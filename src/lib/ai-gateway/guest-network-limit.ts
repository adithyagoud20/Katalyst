import "server-only";
import type { NextRequest } from "next/server";
import { getTrustedClientIpRateLimitHash } from "./guest";
import { consumeRateLimit } from "./rate-limiter";
import type { AICreditPolicies } from "./types";

export const GUEST_NETWORK_REQUESTS_PER_MINUTE = 120;

/** A generous shared-network burst cap; guest credit balances remain cookie scoped. */
export async function consumeGuestNetworkLimit(
  request: Request | NextRequest,
  policies: AICreditPolicies
) {
  const ipHash = getTrustedClientIpRateLimitHash(request);
  if (!ipHash) {
    // In production, guest inference must not silently lose its network burst
    // limit when a reverse proxy does not provide a trusted client-IP header.
    return process.env.NODE_ENV === "production"
      ? { allowed: false as const, configurationMissing: true as const }
      : { allowed: true as const };
  }
  return consumeRateLimit(`guest-ip:${ipHash}`, true, policies, GUEST_NETWORK_REQUESTS_PER_MINUTE);
}

export const GUEST_SESSION_REQUESTS_PER_MINUTE = 120;

/** Session status traffic has its own bucket and cannot spend the inference burst. */
export async function consumeGuestSessionNetworkLimit(
  request: Request | NextRequest,
  policies: AICreditPolicies
) {
  const ipHash = getTrustedClientIpRateLimitHash(request);
  if (!ipHash) return { allowed: true as const };
  return consumeRateLimit("guest-session-ip:" + ipHash, true, policies, GUEST_SESSION_REQUESTS_PER_MINUTE);
}
