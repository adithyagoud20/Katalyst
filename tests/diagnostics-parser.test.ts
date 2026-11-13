import { describe, expect, it } from "vitest";
import { parseDiagnostics } from "../src/lib/execution/diagnostics-parser";

describe("Diagnostics Parser (M19)", () => {
  it("returns empty array for empty or whitespace stderr", () => {
    expect(parseDiagnostics("", "c")).toEqual([]);
    expect(parseDiagnostics("   \n", "python")).toEqual([]);
  });

  describe("C11 / Clang diagnostics", () => {
    it("parses single compiler error with line and column", () => {
      const stderr = "solution.c:12:5: error: expected ';' after expression\n    int x = 10\n    ^";
      const result = parseDiagnostics(stderr, "c");

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        line: 12,
        column: 5,
        severity: "error",
        message: "expected ';' after expression",
      });
    });

    it("parses compiler warnings and multiple diagnostics", () => {
      const stderr = `main.c:4:10: warning: unused variable 'unused_val' [-Wunused-variable]
main.c:15:3: error: use of undeclared identifier 'count'`;
      const result = parseDiagnostics(stderr, "c");

      expect(result).toHaveLength(2);
      expect(result[0]!.severity).toBe("warning");
      expect(result[0]!.line).toBe(4);
      expect(result[1]!.severity).toBe("error");
      expect(result[1]!.line).toBe(15);
      expect(result[1]!.message).toContain("undeclared identifier 'count'");
    });
  });

  describe("Python tracebacks", () => {
    it("parses Python runtime exception with line number", () => {
      const stderr = `Traceback (most recent call last):
  File "solution.py", line 7, in <module>
    result = divide(10, 0)
ZeroDivisionError: division by zero`;
      const result = parseDiagnostics(stderr, "python");

      expect(result).toHaveLength(1);
      expect(result[0]!.line).toBe(7);
      expect(result[0]!.severity).toBe("error");
      expect(result[0]!.message).toContain("ZeroDivisionError: division by zero");
    });

    it("parses Python syntax errors", () => {
      const stderr = `  File "solution.py", line 3
    if x == 5
             ^
SyntaxError: expected ':'`;
      const result = parseDiagnostics(stderr, "python");

      expect(result).toHaveLength(1);
      expect(result[0]!.line).toBe(3);
      expect(result[0]!.severity).toBe("error");
      expect(result[0]!.message).toContain("SyntaxError: expected ':'");
    });
  });

  describe("JavaScript errors", () => {
    it("parses JavaScript runtime error with line and column", () => {
      const stderr = "ReferenceError: foo is not defined\n    at solution.js:8:12";
      const result = parseDiagnostics(stderr, "javascript");

      expect(result).toHaveLength(1);
      expect(result[0]!.line).toBe(8);
      expect(result[0]!.column).toBe(12);
      expect(result[0]!.message).toContain("ReferenceError: foo is not defined");
    });
  });
});
