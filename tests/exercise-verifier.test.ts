import { describe, expect, it } from "vitest";
import {
  normalizeOutput,
  matchOutput,
  maskHiddenTestCase,
  verifyExerciseSubmission,
  type TestCaseResult,
} from "../src/lib/exercise-verifier";
import { executionRegistry } from "../src/lib/execution/runner";
import type { ExecutionRunner, ExecutionResult } from "../src/lib/execution/types";

describe("Exercise Verifier (M18)", () => {
  describe("normalizeOutput", () => {
    it("converts Windows \\r\\n to POSIX \\n", () => {
      expect(normalizeOutput("line1\r\nline2\r\n")).toBe("line1\nline2\n");
      expect(normalizeOutput("simple\n")).toBe("simple\n");
    });
  });

  describe("matchOutput", () => {
    it("matches exact output strictly", () => {
      expect(matchOutput("Hello, World!\n", "Hello, World!\n", "exact")).toBe(true);
      expect(matchOutput("Hello, World!", "Hello, World!\n", "exact")).toBe(false);
      expect(matchOutput("  Hello  ", "Hello", "exact")).toBe(false);
    });

    it("matches trimmed output ignoring outer whitespace (default)", () => {
      expect(matchOutput("  Hello, World!\n\n", "Hello, World!", "trimmed")).toBe(true);
      expect(matchOutput("Hello, World!", "  Hello, World!  ")).toBe(true);
      expect(matchOutput("Count: 5\n", "Count: 5")).toBe(true);
      expect(matchOutput("Count: 4", "Count: 5")).toBe(false);
    });

    it("matches contains output by substring", () => {
      expect(matchOutput("Sensor active: 101.325 kPa", "101.325", "contains")).toBe(true);
      expect(matchOutput("Pressure nominal", "101.325", "contains")).toBe(false);
    });
  });

  describe("maskHiddenTestCase", () => {
    it("keeps visible test case output unmodified", () => {
      const publicResult: TestCaseResult = {
        id: "t1",
        label: "Public test",
        passed: true,
        actualStdout: "Result: 42",
        expectedStdout: "Result: 42",
        matchMode: "trimmed",
        hidden: false,
        exitCode: 0,
        executionTimeMs: 15,
        stdin: "42",
      };
      const masked = maskHiddenTestCase(publicResult);
      expect(masked.actualStdout).toBe("Result: 42");
      expect(masked.expectedStdout).toBe("Result: 42");
      expect(masked.stdin).toBe("42");
    });

    it("masks stdout, expectedStdout, and stdin for hidden tests", () => {
      const hiddenPassed: TestCaseResult = {
        id: "t2",
        label: "Hidden boundary test",
        passed: true,
        actualStdout: "Secret output",
        expectedStdout: "Secret output",
        matchMode: "exact",
        hidden: true,
        exitCode: 0,
        executionTimeMs: 12,
        stdin: "secret_input",
      };
      const maskedPassed = maskHiddenTestCase(hiddenPassed);
      expect(maskedPassed.expectedStdout).toBe("[Hidden]");
      expect(maskedPassed.stdin).toBe("[Hidden input]");
      expect(maskedPassed.actualStdout).toBe("[Hidden test case output matched]");

      const hiddenFailed: TestCaseResult = {
        id: "t3",
        label: "Hidden edge test",
        passed: false,
        actualStdout: "Wrong secret output",
        expectedStdout: "Expected secret output",
        matchMode: "exact",
        hidden: true,
        exitCode: 0,
        executionTimeMs: 10,
        stderr: "Internal panic trace at line 4",
      };
      const maskedFailed = maskHiddenTestCase(hiddenFailed);
      expect(maskedFailed.expectedStdout).toBe("[Hidden]");
      expect(maskedFailed.actualStdout).toBe("[Output hidden for private test case]");
      expect(maskedFailed.stderr).toBe("[Private error details masked]");
    });
  });

  describe("verifyExerciseSubmission execution flow", () => {
    it("returns empty report when testCases array is empty", async () => {
      const report = await verifyExerciseSubmission({
        language: "python",
        code: "print('empty')",
        testCases: [],
      });
      expect(report.totalCount).toBe(0);
      expect(report.passedCount).toBe(0);
      expect(report.allPassed).toBe(false);
      expect(report.results).toEqual([]);
    });

    it("verifies matching test cases using registered runner", async () => {
      const mockRunner: ExecutionRunner = {
        id: "mock-verifier-runner",
        name: "Mock Verifier Runner",
        target: "browser-wasm",
        supportsLanguage: (lang) => lang === "python",
        isReady: () => true,
        prepare: async () => {},
        execute: async (req): Promise<ExecutionResult> => {
          if (req.stdin === "42\n") {
            return {
              ok: true,
              exitCode: 0,
              stdout: "Answer: 42\n",
              stderr: "",
              executionTimeMs: 25,
              runner: "browser-wasm",
              stage: "finished",
            };
          }
          return {
            ok: true,
            exitCode: 0,
            stdout: "Answer: 10\n",
            stderr: "",
            executionTimeMs: 20,
            runner: "browser-wasm",
            stage: "finished",
          };
        },
      };

      executionRegistry.register(mockRunner);

      const report = await verifyExerciseSubmission({
        language: "python",
        code: "val = input()\nprint(f'Answer: {val}')",
        testCases: [
          {
            id: "case-1",
            label: "Evaluates standard answer 10",
            stdin: "10\n",
            expectedStdout: "Answer: 10",
            matchMode: "trimmed",
          },
          {
            id: "case-2",
            label: "Evaluates standard answer 42",
            stdin: "42\n",
            expectedStdout: "Answer: 42",
            matchMode: "trimmed",
          },
        ],
      });

      expect(report.totalCount).toBe(2);
      expect(report.passedCount).toBe(2);
      expect(report.allPassed).toBe(true);
      expect(report.results[0]!.passed).toBe(true);
      expect(report.results[1]!.passed).toBe(true);

      executionRegistry.unregister("mock-verifier-runner");
    });

    it("short-circuits subsequent tests upon compilation failure", async () => {
      let callCount = 0;
      const mockCompileFailRunner: ExecutionRunner = {
        id: "mock-compile-fail-runner",
        name: "Mock Compile Fail Runner",
        target: "browser-wasm",
        supportsLanguage: (lang) => lang === "c",
        isReady: () => true,
        prepare: async () => {},
        execute: async (): Promise<ExecutionResult> => {
          callCount++;
          return {
            ok: false,
            exitCode: 1,
            stdout: "",
            stderr: "error: expected ';' after expression",
            diagnostics: "main.c:4:5: error: expected ';' after expression",
            executionTimeMs: 10,
            runner: "browser-wasm",
            stage: "compile",
          };
        },
      };

      executionRegistry.register(mockCompileFailRunner);

      const report = await verifyExerciseSubmission({
        language: "c",
        code: "int main() { syntax_error }",
        testCases: [
          { id: "c1", label: "Test 1", expectedStdout: "Output 1" },
          { id: "c2", label: "Test 2", expectedStdout: "Output 2" },
          { id: "c3", label: "Test 3", expectedStdout: "Output 3" },
        ],
      });

      // Runner should only be called once because test 1 failed compile
      expect(callCount).toBe(1);
      expect(report.shortCircuited).toBe(true);
      expect(report.compileError).toContain("expected ';'");
      expect(report.totalCount).toBe(3);
      expect(report.passedCount).toBe(0);
      expect(report.allPassed).toBe(false);
      expect(report.results[0]!.passed).toBe(false);
      expect(report.results[1]!.skipped).toBe(true);
      expect(report.results[2]!.skipped).toBe(true);

      executionRegistry.unregister("mock-compile-fail-runner");
    });
  });
});
