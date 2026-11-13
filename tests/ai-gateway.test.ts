import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  calculateEstimatedReservationCredits,
  calculateSettledCredits,
  estimateTokensFromText,
  getCurrentUtcMonthPeriod,
} from "@/lib/ai-gateway/credits";
import { signGuestSession, verifyGuestSession, hashClientIp } from "@/lib/ai-gateway/guest";
import { checkRateLimit, resetRateLimitsForTesting } from "@/lib/ai-gateway/rate-limiter";
import { isEmailConfiguredAdmin } from "@/lib/ai-gateway/admin";
import type { AIModelConfig, AICreditPolicies } from "@/lib/ai-gateway/types";

describe("AI Gateway — Credit Accounting", () => {
  const standardModel: AIModelConfig = {
    modelId: "@cf/meta/llama-3.3-70b-instruct",
    enabled: true,
    creditWeight: 1.0,
    tokenCostMultiplier: 1.0,
    maxInputTokens: 4096,
    maxOutputTokens: 2048,
  };

  const lightweightModel: AIModelConfig = {
    modelId: "@cf/meta/llama-3.1-8b-instruct",
    enabled: true,
    creditWeight: 0.5,
    tokenCostMultiplier: 0.5,
    maxInputTokens: 4096,
    maxOutputTokens: 2048,
  };

  it("calculates estimated reservation credits based on character length and model weight", () => {
    // 380 chars =~ 100 input tokens. estimated output = 500. total factor = 600 / 2000 = 0.3.
    // weight 1.0 * (1 + 0.3) = 1.3
    const est1 = calculateEstimatedReservationCredits(standardModel, 380);
    expect(est1).toBeCloseTo(1.3, 1);

    const est2 = calculateEstimatedReservationCredits(lightweightModel, 380);
    expect(est2).toBeCloseTo(0.65, 1);
  });

  it("calculates settled credits proportionally from input and output tokens", () => {
    // 500 in + 500 out = 1000 tokens. factor = 0.5. weight 1.0 * (1 + 0.5) = 1.5
    const settled = calculateSettledCredits(standardModel, 500, 500);
    expect(settled).toBe(1.5);

    const settledLight = calculateSettledCredits(lightweightModel, 500, 500);
    expect(settledLight).toBe(0.75);
  });

  it("provides conservative token estimation when provider does not report usage", () => {
    const { inputTokens, outputTokens } = estimateTokensFromText(380, 760);
    expect(inputTokens).toBe(100);
    expect(outputTokens).toBe(200);
  });

  it("computes strict UTC calendar month boundaries without rollover", () => {
    const period = getCurrentUtcMonthPeriod();
    const start = new Date(period.periodStart);
    const end = new Date(period.periodEnd);

    expect(start.getUTCDate()).toBe(1);
    expect(start.getUTCHours()).toBe(0);
    expect(start.getUTCMinutes()).toBe(0);
    expect(end.getUTCDate()).toBe(1);
    expect(end.getTime()).toBeGreaterThan(start.getTime());
    expect(period.resetDate).toBe(period.periodEnd);
  });
});

describe("AI Gateway — Guest Session Security & Anti-Abuse", () => {
  it("generates and verifies tamper-resistant HMAC-signed guest session cookies", () => {
    const guestId = "98765432-1234-5678-1234-56789abcdef0";
    const now = Date.now();
    const expiresAt = now + 100_000;

    const token = signGuestSession(guestId, now, expiresAt);
    expect(typeof token).toBe("string");

    const verified = verifyGuestSession(token);
    expect(verified).not.toBeNull();
    expect(verified?.guestId).toBe(guestId);
    expect(verified?.createdAt).toBe(now);
    expect(verified?.expiresAt).toBe(expiresAt);
  });

  it("rejects tampered or forged guest session tokens", () => {
    const guestId = "98765432-1234-5678-1234-56789abcdef0";
    const now = Date.now();
    const expiresAt = now + 100_000;

    const token = signGuestSession(guestId, now, expiresAt);
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));

    // Tamper with guestId
    decoded.guestId = "00000000-0000-0000-0000-000000000000";
    const tamperedToken = Buffer.from(JSON.stringify(decoded)).toString("base64url");

    expect(verifyGuestSession(tamperedToken)).toBeNull();
  });

  it("rejects expired guest session tokens", () => {
    const guestId = "98765432-1234-5678-1234-56789abcdef0";
    const now = Date.now() - 200_000;
    const expiresAt = Date.now() - 100_000; // expired in past

    const expiredToken = signGuestSession(guestId, now, expiresAt);
    expect(verifyGuestSession(expiredToken)).toBeNull();
  });

  it("generates privacy-conscious one-way IP hashes without exposing raw IP", () => {
    const mockReq1 = new Request("http://localhost:3000", {
      headers: { "x-forwarded-for": "203.0.113.195, 10.0.0.1" },
    });
    const hash1 = hashClientIp(mockReq1);
    expect(hash1).toHaveLength(64);
    expect(hash1).not.toContain("203.0.113");

    // Same IP yields deterministic hash for trial re-binding
    const mockReq2 = new Request("http://localhost:3000", {
      headers: { "x-forwarded-for": "203.0.113.195" },
    });
    expect(hashClientIp(mockReq2)).toBe(hash1);
  });
});

