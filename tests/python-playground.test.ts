import { describe, expect, it } from "vitest";
import {
  PYTHON_PLAYGROUND_STORAGE_KEY,
  PYTHON_PLAYGROUND_SOURCE_LIMIT,
  PYTHON_PLAYGROUND_STDIN_LIMIT,
  defaultPythonProgram,
  limitPythonPlaygroundRecord,
  readPythonPlaygroundRecord,
  programExpectsStdinPython,
} from "../src/lib/python-playground";

describe("Python Playground configuration and storage record", () => {
  it("stores and validates bounded versioned Python drafts", () => {
    expect(PYTHON_PLAYGROUND_STORAGE_KEY).toBe("katalyst.python.playground.v1");
    expect(readPythonPlaygroundRecord(null)).toEqual({ kind: "missing" });
    expect(readPythonPlaygroundRecord("not-json")).toEqual({ kind: "invalid" });
    expect(readPythonPlaygroundRecord(JSON.stringify({ version: 2, source: "print(1)", stdin: "" })).kind).toBe("invalid");

    const record = limitPythonPlaygroundRecord("x".repeat(PYTHON_PLAYGROUND_SOURCE_LIMIT + 10), "y".repeat(PYTHON_PLAYGROUND_STDIN_LIMIT + 10));
    expect(record.source.length).toBe(PYTHON_PLAYGROUND_SOURCE_LIMIT);
    expect(record.stdin.length).toBe(PYTHON_PLAYGROUND_STDIN_LIMIT);

    const validRead = readPythonPlaygroundRecord(JSON.stringify(record));
    expect(validRead.kind).toBe("valid");
    if (validRead.kind === "valid") {
      expect(validRead.record.version).toBe(1);
      expect(validRead.record.source).toBe(record.source);
    }
  });

  it("detects when Python code requests input", () => {
    expect(programExpectsStdinPython("print('Hello')")).toBe(false);
    expect(programExpectsStdinPython("name = input('Name: ')")).toBe(true);
    expect(programExpectsStdinPython("import sys\ndata = sys.stdin.read()")).toBe(true);
  });

  it("provides valid default starter Python program", () => {
    expect(defaultPythonProgram).toContain("def main():");
    expect(defaultPythonProgram).toContain("Python 3.12");
  });
});
