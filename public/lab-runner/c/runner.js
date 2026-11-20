const VERSION = 1;
const COMPILER_PACKAGE = "clang/clang@=0.160000.1";
const OUTPUT_LIMIT = 64_000;
const SOURCE_LIMIT = 12_000;
const STDIN_LIMIT = 2_000;
const COMPILED_WASM_LIMIT = 16 * 1024 * 1024;
const COMPILE_TIMEOUT_MS = 60_000;
const CPP_COMPILE_TIMEOUT_MS = 60_000;
const RUN_TIMEOUT_MS = 8_000;
const INTERACTIVE_RUN_TIMEOUT_MS = 60_000;
const LOAD_TIMEOUT_MS = 5 * 60_000;
const encoder = new TextEncoder();
const wasmerWorkerUrl = new URL("/lab-runner/c/wasmer/dist/browser-worker.js", window.location.href).href;
const wasmerWorkerBootstrapSource = `
let handler = null;
const pending = [];
Object.defineProperty(self, "onmessage", {
  configurable: true,
  get() { return handler; },
  set(next) {
    handler = next;
    if (typeof handler === "function") {
      while (pending.length) handler.call(self, { data: pending.shift() });
    }
  },
});
self.addEventListener("message", (event) => {
  if (!handler && pending.length < 32) {
    pending.push(event.data);
  }
});
import(${JSON.stringify(wasmerWorkerUrl)}).catch((error) => {
  self.postMessage({ __katalystCLabWorkerError: String(error) });
});`;
const wasmerWorkerBootstrap = new Blob([wasmerWorkerBootstrapSource], { type: "text/javascript" });
Object.defineProperty(globalThis, "__katalystCLabWorkerUrl", {
  value: URL.createObjectURL(wasmerWorkerBootstrap),
  configurable: false,
  enumerable: false,
  writable: false,
});
const expectedParentOrigin = (() => {
  try {
    return new URL(document.querySelector('meta[name="c-lab-parent-origin"]')?.content ?? "").origin;
  } catch {
    return "";
  }
})();

let sessionToken = "";
let initRequestId = "";
let wasmerClient;
let compilerPackage;
let compilerPromise;
let activeRun;

const NativeWorker = window.Worker;
window.Worker = class IsolatedCLabWorker extends NativeWorker {
  constructor(url, options) {
    const isIsolatedCLabWorker = String(url) === globalThis.__katalystCLabWorkerUrl;
    try {
      // Opaque sandbox origins cannot start module workers. The blob wrapper is
      // classic and dynamically imports the SDK's module worker with CORS.
      super(url, isIsolatedCLabWorker ? undefined : options);
    } catch {
      throw new Error("The isolated C runtime worker could not be created.");
    }
    this.addEventListener("error", () => {
      if (isIsolatedCLabWorker && activeRun && !activeRun.controller.signal.aborted) {
        send("ERROR", activeRun.requestId, { stage: "load", message: "The isolated C runtime worker could not start. Retry the run; your code remains in the editor." });
      }
    });
    this.addEventListener("message", (event) => {
      if (event.data?.__katalystCLabWorkerError) {
        event.stopImmediatePropagation();
        if (activeRun && !activeRun.controller.signal.aborted) {
          send("ERROR", activeRun.requestId, { stage: "load", message: "The isolated C runtime worker could not load. Check your connection and retry; your code remains in the editor." });
        }
      }
    });
    this.addEventListener("messageerror", () => {
      if (isIsolatedCLabWorker && activeRun && !activeRun.controller.signal.aborted) {
        send("ERROR", activeRun.requestId, { stage: "load", message: "The isolated C runtime could not exchange a message with its worker. Retry the run; your code remains in the editor." });
      }
    });
  }
};

function boundedText(value, byteLimit = OUTPUT_LIMIT) {
  let result = String(value ?? "");
  while (result && encoder.encode(result).byteLength > byteLimit) {
    result = result.slice(0, Math.max(1, Math.floor(result.length * 0.8)));
  }
  return result;
}

function send(type, requestId, payload = {}) {
  if (!sessionToken || !expectedParentOrigin) return;
  window.parent.postMessage({ version: VERSION, type, token: sessionToken, requestId, ...payload }, expectedParentOrigin);
}

function validRequestId(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 100;
}

