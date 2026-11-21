export const C_PLAYGROUND_STORAGE_KEY = "katalyst.c.playground.v1";
export const C_PLAYGROUND_SOURCE_LIMIT = 12_000;
export const C_PLAYGROUND_STDIN_LIMIT = 2_000;

export const defaultCProgram = `#include <stdio.h>

int main(void) {
    printf("Hello, C!\\n");
    return 0;
}
`;

export type CPlaygroundRecord = { version: 1; source: string; stdin: string };

export type CPlaygroundReadResult =
  | { kind: "missing" }
  | { kind: "valid"; record: CPlaygroundRecord }
  | { kind: "invalid" };

export function readCPlaygroundRecord(raw: string | null): CPlaygroundReadResult {
  if (raw === null) return { kind: "missing" };
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return { kind: "invalid" };
    const candidate = value as Record<string, unknown>;
    if (candidate.version !== 1 || typeof candidate.source !== "string" || typeof candidate.stdin !== "string") return { kind: "invalid" };
    if (candidate.source.length > C_PLAYGROUND_SOURCE_LIMIT || candidate.stdin.length > C_PLAYGROUND_STDIN_LIMIT) return { kind: "invalid" };
    return { kind: "valid", record: { version: 1, source: candidate.source, stdin: candidate.stdin } };
  } catch {
    return { kind: "invalid" };
  }
}

export function limitCPlaygroundRecord(source: string, stdin: string): CPlaygroundRecord {
  return {
    version: 1,
    source: source.slice(0, C_PLAYGROUND_SOURCE_LIMIT),
    stdin: stdin.slice(0, C_PLAYGROUND_STDIN_LIMIT),
  };
}

export function extractCCode(content: string): string | undefined {
  const fences = /(?:^|\n)~~~[ \t]*c[ \t]*\r?\n([\s\S]*?)\r?\n~~~(?=\s*(?:\n|$))/gi;
  const match = fences.exec(content);
  if (!match) return undefined;
  const code = match[1].replace(/\r\n/g, "\n");
  return code.length <= C_PLAYGROUND_SOURCE_LIMIT && code.trim() ? code : undefined;
}

export function makeRunnableCProgram(example: string): string {
  const source = example.trim();
  if (/\bmain\s*\(/.test(source)) return `${source}\n`;
  const hasStdio = /^\s*#\s*include\s*[<"]stdio\.h[>"]/m.test(source);
  const body = source.split("\n").map((line) => line.length ? `    ${line}` : "").join("\n");
  return `${hasStdio ? "" : "#include <stdio.h>\n\n"}int main(void) {\n${body}\n    return 0;\n}\n`;
}

export function normalizeStdin(stdin: string): string {
  if (!stdin) return "";
  const normalized = stdin.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return normalized.endsWith("\n") ? normalized : `${normalized}\n`;
}

export function programExpectsStdinC(source: string): boolean {
  return /\b(scanf|getchar|fgetc|fgets|fscanf|gets|readline)\s*\(/.test(source);
}
