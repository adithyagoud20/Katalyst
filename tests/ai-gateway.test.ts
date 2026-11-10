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
