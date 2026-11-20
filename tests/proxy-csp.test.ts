import { afterEach, describe, expect, it, vi } from "vitest";
import { getContentSecurityPolicy } from "@/proxy";
import { getCLabRunnerAssetContentSecurityPolicy, getCLabRunnerContentSecurityPolicy } from "@/lib/c-lab-runner-security";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("production content security policy for browser compilation", () => {
  it("scopes Wasm runtime permissions to lab routes without unsafe eval", () => {
    vi.stubEnv("NODE_ENV", "production");

    const appPolicy = getContentSecurityPolicy("test-nonce", "/");
    const playgroundPolicy = getContentSecurityPolicy("test-nonce", "/playground");
    const publicCoursePolicy = getContentSecurityPolicy("test-nonce", "/courses/c-programming-foundations/source-to-output");
    const courseOverviewPolicy = getContentSecurityPolicy("test-nonce", "/courses/c-programming-foundations");
    const nonLabCoursePolicy = getContentSecurityPolicy("test-nonce", "/courses/arduino-embedded/arduino-sketch-lifecycle");
    const sdkPolicy = getContentSecurityPolicy("test-nonce", "/vendor/wasmer-sdk/dist/index.js");
    const workerPolicy = getContentSecurityPolicy("test-nonce", "/vendor/wasmer-sdk/dist/browser-worker.js");

    expect(appPolicy).not.toContain("'unsafe-eval'");
    expect(appPolicy).not.toContain("'wasm-unsafe-eval'");
    expect(appPolicy).not.toContain("frame-src 'self'");
    expect(sdkPolicy).not.toContain("'unsafe-eval'");
    expect(playgroundPolicy).toContain("frame-src https://challenges.cloudflare.com 'self'");
    expect(playgroundPolicy).not.toContain("'unsafe-eval'");
    expect(publicCoursePolicy).toContain("frame-src https://challenges.cloudflare.com 'self'");
    expect(publicCoursePolicy).not.toContain("'wasm-unsafe-eval'");
    expect(publicCoursePolicy).not.toContain("worker-src 'self' blob:");
    expect(publicCoursePolicy).not.toContain("https://registry.wasmer.io");
    expect(publicCoursePolicy).not.toContain("'unsafe-inline'");
    expect(publicCoursePolicy).not.toContain("'unsafe-eval'");
    expect(courseOverviewPolicy).not.toContain("'wasm-unsafe-eval'");
    expect(courseOverviewPolicy).not.toContain("frame-src 'self'");
    expect(nonLabCoursePolicy).not.toContain("'wasm-unsafe-eval'");
    expect(nonLabCoursePolicy).not.toContain("frame-src 'self'");
    expect(nonLabCoursePolicy).not.toContain("blob: data:");
    expect(workerPolicy).toContain("'wasm-unsafe-eval'");
    expect(workerPolicy).not.toContain("'unsafe-eval'");

    const runnerPolicy = getCLabRunnerContentSecurityPolicy("https://katalyst.invalid", "https://katalyst.invalid");
    const runnerAssetPolicy = getCLabRunnerAssetContentSecurityPolicy("https://katalyst.invalid");
    expect(runnerPolicy).toContain("/lab-runner/c/runner.js");
    expect(runnerPolicy).toContain("/lab-runner/c/wasmer/dist/");
    expect(runnerPolicy).toContain("'unsafe-eval' 'wasm-unsafe-eval'");
    expect(runnerPolicy).toContain("sandbox allow-scripts");
    expect(runnerPolicy).toContain("frame-ancestors 'self'");
    expect(runnerPolicy).not.toContain("'unsafe-inline'");
    expect(runnerPolicy).not.toContain("connect-src 'self'");
    expect(runnerAssetPolicy).toContain("/lab-runner/c/wasmer/dist/");
    expect(runnerAssetPolicy).toContain("'unsafe-eval' 'wasm-unsafe-eval'");
    expect(runnerAssetPolicy).not.toContain("connect-src 'self'");
    expect(getContentSecurityPolicy("test-nonce", "/lab-runner/c/wasmer/dist/browser-worker.js")).not.toContain("'unsafe-eval'");
  });
});
