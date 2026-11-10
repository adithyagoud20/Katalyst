import { describe, expect, it } from "vitest";
import { cProgrammingPath, flattenLessons } from "../src/lib/learning-curriculum";
import {
  C_PLAYGROUND_COMPILER_PACKAGE,
  C_PLAYGROUND_OUTPUT_LIMIT,
  C_PLAYGROUND_RUN_TIMEOUT_MS,
  C_PLAYGROUND_SOURCE_LIMIT,
  C_PLAYGROUND_STDIN_LIMIT,
  defaultCProgram,
  extractCCode,
  limitCPlaygroundRecord,
  makeRunnableCProgram,
  readCPlaygroundRecord,
} from "../src/lib/c-playground";

describe("C Playground inputs and lesson examples", () => {
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
    expect(C_PLAYGROUND_RUN_TIMEOUT_MS).toBeGreaterThan(0);
    expect(C_PLAYGROUND_OUTPUT_LIMIT).toBe(64_000);
    expect(defaultCProgram).toContain("int main(void)");
  });
});
