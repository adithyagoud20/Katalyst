import type { ExecutionLanguage } from "./types";

export interface ParsedDiagnostic {
  line: number;
  column?: number;
  severity: "error" | "warning";
  message: string;
  sourceSnippet?: string;
  raw: string;
}

/**
 * Parses raw compiler/interpreter stderr into structured line-targeted diagnostics.
 */
export function parseDiagnostics(
  stderr: string,
  language: ExecutionLanguage
): ParsedDiagnostic[] {
  if (!stderr || !stderr.trim()) return [];

  const diagnostics: ParsedDiagnostic[] = [];
  const lines = stderr.split(/\r?\n/);

  if (language === "c" || language === "cpp") {
    // Clang / GCC format: <filename>:<line>:<col>: <severity>: <message>
    // e.g.: solution.c:12:5: error: expected ';' after expression
    const clangRegex = /(?:^|\n)(?:[A-Za-z0-9_.-]+):(\d+):(?:(\d+):)?\s*(error|warning|fatal error):\s*(.+)/gi;
    let match: RegExpExecArray | null;

    while ((match = clangRegex.exec(stderr)) !== null) {
      const lineNum = parseInt(match[1]!, 10);
      const colNum = match[2] ? parseInt(match[2], 10) : undefined;
      const sevStr = match[3]!.toLowerCase();
      const severity: "error" | "warning" = sevStr.includes("warning") ? "warning" : "error";
      const message = match[4]!.trim();

      diagnostics.push({
        line: lineNum,
        column: colNum,
        severity,
        message,
        raw: match[0].trim(),
      });
    }
  } else if (language === "python") {
    // Python traceback format:
    // File "solution.py", line 4, in <module>
    // ...
    // NameError: name 'x' is not defined
    let currentLine: number | undefined;
    let currentMessage = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const fileMatch = /File\s+["'](?:[^"']+)["'],\s+line\s+(\d+)/i.exec(line);
      if (fileMatch) {
        currentLine = parseInt(fileMatch[1]!, 10);
      }

      const errorMatch = /^(?:[A-Za-z_][A-Za-z0-9_]*Error|Exception):\s*(.*)/.exec(line);
      if (errorMatch && currentLine !== undefined) {
        currentMessage = line.trim();
        diagnostics.push({
          line: currentLine,
          severity: "error",
          message: currentMessage,
          raw: line.trim(),
        });
      } else if (/^SyntaxError:\s*(.*)/.exec(line) && currentLine !== undefined) {
        diagnostics.push({
          line: currentLine,
          severity: "error",
          message: line.trim(),
          raw: line.trim(),
        });
      }
    }

    // Fallback if no specific Error header matched but line was detected
    if (diagnostics.length === 0 && currentLine !== undefined) {
      const lastNonEmpty = lines.filter((l) => l.trim()).pop() ?? "Execution error";
      diagnostics.push({
        line: currentLine,
        severity: "error",
        message: lastNonEmpty.trim(),
        raw: stderr.trim(),
      });
    }
  } else if (language === "javascript") {
    // JavaScript V8/Node format:
    // solution.js:4:10
    // ReferenceError: x is not defined
    const jsRegex = /(?:solution\.js|eval|worker):(\d+):(?:(\d+))/i;
    let lineNum: number | undefined;
    let colNum: number | undefined;

    for (const l of lines) {
      const m = jsRegex.exec(l);
      if (m) {
        lineNum = parseInt(m[1]!, 10);
        colNum = m[2] ? parseInt(m[2], 10) : undefined;
        break;
      }
    }

    const errorLine = lines.find((l) => /(?:Error|Exception):/.test(l)) || lines[0] || "Runtime error";

    if (lineNum !== undefined) {
      diagnostics.push({
        line: lineNum,
        column: colNum,
        severity: "error",
        message: errorLine.trim(),
        raw: stderr.trim(),
      });
    } else if (errorLine.trim()) {
      diagnostics.push({
        line: 1,
        severity: "error",
        message: errorLine.trim(),
        raw: stderr.trim(),
      });
    }
  } else if (language === "sql") {
    const lineMatch = /(?:line\s+(\d+)|at\s+line\s+(\d+))/i.exec(stderr);
    const lineNum = lineMatch ? parseInt(lineMatch[1] || lineMatch[2]!, 10) : 1;
    const msg = lines.filter((l) => l.trim()).join(" ") || "SQL execution error";
    diagnostics.push({
      line: lineNum,
      severity: "error",
      message: msg.trim(),
      raw: stderr.trim(),
    });
  }

  return diagnostics;
}
