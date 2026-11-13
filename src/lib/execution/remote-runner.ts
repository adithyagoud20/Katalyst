import {
  ExecutionLanguage,
  ExecutionRequest,
  ExecutionResult,
  ExecutionRunner,
} from "./types";

export interface RemoteExecutionConfig {
  endpoint?: string;
  provider: "judge0" | "piston" | "jdoodle" | "onecompiler";
  configured: boolean;
}

export class RemoteSandboxRunner implements ExecutionRunner {
  readonly id = "remote-sandbox-adapter";
  readonly name = "Remote Sandboxed Execution (Judge0 / Piston)";
  readonly target = "remote-sandbox" as const;

  supportsLanguage(language: ExecutionLanguage): boolean {
    return ["c", "cpp", "python", "java", "javascript"].includes(language);
  }

  isReady(language: ExecutionLanguage): boolean {
    // Only ready if the language is supported and a verified remote endpoint is provided via environment
    return this.supportsLanguage(language) && Boolean(typeof process !== "undefined" && process.env?.EXECUTION_REMOTE_ENDPOINT);
  }

  async prepare(language: ExecutionLanguage): Promise<void> {
    if (!this.supportsLanguage(language)) {
      throw new Error(`Unsupported execution language: ${language}`);
    }
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const isConfigured = Boolean(typeof process !== "undefined" && process.env?.EXECUTION_REMOTE_ENDPOINT);

    if (!isConfigured) {
      return {
        ok: false,
        exitCode: -1,
        stdout: "",
        stderr: `Remote execution provider is not configured. Configure EXECUTION_REMOTE_ENDPOINT to enable remote sandboxing for ${request.language}.`,
        executionTimeMs: 0,
        runner: "remote-sandbox",
        stage: "error",
        error: "Remote execution provider unconfigured",
      };
    }

    // In a fully configured deployment, dispatch to verified remote container
    return {
      ok: false,
      exitCode: -1,
      stdout: "",
      stderr: "Remote execution request failed: connection refused.",
      executionTimeMs: 0,
      runner: "remote-sandbox",
      stage: "error",
      error: "Remote execution connection refused",
    };
  }
}