describe("AI Gateway — Rate Limiting", () => {
  const policies: AICreditPolicies = {
    monthlyAuthenticatedCredits: 1000,
    guestTrialCredits: 50,
    maxInputCharacters: 44000,
    maxRequestBytes: 192000,
    userRequestsPerMinute: 3, // strict test limit
    guestRequestsPerMinute: 2,
  };

  beforeEach(() => {
    resetRateLimitsForTesting();
  });

  it("enforces sliding-window request limits for authenticated users", () => {
    const userKey = "user:usr-123";
    expect(checkRateLimit(userKey, false, policies).allowed).toBe(true);
    expect(checkRateLimit(userKey, false, policies).allowed).toBe(true);
    expect(checkRateLimit(userKey, false, policies).allowed).toBe(true);

    const fourth = checkRateLimit(userKey, false, policies);
    expect(fourth.allowed).toBe(false);
    expect(fourth.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("enforces stricter request limits for guest sessions", () => {
    const guestKey = "guest:gst-456";
    expect(checkRateLimit(guestKey, true, policies).allowed).toBe(true);
    expect(checkRateLimit(guestKey, true, policies).allowed).toBe(true);

    const third = checkRateLimit(guestKey, true, policies);
    expect(third.allowed).toBe(false);
  });
});

describe("AI Gateway — Admin Authorization & Security", () => {
  it("recognizes configured admin emails from environment variable list", () => {
    vi.stubEnv("KATALYST_ADMIN_EMAILS", "admin@katalyst.learn, security@katalyst.learn");

    expect(isEmailConfiguredAdmin("admin@katalyst.learn")).toBe(true);
    expect(isEmailConfiguredAdmin("SECURITY@KATALYST.LEARN")).toBe(true); // case-insensitive
    expect(isEmailConfiguredAdmin("student@katalyst.learn")).toBe(false);
    expect(isEmailConfiguredAdmin(null)).toBe(false);

    vi.unstubAllEnvs();
  });
});

describe("AI Gateway — Guest Session Lifecycle & Edge Cases", () => {
  it("creates a valid server-issued guest session on first request", async () => {
    const request = new Request("http://localhost:3000/api/ai/session", {
      headers: { "x-forwarded-for": "198.51.100.12" },
    });
    const guestData = await import("@/lib/ai-gateway/guest").then((m) =>
      m.getOrCreateGuestIdentity(request, null)
    );

    expect(guestData.guestId).toMatch(/^[0-9a-fA-F-]{36}$/);
    expect(guestData.status.isGuest).toBe(true);
    expect(guestData.status.trialCreditsAllocated).toBe(50);
    expect(guestData.status.trialCreditsRemaining).toBe(50);
    expect(guestData.status.isExhausted).toBe(false);
    expect(typeof guestData.cookieToken).toBe("string");
  });

  it("persists guest identity across page reloads using the cookie token", async () => {
    const { getOrCreateGuestIdentity } = await import("@/lib/ai-gateway/guest");
    const firstReq = new Request("http://localhost:3000/api/ai/session", {
      headers: { "x-forwarded-for": "198.51.100.15" },
    });
    const first = await getOrCreateGuestIdentity(firstReq, null);

    // Simulated reload with cookie sent back
    const secondReq = new Request("http://localhost:3000/api/ai/session", {
      headers: {
        "x-forwarded-for": "198.51.100.15",
        cookie: `katalyst_guest_session=${first.cookieToken}`,
      },
    });
    const second = await getOrCreateGuestIdentity(secondReq, first.cookieToken);

    expect(second.guestId).toBe(first.guestId);
    expect(second.status.trialCreditsAllocated).toBe(first.status.trialCreditsAllocated);
  });

  it("handles URL-encoded and quote-wrapped cookie values gracefully", () => {
    const guestId = "12345678-abcd-1234-abcd-123456789abc";
    const now = Date.now();
    const token = signGuestSession(guestId, now, now + 100_000);

    const quoted = `"${token}"`;
    const encoded = encodeURIComponent(quoted);

    const verifiedFromQuoted = verifyGuestSession(quoted);
    const verifiedFromEncoded = verifyGuestSession(encoded);

    expect(verifiedFromQuoted?.guestId).toBe(guestId);
    expect(verifiedFromEncoded?.guestId).toBe(guestId);
  });

  it("handles missing guest cookie by minting a new valid session", async () => {
    const { getOrCreateGuestIdentity } = await import("@/lib/ai-gateway/guest");
    const request = new Request("http://localhost:3000/api/chat", {
      headers: { "x-forwarded-for": "198.51.100.88" },
    });
    const session = await getOrCreateGuestIdentity(request, undefined);
    expect(session.guestId).toBeDefined();
    expect(session.status.trialCreditsRemaining).toBe(50);
  });

  it("handles expired guest sessions by rejecting invalid signatures", () => {
    const guestId = "12345678-abcd-1234-abcd-123456789abc";
    const past = Date.now() - 500_000;
    const expired = signGuestSession(guestId, past - 1000, past);
    expect(verifyGuestSession(expired)).toBeNull();
  });

  it("handles concurrent guest initialization requests consistently", async () => {
    const { getOrCreateGuestIdentity } = await import("@/lib/ai-gateway/guest");
    const req1 = new Request("http://localhost:3000/api/ai/session", {
      headers: { "x-forwarded-for": "198.51.100.99" },
    });
    const req2 = new Request("http://localhost:3000/api/ai/session", {
      headers: { "x-forwarded-for": "198.51.100.99" },
    });

    const [res1, res2] = await Promise.all([
      getOrCreateGuestIdentity(req1, null),
      getOrCreateGuestIdentity(req2, null),
    ]);

    expect(res1.status.trialCreditsAllocated).toBe(50);
    expect(res2.status.trialCreditsAllocated).toBe(50);
  });

  it("reserves credits and releases them upon provider cancellation or error", async () => {
    const { reserveCredits, releaseReservation } = await import("@/lib/ai-gateway/credits");
    const idKey = "test-idempotency-" + Date.now();
    const reservation = await reserveCredits({
      idempotencyKey: idKey,
      modelId: "@cf/meta/llama-3.3-70b-instruct",
      estimatedCredits: 1.5,
      guestId: "12345678-1234-1234-1234-1234567890ab",
    });

    expect(reservation.ok).toBe(true);
    expect(reservation.creditsReserved).toBe(1.5);

    // Release must not throw
    await expect(
      releaseReservation({
        reservationId: reservation.reservationId!,
        outcome: "cancelled",
      })
    ).resolves.not.toThrow();
  });

  it("settles credit reservations accurately", async () => {
    const { reserveCredits, settleCredits } = await import("@/lib/ai-gateway/credits");
    const idKey = "test-settle-" + Date.now();
    const reservation = await reserveCredits({
      idempotencyKey: idKey,
      modelId: "@cf/meta/llama-3.3-70b-instruct",
      estimatedCredits: 1.0,
      guestId: "12345678-1234-1234-1234-1234567890ab",
    });

    const settled = await settleCredits({
      reservationId: reservation.reservationId!,
      inputTokens: 100,
      outputTokens: 200,
      actualCredits: 1.25,
      isEstimated: false,
    });

    expect(settled.ok).toBe(true);
    expect(settled.creditsSettled).toBe(1.25);
  });
});
