import { describe, expect, it } from "vitest";
import { executionRegistry, executeProgram } from "../src/lib/execution/runner";
import { ExecutionRunner, ExecutionResult } from "../src/lib/execution/types";

describe("Execution Runner Registry & Interface", () => {
  it("returns an error result when no runner is registered for a language", async () => {
    const res = await executeProgram({
      language: "java",
      files: [{ path: "Main.java", content: "public class Main {}" }],
    });

    expect(res.ok).toBe(false);
    expect(res.error).toContain("Unsupported execution target or language: java");
  });

  it("registers and resolves runners according to target preferences", async () => {
    const mockWasmRunner: ExecutionRunner = {
      id: "mock-wasm-c",
      name: "Mock WASM C Runner",
      target: "browser-wasm",
      supportsLanguage: (lang) => lang === "c",
      isReady: () => true,
      prepare: async () => {},
      execute: async (): Promise<ExecutionResult> => ({
        ok: true,
        exitCode: 0,
        stdout: "WASM output",
        stderr: "",
        executionTimeMs: 12,
        runner: "browser-wasm",
        stage: "finished",
      }),
    };

    const mockRemoteRunner: ExecutionRunner = {
      id: "mock-remote-c",
      name: "Mock Remote C Runner",
      target: "remote-sandbox",
      supportsLanguage: (lang) => lang === "c",
      isReady: () => true,
      prepare: async () => {},
      execute: async (): Promise<ExecutionResult> => ({
        ok: true,
        exitCode: 0,
        stdout: "Remote output",
        stderr: "",
        executionTimeMs: 150,
        runner: "remote-sandbox",
        stage: "finished",
      }),
    };

    executionRegistry.register(mockWasmRunner);
    executionRegistry.register(mockRemoteRunner);

    // Auto resolves browser-wasm first
    const autoRes = await executeProgram({
      language: "c",
      files: [{ path: "main.c", content: "int main() {}" }],
    });
    expect(autoRes.runner).toBe("browser-wasm");
    expect(autoRes.stdout).toBe("WASM output");

    // Explicit remote-sandbox preference resolves remote runner
    const remoteRes = await executeProgram({
      language: "c",
      files: [{ path: "main.c", content: "int main() {}" }],
      preferredTarget: "remote-sandbox",
    });
    expect(remoteRes.runner).toBe("remote-sandbox");
    expect(remoteRes.stdout).toBe("Remote output");
  });

  it("lists registered execution runners with capabilities", () => {
    const runners = executionRegistry.list();
    expect(runners.length).toBeGreaterThanOrEqual(2);
    expect(runners.some((r) => r.id === "browser-c-wasmer")).toBe(true);
    expect(runners.some((r) => r.id === "browser-python-pyodide")).toBe(true);
  });

  it("executes Python code with standard input and stdout capture", async () => {
    const res = await executeProgram({
      language: "python",
      files: [{
        path: "main.py",
        content: "import sys\nline = sys.stdin.read().strip()\nprint(f'Processed: {line}')",
      }],
      stdin: "KATALYST-Telemetry-2026",
    });

    expect(res.ok).toBe(true);
    expect(res.stdout).toContain("Processed: KATALYST-Telemetry-2026");
    expect(res.exitCode).toBe(0);
    expect(res.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("captures Python exceptions and errors cleanly", async () => {
    const res = await executeProgram({
      language: "python",
      files: [{
        path: "main.py",
        content: "raise ValueError('Sensor reading out of range')",
      }],
    });

    expect(res.ok).toBe(false);
    expect(res.exitCode).toBe(1);
    expect(res.stderr).toContain("ValueError: Sensor reading out of range");
  });

  it("executes C++17 code with standard input and stdout capture", async () => {
    const res = await executeProgram({
      language: "cpp",
      files: [{
        path: "main.cpp",
        content: `#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::vector<int> nums = {1, 2, 3, 4, 5};
    int total = std::accumulate(nums.begin(), nums.end(), 0);
    std::cout << "Sum: " << total << std::endl;
    return 0;
}`,
      }],
    });

    expect(res.ok).toBe(true);
    expect(res.stdout).toContain("Sum: 15");
    expect(res.exitCode).toBe(0);
  });
});
