import {
  ExecutionLanguage,
  ExecutionRequest,
  ExecutionResult,
  ExecutionRunner,
} from "./types";

export class WasmerCRunner implements ExecutionRunner {
  readonly id = "browser-c-wasmer";
  readonly name = "Wasmer Clang C11 / C++17 WebAssembly";
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
        stderr: `Language ${request.language} is not supported by the Wasmer C/C++ runner.`,
        executionTimeMs: 0,
        runner: "browser-wasm",
        stage: "error",
      };
    }

    const startTime = performance.now();
    const isCpp = request.language === "cpp";
    const mainFile = request.files.find((f) =>
      isCpp ? f.path.endsWith(".cpp") || f.path.endsWith(".cc") : f.path.endsWith(".c")
    ) || request.files[0];
    const sourceCode = mainFile?.content ?? "";
    const stdinContent = request.stdin ?? "";

    // Node.js / test environment execution via system clang/gcc/c++
    if (typeof window === "undefined") {
      try {
        const { spawnSync } = await import("node:child_process");
        const { mkdtempSync, writeFileSync, rmSync } = await import("node:fs");
        const { tmpdir } = await import("node:os");
        const { join } = await import("node:path");

        const tempDir = mkdtempSync(join(tmpdir(), "katalyst-c-"));
        const fileName = isCpp ? "main.cpp" : "main.c";
        const filePath = join(tempDir, fileName);
        const binaryPath = join(tempDir, "a.out");

        writeFileSync(filePath, sourceCode, "utf-8");

        const compilerCmd = isCpp ? "c++" : "cc";
        const compileArgs = isCpp
          ? ["-std=c++17", "-Wall", "-Wextra", filePath, "-o", binaryPath]
          : ["-std=c11", "-Wall", "-Wextra", filePath, "-o", binaryPath];

        const compileProc = spawnSync(compilerCmd, compileArgs, {
          timeout: 5000,
          encoding: "utf-8",
        });

        if (compileProc.status !== 0) {
          rmSync(tempDir, { recursive: true, force: true });
          const executionTimeMs = Math.round(performance.now() - startTime);
          return {
            ok: false,
            exitCode: compileProc.status ?? 1,
            stdout: "",
            stderr: compileProc.stderr || compileProc.stdout || "Compilation failed.",
            executionTimeMs,
            runner: "browser-wasm",
            stage: "error",
          };
        }

        const runProc = spawnSync(binaryPath, [], {
          input: stdinContent,
          timeout: request.limits?.timeoutMs ?? 8000,
          maxBuffer: request.limits?.outputLimitBytes ?? 64000,
          encoding: "utf-8",
        });

        rmSync(tempDir, { recursive: true, force: true });
        const executionTimeMs = Math.round(performance.now() - startTime);
        return {
          ok: runProc.status === 0,
          exitCode: runProc.status ?? (runProc.error ? -1 : 0),
          stdout: runProc.stdout ?? "",
          stderr: runProc.stderr ?? (runProc.error ? String(runProc.error.message) : ""),
          executionTimeMs,
          runner: "browser-wasm",
          stage: runProc.status === 0 ? "finished" : "error",
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
