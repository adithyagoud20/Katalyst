import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { createServerClient, cookieStore, recordLegalConsent } = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  cookieStore: { getAll: vi.fn(() => []), set: vi.fn() },
  recordLegalConsent: vi.fn(),
}));
vi.mock("@supabase/ssr", () => ({ createServerClient }));
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => cookieStore) }));
vi.mock("@/lib/legal-consent", () => ({ LEGAL_CONSENT_COOKIE: "katalyst_legal_consent", recordLegalConsent }));

import { GET as authCallback } from "@/app/(app)/auth/callback/route";
import { getVerifiedSupabaseUser } from "@/lib/supabase/server";

describe("Supabase OAuth callback and session verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recordLegalConsent.mockResolvedValue(true);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-example");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("exchanges the Google PKCE code and returns to the app", async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ data: { user: { id: "verified-user" } }, error: null });
    const signOut = vi.fn();
    createServerClient.mockReturnValue({ auth: { exchangeCodeForSession, signOut } });

    const response = await authCallback(new NextRequest("http://localhost:3000/auth/callback?code=pkce-code", { headers: { cookie: "katalyst_legal_consent=signed-consent" } }));

    expect(exchangeCodeForSession).toHaveBeenCalledWith("pkce-code");
    expect(recordLegalConsent).toHaveBeenCalledWith("verified-user", "signed-consent");
    expect(signOut).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("http://localhost:3000/?account=signed-in");
  });

  it("rejects Google callback sign-in when current consent is missing or cannot be saved", async () => {
    const signOut = vi.fn();
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ data: { user: { id: "verified-user" } }, error: null });
    createServerClient.mockReturnValue({ auth: { exchangeCodeForSession, signOut } });
    recordLegalConsent.mockResolvedValue(false);

    const response = await authCallback(new NextRequest("http://localhost:3000/auth/callback?code=pkce-code"));

    expect(signOut).toHaveBeenCalledOnce();
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?account=consent-required");
  });

  it("fails closed when the callback has no code, no client, or an exchange error", async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("exchange failed") });
    createServerClient.mockReturnValue({ auth: { exchangeCodeForSession } });
    const invalidCode = await authCallback(new NextRequest("http://localhost:3000/auth/callback"));
    const invalidExchange = await authCallback(new NextRequest("http://localhost:3000/auth/callback?code=invalid"));
    createServerClient.mockReturnValue(null);
    const unavailableClient = await authCallback(new NextRequest("http://localhost:3000/auth/callback?code=valid"));

    expect(invalidCode.headers.get("location")).toBe("http://localhost:3000/login?account=sign-in-failed");
    expect(invalidExchange.headers.get("location")).toBe("http://localhost:3000/login?account=sign-in-failed");
    expect(unavailableClient.headers.get("location")).toBe("http://localhost:3000/login?account=sign-in-failed");
  });

  it("accepts only a user returned by Supabase auth.getUser", async () => {
    const user = { id: "verified-user" };
    createServerClient.mockReturnValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) } });
    await expect(getVerifiedSupabaseUser()).resolves.toMatchObject({ configured: true, user });

    createServerClient.mockReturnValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: new Error("invalid session") }) } });
    await expect(getVerifiedSupabaseUser()).resolves.toMatchObject({ configured: true, user: null });

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    createServerClient.mockReturnValue(null);
    await expect(getVerifiedSupabaseUser()).resolves.toMatchObject({ configured: false, user: null });
  });
});
