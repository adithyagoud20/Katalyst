import { afterEach, describe, expect, it, vi } from "vitest";
import { getContentSecurityPolicy } from "@/proxy";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("production content security policy for browser compilation", () => {
  it("allows Wasmer's runtime worker to use dynamic code without allowing it in app scripts", () => {
    vi.stubEnv("NODE_ENV", "production");

    const appPolicy = getContentSecurityPolicy("test-nonce", "/");
    const sdkPolicy = getContentSecurityPolicy("test-nonce", "/vendor/wasmer-sdk/dist/index.js");
    const workerPolicy = getContentSecurityPolicy("test-nonce", "/vendor/wasmer-sdk/dist/browser-worker.js");

    expect(appPolicy).not.toContain("'unsafe-eval'");
    expect(sdkPolicy).not.toContain("'unsafe-eval'");
    expect(workerPolicy).toContain("'unsafe-eval'");
  });
});