function hasOnlyKeys(value, keys) {
  return Object.keys(value).every((key) => keys.includes(key));
}

function validateParentMessage(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || value.version !== VERSION || !validRequestId(value.requestId)
    || !hasOnlyKeys(value, ["version", "type", "token", "requestId", "autoInitialize", "language", "code", "stdin", "closeStdin", "value"])) return false;
  if (value.type === "INIT") return typeof value.token === "string" && value.token.length >= 32 && value.token.length <= 100 && typeof value.autoInitialize === "boolean";
  if (!sessionToken || value.token !== sessionToken) return false;
  if (value.type === "PREPARE" || value.type === "STOP" || value.type === "EOF") return true;
  if (value.type === "RUN") return (value.language === "c" || value.language === "cpp")
    && typeof value.code === "string" && value.code.length <= SOURCE_LIMIT
    && encoder.encode(value.code).byteLength <= SOURCE_LIMIT
    && typeof value.stdin === "string" && value.stdin.length <= STDIN_LIMIT
    && encoder.encode(value.stdin).byteLength <= STDIN_LIMIT
    && typeof value.closeStdin === "boolean";
  if (value.type === "INPUT") return typeof value.value === "string"
    && value.value.length <= STDIN_LIMIT && encoder.encode(value.value).byteLength <= STDIN_LIMIT;
  return false;
}

function normalizeStdin(value) {
  if (!value) return "";
  const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return normalized.endsWith("\n") ? normalized : `${normalized}\n`;
}

function outputChannels(result) {
  const stdout = boundedText(result.stdout?.text?.() ?? "");
  const stderr = boundedText(result.stderr?.text?.() ?? "");
  return { stdout, stderr };
}

async function ensureCompiler(requestId, signal) {
  if (compilerPackage) return compilerPackage;
  if (compilerPromise) return compilerPromise;
  send("COMPILER_STATE", requestId, { state: "initializing", message: "Preparing the isolated C runtime…" });
  compilerPromise = (async () => {
    if (!window.crossOriginIsolated || typeof SharedArrayBuffer === "undefined") {
      throw new Error("This browser did not enable cross-origin isolation for the C runtime.");
    }
    const { Wasmer } = await import("/lab-runner/c/wasmer/dist/index.js");
    wasmerClient = wasmerClient ?? new Wasmer({ cache: "memory", outputBytes: OUTPUT_LIMIT });
    const loadSignal = AbortSignal.any([signal, AbortSignal.timeout(LOAD_TIMEOUT_MS)]);
    compilerPackage = await wasmerClient.packages.load(COMPILER_PACKAGE, {
      signal: loadSignal,
      onProgress(progress) {
        const phase = progress.phase;
        const downloaded = progress.download?.downloadedBytes ?? 0;
        const total = progress.download?.totalBytes ?? 0;
        const amount = total > 0 ? `${Math.round(downloaded / (1024 * 1024))} of ${Math.round(total / (1024 * 1024))} MiB` : `${Math.round(downloaded / (1024 * 1024))} MiB`;
        const message = phase === "resolving" ? "Finding the C compiler…"
          : phase === "downloading" ? `Downloading the C compiler · ${amount}`
            : phase === "loading" ? "Preparing the compiler…" : "Preparing the local compiler…";
        send("PROGRESS", requestId, { message });
      },
    });
    send("COMPILER_STATE", requestId, { state: "ready", message: "Compiler ready" });
    return compilerPackage;
  })().catch((error) => {
    compilerPromise = undefined;
    compilerPackage = undefined;
    send("COMPILER_STATE", requestId, { state: "failed", message: "The isolated C compiler could not be prepared." });
    throw error;
  }).finally(() => {
    if (compilerPackage) compilerPromise = undefined;
  });
  return compilerPromise;
}

async function collectStream(stream, requestId, channel, onChange) {
  if (!stream) return "";
  const decoder = new TextDecoder();
  let captured = "";
  for await (const chunk of stream) {
    captured = boundedText(captured + decoder.decode(chunk, { stream: true }));
    onChange(captured);
    send("OUTPUT", requestId, { channel, text: captured });
  }
  captured = boundedText(captured + decoder.decode());
  onChange(captured);
  send("OUTPUT", requestId, { channel, text: captured });
  return captured;
}

