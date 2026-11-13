export const PYTHON_PLAYGROUND_STORAGE_KEY = "katalyst.python.playground.v1";
export const PYTHON_PLAYGROUND_SOURCE_LIMIT = 24_000;
export const PYTHON_PLAYGROUND_STDIN_LIMIT = 4_000;
export const PYTHON_PLAYGROUND_OUTPUT_LIMIT = 64_000;

export const defaultPythonProgram = `def main():
    print("Hello from Python 3.12!")

if __name__ == "__main__":
    main()
`;

export type PythonPlaygroundRecord = {
  version: 1;
  source: string;
  stdin: string;
  updatedAt?: number;
};

export type PythonPlaygroundRecordRead =
  | { kind: "valid"; record: PythonPlaygroundRecord }
  | { kind: "missing" }
  | { kind: "invalid" };

export function limitPythonPlaygroundRecord(source: string, stdin: string): PythonPlaygroundRecord {
  return {
    version: 1,
    source: source.slice(0, PYTHON_PLAYGROUND_SOURCE_LIMIT),
    stdin: stdin.slice(0, PYTHON_PLAYGROUND_STDIN_LIMIT),
    updatedAt: Date.now(),
  };
}

export function readPythonPlaygroundRecord(raw: string | null): PythonPlaygroundRecordRead {
  if (raw === null) return { kind: "missing" };
  try {
    const parsed = JSON.parse(raw) as Partial<PythonPlaygroundRecord>;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      parsed.version !== 1 ||
      typeof parsed.source !== "string" ||
      typeof parsed.stdin !== "string" ||
      parsed.source.length > PYTHON_PLAYGROUND_SOURCE_LIMIT ||
      parsed.stdin.length > PYTHON_PLAYGROUND_STDIN_LIMIT
    ) {
      return { kind: "invalid" };
    }
    return {
      kind: "valid",
      record: {
        version: 1,
        source: parsed.source,
        stdin: parsed.stdin,
        ...(typeof parsed.updatedAt === "number" ? { updatedAt: parsed.updatedAt } : {}),
      },
    };
  } catch {
    return { kind: "invalid" };
  }
}

export function programExpectsStdinPython(source: string): boolean {
  return /\binput\s*\(|\bsys\.stdin\b/.test(source);
}
