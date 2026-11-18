import "server-only";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { AICreditPolicies } from "./types";

type RateLimitRecord = {
  timestamps: number[];
};

// In-memory sliding window rate-limiting map
const rateLimitBuckets = new Map<string, RateLimitRecord>();

function getRateLimitAdminClient() {
  const config = getSupabaseConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!config || !serviceKey) return null;
  return createClient(config.url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Clean up stale buckets every 5 minutes
setInterval(() => {
  const now = Date.now();
  const windowMs = 60_000;
  for (const [key, record] of rateLimitBuckets.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
    if (record.timestamps.length === 0) {
      rateLimitBuckets.delete(key);
    }
  }
}, 300_000).unref();

export function checkRateLimit(
  identifier: string,
  isGuest: boolean,
  policies: AICreditPolicies,
  maxRequestsOverride?: number
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = maxRequestsOverride ?? (isGuest ? policies.guestRequestsPerMinute : policies.userRequestsPerMinute);

  let record = rateLimitBuckets.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    rateLimitBuckets.set(identifier, record);
  }

  // Filter timestamps within the last 60 seconds
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const retryAfterSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  record.timestamps.push(now);
  return { allowed: true };
}

/**
 * Applies the request window across all app instances when Supabase is configured.
 * Local-only deployments retain the in-memory limiter used by development and tests.
 */
export async function consumeRateLimit(
  identifier: string,
  isGuest: boolean,
  policies: AICreditPolicies,
  maxRequestsOverride?: number
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const maxRequests = maxRequestsOverride ?? (isGuest ? policies.guestRequestsPerMinute : policies.userRequestsPerMinute);
  const admin = getRateLimitAdminClient();
  if (!admin) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Production AI requests require the Supabase-backed rate limiter.");
    }
    return checkRateLimit(identifier, isGuest, policies, maxRequests);
  }

  const identifierHash = createHash("sha256").update(identifier).digest("hex");
  const { data, error } = await admin.rpc("consume_ai_request_rate_limit", {
    p_identifier_hash: identifierHash,
    p_max_requests: maxRequests,
    p_window_seconds: 60,
  });
  if (error) throw new Error("The shared AI request limiter could not be reached.");

  const result = Array.isArray(data) ? data[0] as {
    allowed?: boolean;
    retry_after_seconds?: number;
  } | undefined : undefined;
  if (!result || typeof result.allowed !== "boolean") {
    throw new Error("The shared AI request limiter returned an invalid response.");
  }
  return {
    allowed: result.allowed,
    ...(!result.allowed ? { retryAfterSeconds: Math.max(1, Number(result.retry_after_seconds) || 1) } : {}),
  };
}

export function resetRateLimitsForTesting() {
  rateLimitBuckets.clear();
}
