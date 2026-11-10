"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { cpp } from "@codemirror/lang-cpp";
import { bracketMatching, foldGutter, HighlightStyle, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { EditorView, highlightActiveLineGutter, keymap, lineNumbers } from "@codemirror/view";
import { ArrowLeft, Check, Code2, Copy, LoaderCircle, Play, RotateCcw, Square, Terminal } from "lucide-react";
import type { Package, Process, Sandbox, Wasmer } from "@wasmer/sdk/browser";
import {
  C_PLAYGROUND_COMPILER_PACKAGE,
  C_PLAYGROUND_COMPILE_TIMEOUT_MS,
  C_PLAYGROUND_OUTPUT_LIMIT,
  C_PLAYGROUND_RUN_TIMEOUT_MS,
  C_PLAYGROUND_SOURCE_LIMIT,
  C_PLAYGROUND_STDIN_LIMIT,
  C_PLAYGROUND_STORAGE_KEY,
  defaultCProgram,
  limitCPlaygroundRecord,
  readCPlaygroundRecord,
  type CPlaygroundRecord,
} from "@/lib/c-playground";

type PendingExample = { code: string; lessonId: string; lessonTitle: string; requestId: number };
type Activity = { source: string; diagnostics: string; output: string };
type Props = {
  pendingExample: PendingExample | null;
  onReturnToLesson: (lessonId: string) => void;
  autoInitialize?: boolean;
  compact?: boolean;
  onActivityChange?: (activity: Activity) => void;
};
type RunStage = "idle" | "compiling" | "running";
type CompilerState = "idle" | "initializing" | "ready" | "failed";
type RunOutcome = "none" | "success" | "compile-error" | "runtime-error" | "timeout";

const cSyntaxHighlight = HighlightStyle.define([
  { tag: [tags.keyword, tags.controlKeyword, tags.modifier], color: "var(--code-keyword)" },
  { tag: [tags.string, tags.special(tags.string)], color: "var(--code-string)" },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: "var(--code-comment)", fontStyle: "italic" },
  { tag: [tags.number, tags.integer, tags.float], color: "var(--code-number)" },
  { tag: [tags.function(tags.variableName), tags.typeName, tags.className], color: "var(--code-name)" },
  { tag: [tags.definition(tags.variableName), tags.variableName], color: "var(--code-foreground)" },
  { tag: [tags.operator, tags.punctuation], color: "var(--code-name)" },
]);

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 1) return "0 MiB";
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MiB`;
}

function describeProgress(phase: string, downloaded: number, total: number | null): string {
  const amount = total && total > 0 ? `${formatBytes(downloaded)} of ${formatBytes(total)}` : formatBytes(downloaded);
  if (phase === "resolving") return "Finding the C toolchain…";
  if (phase === "downloading") return `Downloading the C toolchain · ${amount}`;
  if (phase === "loading") return "Preparing the compiler…";
  return "Preparing the local compiler…";
}

function getOutputText(output: { stdout: { text: () => string; truncated: boolean }; stderr: { text: () => string; truncated: boolean } }): string {
  const stdout = output.stdout.text();
  const stderr = output.stderr.text();
  const combined = [stdout, stderr && stderr !== stdout ? stderr : ""].filter(Boolean).join("\n").trim();
  return `${combined}${output.stdout.truncated || output.stderr.truncated ? "\n\nOutput was cut off at the 64 KB limit." : ""}`;
}

function getOutputChannels(output: { stdout: { text: () => string; truncated: boolean }; stderr: { text: () => string; truncated: boolean } }): { stdout: string; stderr: string } {
  const truncated = "\n[Output cut off at the 64 KB limit.]";
  return {
    stdout: `${output.stdout.text()}${output.stdout.truncated ? truncated : ""}`,
    stderr: `${output.stderr.text()}${output.stderr.truncated ? truncated : ""}`,
  };
}

function saveDraft(source: string, stdin: string): boolean {
  try {
    const record: CPlaygroundRecord = limitCPlaygroundRecord(source, stdin);
    window.localStorage.setItem(C_PLAYGROUND_STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

export function CPlayground({ pendingExample, onReturnToLesson, autoInitialize = false, compact = false, onActivityChange }: Props) {
  const [source, setSource] = useState(defaultCProgram);
  const [stdin, setStdin] = useState("");
  const [storageReady, setStorageReady] = useState(false);
  const [storageMessage, setStorageMessage] = useState("");
  const [stage, setStage] = useState<RunStage>("idle");
  const [status, setStatus] = useState("C11 compiler is loading in the background.");
  const [outcome, setOutcome] = useState<RunOutcome>("none");
  const [output, setOutput] = useState("");
  const [stdout, setStdout] = useState("");
  const [stderr, setStderr] = useState("");
  const [diagnostics, setDiagnostics] = useState("");
  const [error, setError] = useState("");
  const [copyLabel, setCopyLabel] = useState("Copy code");
  const [compilerState, setCompilerState] = useState<CompilerState>("idle");
  const [downloadProgress, setDownloadProgress] = useState("");
  const [activeLesson, setActiveLesson] = useState<Pick<PendingExample, "lessonId" | "lessonTitle"> | null>(null);
  const editorHostRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const clientRef = useRef<Wasmer | null>(null);
  const compilerRef = useRef<Package | null>(null);
  const compilerPromiseRef = useRef<Promise<Package> | null>(null);
  const sandboxRef = useRef<Sandbox | null>(null);
  const processRef = useRef<Process | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);
  const handledExampleRef = useRef(0);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    const timer = window.setTimeout(() => {
      try {
        const record = readCPlaygroundRecord(window.localStorage.getItem(C_PLAYGROUND_STORAGE_KEY));
        if (record.kind === "valid") {
          setSource(record.record.source);
          setStdin(record.record.stdin);
        } else if (record.kind === "invalid") {
          setStorageMessage("The saved C draft could not be read. A new draft will be saved when you edit it.");
        }
      } catch {
        setStorageMessage("Browser storage is unavailable. This C draft will stay in memory for this visit.");
      }
      setStorageReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const updateSource = useCallback((value: string) => {
    const next = value.slice(0, C_PLAYGROUND_SOURCE_LIMIT);
    setSource(next);
    if (storageReady) setStorageMessage(saveDraft(next, stdin) ? "" : "This C draft could not be saved. Export or copy it before leaving this browser.");
  }, [stdin, storageReady]);
  const updateSourceRef = useRef(updateSource);
  useEffect(() => {
    updateSourceRef.current = updateSource;
  }, [updateSource]);

  const ensureCompiler = useCallback(async (): Promise<Package> => {
    if (compilerRef.current) return compilerRef.current;
    if (compilerPromiseRef.current) return compilerPromiseRef.current;
    setCompilerState("initializing");
    setStatus("Preparing the browser-based C11 compiler. You can keep reading while it loads.");
    setError("");
    setDownloadProgress("");
    const pending = (async () => {
      try {
        const sdkUrl = new URL("/vendor/wasmer-sdk/dist/index.js", window.location.href).href;
        const { Wasmer } = await import(/* webpackIgnore: true */ sdkUrl) as typeof import("@wasmer/sdk/browser");
        if (!aliveRef.current) throw new DOMException("Compiler initialization was interrupted.", "AbortError");
        const client = clientRef.current ?? new Wasmer({ cache: { namespace: "katalyst-c-playground" }, outputBytes: C_PLAYGROUND_OUTPUT_LIMIT });
        clientRef.current = client;
        const compiler = await client.packages.load(C_PLAYGROUND_COMPILER_PACKAGE, {
          signal: AbortSignal.timeout(5 * 60_000),
          onProgress: (progress) => {
            if (aliveRef.current) setDownloadProgress(describeProgress(progress.phase, progress.download.downloadedBytes, progress.download.totalBytes));
          },
        });
        if (!aliveRef.current) throw new DOMException("Compiler initialization was interrupted.", "AbortError");
        compilerRef.current = compiler;
        setCompilerState("ready");
        setStatus("C11 compiler ready. Your code stays in this browser.");
        setDownloadProgress("");
        setError("");
        return compiler;
      } catch (initializationError) {
        if (aliveRef.current) {
          const timedOut = initializationError instanceof DOMException && initializationError.name === "TimeoutError";
          setCompilerState("failed");
          setStatus("The C11 compiler could not be initialized.");
          setError(timedOut ? "The C compiler download exceeded five minutes. Check your connection, then retry. A previously cached runtime will be reused when available." : initializationError instanceof Error ? `${initializationError.message} Retry initialization; the browser cache may contain a usable copy.` : "Could not prepare the local C compiler. Check the connection and retry.");
          setDownloadProgress("");
        }
        throw initializationError;
      } finally {
        compilerPromiseRef.current = null;
      }
    })();
    compilerPromiseRef.current = pending;
    return pending;
  }, []);

  useEffect(() => {
    if (autoInitialize && compilerState === "idle") void ensureCompiler().catch(() => undefined);
  }, [autoInitialize, compilerState, ensureCompiler]);

  useEffect(() => {
    if (!storageReady || !pendingExample || pendingExample.requestId === handledExampleRef.current) return;
    handledExampleRef.current = pendingExample.requestId;
    const nextSource = pendingExample.code.slice(0, C_PLAYGROUND_SOURCE_LIMIT);
    setSource(nextSource);
    setStdin("");
    setStorageMessage(saveDraft(nextSource, "") ? "" : "This C example could not be saved. Export or copy it before leaving this browser.");
    setOutput("");
    setStdout("");
    setStderr("");
    setDiagnostics("");
    setError("");
    setOutcome("none");
    setStatus(`Loaded the example from “${pendingExample.lessonTitle}”.`);
    setActiveLesson({ lessonId: pendingExample.lessonId, lessonTitle: pendingExample.lessonTitle });
  }, [pendingExample, storageReady]);

  useEffect(() => {
    const host = editorHostRef.current;
    if (!host || editorViewRef.current) return;
    const editor = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: defaultCProgram,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          foldGutter(),
          cpp(),
          indentOnInput(),
          bracketMatching(),
          syntaxHighlighting(cSyntaxHighlight),
          keymap.of([...defaultKeymap, indentWithTab]),
          EditorView.contentAttributes.of({ "aria-label": "C source code", spellcheck: "false", autocorrect: "off", autocapitalize: "off" }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) updateSourceRef.current(update.state.doc.toString());
          }),
        ],
      }),
    });
    editorViewRef.current = editor;
    return () => {
      editor.destroy();
      editorViewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const editor = editorViewRef.current;
    if (!editor || editor.state.doc.toString() === source) return;
    editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: source } });
  }, [source]);

  useEffect(() => {
    onActivityChange?.({ source, diagnostics, output });
  }, [diagnostics, onActivityChange, output, source]);

  useEffect(() => () => {
    aliveRef.current = false;
    runIdRef.current += 1;
    abortRef.current?.abort(new DOMException("Run stopped.", "AbortError"));
    if (processRef.current) void processRef.current.kill();
    if (sandboxRef.current) void sandboxRef.current.close();
    if (clientRef.current) void clientRef.current.close();
    clientRef.current = null;
    compilerRef.current = null;
    compilerPromiseRef.current = null;
  }, []);

  const updateStdin = (value: string) => {
    const next = value.slice(0, C_PLAYGROUND_STDIN_LIMIT);
    setStdin(next);
    if (storageReady) setStorageMessage(saveDraft(source, next) ? "" : "This C draft could not be saved. Export or copy it before leaving this browser.");
  };

  const stopRun = () => {
    runIdRef.current += 1;
    abortRef.current?.abort(new DOMException("Run stopped.", "AbortError"));
    abortRef.current = null;
    if (processRef.current) void processRef.current.kill();
    processRef.current = null;
    if (sandboxRef.current) void sandboxRef.current.close();
    sandboxRef.current = null;
    setStage("idle");
    setOutcome("none");
    setStatus("Run stopped.");
  };

  const runProgram = async () => {
    if (stage !== "idle") return;
    if (compilerState !== "ready" || !compilerRef.current || !clientRef.current) {
      setStatus(compilerState === "failed" ? "Compiler initialization failed. Retry before running code." : "The C11 compiler is still initializing. Run is available when it is ready.");
      return;
    }
    if (!source.trim()) {
      setError("Add a C program before running it.");
      return;
    }
    if (typeof window.crossOriginIsolated !== "boolean" || !window.crossOriginIsolated) {
      setError("The C runtime needs a cross-origin-isolated page. Start KATALYST with its configured Next.js server headers, then reload.");
      return;
    }

    const runId = ++runIdRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    const isCurrent = () => runIdRef.current === runId;
    const client = clientRef.current;
    const compiler = compilerRef.current;
    setStage("compiling");
    setOutcome("none");
    setStatus("Compiling your C program locally…");
    setOutput("");
    setStdout("");
    setStderr("");
    setDiagnostics("");
    setError("");

    try {
      const sandbox = await client.sandboxes.create({
        packages: [compiler],
        files: { "main.c": source },
        network: { mode: "disabled" },
        signal: controller.signal,
      });
      if (!isCurrent()) {
        await sandbox.close();
        return;
      }
      sandboxRef.current = sandbox;

      const compilerName = compiler.entrypoint ?? "clang";
      const compileProcess = await sandbox.command(compilerName, ["-std=c11", "-O0", "/workspace/main.c", "-o", "/workspace/program.wasm"]).spawn({
        timeoutMs: C_PLAYGROUND_COMPILE_TIMEOUT_MS,
        outputBytes: C_PLAYGROUND_OUTPUT_LIMIT,
        stdin: "closed",
        stdout: "capture",
        stderr: "capture",
      });
      processRef.current = compileProcess;
      if (!isCurrent()) {
        await compileProcess.kill();
        return;
      }
      const compiled = await compileProcess.wait({ check: false });
      processRef.current = null;
      const compileDiagnostics = getOutputText(compiled);
      setDiagnostics(compileDiagnostics);
      if (compiled.reason !== "exited" || compiled.exitCode !== 0) {
        const timedOut = compiled.reason === "timeout";
        setOutcome(timedOut ? "timeout" : "compile-error");
        setError(timedOut ? "Compilation took longer than 15 seconds. Shorten the example and try again." : "The C compiler could not build this program. Review the compiler messages below.");
        setStatus(timedOut ? "Compilation timed out." : "Compilation failed.");
        return;
      }

      const binary = await sandbox.fs.readFile("/workspace/program.wasm");
      const program = await client.packages.load(new Uint8Array(binary), { signal: controller.signal });
      await sandbox.installPackage(program);
      if (!isCurrent()) return;

      setStage("running");
      setStatus("Running the compiled program in the browser sandbox…");
      const programProcess = await sandbox.command(program).spawn({
        timeoutMs: C_PLAYGROUND_RUN_TIMEOUT_MS,
        outputBytes: C_PLAYGROUND_OUTPUT_LIMIT,
        stdin: "pipe",
        stdout: "capture",
        stderr: "capture",
      });
      processRef.current = programProcess;
      if (!isCurrent()) {
        await programProcess.kill();
        return;
      }
      if (stdin) await programProcess.stdin?.write(stdin);
      await programProcess.stdin?.close();
      const result = await programProcess.wait({ check: false });
      processRef.current = null;
      if (!isCurrent()) return;
      const channels = getOutputChannels(result);
      const noOutputMessage = result.reason === "exited" && result.exitCode === 0 && !channels.stdout && !channels.stderr ? "Program finished with no output." : "";
      setStdout(channels.stdout || noOutputMessage);
      setStderr(channels.stderr);
      setOutput([channels.stdout, channels.stderr && `stderr:\n${channels.stderr}`, noOutputMessage].filter(Boolean).join("\n"));
      if (result.reason === "timeout") {
        setOutcome("timeout");
        setError("The program exceeded the 8 second run limit. Check its loop conditions and try again.");
        setStatus("Program timed out and was stopped.");
      } else if (result.reason === "terminated") {
        setOutcome("none");
        setStatus("Run stopped.");
      } else if (result.exitCode !== 0) {
        setOutcome("runtime-error");
        setError(`The program exited with status ${result.exitCode}. Check the output for details.`);
        setStatus("Program finished with a runtime error.");
      } else {
        setOutcome("success");
        setStatus("Program finished successfully in the local WebAssembly sandbox.");
      }
    } catch (runError) {
      if (!isCurrent()) return;
      const timedOut = controller.signal.reason instanceof DOMException && controller.signal.reason.name === "TimeoutError";
      const stopped = controller.signal.aborted;
      setOutcome(timedOut ? "timeout" : stopped ? "none" : "runtime-error");
      setError(timedOut ? "The C runtime took too long to finish. Check the program and try again." : stopped ? "Run stopped." : runError instanceof Error ? runError.message.slice(0, 1_000) : "The C runtime could not start.");
      setStatus(timedOut ? "Program timed out and was stopped." : stopped ? "Run stopped." : "The C playground could not finish this run.");
    } finally {
      if (isCurrent()) {
        abortRef.current = null;
        processRef.current = null;
        if (sandboxRef.current) {
          await sandboxRef.current.close();
          sandboxRef.current = null;
        }
        setStage("idle");
      }
    }
  };

  const copySource = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopyLabel("Copied");
      window.setTimeout(() => setCopyLabel("Copy code"), 1_500);
    } catch {
      setCopyLabel("Could not copy");
      window.setTimeout(() => setCopyLabel("Copy code"), 1_800);
    }
  };

  const resetSource = () => {
    setSource(defaultCProgram);
    setStdin("");
    if (storageReady) setStorageMessage(saveDraft(defaultCProgram, "") ? "" : "This C draft could not be saved. Export or copy it before leaving this browser.");
    setActiveLesson(null);
    setOutput("");
    setStdout("");
    setStderr("");
    setDiagnostics("");
    setError("");
    setOutcome("none");
    setStatus("Starter program restored.");
  };

  const clearOutput = () => {
    setOutput("");
    setStdout("");
    setStderr("");
    setDiagnostics("");
    setError("");
    setOutcome("none");
    setStatus("Output cleared.");
  };

  const compilerStatus = compilerState === "ready" ? "Compiler ready" : compilerState === "failed" ? "Setup failed" : compilerState === "initializing" ? "Preparing compiler" : "Compiler waiting";

  return <section className={`c-playground${compact ? " c-playground-compact" : ""}`} aria-labelledby="c-playground-title" data-compiler-state={compilerState}>
    {!compact ? <header className="c-playground-heading"><div className="c-playground-heading-copy"><span className="eyebrow">C PROGRAMMING · WORKBENCH</span><h1 id="c-playground-title">C Workbench</h1><p>Write, compile, and run C11 in your browser.</p></div><div className="c-playground-heading-meta"><span className="c-language-label"><Code2 size={14} /> C · C11</span>{activeLesson && <button className="learning-text-button" onClick={() => onReturnToLesson(activeLesson.lessonId)}><ArrowLeft size={14} /> Return to {activeLesson.lessonTitle}</button>}</div></header> : <h2 id="c-playground-title" className="sr-only">C11 code editor and local program output</h2>}
    <div className="c-playground-notice"><span className="c-playground-status-dot" /><p>{compilerState === "ready" ? "C11 is ready. Your code compiles to WebAssembly and runs in this browser tab; KATALYST does not upload it." : compilerState === "failed" ? "The C11 compiler could not be prepared. Your lesson is still available; retry setup when ready." : "The C11 compiler is preparing in the background. You can read and edit while it initializes; Run becomes available when setup finishes."} The runtime is cached in this browser.</p><span>Powered by Wasmer</span></div>
    {storageMessage && <p className="c-playground-storage" role="status">{storageMessage}</p>}

    <div className="c-playground-grid">
      <section className="c-editor-pane" aria-label="C source editor">
        <div className="c-pane-heading"><div><Code2 size={15} /><strong>main.c</strong><span>C11</span></div><div className="c-pane-actions"><span>{source.length.toLocaleString()} / {C_PLAYGROUND_SOURCE_LIMIT.toLocaleString()}</span><button type="button" className="c-small-action" onClick={() => void copySource()}><Copy size={13} />{copyLabel}</button></div></div>
        <label className="sr-only" htmlFor="c-playground-source">C source code</label><div id="c-playground-source" ref={editorHostRef} className="c-source-editor-host" aria-describedby="c-playground-language" />
        <div className="c-editor-footer"><span id="c-playground-language">C11 · clang to WebAssembly · local draft</span><button type="button" className="c-small-action" onClick={resetSource}><RotateCcw size={13} />Reset example</button></div>
      </section>

      <section className="c-output-pane" aria-label="Program input and output">
        <div className="c-pane-heading"><div><Terminal size={15} /><strong>Terminal</strong><span>{compilerStatus}</span></div>{stage === "idle" ? <button type="button" className="c-run-button" onClick={() => void runProgram()} disabled={compilerState !== "ready"}><Play size={14} />Run code</button> : <button type="button" className="c-stop-button" onClick={stopRun}><Square size={12} />Stop</button>}</div>
        {compilerState === "initializing" && <div className="c-compiler-progress" role="status"><LoaderCircle size={14} className="c-loading-icon" /><span>{downloadProgress || "Checking the browser cache and preparing C11…"}</span></div>}
        {compilerState === "failed" && <div className="c-compiler-failure" role="alert"><span>{error || "Compiler initialization failed."}</span><button type="button" className="secondary-button" onClick={() => void ensureCompiler().catch(() => undefined)}>Retry compiler setup</button></div>}
        <label className="c-stdin-label" htmlFor="c-playground-stdin">Program input <span>stdin · one line at a time</span></label>
        <textarea id="c-playground-stdin" className="c-stdin-editor" value={stdin} onChange={(event) => updateStdin(event.target.value)} placeholder="Enter values here when your program reads input." maxLength={C_PLAYGROUND_STDIN_LIMIT} spellCheck={false} />
        <div className="c-console-heading"><span>Output</span><span className={`c-run-status outcome-${outcome}`} role="status">{stage !== "idle" && <LoaderCircle size={13} className="c-loading-icon" />}{outcome === "success" && <Check size={13} />}{status}</span><button type="button" className="c-small-action" onClick={clearOutput} disabled={stage !== "idle"} aria-label="Clear terminal output">Clear output</button></div>
        <div className="c-console-output" aria-live="polite" aria-label="Program output">
          <div className="c-output-stream"><span>stdout</span><pre>{stdout || (stage === "idle" ? "Run the example to see its output here." : "Waiting for program output…")}</pre></div>
          {stderr && <div className="c-output-stream stderr"><span>stderr</span><pre>{stderr}</pre></div>}
        </div>
        {diagnostics && <details className="c-compiler-diagnostics" open={outcome === "compile-error"}><summary>{outcome === "compile-error" ? "Compiler errors" : "Compiler messages"}</summary><pre>{diagnostics}</pre></details>}
        {error && compilerState !== "failed" && <div className="c-playground-error" role="alert">{error}</div>}
      </section>
    </div>
    <p className="c-playground-footnote">Compiler package: clang/clang · Code is limited to 12 KB, input to 2 KB, output to 64 KB, compilation to 15 seconds, and each run to 8 seconds. Network access is disabled.</p>
  </section>;
}
