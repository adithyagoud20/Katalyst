import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { purgeLegacyStandaloneCredentials } from "../src/lib/client-storage-cleanup";
import { getProviderRequestHeaders } from "../src/lib/providers/client-request-headers";
import { passwordInputType } from "../src/lib/login-utils";

describe("browser security boundaries", () => {
  it("never attaches Cloudflare credentials in shared platform mode", () => {
    expect(getProviderRequestHeaders({
      provider: "cloudflare",
      cloudflareMode: "platform",
      sessionKey: "server-token-must-not-leak",
      cloudflareAccountId: "server-account-must-not-leak",
    })).toEqual({});
  });

  it("sends personal Cloudflare credentials only in explicit BYOK mode", () => {
    expect(getProviderRequestHeaders({
      provider: "cloudflare",
      cloudflareMode: "byok",
      sessionKey: "personal-token",
      cloudflareAccountId: "personal-account",
    })).toEqual({
      "x-katalyst-provider-key": "personal-token",
      "x-katalyst-cloudflare-account-id": "personal-account",
    });
  });

  it("cleans standalone legacy credentials while preserving KATALYST versioned records", () => {
    const values = new Map<string, string>([
      ["CLOUDFLARE_API_TOKEN", "legacy-token"],
      ["OPENAI_API_KEY", "legacy-openai-key"],
      ["katalyst.workspace.v1", "workspace-record"],
      ["katalyst.preferences.v1", "preferences-record"],
    ]);
    const storage = {
      get length() { return values.size; },
      key(index: number) { return [...values.keys()][index] ?? null; },
      removeItem(key: string) { values.delete(key); },
    };

    expect(purgeLegacyStandaloneCredentials(storage as Storage)).toEqual(expect.arrayContaining(["CLOUDFLARE_API_TOKEN", "OPENAI_API_KEY"]));
    expect(values.has("CLOUDFLARE_API_TOKEN")).toBe(false);
    expect(values.has("OPENAI_API_KEY")).toBe(false);
    expect(values.get("katalyst.workspace.v1")).toBe("workspace-record");
    expect(values.get("katalyst.preferences.v1")).toBe("preferences-record");
  });

  it("has a deterministic password visibility type for the login controls", () => {
    expect(passwordInputType(false)).toBe("password");
    expect(passwordInputType(true)).toBe("text");
  });

  it("keeps server secret environment names out of client source modules", () => {
    const clientFiles = [
      "src/components/workspace.tsx",
      "src/components/kat-tutor.tsx",
      "src/components/learning-experience.tsx",
      "src/components/login-form.tsx",
      "src/components/brand-mark.tsx",
      "src/lib/providers/client-request-headers.ts",
      "src/lib/providers/catalog.ts",
    ];
    const secretNames = /\b(?:CLOUDFLARE_ACCOUNT_ID|CLOUDFLARE_API_TOKEN|SUPABASE_SERVICE_ROLE_KEY|GUEST_SESSION_SECRET|OPENAI_API_KEY|GEMINI_API_KEY|OPENROUTER_API_KEY)\b/;
    for (const file of clientFiles) {
      expect(readFileSync(resolve(process.cwd(), file), "utf8"), file).not.toMatch(secretNames);
    }
  });
});
