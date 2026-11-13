import {
  ExecutionLanguage,
  ExecutionRequest,
  ExecutionResult,
  ExecutionRunner,
} from "./types";

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<PyodideInterface>;
    __katalyst_pyodide?: PyodideInterface;
  }
}

export interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout?: (options: { batched: (output: string) => void }) => void;
  setStderr?: (options: { batched: (output: string) => void }) => void;
  globals?: {
    get: (name: string) => unknown;
    set: (name: string, value: unknown) => void;
  };
}

let pyodideLoadingPromise: Promise<PyodideInterface> | null = null;

async function loadBrowserPyodide(): Promise<PyodideInterface> {
  if (typeof window === "undefined") {
    throw new Error("Pyodide browser runner can only be loaded in a browser context.");
  }

  if (window.__katalyst_pyodide) {
    return window.__katalyst_pyodide;
  }

  if (pyodideLoadingPromise) {
    return pyodideLoadingPromise;
  }

  pyodideLoadingPromise = (async () => {
    if (!window.loadPyodide) {
      // Inject Pyodide script
      await new Promise<void>((resolve, reject) => {
        const existing = document.querySelector('script[src*="pyodide.js"]');
        if (existing) {
          existing.addEventListener("load", () => resolve());
          existing.addEventListener("error", () => reject(new Error("Failed to load Pyodide script.")));
          return;
        }

        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Pyodide script from CDN."));
        document.head.appendChild(script);
      });
    }

    if (!window.loadPyodide) {
      throw new Error("window.loadPyodide is not defined after script injection.");
    }

    const pyodide = await window.loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
    });

    window.__katalyst_pyodide = pyodide;
    return pyodide;
  })();

  return pyodideLoadingPromise;
}

export class PyodidePythonRunner implements ExecutionRunner {
  readonly id = "browser-python-pyodide";
  readonly name = "Pyodide WebAssembly Python 3.12";
  readonly target = "browser-wasm" as const;

  supportsLanguage(language: ExecutionLanguage): boolean {
    return language === "python";
  }

  isReady(language: ExecutionLanguage): boolean {
    if (language !== "python") return false;
    if (typeof window === "undefined") return true;
    return Boolean(window.__katalyst_pyodide);
  }

  async prepare(language: ExecutionLanguage): Promise<void> {
    if (language !== "python") return;
    if (typeof window === "undefined") return;
    await loadBrowserPyodide();
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    if (request.language !== "python") {
      return {
        ok: false,
        exitCode: -1,
        stdout: "",
        stderr: `Language ${request.language} is not supported by the Python runner.`,
        executionTimeMs: 0,
        runner: "browser-wasm",
        stage: "error",
      };
    }

    const startTime = performance.now();
    const mainFile = request.files.find((f) => f.path === (request.entrypoint || "main.py")) || request.files[0];
    const sourceCode = mainFile?.content ?? "";
    const stdinContent = request.stdin ?? "";

    // Node.js test environment runner fallback
    if (typeof window === "undefined") {
      try {
        const { spawnSync } = await import("node:child_process");
        const proc = spawnSync("python3", ["-c", sourceCode], {
          input: stdinContent,
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

    // In-browser execution via Pyodide
    try {
      request.onProgress?.("preparing", "Initializing Python virtual machine…");
      const pyodide = await loadBrowserPyodide();

      request.onProgress?.("runtime", "Executing Python script…");

      // Python execution wrapper to isolate stdout, stderr, and mock stdin
      const wrapperScript = `
import sys, io, traceback

__stdin_data = ${JSON.stringify(stdinContent)}
sys.stdin = io.StringIO(__stdin_data)
__stdout_capture = io.StringIO()
__stderr_capture = io.StringIO()

sys.stdout = __stdout_capture
sys.stderr = __stderr_capture

__exit_code = 0
__user_error = None

try:
    __globals_dict = {"__name__": "__main__"}
    exec(compile(${JSON.stringify(sourceCode)}, "main.py", "exec"), __globals_dict)
except SystemExit as e:
    __exit_code = e.code if isinstance(e.code, int) else 0
except Exception as e:
    __exit_code = 1
    traceback.print_exc(file=sys.stderr)

__stdout_result = __stdout_capture.getvalue()
__stderr_result = __stderr_capture.getvalue()
`;

      await pyodide.runPythonAsync(wrapperScript);

      const stdout = (pyodide.globals?.get("__stdout_result") as string) ?? "";
      const stderr = (pyodide.globals?.get("__stderr_result") as string) ?? "";
      const exitCode = (pyodide.globals?.get("__exit_code") as number) ?? 0;
      const executionTimeMs = Math.round(performance.now() - startTime);

      return {
        ok: exitCode === 0,
        exitCode,
        stdout,
        stderr,
        executionTimeMs,
        runner: "browser-wasm",
        stage: exitCode === 0 ? "finished" : "error",
      };
    } catch (err: unknown) {
      const executionTimeMs = Math.round(performance.now() - startTime);
      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        exitCode: -1,
        stdout: "",
        stderr: errorMessage,
        executionTimeMs,
        runner: "browser-wasm",
        stage: "error",
        error: errorMessage,
      };
    }
  }
}
