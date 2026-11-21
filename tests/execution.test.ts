import { describe, expect, it } from "vitest";
import { executionRegistry, executeProgram, listExecutionRunners } from "../src/lib/execution/runner";

describe("Execution Runner Registry & Interface", () => {
  it("returns an error result when no runner is registered for a language", async () => {
    const res = await executeProgram({
      language: "java",
      files: [{ path: "Main.java", content: "public class Main {}" }],
    });

    expect(res.ok).toBe(false);
    expect(res.error).toContain("Unsupported execution target or language: java");
  });

  it("registers C runner and keeps C++ runner disabled until verified", async () => {
    const runners = executionRegistry.list();
    expect(runners.some((runner) => runner.supportsLanguage("c"))).toBe(true);
    expect(runners.every((runner) => !runner.supportsLanguage("cpp"))).toBe(true);

    const cppResult = await executeProgram({ language: "cpp", files: [{ path: "main.cpp", content: "" }] });
    expect(cppResult.ok).toBe(false);
    expect(cppResult.error).toContain("Unsupported execution target or language: cpp");
  });

  it("keeps the remaining browser execution runners registered", () => {
    const runners = listExecutionRunners();
    expect(runners.some((runner) => runner.id === "browser-python-pyodide")).toBe(true);
    expect(runners.some((runner) => runner.id === "browser-javascript-worker")).toBe(true);
    expect(runners.some((runner) => runner.id === "browser-sql-wasm")).toBe(true);
    expect(runners.some((runner) => runner.id.includes("c-wasmer"))).toBe(false);
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

});
