import {
  ExecutionLanguage,
  ExecutionLimits,
  ExecutionRequest,
  ExecutionResult,
  ExecutionRunner,
  ExecutionTarget,
} from "./types";
import { WasmerCRunner } from "./c-runner";
import { PyodidePythonRunner } from "./python-runner";
import { JavaScriptWorkerRunner } from "./js-runner";
import { SqlWasmRunner } from "./sql-runner";
import { RemoteSandboxRunner } from "./remote-runner";

export const DEFAULT_EXECUTION_LIMITS: ExecutionLimits = {
  timeoutMs: 8_000,
  compileTimeoutMs: 15_000,
  memoryLimitMb: 64,
  outputLimitBytes: 64_000,
};

/**
 * Registry holding available execution runners.
 */
class ExecutionRegistry {
  private runners: Map<string, ExecutionRunner> = new Map();

  register(runner: ExecutionRunner): void {
    this.runners.set(runner.id, runner);
  }

  unregister(id: string): boolean {
    return this.runners.delete(id);
  }

  clear(): void {
    this.runners.clear();
  }

  get(id: string): ExecutionRunner | undefined {
    return this.runners.get(id);
  }

  list(): ExecutionRunner[] {
    return Array.from(this.runners.values());
  }

  /**
   * Selects the most appropriate runner for a given language and target preference.
   */
  resolveRunner(
    language: ExecutionLanguage,
    preference: ExecutionTarget = "auto"
  ): ExecutionRunner | undefined {
    // Reverse array so more recently registered runners take precedence
    const candidates = Array.from(this.runners.values()).reverse().filter((r) =>
      r.supportsLanguage(language)
    );

    if (preference === "browser-wasm") {
      return candidates.find((r) => r.target === "browser-wasm");
    }
    if (preference === "remote-sandbox") {
      return candidates.find((r) => r.target === "remote-sandbox");
    }

    // "auto" preference: prefer local browser-wasm if ready or available,
    // otherwise fallback to remote-sandbox.
    const local = candidates.find((r) => r.target === "browser-wasm");
    if (local) return local;

    return candidates.find((r) => r.target === "remote-sandbox");
  }
}

export const executionRegistry = new ExecutionRegistry();

export function registerDefaultRunners(): void {
  executionRegistry.register(new WasmerCRunner());
  executionRegistry.register(new PyodidePythonRunner());
  executionRegistry.register(new JavaScriptWorkerRunner());
  executionRegistry.register(new SqlWasmRunner());
  if (typeof process !== "undefined" && process.env?.EXECUTION_REMOTE_ENDPOINT) {
    executionRegistry.register(new RemoteSandboxRunner());
  }
}

registerDefaultRunners();

/**
 * Top-level dispatcher to execute a program using the optimal runner.
 */
export async function executeProgram(request: ExecutionRequest): Promise<ExecutionResult> {
  const runner = executionRegistry.resolveRunner(request.language, request.preferredTarget);

  if (!runner) {
    return {
      ok: false,
      exitCode: -1,
      stdout: "",
      stderr: `No runner registered for language '${request.language}'.`,
      executionTimeMs: 0,
      runner: request.preferredTarget === "remote-sandbox" ? "remote-sandbox" : "browser-wasm",
      stage: "error",
      error: `Unsupported execution target or language: ${request.language}`,
    };
  }

  return runner.execute(request);
}

export function listExecutionRunners(): Array<{
  id: string;
  name: string;
  target: "browser-wasm" | "remote-sandbox";
  supportedLanguages: ExecutionLanguage[];
  isReady: boolean;
}> {
  const allLanguages: ExecutionLanguage[] = ["c", "cpp", "python", "java", "javascript", "html", "circuit"];
  return executionRegistry.list().map((runner) => {
    const supported = allLanguages.filter((l) => runner.supportsLanguage(l));
    return {
      id: runner.id,
      name: runner.name,
      target: runner.target,
      supportedLanguages: supported,
      isReady: supported.some((l) => runner.isReady(l)),
    };
  });
}
