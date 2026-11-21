import { afterEach, describe, expect, it, vi } from "vitest";
import { getContentSecurityPolicy } from "@/proxy";

afterEach(() => {
  vi.unstubAllEnvs();
});

function scriptDirective(policy: string): string {
  return policy.split(";").find((directive) => directive.trim().startsWith("script-src")) ?? "";
}

describe("nonce content security policy", () => {
  it("keeps the main app and public course pages on nonce-authorized scripts", () => {
    vi.stubEnv("NODE_ENV", "production");
    const appPolicy = getContentSecurityPolicy("app-nonce", "/settings");
    const publicPolicy = getContentSecurityPolicy("public-nonce", "/courses/c-programming-foundations/source-to-output");

    for (const policy of [appPolicy, publicPolicy]) {
      const scripts = scriptDirective(policy);
      expect(scripts).toContain("'nonce-");
      expect(scripts).toContain("'strict-dynamic'");
      expect(scripts).not.toContain("'unsafe-inline'");
      expect(scripts).not.toContain("'unsafe-eval'");
      expect(policy).toContain("frame-ancestors 'none'");
    }
    expect(publicPolicy).not.toContain("'unsafe-inline'");
  });

  it("limits browser-Wasm permissions to the existing in-browser lab screens", () => {
    const appShellPolicy = getContentSecurityPolicy("shell-nonce", "/");
    const playgroundPolicy = getContentSecurityPolicy("lab-nonce", "/playground");
    const pathsPolicy = getContentSecurityPolicy("paths-nonce", "/paths");
    const practicePolicy = getContentSecurityPolicy("practice-nonce", "/practice");
    const pythonLessonPolicy = getContentSecurityPolicy("python-nonce", "/courses/python-programming-foundations/py-source-to-interpreter");
    const javascriptLessonPolicy = getContentSecurityPolicy("javascript-nonce", "/courses/js-systems-algorithms/js-array-buffer-views");
    const appPolicy = getContentSecurityPolicy("app-nonce", "/settings");
    const lessonPolicy = getContentSecurityPolicy("lesson-nonce", "/courses/arduino-embedded/arduino-sketch-lifecycle");

    for (const policy of [appShellPolicy, playgroundPolicy, pathsPolicy, practicePolicy]) {
      expect(policy).toContain("'wasm-unsafe-eval'");
      expect(policy).toContain("worker-src 'self' blob:");
      expect(policy).toContain("blob: data:");
      expect(policy).toContain("https://cdn.jsdelivr.net");
      expect(scriptDirective(policy)).not.toContain("'unsafe-eval'");
    }
    expect(appPolicy).not.toContain("'wasm-unsafe-eval'");
    expect(appPolicy).not.toContain("worker-src 'self' blob:");
    for (const policy of [appPolicy, lessonPolicy]) {
      expect(policy).not.toContain("https://registry.wasmer.io");
      expect(policy).not.toContain("https://cdn.wasmer.io");
    }
    expect(lessonPolicy).not.toContain("'wasm-unsafe-eval'");
    expect(lessonPolicy).toContain("worker-src 'self' blob:");
    expect(pythonLessonPolicy).toContain("'wasm-unsafe-eval'");
    expect(pythonLessonPolicy).toContain("https://cdn.jsdelivr.net");
    expect(pythonLessonPolicy).toContain("worker-src 'self' blob:");
    expect(pythonLessonPolicy).not.toContain("frame-src https://challenges.cloudflare.com blob: data:");
    expect(javascriptLessonPolicy).toContain("worker-src 'self' blob:");
    expect(javascriptLessonPolicy).not.toContain("'wasm-unsafe-eval'");
    expect(javascriptLessonPolicy).not.toContain("https://cdn.jsdelivr.net");
  });

  it("does not vary CSP to authorize the retired C runner route", () => {
    expect(getContentSecurityPolicy("same-nonce", "/lab-runner/c")).toBe(
      getContentSecurityPolicy("same-nonce", "/settings")
    );
  });
});
