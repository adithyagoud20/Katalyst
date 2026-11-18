import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AICreditPolicies } from "@/lib/ai-gateway/types";

const { createClient, rpc } = vi.hoisted(() => ({
  createClient: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({ createClient }));

import { consumeRateLimit, resetRateLimitsForTesting } from "@/lib/ai-gateway/rate-limiter";

const policies: AICreditPolicies = {
  monthlyAuthenticatedCredits: 1000,
  guestTrialCredits: 50,
  maxInputCharacters: 44_000,
  maxRequestBytes: 192_000,
  userRequestsPerMinute: 15,
  guestRequestsPerMinute: 6,
};

describe("shared AI request rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitsForTesting();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-test-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "server-only-test-key");
    createClient.mockReturnValue({ rpc });
  });
  afterEach(() => vi.unstubAllEnvs());

  it("uses the atomic database RPC and sends only a digest of the identity", async () => {
    rpc.mockResolvedValue({ data: [{ allowed: false, retry_after_seconds: 23 }], error: null });

    await expect(consumeRateLimit("user:verified-id", false, policies)).resolves.toEqual({
      allowed: false,
      retryAfterSeconds: 23,
    });

    expect(createClient).toHaveBeenCalledWith("https://supabase.example", "server-only-test-key", {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    expect(rpc).toHaveBeenCalledWith("consume_ai_request_rate_limit", expect.objectContaining({
      p_max_requests: 15,
      p_window_seconds: 60,
    }));
    const hash = rpc.mock.calls[0][1].p_identifier_hash as string;
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain("verified-id");
  });

  it("supports a separate network burst ceiling without changing the guest-session quota", async () => {
    rpc.mockResolvedValue({ data: [{ allowed: true, retry_after_seconds: 0 }], error: null });
    await expect(consumeRateLimit("guest-ip:trusted-hash", true, policies, 120)).resolves.toEqual({ allowed: true });
    expect(rpc).toHaveBeenCalledWith("consume_ai_request_rate_limit", expect.objectContaining({ p_max_requests: 120 }));
  });

  it("fails closed when a configured database cannot apply the shared limiter", async () => {
    rpc.mockResolvedValue({ data: null, error: new Error("migration missing") });
    await expect(consumeRateLimit("guest:verified-id", true, policies)).rejects.toThrow("request limiter");
  });

  it("uses the in-memory fallback only when Supabase service credentials are absent", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    await expect(consumeRateLimit("guest:local-only", true, policies)).resolves.toEqual({ allowed: true });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("fails closed in production when the distributed limiter is not configured", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    await expect(consumeRateLimit("guest:production", true, policies)).rejects.toThrow("Production AI requests require");
  });
});
