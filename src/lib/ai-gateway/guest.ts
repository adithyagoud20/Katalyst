import "server-only";
import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { GuestCreditStatus, GuestSessionPayload } from "./types";

export const GUEST_COOKIE_NAME = "katalyst_guest_session";
const GUEST_SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const developmentSigningSecret = process.env.NODE_ENV === "production"
  ? null
  : crypto.randomBytes(32).toString("base64url");

function getSigningSecret(): string {
  const secret = process.env.GUEST_SESSION_SECRET?.trim()
    || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    || developmentSigningSecret;
  if (!secret) throw new Error("GUEST_SESSION_SECRET must be configured on the server.");
  return secret;
}

function getTrustedClientIp(request: Request | NextRequest): string | null {
  const trustedHeader = process.env.KATALYST_TRUSTED_CLIENT_IP_HEADER?.trim().toLowerCase();
  let rawIp: string | null = null;

  // Vercel owns this header at its edge. Do not trust a caller-supplied
  // X-Forwarded-For chain on other production hosts unless the operator has
  // explicitly selected a header that their reverse proxy overwrites.
  if (process.env.VERCEL === "1") {
    rawIp = request.headers.get("x-vercel-forwarded-for")?.split(",")[0] ?? null;
  } else if (process.env.NODE_ENV !== "production") {
    rawIp = request.headers.get("cf-connecting-ip")
      || request.headers.get("x-real-ip")
      || request.headers.get("x-forwarded-for")?.split(",")[0]
      || null;
  } else if (trustedHeader && ["cf-connecting-ip", "x-real-ip", "x-forwarded-for"].includes(trustedHeader)) {
    rawIp = request.headers.get(trustedHeader)?.split(",")[0] ?? null;
  }

  return rawIp?.trim() || null;
}

function hashTrustedIp(rawIp: string): string {
  return crypto.createHmac("sha256", getSigningSecret()).update(`ip-salt:${rawIp}`).digest("hex");
}

export function hashClientIp(request: Request | NextRequest): string {
  // Keep a stable fallback for database records, but never use it to merge
  // guest identities or rate-limit visitors when the proxy address is absent.
  return hashTrustedIp(getTrustedClientIp(request) || "no-trusted-client-ip");
}

export function getTrustedClientIpRateLimitHash(request: Request | NextRequest): string | null {
  const rawIp = getTrustedClientIp(request);
  return rawIp ? hashTrustedIp(rawIp) : null;
}

export function signGuestSession(guestId: string, createdAt: number, expiresAt: number): string {
  const payload = `${guestId}:${createdAt}:${expiresAt}`;
  const signature = crypto.createHmac("sha256", getSigningSecret()).update(payload).digest("hex");
  return Buffer.from(JSON.stringify({ guestId, createdAt, expiresAt, signature })).toString("base64url");
}

export function verifyGuestSession(cookieValue: string | null | undefined): GuestSessionPayload | null {
  if (!cookieValue) return null;
  try {
    const rawVal = decodeURIComponent(cookieValue.trim()).replace(/^"|"$/g, "");
    const raw = Buffer.from(rawVal, "base64url").toString("utf-8");
    const parsed = JSON.parse(raw) as GuestSessionPayload;
    if (!parsed.guestId || !parsed.createdAt || !parsed.expiresAt || !parsed.signature) return null;
    if (parsed.expiresAt < Date.now()) return null;
    const expectedSig = crypto
      .createHmac("sha256", getSigningSecret())
      .update(`${parsed.guestId}:${parsed.createdAt}:${parsed.expiresAt}`)
      .digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(parsed.signature), Buffer.from(expectedSig))) return null;
    return parsed;
  } catch {
    return null;
  }
}