async function runProgram(request) {
  if (activeRun) return;
  const startedAt = performance.now();
  const run = {
    requestId: request.requestId,
    controller: new AbortController(),
    process: null,
    sandbox: null,
    stopped: false,
    stdout: "",
    stderr: "",
  };
  activeRun = run;
  let phase = "load";
  try {
    send("PHASE", run.requestId, { phase: "compiling" });
    const compiler = await ensureCompiler(run.requestId, run.controller.signal);
    if (activeRun !== run || run.controller.signal.aborted) return;
    phase = "compile";
    const isCpp = request.language === "cpp";
    const compileTimeoutMs = isCpp ? CPP_COMPILE_TIMEOUT_MS : COMPILE_TIMEOUT_MS;
    const sourceName = isCpp ? "main.cpp" : "main.c";
    const sourcePath = `/workspace/${sourceName}`;
    const sandbox = await wasmerClient.sandboxes.create({
      packages: [compiler],
      files: { [sourceName]: request.code },
      network: { mode: "disabled" },
      signal: run.controller.signal,
    });
    run.sandbox = sandbox;
    if (run.controller.signal.aborted) return;
    const compileArgs = [
      ...(isCpp ? ["--driver-mode=g++", "-x", "c++"] : []),
      isCpp ? "-std=c++17" : "-std=c11",
      isCpp ? "-O0" : "-O1",
      "-Wall", "-Wextra", sourcePath, "-lm", "-o", "-",
    ];
    const compiled = await sandbox.command(compiler.entrypoint ?? "clang", compileArgs, { cwd: "/workspace" }).run({
      timeoutMs: compileTimeoutMs,
      outputBytes: COMPILED_WASM_LIMIT,
      check: false,
    });
    if (activeRun !== run || run.controller.signal.aborted) return;
    const diagnostics = boundedText(compiled.stderr?.text?.() ?? "");
    if (compiled.reason !== "exited" || compiled.exitCode !== 0) {
      const timedOut = compiled.reason === "timeout";
      send("DONE", run.requestId, {
        outcome: timedOut ? "timeout" : "compile-error",
        stdout: "",
        stderr: diagnostics,
        diagnostics,
        error: timedOut ? `Compilation took longer than ${Math.round(compileTimeoutMs / 1_000)} seconds. Shorten the example and try again.` : "",
        durationMs: performance.now() - startedAt,
        exitCode: compiled.exitCode ?? undefined,
      });
      return;
    }
    const binary = new Uint8Array(compiled.stdout?.bytes ?? []);
    if (binary.length < 8 || binary[0] !== 0 || binary[1] !== 97 || binary[2] !== 115 || binary[3] !== 109) {
      send("DONE", run.requestId, {
        outcome: "compile-error",
        stdout: "",
        stderr: diagnostics,
        diagnostics: diagnostics || "The C compiler did not produce a valid WebAssembly program.",
        error: "The C compiler finished without producing a valid WebAssembly program. Review the compiler messages below.",
        durationMs: performance.now() - startedAt,
        exitCode: compiled.exitCode,
      });
      return;
    }
    const program = await wasmerClient.packages.load(binary, { signal: run.controller.signal });
    await sandbox.installPackage(program);
    if (activeRun !== run || run.controller.signal.aborted) return;

    phase = "run";
    send("PHASE", run.requestId, { phase: "running" });
    const timeoutMs = /\b(?:scanf|fscanf|getchar|getline|getdelim|fgets|fgetc|getc|fread|cin\s*>>)/.test(request.code)
      && !normalizeStdin(request.stdin) ? INTERACTIVE_RUN_TIMEOUT_MS : RUN_TIMEOUT_MS;
    const process = await sandbox.command(program).spawn({
      timeoutMs,
      outputBytes: OUTPUT_LIMIT,
      stdin: "pipe",
      terminal: { columns: 100, rows: 32 },
    });
    run.process = process;
    if (request.stdin) await process.stdin?.write(normalizeStdin(request.stdin));
    if (request.closeStdin) {
      await process.stdin?.close();
      send("INPUT_STATE", run.requestId, { closed: true });
    }
    const stdoutPromise = collectStream(process.stdout, run.requestId, "stdout", (value) => {
      run.stdout = value;
    });
    const stderrPromise = collectStream(process.stderr, run.requestId, "stderr", (value) => {
      run.stderr = value;
    });
    const result = await process.wait({ check: false });
    await Promise.all([stdoutPromise, stderrPromise]);
    await process.stdin?.close().catch(() => undefined);
    run.process = null;
    if (activeRun !== run || run.controller.signal.aborted) return;
    const final = outputChannels(result);
    const stdout = run.stdout || final.stdout;
    const stderr = run.stderr || final.stderr;
    const outcome = result.reason === "timeout" ? "timeout"
      : result.reason === "terminated" ? "stopped"
        : result.exitCode === 0 ? "success" : "runtime-error";
    const timeoutMessage = `The program exceeded the ${Math.round(timeoutMs / 1_000)} second run limit. Check its loop conditions and try again.`;
    send("DONE", run.requestId, {
      outcome,
      stdout: stdout || (outcome === "success" ? "Program finished with no output." : ""),
      stderr,
      diagnostics: "",
      error: outcome === "timeout" ? timeoutMessage : outcome === "runtime-error" ? `The program exited with status ${result.exitCode}. Check the output for details.` : "",
      durationMs: performance.now() - startedAt,
      exitCode: result.exitCode ?? undefined,
    });
  } catch (error) {
    if (activeRun !== run) return;
    if (run.stopped || run.controller.signal.aborted) {
      send("DONE", run.requestId, { outcome: "stopped", stdout: run.stdout, stderr: run.stderr, diagnostics: "", error: "Run stopped.", durationMs: performance.now() - startedAt });
    } else if (phase === "load") {
      const message = error instanceof Error ? error.message.slice(0, 1_000) : "The compiler package could not be loaded.";
      send("ERROR", run.requestId, { stage: "load", message: "The isolated C runner could not prepare the compiler. Check your connection and retry; your code remains in the editor." });
      send("DONE", run.requestId, { outcome: "runtime-error", stdout: "", stderr: "", diagnostics: "", error: message, durationMs: performance.now() - startedAt });
    } else {
      const message = error instanceof Error ? error.message.slice(0, 1_000) : "The C runtime could not start.";
      send("DONE", run.requestId, { outcome: "runtime-error", stdout: run.stdout, stderr: run.stderr, diagnostics: "", error: message, durationMs: performance.now() - startedAt });
    }
  } finally {
    if (activeRun === run) {
      run.process = null;
      await run.sandbox?.close().catch(() => undefined);
      run.sandbox = null;
      activeRun = undefined;
    }
  }
}

