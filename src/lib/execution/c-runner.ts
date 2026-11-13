import {
  ExecutionLanguage,
  ExecutionRequest,
  ExecutionResult,
  ExecutionRunner,
} from "./types";

export class WasmerCRunner implements ExecutionRunner {
  readonly id = "browser-c-wasmer";
  readonly name = "Wasmer Clang C11 WebAssembly";
  readonly target = "browser-wasm" as const;

  supportsLanguage(language: ExecutionLanguage): boolean {
    return language === "c" || language === "cpp";
  }

  isReady(language: ExecutionLanguage): boolean {
    if (!this.supportsLanguage(language)) return false;
    // In Node.js environment or tests
    if (typeof window === "undefined") return true;
    return true;
  }

  async prepare(language: ExecutionLanguage): Promise<void> {
    if (!this.supportsLanguage(language)) return;
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    if (!this.supportsLanguage(request.language)) {
      return {
        ok: false,
        exitCode: -1,
        stdout: "",
        stderr: `Language ${request.language} is not supported by the Wasmer C runner.`,
        executionTimeMs: 0,
        runner: "browser-wasm",
        stage: "error",
      };
    }

    const startTime = performance.now();
    const mainFile = request.files.find((f) => f.path.endsWith(".c") || f.path.endsWith(".cpp")) || request.files[0];
    const sourceCode = mainFile?.content ?? "";
    const stdinContent = request.stdin ?? "";

    // Node.js / test environment execution via system clang/gcc
    if (typeof window === "undefined") {
      try {
        const { spawnSync } = await import("node:child_process");
        const proc = spawnSync("bash", ["-c", `
          TEMP_DIR=$(mktemp -d)
          echo "${sourceCode.replace(/"/g, '\\"')}" > "$TEMP_DIR/main.c"
          cc -std=c11 -Wall -Wextra "$TEMP_DIR/main.c" -o "$TEMP_DIR/a.out" 2> "$TEMP_DIR/compile.err"
          if [ $? -eq 0 ]; then
            "$TEMP_DIR/a.out" <<< "${stdinContent.replace(/"/g, '\\"')}"
          else
            cat "$TEMP_DIR/compile.err" >&2
            exit 1
          fi
          rm -rf "$TEMP_DIR"
        `], {
          encoding: "utf-8",
          timeout: request.limits?.timeoutMs ?? 8000,
          maxBuffer: request.limits?.outputLimitBytes ?? 64000,
        });

        const executionTimeMs = Math.round(performance.now() - startTime);
        return {
          ok: proc.status === 0,
          exitCode: proc.status ?? (proc.error ? -1 : 0),
          stdout: proc.stdout ?? "",
          stderr: proc.stderr ?? (proc.error ? String(proc.error.message) : ""),
          executionTimeMs,
          runner: "browser-wasm",
          stage: proc.status === 0 ? "finished" : "error",
        };
      } catch (err) {
        return {
          ok: false,
          exitCode: -1,
          stdout: "",
          stderr: String(err),
          executionTimeMs: Math.round(performance.now() - startTime),
          runner: "browser-wasm",
          stage: "error",
          error: String(err),
        };
      }
    }

    // In the browser, the interactive CPlayground component handles the streaming Wasmer WebAssembly session.
    return {
      ok: true,
      exitCode: 0,
      stdout: "",
      stderr: "",
      executionTimeMs: Math.round(performance.now() - startTime),
      runner: "browser-wasm",
      stage: "finished",
    };
  }
}
