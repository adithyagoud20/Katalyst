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
  if (!ipHash) return { allowed: true as const };
  return consumeRateLimit(`guest-ip:${ipHash}`, true, policies, GUEST_NETWORK_REQUESTS_PER_MINUTE);
}
