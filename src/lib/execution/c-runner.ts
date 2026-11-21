/**
 * KATALYST In-Browser C Runner (WebAssembly / Clang / LLD / WASI)
 *
 * Compiles and runs C11 programs directly inside browser Web Workers:
 * 1. compiler-worker: wasm-clang + lld + memfs (in-memory toolchain)
 * 2. execution-worker: isolated pure-JS WASI preview-1 sandbox with virtual file system
 *
 * Feature flag: NEXT_PUBLIC_C_RUN_ENABLED (default false)
 * Security: ZERO eval, ZERO new Function, ZERO SharedArrayBuffer, strict nonce CSP.
 */

import {
  ExecutionLanguage,
  ExecutionLimits,
  ExecutionRequest,
  ExecutionResult,
  ExecutionRunner,
  ExecutionStage,
} from "./types";

export const C_RUN_FEATURE_FLAG = "NEXT_PUBLIC_C_RUN_ENABLED";
export const C_TOOLCHAIN_CACHE_NAME = "katalyst-c-toolchain-v1";
export const C_TOOLCHAIN_BASE_PATH = "/vendor/c-toolchain/";
export const COMPILER_IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export function isCRunEnabled(): boolean {
  if (typeof process !== "undefined" && process.env) {
    return process.env.NEXT_PUBLIC_C_RUN_ENABLED !== "false";
  }
  return true;
}

export interface CToolchainFile {
  name: string;
  size: number;
}

export const C_TOOLCHAIN_FILES: CToolchainFile[] = [
  { name: "clang", size: 31_214_472 },
  { name: "lld", size: 19_490_094 },
  { name: "sysroot.tar", size: 9_297_920 },
  { name: "memfs", size: 345_442 },
];

export const TOTAL_TOOLCHAIN_BYTES = C_TOOLCHAIN_FILES.reduce((sum, f) => sum + f.size, 0);

export interface ParsedDiagnostic {
  line?: number;
  column?: number;
  severity: "error" | "warning" | "note";
  message: string;
  raw: string;
}

export function parseCDiagnostics(raw: string): ParsedDiagnostic[] {
  if (!raw) return [];
  const lines = raw.split("\n");
  const diagnostics: ParsedDiagnostic[] = [];
  const regex = /^(?:test\.c|main\.c|input\.c):(\d+):(\d+):\s*(error|warning|note):\s*(.+)$/i;

  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      diagnostics.push({
        line: parseInt(match[1]!, 10),
        column: parseInt(match[2]!, 10),
        severity: match[3]!.toLowerCase() as "error" | "warning" | "note",
        message: match[4]!.trim(),
        raw: line,
      });
    }
  }
  return diagnostics;
}

export class WasmClangCRunner implements ExecutionRunner {
  readonly id = "browser-c-clang-wasm";
  readonly name = "Clang In-Browser WebAssembly Runner";
  readonly target = "browser-wasm" as const;

  private compilerWorker: Worker | null = null;
  private compilerInitPromise: Promise<void> | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private requestIdCounter = 0;

  supportsLanguage(language: ExecutionLanguage): boolean {
    return isCRunEnabled() && language === "c";
  }

  isReady(language: ExecutionLanguage): boolean {
    return this.supportsLanguage(language) && this.compilerWorker !== null;
  }

