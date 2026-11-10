import type { AICreditPolicies } from "./types";

type RateLimitRecord = {
  timestamps: number[];
};

// In-memory sliding window rate-limiting map
const rateLimitBuckets = new Map<string, RateLimitRecord>();

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
  policies: AICreditPolicies
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = isGuest ? policies.guestRequestsPerMinute : policies.userRequestsPerMinute;

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

export function resetRateLimitsForTesting() {
  rateLimitBuckets.clear();
}