function getAdminClient() {
  const config = getSupabaseConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!config || !serviceKey) return null;
  return createClient(config.url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Ensures or loads a server-side guest identity with trial tracking. A valid,
 * signed cookie is the quota identity; IP hashes are used only for a separate
 * generous burst limit and never merge visitors on shared networks.
 */
export async function getOrCreateGuestIdentity(
  request: Request | NextRequest,
  cookieHeader?: string | null
): Promise<{ guestId: string; cookieToken: string; status: GuestCreditStatus }> {
  const ipHash = hashClientIp(request);
  const now = Date.now();
  const verified = verifyGuestSession(cookieHeader);

  const admin = getAdminClient();
  const expiresAtIso = new Date(now + GUEST_SESSION_MAX_AGE_MS).toISOString();

  let targetGuestId = verified?.guestId;

  if (!targetGuestId) {
    targetGuestId = crypto.randomUUID();
  }

  const cookieToken = signGuestSession(targetGuestId, now, now + GUEST_SESSION_MAX_AGE_MS);

  if (!admin) {
    // Local / unconfigured fallback: returns memory/default trial
    return {
      guestId: targetGuestId,
      cookieToken,
      status: {
        isGuest: true,
        guestId: targetGuestId,
        trialCreditsAllocated: 50,
        trialCreditsUsed: 0,
        trialCreditsReserved: 0,
        trialCreditsRemaining: 50,
        isExhausted: false,
        expiresAt: expiresAtIso,
      },
    };
  }

  // Database-backed trial registration:
  // First attempt RPC get_or_create_guest_session
  let sessionRow: {
    trial_credits_allocated: number;
    trial_credits_used: number;
    trial_credits_reserved: number;
    expires_at: string;
  } | null = null;

  try {
    const { data: rpcData, error: rpcError } = await admin.rpc("get_or_create_guest_session", {
      p_guest_id: targetGuestId,
      p_ip_hash: ipHash,
      p_expires_at: expiresAtIso,
    });

    if (!rpcError && rpcData && rpcData.length > 0) {
      const row = rpcData[0];
      sessionRow = {
        trial_credits_allocated: Number(row.trial_credits_allocated ?? 50),
        trial_credits_used: Number(row.trial_credits_used ?? 0),
        trial_credits_reserved: Number(row.trial_credits_reserved ?? 0),
        expires_at: expiresAtIso,
      };
    }
  } catch {
    // Proceed to resilient direct persistence fallback
  }

  // If RPC failed or returned no row, perform resilient direct upsert
  if (!sessionRow) {
    const { data: upsertData, error: upsertError } = await admin
      .from("ai_guest_sessions")
      .upsert(
        {
          guest_id: targetGuestId,
          ip_hash: ipHash,
          trial_credits_allocated: 50,
          trial_credits_used: 0,
          trial_credits_reserved: 0,
          expires_at: expiresAtIso,
        },
        { onConflict: "guest_id", ignoreDuplicates: true }
      )
      .select("trial_credits_allocated,trial_credits_used,trial_credits_reserved,expires_at")
      .maybeSingle();

    if (!upsertError && upsertData) {
      sessionRow = {
        trial_credits_allocated: Number(upsertData.trial_credits_allocated ?? 50),
        trial_credits_used: Number(upsertData.trial_credits_used ?? 0),
        trial_credits_reserved: Number(upsertData.trial_credits_reserved ?? 0),
        expires_at: upsertData.expires_at || expiresAtIso,
      };
    } else {
      // Query existing if ignoreDuplicates did not return data
      const { data: directData } = await admin
        .from("ai_guest_sessions")
        .select("trial_credits_allocated,trial_credits_used,trial_credits_reserved,expires_at")
        .eq("guest_id", targetGuestId)
        .maybeSingle();

      if (directData) {
        sessionRow = {
          trial_credits_allocated: Number(directData.trial_credits_allocated ?? 50),
          trial_credits_used: Number(directData.trial_credits_used ?? 0),
          trial_credits_reserved: Number(directData.trial_credits_reserved ?? 0),
          expires_at: directData.expires_at || expiresAtIso,
        };
      }
    }
  }

  if (!sessionRow) {
    throw new Error("Unable to establish or persist guest trial session in database.");
  }

  const allocated = sessionRow.trial_credits_allocated;
  const used = sessionRow.trial_credits_used;
  const reserved = sessionRow.trial_credits_reserved;
  const remaining = Math.max(0, allocated - used - reserved);

  return {
    guestId: targetGuestId,
    cookieToken,
    status: {
      isGuest: true,
      guestId: targetGuestId,
      trialCreditsAllocated: allocated,
      trialCreditsUsed: used,
      trialCreditsReserved: reserved,
      trialCreditsRemaining: remaining,
      isExhausted: remaining <= 0,
      expiresAt: sessionRow.expires_at,
    },
  };
}