  private resetIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    if (typeof window !== "undefined") {
      this.idleTimer = setTimeout(() => {
        this.terminateCompiler();
      }, COMPILER_IDLE_TIMEOUT_MS);
    }
  }

  terminateCompiler(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    if (this.compilerWorker) {
      try {
        this.compilerWorker.terminate();
      } catch {
        // ignore
      }
      this.compilerWorker = null;
    }
    this.compilerInitPromise = null;
  }

  /**
   * Lazily downloads toolchain assets into Cache API with progress reporting.
   */
  async prepare(
    language: ExecutionLanguage,
    onProgress?: (stage: ExecutionStage, message: string) => void
  ): Promise<void> {
    if (!this.supportsLanguage(language)) {
      throw new Error(`C runner is disabled or language '${language}' is unsupported.`);
    }

    if (typeof window === "undefined") {
      throw new Error("WASM Clang runner is only available in browser environments.");
    }

    if (this.compilerWorker) {
      this.resetIdleTimer();
      return;
    }

    if (this.compilerInitPromise) {
      return this.compilerInitPromise;
    }

    this.compilerInitPromise = (async () => {
      onProgress?.("preparing", "Preparing C compiler toolchain…");

      // Verify network connectivity if Cache API has not populated yet
      let hasCache = false;
      if ("caches" in window) {
        try {
          const cache = await window.caches.open(C_TOOLCHAIN_CACHE_NAME);
          const match = await cache.match(`${C_TOOLCHAIN_BASE_PATH}clang`);
          hasCache = Boolean(match);
        } catch {
          hasCache = false;
        }
      }

      if (!hasCache && typeof navigator !== "undefined" && !navigator.onLine) {
        throw new Error(
          "Unable to download the C compiler toolchain while offline. Please connect to the internet and try again."
        );
      }

      // Pre-cache toolchain assets with byte progress reporting
      if ("caches" in window && !hasCache) {
        try {
          const cache = await window.caches.open(C_TOOLCHAIN_CACHE_NAME);
          let downloadedBytes = 0;

          for (const file of C_TOOLCHAIN_FILES) {
            const fileUrl = `${C_TOOLCHAIN_BASE_PATH}${file.name}`;
            const existing = await cache.match(fileUrl);
            if (existing) {
              downloadedBytes += file.size;
              continue;
            }

            const mbCurrent = (downloadedBytes / (1024 * 1024)).toFixed(1);
            const mbTotal = (TOTAL_TOOLCHAIN_BYTES / (1024 * 1024)).toFixed(1);
            onProgress?.(
              "preparing",
              `Downloading C compiler (${file.name}: ${mbCurrent} MB / ${mbTotal} MB)…`
            );

            const res = await fetch(fileUrl);
            if (!res.ok) {
              throw new Error(`Failed to download ${file.name} (HTTP ${res.status}).`);
            }
            await cache.put(fileUrl, res.clone());
            downloadedBytes += file.size;
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          throw new Error(`C compiler download failed: ${msg}. Please check your connection.`);
        }
      }

      onProgress?.("preparing", "Initializing compiler engine…");

      // Instantiate compiler worker
      const workerUrl = `${C_TOOLCHAIN_BASE_PATH}compiler-worker.js`;
      const worker = new Worker(workerUrl);
      this.compilerWorker = worker;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.terminateCompiler();
          reject(new Error("Compiler worker initialization timed out."));
        }, 30_000);

        worker.onmessage = (event) => {
          const data = event.data;
          if (data?.type === "status") {
            onProgress?.("preparing", data.message);
          } else if (data?.type === "ready") {
            clearTimeout(timeout);
            this.resetIdleTimer();
            resolve();
          } else if (data?.type === "init_error") {
            clearTimeout(timeout);
            this.terminateCompiler();
            reject(new Error(data.error || "Compiler initialization error."));
          }
        };

        worker.onerror = (err) => {
          clearTimeout(timeout);
          this.terminateCompiler();
          reject(new Error(`Compiler worker error: ${err.message}`));
        };

        worker.postMessage({ type: "init", basePath: C_TOOLCHAIN_BASE_PATH });
      });
    })();

    return this.compilerInitPromise;
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const limits: ExecutionLimits = {
      timeoutMs: request.limits?.timeoutMs ?? 10_000,
      compileTimeoutMs: request.limits?.compileTimeoutMs ?? 20_000,
      outputLimitBytes: request.limits?.outputLimitBytes ?? 64_000,
    };

    if (!isCRunEnabled()) {
      return {
        ok: false,
        exitCode: -1,
        stdout: "",
        stderr: "C run is being upgraded, lesson is readable.",
        executionTimeMs: 0,
        runner: "browser-wasm",
        stage: "error",
        error: "C run is currently disabled by feature flag.",
      };
    }

    if (request.signal?.aborted) {
      return {
        ok: false,
        exitCode: 130,
        stdout: "",
        stderr: "Execution cancelled.",
        executionTimeMs: 0,
        runner: "browser-wasm",
        stage: "cancelled",
        error: "Execution was aborted.",
      };
    }

    const sourceFile = request.files[0];
    const sourceCode = sourceFile?.content ?? "";

    if (!sourceCode.trim()) {
      return {
        ok: false,
        exitCode: 1,
        stdout: "",
        stderr: "No source code provided to compile.",
        executionTimeMs: 0,
        runner: "browser-wasm",
        stage: "compile",
        error: "Empty source code.",
      };
    }

    // Step 1: Ensure compiler worker is ready
    try {
      await this.prepare("c", request.onProgress);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        exitCode: -1,
        stdout: "",
        stderr: msg,
        executionTimeMs: 0,
        runner: "browser-wasm",
        stage: "error",
        error: msg,
      };
    }

    this.resetIdleTimer();
    const reqId = ++this.requestIdCounter;

    // Step 2: Compile source code in compiler-worker
    request.onProgress?.("compile", "Compiling C source…");
    const compileT0 = performance.now();

    const compileResult = await new Promise<{
      success: boolean;
      wasmBuffer?: ArrayBuffer;
      compileTimeMs?: number;
      diagnostics?: string;
      error?: string;
    }>((resolve) => {
      const worker = this.compilerWorker!;
      let compileTimer: ReturnType<typeof setTimeout> | null = null;

      const handleMessage = (event: MessageEvent) => {
        const data = event.data;
        if (data?.id !== reqId) return;

        if (data.type === "status") {
          request.onProgress?.("compile", data.message);
        } else if (data.type === "compiler_diag") {
          request.onProgress?.("compile", data.text);
        } else if (data.type === "compile_success") {
          if (compileTimer) clearTimeout(compileTimer);
          worker.removeEventListener("message", handleMessage);
          resolve({
            success: true,
            wasmBuffer: data.wasmBuffer,
            compileTimeMs: data.compileTimeMs,
            diagnostics: data.diagnostics,
          });
        } else if (data.type === "compile_error") {
          if (compileTimer) clearTimeout(compileTimer);
          worker.removeEventListener("message", handleMessage);
          resolve({
            success: false,
            error: data.error,
            diagnostics: data.diagnostics,
            compileTimeMs: data.compileTimeMs,
          });
        }
      };

      worker.addEventListener("message", handleMessage);

      // Timeout for compilation
      compileTimer = setTimeout(() => {
        worker.removeEventListener("message", handleMessage);
        this.terminateCompiler();
        resolve({
          success: false,
          error: `Compilation timed out after ${limits.compileTimeoutMs}ms.`,
        });
      }, limits.compileTimeoutMs);

      worker.postMessage({
        id: reqId,
        type: "compile",
        source: sourceCode,
        language: "c",
        basePath: C_TOOLCHAIN_BASE_PATH,
      });
    });

    if (!compileResult.success || !compileResult.wasmBuffer) {
      const diag = compileResult.diagnostics || compileResult.error || "Compilation failed.";
      return {
        ok: false,
        exitCode: 1,
        stdout: "",
        stderr: diag,
        diagnostics: diag,
        executionTimeMs: Math.round(performance.now() - compileT0),
        runner: "browser-wasm",
        stage: "compile",
        error: compileResult.error || "Compilation failed.",
      };
    }

    if (request.signal?.aborted) {
      return {
        ok: false,
        exitCode: 130,
        stdout: "",
        stderr: "Execution cancelled after compilation.",
        executionTimeMs: Math.round(performance.now() - compileT0),
        runner: "browser-wasm",
        stage: "cancelled",
        error: "Execution was aborted.",
      };
    }

    // Step 3: Run compiled WASM in isolated execution-worker
    request.onProgress?.("runtime", "Running program…");
    const runT0 = performance.now();

    const executionWorkerUrl = `${C_TOOLCHAIN_BASE_PATH}execution-worker.js`;
    const execWorker = new Worker(executionWorkerUrl);

    return new Promise<ExecutionResult>((resolve) => {
      let runTimer: ReturnType<typeof setTimeout> | null = null;
      let cleanedUp = false;

      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        if (runTimer) clearTimeout(runTimer);
        try {
          execWorker.terminate();
        } catch {
          // ignore
        }
      };

      // Handle external abort signal (Stop button)
      const onAbort = () => {
        cleanup();
        resolve({
          ok: false,
          exitCode: 130,
          stdout: "",
          stderr: "[Execution stopped by user]",
          executionTimeMs: Math.round(performance.now() - runT0),
          runner: "browser-wasm",
          stage: "cancelled",
          error: "Execution stopped by user.",
        });
      };

      if (request.signal) {
        request.signal.addEventListener("abort", onAbort, { once: true });
      }

      // Enforce run timeout
      runTimer = setTimeout(() => {
        cleanup();
        if (request.signal) request.signal.removeEventListener("abort", onAbort);
        resolve({
          ok: false,
          exitCode: 124,
          stdout: "",
          stderr: `\n[Execution timed out after ${Math.round(limits.timeoutMs / 1000)} seconds]`,
          executionTimeMs: limits.timeoutMs,
          runner: "browser-wasm",
          stage: "timeout",
          error: `Execution timed out after ${limits.timeoutMs}ms.`,
        });
      }, limits.timeoutMs);

      execWorker.onmessage = (event) => {
        const data = event.data;
        if (data?.id !== reqId) return;

        if (data.type === "stdout") {
          request.onProgress?.("runtime", data.data);
        } else if (data.type === "stderr") {
          request.onProgress?.("runtime", data.data);
        } else if (data.type === "done") {
          cleanup();
          if (request.signal) request.signal.removeEventListener("abort", onAbort);
          const artifacts = data.files
            ? Object.entries(data.files).map(([p, c]) => ({ path: p, content: c as string }))
            : undefined;

          resolve({
            ok: data.exitCode === 0,
            exitCode: data.exitCode,
            stdout: data.stdout,
            stderr: data.stderr,
            diagnostics: compileResult.diagnostics,
            executionTimeMs: Math.round(performance.now() - runT0),
            runner: "browser-wasm",
            stage: "finished",
            artifacts,
          });
        } else if (data.type === "error") {
          cleanup();
          if (request.signal) request.signal.removeEventListener("abort", onAbort);
          resolve({
            ok: false,
            exitCode: 1,
            stdout: data.stdout || "",
            stderr: data.error || "Runtime error.",
            diagnostics: compileResult.diagnostics,
            executionTimeMs: Math.round(performance.now() - runT0),
            runner: "browser-wasm",
            stage: "error",
            error: data.error,
          });
        }
      };

      execWorker.onerror = (err) => {
        cleanup();
        if (request.signal) request.signal.removeEventListener("abort", onAbort);
        resolve({
          ok: false,
          exitCode: 1,
          stdout: "",
          stderr: `Execution worker error: ${err.message}`,
          executionTimeMs: Math.round(performance.now() - runT0),
          runner: "browser-wasm",
          stage: "error",
          error: err.message,
        });
      };

      execWorker.postMessage(
        {
          id: reqId,
          type: "run",
          wasmBuffer: compileResult.wasmBuffer,
          stdin: request.stdin ?? "",
          maxOutputBytes: limits.outputLimitBytes,
        },
        [compileResult.wasmBuffer!]
      );
    });
  }
}

export const cRunner = new WasmClangCRunner();
