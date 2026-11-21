import { afterEach, describe, expect, it, vi } from "vitest";
import { getContentSecurityPolicy } from "@/proxy";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("retired C runner security contract", () => {
  it("does not grant the retired runner a special CSP policy", () => {
    vi.stubEnv("NODE_ENV", "production");

    const appPolicy = getContentSecurityPolicy("test-nonce", "/settings");
    const retiredPathPolicy = getContentSecurityPolicy("test-nonce", "/lab-runner/c");

    expect(retiredPathPolicy).toBe(appPolicy);
    expect(retiredPathPolicy).not.toContain("'unsafe-eval'");
    expect(retiredPathPolicy).toContain("frame-ancestors 'none'");
  });

  it("keeps C and C++ lesson pages on the nonce policy without script inline permissions", () => {
    const lessonPolicy = getContentSecurityPolicy(
      "lesson-nonce",
      "/courses/c-programming-foundations/source-to-output"
    );
    const scriptPolicy = lessonPolicy.split(";").find((directive) => directive.trim().startsWith("script-src"));

    expect(scriptPolicy).toContain("'nonce-lesson-nonce'");
    expect(scriptPolicy).toContain("'strict-dynamic'");
    expect(scriptPolicy).not.toContain("'unsafe-inline'");
    expect(scriptPolicy).not.toContain("'unsafe-eval'");
    expect(lessonPolicy).toContain("frame-ancestors 'none'");
  });
});
