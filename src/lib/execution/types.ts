/**
 * KATALYST Provider-Neutral Execution Interface
 *
 * Defines contracts for executing code across multiple runtimes (C/C++, Python,
 * Java, JavaScript, HTML/CSS, and Circuit simulation) either locally via
 * WebAssembly in the browser or remotely via sandboxed microVMs/containers.
 */

export type ExecutionLanguage =
  | "c"
  | "cpp"
  | "python"
  | "java"
  | "javascript"
  | "html"
  | "circuit";

export type ExecutionTarget = "auto" | "browser-wasm" | "remote-sandbox";

export type ExecutionStage =
  | "idle"
  | "preparing"
  | "compile"
  | "runtime"
  | "finished"
  | "timeout"
  | "cancelled"
  | "error";

export interface ExecutionFile {
  path: string;
  content: string;
}

export interface ExecutionLimits {
  /** Maximum execution time in milliseconds (default: 8,000 ms) */
  timeoutMs: number;
  /** Maximum compile time in milliseconds (default: 15,000 ms) */
  compileTimeoutMs?: number;
  /** Memory limit in megabytes (default: 64 MB) */
  memoryLimitMb?: number;
  /** Maximum output size in bytes (default: 64,000 bytes) */
  outputLimitBytes: number;
}

export interface ExecutionRequest {
  language: ExecutionLanguage;
  files: ExecutionFile[];
  entrypoint?: string;
  stdin?: string;
  limits?: Partial<ExecutionLimits>;
  preferredTarget?: ExecutionTarget;
  signal?: AbortSignal;
  onProgress?: (stage: ExecutionStage, message: string) => void;
}

export interface ExecutionResult {
  ok: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  diagnostics?: string;
  executionTimeMs: number;
  runner: "browser-wasm" | "remote-sandbox";
  stage: ExecutionStage;
  error?: string;
  artifacts?: Array<{ path: string; content: string }>;
}

export interface ExecutionRunner {
  readonly id: string;
  readonly name: string;
  readonly target: "browser-wasm" | "remote-sandbox";

  supportsLanguage(language: ExecutionLanguage): boolean;
  isReady(language: ExecutionLanguage): boolean;
  prepare(language: ExecutionLanguage): Promise<void>;
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
}
