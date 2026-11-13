import {
  ExecutionLanguage,
  ExecutionRequest,
  ExecutionResult,
  ExecutionRunner,
} from "./types";

export class JavaScriptWorkerRunner implements ExecutionRunner {
  readonly id = "browser-javascript-worker";
  readonly name = "Isolated JavaScript Web Worker";
  readonly target = "browser-wasm" as const;

  supportsLanguage(language: ExecutionLanguage): boolean {
    return language === "javascript";
  }

  isReady(language: ExecutionLanguage): boolean {
    return language === "javascript";
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
        stderr: `Language ${request.language} is not supported by the JavaScript runner.`,
        executionTimeMs: 0,
        runner: "browser-wasm",
        stage: "error",
      };
    }

    const startTime = performance.now();
    const mainFile =
      request.files.find((f) => f.path.endsWith(".js") || f.path.endsWith(".mjs")) ||
      request.files[0];
    const sourceCode = mainFile?.content ?? "";
    const stdinContent = request.stdin ?? "";
    const timeoutMs = request.limits?.timeoutMs ?? 8_000;

    // Node.js / test environment execution via node:vm
    if (typeof window === "undefined") {
      try {
        const vm = await import("node:vm");
        let stdout = "";
        let stderr = "";

        const stdinLines = stdinContent.split("\n");
        let stdinIndex = 0;

        const sandbox = {
          console: {
            log: (...args: unknown[]) => {
              stdout += args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ") + "\n";
            },
            info: (...args: unknown[]) => {
              stdout += args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ") + "\n";
            },
            warn: (...args: unknown[]) => {
              stderr += args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ") + "\n";
            },
            error: (...args: unknown[]) => {
              stderr += args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ") + "\n";
            },
          },
          readline: () => stdinLines[stdinIndex++] ?? "",
          prompt: () => stdinLines[stdinIndex++] ?? "",
          setTimeout,
          clearTimeout,
          Math,
          Date,
          JSON,
          Array,
          Object,
          String,
          Number,
          Boolean,
          RegExp,
          Map,
          Set,
          Promise,
        };

        const context = vm.createContext(sandbox);
        const script = new vm.Script(sourceCode, { filename: "solution.js" });
        script.runInContext(context, { timeout: timeoutMs });

        const executionTimeMs = Math.round(performance.now() - startTime);
        return {
          ok: true,
          exitCode: 0,
          stdout,
          stderr,
          executionTimeMs,
          runner: "browser-wasm",
          stage: "finished",
        };
      } catch (err: unknown) {
        const executionTimeMs = Math.round(performance.now() - startTime);
        const errMsg = err instanceof Error ? err.stack || err.message : String(err);
        const isTimeout = errMsg.includes("timed out") || errMsg.includes("ERR_SCRIPT_EXECUTION_TIMEOUT");

        return {
          ok: false,
          exitCode: isTimeout ? 124 : 1,
          stdout: "",
          stderr: errMsg,
          diagnostics: errMsg,
          executionTimeMs,
          runner: "browser-wasm",
          stage: isTimeout ? "timeout" : "runtime",
          error: errMsg,
        };
      }
    }

    // Browser Web Worker execution
    return new Promise<ExecutionResult>((resolve) => {
      let settled = false;
      let timer: number | null = null;
      let worker: Worker | null = null;

      const finish = (result: ExecutionResult) => {
        if (settled) return;
        settled = true;
        if (timer !== null) clearTimeout(timer);
        if (worker) {
          try {
            worker.terminate();
          } catch {}
          worker = null;
        }
        resolve(result);
      };

      if (request.signal?.aborted) {
        finish({
          ok: false,
          exitCode: 130,
          stdout: "",
          stderr: "Execution aborted by user.",
          executionTimeMs: 0,
          runner: "browser-wasm",
          stage: "cancelled",
        });
        return;
      }

      request.signal?.addEventListener("abort", () => {
        finish({
          ok: false,
          exitCode: 130,
          stdout: "",
          stderr: "Execution aborted by user.",
          executionTimeMs: Math.round(performance.now() - startTime),
          runner: "browser-wasm",
          stage: "cancelled",
        });
      });

      const workerCode = `
        let stdout = "";
        let stderr = "";
        const stdinLines = ${JSON.stringify(stdinContent.split("\n"))};
        let stdinIndex = 0;

        self.console = {
          log: (...args) => {
            stdout += args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ") + "\\n";
          },
          info: (...args) => {
            stdout += args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ") + "\\n";
          },
          warn: (...args) => {
            stderr += args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ") + "\\n";
          },
          error: (...args) => {
            stderr += args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ") + "\\n";
          }
        };

        self.readline = () => stdinLines[stdinIndex++] ?? "";
        self.prompt = () => stdinLines[stdinIndex++] ?? "";

        try {
          ${sourceCode}
          self.postMessage({ ok: true, stdout, stderr, exitCode: 0 });
        } catch (err) {
          const errMsg = err && err.stack ? err.stack : String(err);
          self.postMessage({ ok: false, stdout, stderr: errMsg, exitCode: 1, error: errMsg });
        }
      `;

      try {
        const blob = new Blob([workerCode], { type: "application/javascript" });
        const workerUrl = URL.createObjectURL(blob);
        worker = new Worker(workerUrl);

        timer = window.setTimeout(() => {
          finish({
            ok: false,
            exitCode: 124,
            stdout: "",
            stderr: "Execution timed out.",
            executionTimeMs: timeoutMs,
            runner: "browser-wasm",
            stage: "timeout",
            error: `Execution timed out after ${timeoutMs}ms.`,
          });
        }, timeoutMs);

        worker.onmessage = (event: MessageEvent) => {
          URL.revokeObjectURL(workerUrl);
          const executionTimeMs = Math.round(performance.now() - startTime);
          const data = event.data;
          finish({
            ok: data.ok,
            exitCode: data.exitCode,
            stdout: data.stdout || "",
            stderr: data.stderr || "",
            diagnostics: data.error,
            executionTimeMs,
            runner: "browser-wasm",
            stage: data.ok ? "finished" : "runtime",
            error: data.error,
          });
        };

        worker.onerror = (err: ErrorEvent) => {
          URL.revokeObjectURL(workerUrl);
          const executionTimeMs = Math.round(performance.now() - startTime);
          const errMsg = err.message || "Uncaught worker error";
          finish({
            ok: false,
            exitCode: 1,
            stdout: "",
            stderr: errMsg,
            diagnostics: errMsg,
            executionTimeMs,
            runner: "browser-wasm",
            stage: "runtime",
            error: errMsg,
          });
        };
      } catch (workerInitErr) {
        const executionTimeMs = Math.round(performance.now() - startTime);
        const errMsg = workerInitErr instanceof Error ? workerInitErr.message : "Failed to initialize Web Worker";
        finish({
          ok: false,
          exitCode: 1,
          stdout: "",
          stderr: errMsg,
          executionTimeMs,
          runner: "browser-wasm",
          stage: "error",
          error: errMsg,
        });
      }
    });
  }
}