async function prepareCompiler(requestId) {
  try {
    const controller = new AbortController();
    await ensureCompiler(requestId, controller.signal);
  } catch {
    // ensureCompiler posts the useful setup error to the parent.
  }
}

window.addEventListener("message", (event) => {
  if (event.source !== window.parent || event.origin !== expectedParentOrigin) return;
  const message = event.data;
  if (!validateParentMessage(message)) return;
  if (message.type === "INIT") {
    if (sessionToken && message.token !== sessionToken) return;
    sessionToken = message.token;
    initRequestId = message.requestId;
    send("READY", initRequestId);
    send("COMPILER_STATE", initRequestId, { state: "idle", message: "Compiler ready to prepare" });
    if (message.autoInitialize) void prepareCompiler(initRequestId);
    return;
  }
  if (message.type === "PREPARE") {
    void prepareCompiler(message.requestId);
  } else if (message.type === "RUN") {
    void runProgram(message);
  } else if (message.type === "INPUT") {
    const input = activeRun?.requestId === message.requestId ? activeRun.process?.stdin : null;
    if (!input) return;
    void input.write(`${message.value}\n`).catch(() => send("INPUT_STATE", message.requestId, { closed: true }));
  } else if (message.type === "EOF") {
    const input = activeRun?.requestId === message.requestId ? activeRun.process?.stdin : null;
    if (!input) return;
    void input.close().then(() => send("INPUT_STATE", message.requestId, { closed: true })).catch(() => send("INPUT_STATE", message.requestId, { closed: true }));
  } else if (message.type === "STOP") {
    const run = activeRun;
    if (!run || run.requestId !== message.requestId) return;
    run.stopped = true;
    run.controller.abort(new DOMException("Stopped by the learner.", "AbortError"));
    void run.process?.kill().catch(() => undefined);
    void run.sandbox?.close().catch(() => undefined);
  }
});

document.body.textContent = "The isolated C runner is ready.";
