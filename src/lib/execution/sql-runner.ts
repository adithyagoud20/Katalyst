import initSqlJs, { type SqlJsStatic, type QueryExecResult } from "sql.js";
import {
  ExecutionLanguage,
  ExecutionRequest,
  ExecutionResult,
  ExecutionRunner,
} from "./types";

let sqlJsPromise: Promise<SqlJsStatic> | null = null;

async function getSqlJs(): Promise<SqlJsStatic> {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({
      locateFile: (file: string) => {
        if (typeof window !== "undefined") {
          // sql.js' browser entrypoint requests sql-wasm-browser.wasm; the
          // browser and default package builds ship identical WASM bytes.
          const asset = file === "sql-wasm-browser.wasm" ? "sql-wasm.wasm" : file;
          return `/vendor/sqljs/${asset}`;
        }
        // In Node.js / test environments, locate from public/vendor/sqljs or node_modules
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const path = require("node:path");
          return path.resolve(process.cwd(), "public/vendor/sqljs", file);
        } catch {
          return file;
        }
      },
    });
  }
  const pending = sqlJsPromise;
  try {
    return await pending;
  } catch (error) {
    // A transient WASM asset/network failure must not poison SQLite for the
    // rest of this tab. Let the next Run retry initialization.
    if (sqlJsPromise === pending) sqlJsPromise = null;
    throw error;
  }
}

export function formatSqlResults(results: QueryExecResult[]): string {
  if (results.length === 0) {
    return "Query executed successfully.\n(0 rows returned)\n";
  }

  const parts: string[] = [];

  for (const res of results) {
    const { columns, values } = res;
    if (columns.length === 0) continue;

    // Calculate max width for each column
    const colWidths = columns.map((col, idx) => {
      let maxLen = col.length;
      for (const row of values) {
        const str = row[idx] === null || row[idx] === undefined ? "NULL" : String(row[idx]);
        if (str.length > maxLen) maxLen = str.length;
      }
      return maxLen;
    });

    const header = columns.map((col, i) => col.padEnd(colWidths[i]!)).join(" | ");
    const separator = colWidths.map((w) => "-".repeat(w)).join("-+-");

    const rows = values.map((row) =>
      row
        .map((val, i) => {
          const str = val === null || val === undefined ? "NULL" : String(val);
          return str.padEnd(colWidths[i]!);
        })
        .join(" | ")
    );

    const table = [header, separator, ...rows].join("\n");
    const count = `${values.length} ${values.length === 1 ? "row" : "rows"}`;
    parts.push(`${table}\n(${count})`);
  }

  return parts.length > 0 ? parts.join("\n\n") + "\n" : "Query executed successfully.\n";
}

export class SqlWasmRunner implements ExecutionRunner {
  readonly id = "browser-sql-wasm";
  readonly name = "SQLite WebAssembly (sql.js)";
  readonly target = "browser-wasm" as const;

  supportsLanguage(language: ExecutionLanguage): boolean {
    return language === "sql";
  }

  isReady(language: ExecutionLanguage): boolean {
    return language === "sql";
  }

  async prepare(language: ExecutionLanguage): Promise<void> {
    if (!this.supportsLanguage(language)) return;
    await getSqlJs();
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    if (!this.supportsLanguage(request.language)) {
      return {
        ok: false,
        exitCode: -1,
        stdout: "",
        stderr: `Language ${request.language} is not supported by the SQL runner.`,
        executionTimeMs: 0,
        runner: "browser-wasm",
        stage: "error",
      };
    }

    const startTime = performance.now();
    const mainFile =
      request.files.find((f) => f.path.endsWith(".sql")) || request.files[0];
    const sourceCode = mainFile?.content ?? "";
    const stdinSetup = request.stdin?.trim() ?? "";

    try {
      const SQL = await getSqlJs();
      const db = new SQL.Database();

      try {
        // Run optional setup SQL schema and seed data from stdin
        if (stdinSetup) {
          db.run(stdinSetup);
        }

        // Execute learner SQL query / commands
        const queryResults = db.exec(sourceCode);
        const formattedStdout = formatSqlResults(queryResults);
        const duration = Math.round(performance.now() - startTime);

        return {
          ok: true,
          exitCode: 0,
          stdout: formattedStdout,
          stderr: "",
          executionTimeMs: duration,
          runner: "browser-wasm",
          stage: "finished",
        };
      } finally {
        db.close();
      }
    } catch (err: unknown) {
      const duration = Math.round(performance.now() - startTime);
      const errorMessage = err instanceof Error ? err.message : String(err);

      return {
        ok: false,
        exitCode: 1,
        stdout: "",
        stderr: errorMessage,
        executionTimeMs: duration,
        runner: "browser-wasm",
        stage: "runtime",
      };
    }
  }
}
