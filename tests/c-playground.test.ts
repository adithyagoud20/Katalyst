import { describe, expect, it } from "vitest";
import { cProgrammingPath, flattenLessons } from "../src/lib/learning-curriculum";
import {
  C_PLAYGROUND_COMPILER_PACKAGE,
  C_PLAYGROUND_COMPILE_TIMEOUT_MS,
  C_PLAYGROUND_OUTPUT_LIMIT,
  C_PLAYGROUND_RUN_TIMEOUT_MS,
  C_PLAYGROUND_SOURCE_LIMIT,
  C_PLAYGROUND_STDIN_LIMIT,
  defaultCProgram,
  extractCCode,
  getOutputChannels,
  getOutputText,
  limitCPlaygroundRecord,
  makeRunnableCProgram,
  normalizeStdin,
  programExpectsStdin,
  readCPlaygroundRecord,
} from "../src/lib/c-playground";

describe("C Playground inputs, compiler infrastructure and execution limits", () => {
  it("stores only bounded versioned source and stdin and rejects malformed drafts", () => {
    expect(readCPlaygroundRecord(null)).toEqual({ kind: "missing" });
    expect(readCPlaygroundRecord("{bad")).toEqual({ kind: "invalid" });
    expect(readCPlaygroundRecord(JSON.stringify({ version: 2, source: "int main(){}", stdin: "" })).kind).toBe("invalid");
    expect(readCPlaygroundRecord(JSON.stringify({ version: 1, source: "x".repeat(C_PLAYGROUND_SOURCE_LIMIT + 1), stdin: "" })).kind).toBe("invalid");

    const record = limitCPlaygroundRecord("x".repeat(C_PLAYGROUND_SOURCE_LIMIT + 5), "y".repeat(C_PLAYGROUND_STDIN_LIMIT + 5));
    expect(record).toEqual({ version: 1, source: "x".repeat(C_PLAYGROUND_SOURCE_LIMIT), stdin: "y".repeat(C_PLAYGROUND_STDIN_LIMIT) });
    expect(readCPlaygroundRecord(JSON.stringify(record))).toEqual({ kind: "valid", record });
  });

  it("extracts only C fences and wraps lesson snippets as complete programs", () => {
    const firstLesson = flattenLessons(cProgrammingPath)[0].lesson;
    const example = extractCCode(firstLesson.content);
    expect(example).toContain("int main(void)");
    expect(makeRunnableCProgram(example!)).toContain("printf(\"Hello, C!");

    const variables = flattenLessons(cProgrammingPath)[1].lesson;
    const statementSnippet = extractCCode(variables.content);
    const runnable = makeRunnableCProgram(statementSnippet!);
    expect(runnable).toContain("#include <stdio.h>");
    expect(runnable).toContain("int main(void)");
    expect(runnable).toContain("double temperature = 21.5;");
    expect(extractCCode("~~~js\nconsole.log('not C')\n~~~")).toBeUndefined();
  });

  it("provides a real bounded browser compiler configuration", () => {
    expect(C_PLAYGROUND_COMPILER_PACKAGE).toMatch(/^clang\/clang@=/);
    expect(C_PLAYGROUND_RUN_TIMEOUT_MS).toBe(8_000);
    expect(C_PLAYGROUND_COMPILE_TIMEOUT_MS).toBe(15_000);
    expect(C_PLAYGROUND_OUTPUT_LIMIT).toBe(64_000);
    expect(defaultCProgram).toContain("int main(void)");
  });

  describe("Program stdin detection (scanf, integer input, getchar, streams)", () => {
    it("accurately detects programs expecting standard input via scanf, getchar, fgets, cin, etc.", () => {
      expect(programExpectsStdin("int main() { printf(\"Hello\"); return 0; }")).toBe(false);
      expect(programExpectsStdin("int main() { int x; scanf(\"%d\", &x); return 0; }")).toBe(true);
      expect(programExpectsStdin("int main() { int a, b; scanf(\"%d %d\", &a, &b); return 0; }")).toBe(true);
      expect(programExpectsStdin("int main() { char c = getchar(); return 0; }")).toBe(true);
      expect(programExpectsStdin("int main() { char buf[10]; fgets(buf, 10, stdin); return 0; }")).toBe(true);
      expect(programExpectsStdin("int main() { int n; fscanf(stdin, \"%d\", &n); return 0; }")).toBe(true);
      expect(programExpectsStdin("int main() { int x; std::cin >> x; return 0; }")).toBe(true);
    });

    it("normalizes integer input using scanf with trailing newline", () => {
      expect(normalizeStdin("42")).toBe("42\n");
      expect(normalizeStdin("42\n")).toBe("42\n");
      expect(normalizeStdin("-100")).toBe("-100\n");
    });

    it("normalizes multiple input values on a single line", () => {
      expect(normalizeStdin("10 20 30")).toBe("10 20 30\n");
      expect(normalizeStdin("10   20\t30")).toBe("10   20\t30\n");
    });

    it("normalizes multiple input lines and converts CRLF to LF", () => {
      expect(normalizeStdin("10\n20\n30")).toBe("10\n20\n30\n");
      expect(normalizeStdin("10\r\n20\r\n30\r\n")).toBe("10\n20\n30\n");
      expect(normalizeStdin("first\r\nsecond\r\n")).toBe("first\nsecond\n");
    });

    it("handles invalid or empty input and EOF gracefully", () => {
      expect(normalizeStdin("")).toBe("");
      expect(normalizeStdin("   \n")).toBe("   \n");
    });
  });

  describe("Compiler diagnostics, output limits, and runtime outcomes", () => {
    it("formats compilation errors and diagnostics accurately", () => {
      const compileErr = {
        stdout: { text: () => "", truncated: false },
        stderr: { text: () => "main.c:4:5: error: use of undeclared identifier 'x'\n    x = 10;\n    ^", truncated: false },
      };
      const text = getOutputText(compileErr);
      expect(text).toContain("error: use of undeclared identifier 'x'");

      const channels = getOutputChannels(compileErr);
      expect(channels.stdout).toBe("");
      expect(channels.stderr).toContain("use of undeclared identifier 'x'");
    });

    it("formats runtime stdout and stderr channels accurately", () => {
      const runSuccess = {
        stdout: { text: () => "Result: 42\n", truncated: false },
        stderr: { text: () => "", truncated: false },
      };
      expect(getOutputText(runSuccess)).toBe("Result: 42");
      expect(getOutputChannels(runSuccess)).toEqual({
        stdout: "Result: 42\n",
        stderr: "",
      });

      const runtimeError = {
        stdout: { text: () => "Calculating...\n", truncated: false },
        stderr: { text: () => "Segmentation fault (core dumped)\n", truncated: false },
      };
      const combined = getOutputText(runtimeError);
      expect(combined).toContain("Calculating...");
      expect(combined).toContain("Segmentation fault");
    });

    it("appends cut-off notification when output exceeds 64 KB limit", () => {
      const truncatedOutput = {
        stdout: { text: () => "Lots of output...", truncated: true },
        stderr: { text: () => "", truncated: false },
      };
      expect(getOutputText(truncatedOutput)).toContain("Output was cut off at the 64 KB limit.");
      expect(getOutputChannels(truncatedOutput).stdout).toContain("[Output cut off at the 64 KB limit.]");
    });

    it("verifies timeout and limit invariants for local compiler safety", () => {
      // Compile timeout must be longer than run timeout
      expect(C_PLAYGROUND_COMPILE_TIMEOUT_MS).toBeGreaterThan(C_PLAYGROUND_RUN_TIMEOUT_MS);
      // Run timeout is strictly capped at 8 seconds to prevent infinite loops
      expect(C_PLAYGROUND_RUN_TIMEOUT_MS).toBeLessThanOrEqual(8_000);
      // Source code cannot exceed 12 KB
      expect(C_PLAYGROUND_SOURCE_LIMIT).toBe(12_000);
      // Stdin cannot exceed 2 KB
      expect(C_PLAYGROUND_STDIN_LIMIT).toBe(2_000);
    });

    it("exports isolated storage keys and valid starter programs for all playground runtimes", async () => {
      const {
        CPP_PLAYGROUND_STORAGE_KEY,
        JS_PLAYGROUND_STORAGE_KEY,
        SQL_PLAYGROUND_STORAGE_KEY,
        HTML_PLAYGROUND_STORAGE_KEY,
        CIRCUIT_PLAYGROUND_STORAGE_KEY,
        defaultCppProgram,
        defaultJsProgram,
        defaultSqlProgram,
        defaultHtmlProgram,
      } = await import("../src/components/c-playground");

      expect(CPP_PLAYGROUND_STORAGE_KEY).toBe("katalyst.cpp.playground.v1");
      expect(JS_PLAYGROUND_STORAGE_KEY).toBe("katalyst.js.playground.v1");
      expect(SQL_PLAYGROUND_STORAGE_KEY).toBe("katalyst.sql.playground.v1");
      expect(HTML_PLAYGROUND_STORAGE_KEY).toBe("katalyst.html.playground.v1");
      expect(CIRCUIT_PLAYGROUND_STORAGE_KEY).toBe("katalyst.circuit.playground.v1");

      expect(defaultCppProgram).toContain("template <typename T>");
      expect(defaultCppProgram).toContain("scanf");
      expect(defaultCppProgram).toContain("printf");
      expect(defaultJsProgram).toContain("computeFibonacci");
      expect(defaultSqlProgram).toContain("CREATE TABLE engineers");
      expect(defaultHtmlProgram).toContain("<!DOCTYPE html>");
    });
  });
});
