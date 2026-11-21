import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  C_TOOLCHAIN_FILES,
  TOTAL_TOOLCHAIN_BYTES,
  isCRunEnabled,
  parseCDiagnostics,
  WasmClangCRunner,
} from "../src/lib/execution/c-runner";

describe("C Runner (wasm-clang) Unit Tests", () => {
  const originalEnv = process.env.NEXT_PUBLIC_C_RUN_ENABLED;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_C_RUN_ENABLED;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_C_RUN_ENABLED = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_C_RUN_ENABLED;
    }
  });

  it("checks feature flag correctly", () => {
    expect(isCRunEnabled()).toBe(true);
    process.env.NEXT_PUBLIC_C_RUN_ENABLED = "false";
    expect(isCRunEnabled()).toBe(false);
    process.env.NEXT_PUBLIC_C_RUN_ENABLED = "true";
    expect(isCRunEnabled()).toBe(true);
  });

  it("only supports language 'c' when feature flag is enabled", () => {
    const runner = new WasmClangCRunner();
    expect(runner.supportsLanguage("c")).toBe(true);
    expect(runner.supportsLanguage("cpp")).toBe(false);

    process.env.NEXT_PUBLIC_C_RUN_ENABLED = "false";
    expect(runner.supportsLanguage("c")).toBe(false);
    expect(runner.supportsLanguage("cpp")).toBe(false);

    process.env.NEXT_PUBLIC_C_RUN_ENABLED = "true";
    expect(runner.supportsLanguage("c")).toBe(true);
    expect(runner.supportsLanguage("cpp")).toBe(false); // C++ kept disabled until verified
    expect(runner.supportsLanguage("python")).toBe(false);
  });

  it("defines exact toolchain files and expected sizes", () => {
    expect(C_TOOLCHAIN_FILES.map((f) => f.name)).toEqual([
      "clang",
      "lld",
      "sysroot.tar",
      "memfs",
    ]);
    expect(TOTAL_TOOLCHAIN_BYTES).toBe(60_347_928);
  });

  it("parses clang compiler error and warning diagnostics", () => {
    const output = [
      "test.c:14:5: error: expected ';' after expression",
      "test.c:20:12: warning: implicit conversion loses integer precision",
      "random message without line numbers",
    ].join("\n");

    const parsed = parseCDiagnostics(output);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual({
      line: 14,
      column: 5,
      severity: "error",
      message: "expected ';' after expression",
      raw: "test.c:14:5: error: expected ';' after expression",
    });
    expect(parsed[1]).toEqual({
      line: 20,
      column: 12,
      severity: "warning",
      message: "implicit conversion loses integer precision",
      raw: "test.c:20:12: warning: implicit conversion loses integer precision",
    });
  });

  it("rejects execution with clear message when feature flag is disabled", async () => {
    process.env.NEXT_PUBLIC_C_RUN_ENABLED = "false";
    const runner = new WasmClangCRunner();
    const result = await runner.execute({
      language: "c",
      files: [{ path: "main.c", content: 'int main(){return 0;}' }],
    });

    expect(result.ok).toBe(false);
    expect(result.stderr).toContain("C run is being upgraded, lesson is readable.");
    expect(result.error).toContain("disabled by feature flag");
  });
});
