import { executeProgram } from "./execution/runner";
import type { ExecutionLanguage, ExecutionLimits, ExecutionStage } from "./execution/types";
import type { ExerciseTestCase } from "./learning-curriculum";

export interface ExerciseVerificationOptions {
  language: ExecutionLanguage;
  code: string;
  testCases: ExerciseTestCase[];
  limits?: Partial<ExecutionLimits>;
  signal?: AbortSignal;
  onCaseStart?: (testCase: ExerciseTestCase, index: number) => void;
  onCaseComplete?: (result: TestCaseResult, index: number) => void;
}

export interface TestCaseResult {
  id: string;
  label: string;
  passed: boolean;
  actualStdout: string;
  expectedStdout: string;
  matchMode: "exact" | "trimmed" | "contains";
  hidden: boolean;
  exitCode: number;
  executionTimeMs: number;
  stdin?: string;
  stderr?: string;
  diagnostics?: string;
  error?: string;
  stage?: ExecutionStage;
  skipped?: boolean;
  skipReason?: string;
}

export interface ExerciseVerificationReport {
  passedCount: number;
  totalCount: number;
  allPassed: boolean;
  shortCircuited?: boolean;
  compileError?: string;
  results: TestCaseResult[];
}

/**
 * Normalizes carriage returns and newlines so comparison is cross-platform.
 */
export function normalizeOutput(str: string): string {
  return str.replace(/\r\n/g, "\n");
}

/**
 * Compares actual standard output against expected output according to the specified match mode.
 */
export function matchOutput(
  actual: string,
  expected: string,
  mode: "exact" | "trimmed" | "contains" = "trimmed"
): boolean {
  const normActual = normalizeOutput(actual);
  const normExpected = normalizeOutput(expected);

  switch (mode) {
    case "exact":
      return normActual === normExpected;
    case "contains":
      return normActual.includes(normExpected);
    case "trimmed":
    default:
      return normActual.trim() === normExpected.trim();
  }
}

/**
 * Returns a sanitized copy of a test result with private test case details masked for learner UI.
 */
export function maskHiddenTestCase(result: TestCaseResult): TestCaseResult {
  if (!result.hidden) return result;
  return {
    ...result,
    stdin: result.stdin !== undefined ? "[Hidden input]" : undefined,
    actualStdout: result.passed
      ? "[Hidden test case output matched]"
      : "[Output hidden for private test case]",
    expectedStdout: "[Hidden]",
    stderr: result.passed ? "" : result.stderr ? "[Private error details masked]" : undefined,
  };
}

/**
 * Runs an exercise submission against its test cases, evaluating correctness and short-circuiting on compiler errors.
 */
export async function verifyExerciseSubmission(
  options: ExerciseVerificationOptions
): Promise<ExerciseVerificationReport> {
  const { language, code, testCases, limits, signal, onCaseStart, onCaseComplete } = options;

  if (!testCases || testCases.length === 0) {
    return {
      passedCount: 0,
      totalCount: 0,
      allPassed: false,
      results: [],
    };
  }

  const results: TestCaseResult[] = [];
  let shortCircuited = false;
  let compileError: string | undefined = undefined;

  const filename =
    language === "python"
      ? "solution.py"
      : language === "cpp"
      ? "solution.cpp"
      : language === "javascript"
      ? "solution.js"
      : language === "sql"
      ? "solution.sql"
      : "solution.c";

  for (let index = 0; index < testCases.length; index++) {
    const testCase = testCases[index]!;

    if (signal?.aborted) {
      break;
    }

    if (shortCircuited) {
      const skippedResult: TestCaseResult = {
        id: testCase.id,
        label: testCase.label,
        passed: false,
        actualStdout: "",
        expectedStdout: testCase.expectedStdout,
        matchMode: testCase.matchMode ?? "trimmed",
        hidden: Boolean(testCase.hidden),
        exitCode: -1,
        executionTimeMs: 0,
        skipped: true,
        skipReason: compileError ? "Skipped due to compilation failure." : "Skipped.",
      };
      results.push(skippedResult);
      onCaseComplete?.(skippedResult, index);
      continue;
    }

    onCaseStart?.(testCase, index);

    try {
      const execResult = await executeProgram({
        language,
        files: [{ path: filename, content: code }],
        stdin: testCase.stdin ?? "",
        limits,
        signal,
      });

      const mode = testCase.matchMode ?? "trimmed";
      const isCompileError =
        !execResult.ok &&
        (execResult.stage === "compile" ||
          (language === "c" && Boolean(execResult.diagnostics && execResult.exitCode !== 0)));

      const passed = execResult.ok && matchOutput(execResult.stdout, testCase.expectedStdout, mode);

      const testResult: TestCaseResult = {
        id: testCase.id,
        label: testCase.label,
        passed,
        actualStdout: execResult.stdout,
        expectedStdout: testCase.expectedStdout,
        matchMode: mode,
        hidden: Boolean(testCase.hidden),
        exitCode: execResult.exitCode,
        executionTimeMs: execResult.executionTimeMs,
        stdin: testCase.stdin,
        stderr: execResult.stderr,
        diagnostics: execResult.diagnostics,
        error: execResult.error,
        stage: execResult.stage,
      };

      results.push(testResult);
      onCaseComplete?.(testResult, index);

      if (isCompileError) {
        shortCircuited = true;
        compileError =
          execResult.diagnostics || execResult.stderr || execResult.error || "Compilation error.";
      }
    } catch (runErr) {
      const isAbort =
        (runErr instanceof DOMException && runErr.name === "AbortError") || signal?.aborted;

      if (isAbort) {
        break;
      }

      const testResult: TestCaseResult = {
        id: testCase.id,
        label: testCase.label,
        passed: false,
        actualStdout: "",
        expectedStdout: testCase.expectedStdout,
        matchMode: testCase.matchMode ?? "trimmed",
        hidden: Boolean(testCase.hidden),
        exitCode: -1,
        executionTimeMs: 0,
        error: runErr instanceof Error ? runErr.message : "Execution failed.",
      };

      results.push(testResult);
      onCaseComplete?.(testResult, index);
    }
  }

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = testCases.length;
  const allPassed = totalCount > 0 && passedCount === totalCount;

  return {
    passedCount,
    totalCount,
    allPassed,
    shortCircuited,
    compileError,
    results,
  };
}
