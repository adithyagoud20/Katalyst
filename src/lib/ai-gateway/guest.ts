import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { GuestCreditStatus, GuestSessionPayload } from "./types";

export const GUEST_COOKIE_NAME = "katalyst_guest_session";
const GUEST_SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getSigningSecret(): string {
  const secret = process.env.GUEST_SESSION_SECRET?.trim()
    || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    || "katalyst-server-guest-signing-fallback-secret-2026";
  return secret;
}

export function hashClientIp(request: Request | NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  const rawIp = (forwarded ? forwarded.split(",")[0] : cfConnectingIp || realIp || "127.0.0.1").trim();
  // One-way SHA-256 hash with server salt - never stores or exposes raw IP
  return crypto.createHmac("sha256", getSigningSecret()).update(`ip-salt:${rawIp}`).digest("hex");
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
 * Ensures or loads a server-side guest identity with trial tracking.
 * If the cookie was deleted, checks whether an existing trial exists for the IP hash
 * within the last 30 days to prevent infinite free credit resets.
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

  // Anti-abuse: If no verified cookie is present, check if this IP hash recently created a trial
  if (!targetGuestId && admin) {
    const { data: existingByIp } = await admin
      .from("ai_guest_sessions")
      .select("guest_id,expires_at")
      .eq("ip_hash", ipHash)
      .gt("expires_at", new Date(now).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingByIp?.guest_id) {
      targetGuestId = existingByIp.guest_id;
    }
  }

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
