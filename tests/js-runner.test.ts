import { describe, expect, it } from "vitest";
import { JavaScriptWorkerRunner } from "../src/lib/execution/js-runner";
import { verifyExerciseSubmission } from "../src/lib/exercise-verifier";

describe("JavaScript Isolated Runner (M19)", () => {
  const runner = new JavaScriptWorkerRunner();

  it("supports javascript language", () => {
    expect(runner.supportsLanguage("javascript")).toBe(true);
    expect(runner.supportsLanguage("c")).toBe(false);
  });

  it("executes valid JavaScript code and captures console.log output", async () => {
    const result = await runner.execute({
      language: "javascript",
      files: [{ path: "solution.js", content: "console.log('Hello from JS');" }],
    });

    expect(result.ok).toBe(true);
    expect(result.stdout.trim()).toBe("Hello from JS");
    expect(result.exitCode).toBe(0);
  });

  it("handles console.error and console.warn into stderr", async () => {
    const result = await runner.execute({
      language: "javascript",
      files: [{ path: "solution.js", content: "console.warn('Warning log'); console.error('Error log');" }],
    });

    expect(result.ok).toBe(true);
    expect(result.stderr).toContain("Warning log");
    expect(result.stderr).toContain("Error log");
  });

  it("handles multiple console arguments and JSON objects", async () => {
    const result = await runner.execute({
      language: "javascript",
      files: [{ path: "solution.js", content: "console.log('Value:', 42, { ok: true });" }],
    });

    expect(result.ok).toBe(true);
    expect(result.stdout).toContain('Value: 42 {"ok":true}');
  });

  it("handles runtime errors cleanly", async () => {
    const result = await runner.execute({
      language: "javascript",
      files: [{ path: "solution.js", content: "const a = b + 1;" }],
    });

    expect(result.ok).toBe(false);
    expect(result.stderr).toContain("ReferenceError");
    expect(result.exitCode).toBe(1);
  });

  it("supports automated verification with verifyExerciseSubmission", async () => {
    const report = await verifyExerciseSubmission({
      language: "javascript",
      code: `
function solve(n) {
  return n * 2;
}
console.log("Result:", solve(5));
      `,
      testCases: [
        {
          id: "tc-js-1",
          label: "Multiplies 5 by 2 to yield Result: 10",
          expectedStdout: "Result: 10",
          matchMode: "trimmed",
        },
        {
          id: "tc-js-2",
          label: "Exact output contains 10",
          expectedStdout: "10",
          matchMode: "contains",
          hidden: true,
        },
      ],
    });

    expect(report.totalCount).toBe(2);
    expect(report.passedCount).toBe(2);
    expect(report.allPassed).toBe(true);
  });
});
