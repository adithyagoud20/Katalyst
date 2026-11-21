import { describe, expect, it } from "vitest";
import { cProgrammingPath, flattenLessons } from "../src/lib/learning-curriculum";
import {
  C_PLAYGROUND_SOURCE_LIMIT,
  C_PLAYGROUND_STDIN_LIMIT,
  C_PLAYGROUND_STORAGE_KEY,
  defaultCProgram,
  extractCCode,
  limitCPlaygroundRecord,
  makeRunnableCProgram,
  normalizeStdin,
  programExpectsStdinC,
  readCPlaygroundRecord,
} from "../src/lib/c-playground";

describe("C lesson editor drafts", () => {
  it("stores bounded versioned source and stdin and rejects malformed drafts", () => {
    expect(readCPlaygroundRecord(null)).toEqual({ kind: "missing" });
    expect(readCPlaygroundRecord("{bad")).toEqual({ kind: "invalid" });
    expect(readCPlaygroundRecord(JSON.stringify({ version: 2, source: "int main(){}", stdin: "" })).kind).toBe("invalid");
    expect(readCPlaygroundRecord(JSON.stringify({ version: 1, source: "x".repeat(C_PLAYGROUND_SOURCE_LIMIT + 1), stdin: "" })).kind).toBe("invalid");

    const record = limitCPlaygroundRecord("x".repeat(C_PLAYGROUND_SOURCE_LIMIT + 5), "y".repeat(C_PLAYGROUND_STDIN_LIMIT + 5));
    expect(record).toEqual({ version: 1, source: "x".repeat(C_PLAYGROUND_SOURCE_LIMIT), stdin: "y".repeat(C_PLAYGROUND_STDIN_LIMIT) });
    expect(readCPlaygroundRecord(JSON.stringify(record))).toEqual({ kind: "valid", record });
    expect(C_PLAYGROUND_STORAGE_KEY).toBe("katalyst.c.playground.v1");
  });

  it("extracts C lesson examples and prepares complete editable program text", () => {
    const firstLesson = flattenLessons(cProgrammingPath)[0].lesson;
    const example = extractCCode(firstLesson.content);
    expect(example).toContain("int main(void)");
    expect(makeRunnableCProgram(example!)).toContain('printf("Hello, C!');

    const variables = flattenLessons(cProgrammingPath)[1].lesson;
    const snippet = extractCCode(variables.content);
    const editableProgram = makeRunnableCProgram(snippet!);
    expect(editableProgram).toContain("#include <stdio.h>");
    expect(editableProgram).toContain("int main(void)");
    expect(editableProgram).toContain("double temperature = 21.5;");
    expect(extractCCode("~~~js\nconsole.log('not C')\n~~~")).toBeUndefined();
    expect(defaultCProgram).toContain("int main(void)");
  });

  it("normalizes standard input line endings for the remaining browser workbenches", () => {
    expect(normalizeStdin("42")).toBe("42\n");
    expect(normalizeStdin("42\n")).toBe("42\n");
    expect(normalizeStdin("10 20 30")).toBe("10 20 30\n");
    expect(normalizeStdin("10\r\n20\r\n30\r\n")).toBe("10\n20\n30\n");
    expect(normalizeStdin("")).toBe("");
    expect(normalizeStdin("   \n")).toBe("   \n");
  });

  it("detects when a C program expects standard input", () => {
    expect(programExpectsStdinC('int main() { int x; scanf("%d", &x); return 0; }')).toBe(true);
    expect(programExpectsStdinC('int main() { char c = getchar(); return 0; }')).toBe(true);
    expect(programExpectsStdinC('int main() { char buf[32]; fgets(buf, 32, stdin); return 0; }')).toBe(true);
    expect(programExpectsStdinC('int main() { printf("Hello, C!\\n"); return 0; }')).toBe(false);
  });

  it("keeps persistent editor keys and starter source for the other workbenches", async () => {
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
    expect(defaultCppProgram).toContain("const int value = 21;");
    expect(defaultJsProgram).toContain("computeFibonacci");
    expect(defaultSqlProgram).toContain("CREATE TABLE engineers");
    expect(defaultHtmlProgram).toContain("<!DOCTYPE html>");
    expect(defaultHtmlProgram).not.toMatch(/\son[a-z]+\s*=/i);
  });
});
