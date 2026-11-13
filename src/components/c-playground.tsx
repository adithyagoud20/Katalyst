"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Compartment, EditorState } from "@codemirror/state";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { cpp } from "@codemirror/lang-cpp";
import { bracketMatching, foldGutter, HighlightStyle, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { EditorView, highlightActiveLineGutter, keymap, lineNumbers } from "@codemirror/view";
import { ArrowLeft, Check, Code2, Copy, Cpu, Database, Globe, Laptop, LoaderCircle, Play, RotateCcw, RotateCw, Smartphone, Square, Terminal } from "lucide-react";
import type { Package, Process, Sandbox, Wasmer } from "@wasmer/sdk/browser";
import { CircuitSimulator } from "@/components/simulators/circuit-simulator";
import { SimulatorErrorBoundary } from "@/components/simulators/simulator-error-boundary";
import {
  C_PLAYGROUND_COMPILER_PACKAGE,
  C_PLAYGROUND_COMPILE_TIMEOUT_MS,
  C_PLAYGROUND_OUTPUT_LIMIT,
  C_PLAYGROUND_RUN_TIMEOUT_MS,
  C_PLAYGROUND_SOURCE_LIMIT,
  C_PLAYGROUND_STDIN_LIMIT,
  C_PLAYGROUND_STORAGE_KEY,
  defaultCProgram,
  getOutputChannels,
  getOutputText,
  limitCPlaygroundRecord,
  normalizeStdin,
  programExpectsStdin,
} from "@/lib/c-playground";
import {
  PYTHON_PLAYGROUND_STORAGE_KEY,
  PYTHON_PLAYGROUND_SOURCE_LIMIT,
  PYTHON_PLAYGROUND_STDIN_LIMIT,
  PYTHON_PLAYGROUND_OUTPUT_LIMIT,
  defaultPythonProgram,
  limitPythonPlaygroundRecord,
  programExpectsStdinPython,
} from "@/lib/python-playground";
import { executeProgram } from "@/lib/execution/runner";
import { pythonStreamParser, sqlStreamParser, htmlStreamParser } from "./code-workspace";

export type PlaygroundLanguage = "c" | "python" | "javascript" | "sql" | "html" | "circuit";

export const JS_PLAYGROUND_STORAGE_KEY = "katalyst.js.playground.v1";
export const SQL_PLAYGROUND_STORAGE_KEY = "katalyst.sql.playground.v1";
export const HTML_PLAYGROUND_STORAGE_KEY = "katalyst.html.playground.v1";
export const CIRCUIT_PLAYGROUND_STORAGE_KEY = "katalyst.circuit.playground.v1";

export const defaultJsProgram = `// JavaScript (ES2024) Web Worker Playground
function computeFibonacci(n) {
  const sequence = [0, 1];
  for (let i = 2; i < n; i++) {
    sequence.push(sequence[i - 1] + sequence[i - 2]);
  }
  return sequence;
}

console.log("Fibonacci(10):", computeFibonacci(10).join(", "));
`;

export const defaultSqlProgram = `-- SQLite WASM Database Playground
CREATE TABLE engineers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL
);

INSERT INTO engineers VALUES
  (1, 'Ada Lovelace', 'Algorithms'),
  (2, 'Claude Shannon', 'Information Theory'),
  (3, 'Grace Hopper', 'Compilers');

SELECT * FROM engineers ORDER BY id ASC;
`;

export const defaultHtmlProgram = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KATALYST Live Preview</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 2rem;
      background: #090d16;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
    }
    .card {
      background: #131b2e;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 28px;
      max-width: 440px;
      text-align: center;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
    }
    h1 { margin-top: 0; color: #60a5fa; font-size: 1.5rem; }
    p { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; }
    button {
      background: #2563eb;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="card">
    <h1>KATALYST Web Sandbox</h1>
    <p>Live, client-side HTML5 &amp; CSS3 preview. Edits in the editor appear here instantly.</p>
    <button onclick="alert('Hello from KATALYST!')">Test Interaction</button>
  </div>
</body>
</html>
`;

export type PendingExample = {
  code: string;
  lessonId: string;
  lessonTitle: string;
  requestId: number;
  sampleInput?: string;
  language?: PlaygroundLanguage;
};

export type Activity = { source: string; diagnostics: string; output: string };

export type PlaygroundProps = {
  pendingExample?: PendingExample | null;
  onReturnToLesson?: (lessonId: string) => void;
  autoInitialize?: boolean;
  compact?: boolean;
  initialLanguage?: PlaygroundLanguage;
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

function getPlaygroundStorageKey(lang: PlaygroundLanguage): string {
  switch (lang) {
    case "c":
      return C_PLAYGROUND_STORAGE_KEY;
    case "python":
      return PYTHON_PLAYGROUND_STORAGE_KEY;
    case "javascript":
      return JS_PLAYGROUND_STORAGE_KEY;
    case "sql":
      return SQL_PLAYGROUND_STORAGE_KEY;
    case "html":
      return HTML_PLAYGROUND_STORAGE_KEY;
    case "circuit":
      return CIRCUIT_PLAYGROUND_STORAGE_KEY;
  }
}

function getDefaultProgramForLang(lang: PlaygroundLanguage): string {
  switch (lang) {
    case "c":
      return defaultCProgram;
    case "python":
      return defaultPythonProgram;
    case "javascript":
      return defaultJsProgram;
    case "sql":
      return defaultSqlProgram;
    case "html":
      return defaultHtmlProgram;
    case "circuit":
      return "";
  }
}

function saveDraftForLang(lang: PlaygroundLanguage, src: string, inp: string): boolean {
  try {
    const key = getPlaygroundStorageKey(lang);
    if (lang === "c") {
      const record = limitCPlaygroundRecord(src, inp);
      window.localStorage.setItem(key, JSON.stringify(record));
    } else if (lang === "python") {
      const record = limitPythonPlaygroundRecord(src, inp);
      window.localStorage.setItem(key, JSON.stringify(record));
    } else {
      window.localStorage.setItem(
        key,
        JSON.stringify({ version: 1, source: src.slice(0, 100_000), stdin: inp.slice(0, 50_000) })
      );
    }
    return true;
  } catch {
    return false;
  }
}

function readDraftForLang(lang: PlaygroundLanguage): { source: string; stdin: string } | null {
  try {
    const key = getPlaygroundStorageKey(lang);
    const item = window.localStorage.getItem(key);
    if (!item) return null;
    const parsed = JSON.parse(item);
    if (parsed && typeof parsed.source === "string") {
      return { source: parsed.source, stdin: parsed.stdin ?? "" };
    }
  } catch {}
  return null;
}

export function CPlayground({
  pendingExample = null,
  onReturnToLesson = () => undefined,
  autoInitialize = false,
  compact = false,
  initialLanguage = "c",
  onActivityChange,
}: PlaygroundProps) {
  const [activeLanguage, setActiveLanguage] = useState<PlaygroundLanguage>(initialLanguage);
  const [playgroundMode, setPlaygroundMode] = useState<"code" | "circuits">(
    initialLanguage === "circuit" ? "circuits" : "code"
  );
  const [source, setSource] = useState(getDefaultProgramForLang(initialLanguage));
  const [stdin, setStdin] = useState("");
  const [storageReady, setStorageReady] = useState(false);
  const [storageMessage, setStorageMessage] = useState("");
  const [stage, setStage] = useState<RunStage>("idle");
  const [status, setStatus] = useState("Ready");
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
  const [needsStdinConfirm, setNeedsStdinConfirm] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [previewKey, setPreviewKey] = useState(0);

  const editorHostRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const [languageCompartment] = useState(() => new Compartment());
  const clientRef = useRef<Wasmer | null>(null);
  const compilerRef = useRef<Package | null>(null);
  const compilerPromiseRef = useRef<Promise<Package> | null>(null);
  const sandboxRef = useRef<Sandbox | null>(null);
  const processRef = useRef<Process | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);
  const handledExampleRef = useRef(0);
  const aliveRef = useRef(true);
  const isSwitchingRef = useRef(false);

  // Initialize drafts from localStorage
  useEffect(() => {
    aliveRef.current = true;
    const timer = window.setTimeout(() => {
      try {
        const saved = readDraftForLang(activeLanguage);
        if (saved) {
          setSource(saved.source);
          setStdin(saved.stdin);
        } else {
          setSource(getDefaultProgramForLang(activeLanguage));
          setStdin("");
        }
      } catch {
        setStorageMessage("Browser storage is unavailable. This draft will stay in memory for this visit.");
      }
      setStorageReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeLanguage]);

  const saveCurrentDraft = useCallback((lang: PlaygroundLanguage, src: string, inp: string): boolean => {
    return saveDraftForLang(lang, src, inp);
  }, []);

  const updateSource = useCallback((value: string) => {
    if (isSwitchingRef.current) return;
    const limit = activeLanguage === "python" ? PYTHON_PLAYGROUND_SOURCE_LIMIT : C_PLAYGROUND_SOURCE_LIMIT;
    const next = value.slice(0, limit);
    setSource(next);
    if (storageReady) {
      setStorageMessage(
        saveCurrentDraft(activeLanguage, next, stdin)
          ? ""
          : "This draft could not be saved. Export or copy it before leaving this browser."
      );
    }
  }, [activeLanguage, saveCurrentDraft, stdin, storageReady]);

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
        const { Wasmer } = (await import(/* webpackIgnore: true */ sdkUrl)) as typeof import("@wasmer/sdk/browser");
        if (!aliveRef.current) throw new DOMException("Compiler initialization was interrupted.", "AbortError");
        const client = clientRef.current ?? new Wasmer({ cache: { namespace: "katalyst-c-playground" }, outputBytes: C_PLAYGROUND_OUTPUT_LIMIT });
        clientRef.current = client;
        const compiler = await client.packages.load(C_PLAYGROUND_COMPILER_PACKAGE, {
          signal: AbortSignal.timeout(5 * 60_000),
          onProgress: (progress) => {
            if (aliveRef.current) {
              setDownloadProgress(describeProgress(progress.phase, progress.download.downloadedBytes, progress.download.totalBytes));
            }
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
          setError(
            timedOut
              ? "The C compiler download exceeded five minutes. Check your connection, then retry. A previously cached runtime will be reused when available."
              : initializationError instanceof Error
              ? `${initializationError.message} Retry initialization; the browser cache may contain a usable copy.`
              : "Could not prepare the local C compiler. Check the connection and retry."
          );
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
    if (activeLanguage === "c" && autoInitialize && compilerState === "idle") {
      void ensureCompiler().catch(() => undefined);
    }
  }, [activeLanguage, autoInitialize, compilerState, ensureCompiler]);

  // Handle incoming lesson example
  useEffect(() => {
    if (!storageReady || !pendingExample || pendingExample.requestId === handledExampleRef.current) return;
    handledExampleRef.current = pendingExample.requestId;

    const detectedLang: PlaygroundLanguage =
      pendingExample.language ??
      (pendingExample.lessonId.startsWith("py") || pendingExample.lessonId.includes("python")
        ? "python"
        : pendingExample.lessonId.startsWith("sql")
        ? "sql"
        : pendingExample.lessonId.startsWith("html") || pendingExample.lessonId.startsWith("css")
        ? "html"
        : pendingExample.lessonId.startsWith("js")
        ? "javascript"
        : "c");

    // Guard: In compact lesson mode restricted to C, do not accept python examples
    if (compact && initialLanguage === "c" && detectedLang === "python") {
      return;
    }

    const limit = detectedLang === "python" ? PYTHON_PLAYGROUND_SOURCE_LIMIT : C_PLAYGROUND_SOURCE_LIMIT;
    const stdinLimit = detectedLang === "python" ? PYTHON_PLAYGROUND_STDIN_LIMIT : C_PLAYGROUND_STDIN_LIMIT;
    const nextSource = pendingExample.code.slice(0, limit);
    const nextStdin = (pendingExample.sampleInput ?? "").slice(0, stdinLimit);

    isSwitchingRef.current = true;
    try {
      setActiveLanguage(detectedLang);
      setSource(nextSource);
      setStdin(nextStdin);
      setNeedsStdinConfirm(false);
      setStorageMessage(
        saveCurrentDraft(detectedLang, nextSource, nextStdin)
          ? ""
          : "This example could not be saved. Export or copy it before leaving this browser."
      );
      setOutput("");
      setStdout("");
      setStderr("");
      setDiagnostics("");
      setError("");
      setOutcome("none");
      setStatus(`Loaded the example from “${pendingExample.lessonTitle}”.`);
      setActiveLesson({ lessonId: pendingExample.lessonId, lessonTitle: pendingExample.lessonTitle });

      // Update editor
      const editor = editorViewRef.current;
      if (editor) {
        const modeExt =
          detectedLang === "python"
            ? pythonStreamParser
            : detectedLang === "sql"
            ? sqlStreamParser
            : detectedLang === "html"
            ? htmlStreamParser
            : cpp();
        editor.dispatch({
          effects: languageCompartment.reconfigure(modeExt),
          changes: { from: 0, to: editor.state.doc.length, insert: nextSource },
        });
      }
    } finally {
      window.setTimeout(() => {
        isSwitchingRef.current = false;
      }, 0);
    }
  }, [compact, initialLanguage, languageCompartment, pendingExample, saveCurrentDraft, storageReady]);

  // Initialize CodeMirror instance
  useEffect(() => {
    const host = editorHostRef.current;
    if (!host || editorViewRef.current) return;
    const initialSource = activeLanguage === "python" ? defaultPythonProgram : defaultCProgram;
    const editor = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: initialSource,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          foldGutter(),
          languageCompartment.of(activeLanguage === "python" ? pythonStreamParser : cpp()),
          indentOnInput(),
          bracketMatching(),
          syntaxHighlighting(cSyntaxHighlight),
          keymap.of([...defaultKeymap, indentWithTab]),
          EditorView.contentAttributes.of({
            "aria-label": activeLanguage === "python" ? "Python source code" : "C source code",
            spellcheck: "false",
            autocorrect: "off",
            autocapitalize: "off",
          }),
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
  }, [activeLanguage, languageCompartment]);

  // Sync editor content when source state changes externally
  useEffect(() => {
    const editor = editorViewRef.current;
    if (!editor || editor.state.doc.toString() === source) return;
    editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: source } });
  }, [source]);

  // Broadcast activity to parent
  useEffect(() => {
    onActivityChange?.({ source, diagnostics, output });
  }, [diagnostics, onActivityChange, output, source]);

  // Teardown
  useEffect(() => () => {
    aliveRef.current = false;
    runIdRef.current += 1;
    abortRef.current?.abort(new DOMException("Run stopped.", "AbortError"));
    if (processRef.current && typeof processRef.current.kill === "function") void processRef.current.kill();
    if (sandboxRef.current && typeof sandboxRef.current.close === "function") void sandboxRef.current.close();
    if (clientRef.current && typeof clientRef.current.close === "function") void clientRef.current.close();
    clientRef.current = null;
    compilerRef.current = null;
    compilerPromiseRef.current = null;
  }, []);

  const switchLanguage = (targetLang: PlaygroundLanguage) => {
    if (targetLang === activeLanguage) return;
    // 1. Save current language draft
    saveCurrentDraft(activeLanguage, source, stdin);

    isSwitchingRef.current = true;
    try {
      setActiveLanguage(targetLang);
      if (targetLang === "circuit") {
        setPlaygroundMode("circuits");
        setNeedsStdinConfirm(false);
        setStatus("Digital Circuit Simulator ready.");
        return;
      }

      setPlaygroundMode("code");
      const draft = readDraftForLang(targetLang);
      const nextSource = draft?.source ?? getDefaultProgramForLang(targetLang);
      const nextStdin = draft?.stdin ?? "";

      setSource(nextSource);
      setStdin(nextStdin);
      setNeedsStdinConfirm(false);
      setOutput("");
      setStdout("");
      setStderr("");
      setDiagnostics("");
      setError("");
      setOutcome("none");
      setStage("idle");

      if (targetLang === "html") {
        setStatus("HTML/CSS Live Sandbox preview ready.");
        setPreviewKey((k) => k + 1);
      } else if (targetLang === "sql") {
        setStatus("SQLite WebAssembly ready.");
      } else if (targetLang === "javascript") {
        setStatus("JavaScript worker ready.");
      } else if (targetLang === "python") {
        setStatus("Python 3.12 runtime ready. Code executes in browser WebAssembly.");
      } else {
        setStatus(
          compilerState === "ready"
            ? "C11 compiler ready. Your code stays in this browser."
            : "C11 compiler ready to prepare."
        );
      }

      // Reconfigure CodeMirror
      const editor = editorViewRef.current;
      if (editor) {
        const modeExt =
          targetLang === "python"
            ? pythonStreamParser
            : targetLang === "sql"
            ? sqlStreamParser
            : targetLang === "html"
            ? htmlStreamParser
            : cpp();
        editor.dispatch({
          effects: languageCompartment.reconfigure(modeExt),
          changes: { from: 0, to: editor.state.doc.length, insert: nextSource },
        });
      }
    } finally {
      window.setTimeout(() => {
        isSwitchingRef.current = false;
      }, 0);
    }
  };

  const updateStdin = (value: string) => {
    const limit = activeLanguage === "python" ? PYTHON_PLAYGROUND_STDIN_LIMIT : C_PLAYGROUND_STDIN_LIMIT;
    const next = value.slice(0, limit);
    setStdin(next);
    if (next.trim()) setNeedsStdinConfirm(false);
    if (storageReady) {
      setStorageMessage(
        saveCurrentDraft(activeLanguage, source, next)
          ? ""
          : "This draft could not be saved. Export or copy it before leaving this browser."
      );
    }
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

  const runProgram = async (forceEmptyStdin = false) => {
    if (stage !== "idle") return;

    const expectsInput = activeLanguage === "python" ? programExpectsStdinPython(source) : programExpectsStdin(source);

    if (activeLanguage === "circuit") {
      setStatus("Circuit simulation runs interactively.");
      return;
    }

    if (activeLanguage === "html") {
      setPreviewKey((k) => k + 1);
      setStatus("HTML/CSS Live Sandbox preview refreshed.");
      return;
    }

    if (!source.trim()) {
      setError(`Add code before running it.`);
      return;
    }

    if (!forceEmptyStdin && expectsInput && !stdin.trim() && (activeLanguage === "c" || activeLanguage === "python")) {
      setNeedsStdinConfirm(true);
      setError(
        `This program reads standard input (${
          activeLanguage === "python" ? "input()" : "scanf"
        }), but no input was provided in the Program input box above. Enter your values or click “Run with empty input (EOF)”.`
      );
      setStatus("Input required before running.");
      return;
    }
    setNeedsStdinConfirm(false);

    // Python, JavaScript, and SQL execution via unified executeProgram
    if (activeLanguage === "python" || activeLanguage === "javascript" || activeLanguage === "sql") {
      const runId = ++runIdRef.current;
      const controller = new AbortController();
      abortRef.current = controller;
      const isCurrent = () => runIdRef.current === runId;

      setStage("running");
      setOutcome("none");
      setStatus(
        activeLanguage === "sql"
          ? "Executing query in SQLite WebAssembly…"
          : activeLanguage === "javascript"
          ? "Executing JavaScript in Web Worker…"
          : "Executing Python program in browser WebAssembly…"
      );
      setOutput("");
      setStdout("");
      setStderr("");
      setDiagnostics("");
      setError("");

      try {
        const filename =
          activeLanguage === "sql"
            ? "query.sql"
            : activeLanguage === "javascript"
            ? "main.js"
            : "main.py";

        const result = await executeProgram({
          language: activeLanguage,
          files: [{ path: filename, content: source }],
          stdin: normalizeStdin(stdin),
          signal: controller.signal,
          limits: {
            timeoutMs: 10_000,
            compileTimeoutMs: 15_000,
            memoryLimitMb: 64,
            outputLimitBytes: PYTHON_PLAYGROUND_OUTPUT_LIMIT,
          },
          onProgress: (_phase, message) => {
            if (isCurrent()) setStatus(message);
          },
        });

        if (!isCurrent()) return;

        const noOutputMessage =
          result.ok && !result.stdout && !result.stderr ? "Program finished with no output." : "";
        setStdout(result.stdout || noOutputMessage);
        setStderr(result.stderr);
        setOutput(
          [result.stdout, result.stderr && `stderr:\n${result.stderr}`, noOutputMessage].filter(Boolean).join("\n")
        );

        if (result.ok) {
          setOutcome("success");
          setStatus(`Execution completed in ${result.executionTimeMs} ms in local sandbox.`);
        } else {
          const timedOut = result.stage === "timeout" || result.error?.includes("timeout");
          setOutcome(timedOut ? "timeout" : "runtime-error");
          setError(result.stderr || result.error || `Execution failed with status ${result.exitCode}.`);
          setStatus(timedOut ? "Execution timed out." : `Execution finished with an error.`);
        }
      } catch (runErr) {
        if (!isCurrent()) return;
        const stopped = controller.signal.aborted;
        setOutcome(stopped ? "none" : "runtime-error");
        setError(stopped ? "Run stopped." : runErr instanceof Error ? runErr.message : "Execution failed.");
        setStatus(stopped ? "Run stopped." : "Execution encountered an error.");
      } finally {
        if (isCurrent()) {
          abortRef.current = null;
          setStage("idle");
        }
      }
      return;
    }

    // C execution via Wasmer
    if (compilerState !== "ready" || !compilerRef.current || !clientRef.current) {
      if (compilerState === "failed") {
        setStatus("Compiler initialization failed. Retry before running code.");
        return;
      }
      if (compilerState === "idle") {
        try {
          await ensureCompiler();
        } catch {
          return;
        }
      } else {
        setStatus("The C11 compiler is still initializing. Run is available when it is ready.");
        return;
      }
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
    if (!client || !compiler) return;

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
      const normalizedInput = normalizeStdin(stdin);
      if (normalizedInput) await programProcess.stdin?.write(normalizedInput);
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
    const starter = getDefaultProgramForLang(activeLanguage);
    setSource(starter);
    setStdin("");
    setNeedsStdinConfirm(false);
    if (storageReady) {
      setStorageMessage(
        saveCurrentDraft(activeLanguage, starter, "")
          ? ""
          : "This draft could not be saved. Export or copy it before leaving this browser."
      );
    }
    setActiveLesson(null);
    setOutput("");
    setStdout("");
    setStderr("");
    setDiagnostics("");
    setError("");
    setOutcome("none");
    setStatus("Starter program restored.");

    const editor = editorViewRef.current;
    if (editor) {
      editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: starter } });
    }
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

  const compilerStatus =
    compilerState === "ready"
      ? "Compiler ready"
      : compilerState === "failed"
      ? "Setup failed"
      : compilerState === "initializing"
      ? "Preparing compiler"
      : "Compiler ready to prepare";

  const expectsInput = activeLanguage === "python" ? programExpectsStdinPython(source) : programExpectsStdin(source);
  const langDetails = {
    python: {
      eyebrow: "PYTHON PROGRAMMING · WORKBENCH",
      title: "Python Workbench",
      desc: "Write, interpret, and run Python 3.12 in your browser.",
      badge: "Python · 3.12",
      filename: "main.py",
      tag: "Python 3.12",
      engine: "Engine: Pyodide WebAssembly (Python 3.12) · Code is limited to 24 KB, input to 4 KB, output to 64 KB, run to 10 seconds. Network access is disabled.",
      notice: "Python 3.12 runs in this browser tab via Pyodide WebAssembly; KATALYST does not upload your code.",
      poweredBy: "Powered by Pyodide",
    },
    javascript: {
      eyebrow: "JAVASCRIPT SYSTEMS · WORKBENCH",
      title: "JavaScript Workbench",
      desc: "Write, optimize, and run ES2024 algorithms in an isolated Web Worker.",
      badge: "JavaScript · ES2024",
      filename: "main.js",
      tag: "JavaScript ES2024",
      engine: "Engine: Web Worker Sandbox · Code is limited to 32 KB, output to 64 KB, run to 10 seconds. DOM and network access are restricted.",
      notice: "JavaScript runs in this browser tab inside an isolated Web Worker sandbox; KATALYST does not upload your code.",
      poweredBy: "Powered by Web Worker",
    },
    sql: {
      eyebrow: "RELATIONAL DATABASES · WORKBENCH",
      title: "SQL Query Workbench",
      desc: "Write and execute SQL queries against an in-memory SQLite database.",
      badge: "SQLite · WASM",
      filename: "query.sql",
      tag: "SQLite 3.45",
      engine: "Engine: SQLite WebAssembly (sql.js) · Pure in-memory SQLite engine running entirely in your browser. Queries never leave your machine.",
      notice: "SQLite 3.45 runs entirely inside your browser via SQLite WebAssembly (sql.js); KATALYST queries never leave your machine.",
      poweredBy: "Powered by SQLite WASM",
    },
    html: {
      eyebrow: "FRONTEND WEB · WORKBENCH",
      title: "HTML & CSS Sandbox",
      desc: "Design, structure, and style HTML5 & CSS3 with instantaneous live rendering.",
      badge: "HTML5 & CSS3 · Live Preview",
      filename: "index.html",
      tag: "HTML5 / CSS3",
      engine: "Engine: Browser Sandboxed Frame · Rendered client-side in an isolated iframe. No external server requests.",
      notice: "HTML5 & CSS3 live sandbox renders directly inside an isolated iframe in this browser; KATALYST does not upload your code.",
      poweredBy: "Powered by Browser Sandbox",
    },
    c: {
      eyebrow: "C PROGRAMMING · WORKBENCH",
      title: "C Workbench",
      desc: "Write, compile, and run C11 in your browser.",
      badge: "C · C11",
      filename: "main.c",
      tag: "C11",
      engine: "Compiler package: clang/clang · Code is limited to 12 KB, input to 2 KB, output to 64 KB, compilation to 15 seconds, and each run to 8 seconds. Network access is disabled.",
      notice:
        compilerState === "ready"
          ? "C11 is ready. Your code compiles to WebAssembly and runs in this browser tab; KATALYST does not upload it."
          : compilerState === "failed"
          ? "The C11 compiler could not be prepared. Your lesson is still available; retry setup when ready."
          : compilerState === "initializing"
          ? "The C11 compiler is preparing in the background. You can read and edit while it initializes; Run becomes available when setup finishes."
          : "The C11 compiler is ready. Click Run to prepare and execute your code in this browser.",
      poweredBy: "Powered by Wasmer",
    },
  }[activeLanguage === "circuit" ? "c" : activeLanguage];

  return (
    <section
      className={`c-playground${compact ? " c-playground-compact" : ""}`}
      aria-labelledby="c-playground-title"
      data-compiler-state={activeLanguage === "c" ? compilerState : "ready"}
    >
      {!compact && (
        <div className="playground-runtime-bar" role="tablist" aria-label="Execution Runtimes">
          <button
            type="button"
            role="tab"
            aria-selected={playgroundMode === "code" && activeLanguage === "c"}
            className={`runtime-tab${playgroundMode === "code" && activeLanguage === "c" ? " active" : ""}`}
            onClick={() => switchLanguage("c")}
          >
            <Code2 size={14} />
            <span>C (C11)</span>
            <span className="runtime-badge badge-wasm">WebAssembly</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={playgroundMode === "code" && activeLanguage === "python"}
            className={`runtime-tab${playgroundMode === "code" && activeLanguage === "python" ? " active" : ""}`}
            onClick={() => switchLanguage("python")}
          >
            <Code2 size={14} />
            <span>Python (3.12)</span>
            <span className="runtime-badge badge-wasm">WebAssembly</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={playgroundMode === "code" && activeLanguage === "javascript"}
            className={`runtime-tab${playgroundMode === "code" && activeLanguage === "javascript" ? " active" : ""}`}
            onClick={() => switchLanguage("javascript")}
          >
            <Code2 size={14} />
            <span>JavaScript (ES2024)</span>
            <span className="runtime-badge badge-wasm">Web Worker</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={playgroundMode === "code" && activeLanguage === "sql"}
            className={`runtime-tab${playgroundMode === "code" && activeLanguage === "sql" ? " active" : ""}`}
            onClick={() => switchLanguage("sql")}
          >
            <Database size={14} />
            <span>SQL (WASM)</span>
            <span className="runtime-badge badge-wasm">SQLite WASM</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={playgroundMode === "code" && activeLanguage === "html"}
            className={`runtime-tab${playgroundMode === "code" && activeLanguage === "html" ? " active" : ""}`}
            onClick={() => switchLanguage("html")}
          >
            <Globe size={14} />
            <span>HTML &amp; CSS</span>
            <span className="runtime-badge badge-wasm">Live Preview</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={playgroundMode === "circuits"}
            className={`runtime-tab${playgroundMode === "circuits" ? " active" : ""}`}
            onClick={() => switchLanguage("circuit")}
          >
            <Cpu size={14} />
            <span>Circuit Simulator</span>
            <span className="runtime-badge badge-wasm">Interactive</span>
          </button>
        </div>
      )}

      {playgroundMode === "circuits" ? (
        <div className="mt-4">
          <SimulatorErrorBoundary fallbackTitle="Circuit Simulator Encountered an Error">
            <CircuitSimulator />
          </SimulatorErrorBoundary>
        </div>
      ) : (
        <>
          {!compact ? (
            <header className="c-playground-heading">
          <div className="c-playground-heading-copy">
            <span className="eyebrow">{langDetails.eyebrow}</span>
            <h1 id="c-playground-title">{langDetails.title}</h1>
            <p>{langDetails.desc}</p>
          </div>
          <div className="c-playground-heading-meta">
            <span className="c-language-label">
              <Code2 size={14} /> {langDetails.badge}
            </span>
            {activeLesson && (
              <button className="learning-text-button" onClick={() => onReturnToLesson(activeLesson.lessonId)}>
                <ArrowLeft size={14} /> Return to {activeLesson.lessonTitle}
              </button>
            )}
          </div>
        </header>
      ) : (
        <h2 id="c-playground-title" className="sr-only">
          {langDetails.title}
        </h2>
      )}

      <div className="c-playground-notice">
        <span className="c-playground-status-dot" />
        <p>
          {langDetails.notice}{" "}
          {activeLanguage === "c" && "The runtime is cached in this browser."}
        </p>
        <span>{langDetails.poweredBy}</span>
      </div>
      {storageMessage && <p className="c-playground-storage" role="status">{storageMessage}</p>}

      <div className="c-playground-grid">
        <section className="c-editor-pane" aria-label={`${langDetails.tag} source editor`}>
          <div className="c-pane-heading">
            <div>
              <Code2 size={15} />
              <strong>{langDetails.filename}</strong>
              <span>{langDetails.tag}</span>
            </div>
            <div className="c-pane-actions">
              <span>
                {source.length.toLocaleString()} /{" "}
                {(activeLanguage === "python" ? PYTHON_PLAYGROUND_SOURCE_LIMIT : C_PLAYGROUND_SOURCE_LIMIT).toLocaleString()}
              </span>
              <button type="button" className="c-small-action" onClick={() => void copySource()}>
                <Copy size={13} />
                {copyLabel}
              </button>
            </div>
          </div>
          <label className="sr-only" htmlFor="c-playground-source">
            {`${langDetails.tag} source code`}
          </label>
          <div
            id="c-playground-source"
            ref={editorHostRef}
            className="c-source-editor-host"
            aria-describedby="c-playground-language"
          />
          <div className="c-editor-footer">
            <span id="c-playground-language">
              {`${langDetails.badge} · local draft`}
            </span>
            <button type="button" className="c-small-action" onClick={resetSource}>
              <RotateCcw size={13} />
              Reset example
            </button>
          </div>
        </section>

        {activeLanguage === "html" ? (
          <section className="c-output-pane flex flex-col" aria-label="HTML and CSS live preview">
            <div className="c-pane-heading">
              <div className="flex items-center gap-2">
                <Globe size={15} />
                <strong>Live Preview</strong>
                <span className="text-xs text-[var(--text-secondary)]">Sandbox</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-0.5">
                  <button
                    type="button"
                    className={`px-2 py-0.5 text-xs rounded transition-colors flex items-center gap-1 ${
                      previewMode === "desktop"
                        ? "bg-blue-600 text-white font-semibold"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                    onClick={() => setPreviewMode("desktop")}
                    title="Desktop Preview"
                  >
                    <Laptop size={12} /> Desktop
                  </button>
                  <button
                    type="button"
                    className={`px-2 py-0.5 text-xs rounded transition-colors flex items-center gap-1 ${
                      previewMode === "mobile"
                        ? "bg-blue-600 text-white font-semibold"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                    onClick={() => setPreviewMode("mobile")}
                    title="Mobile Preview (375px)"
                  >
                    <Smartphone size={12} /> Mobile
                  </button>
                </div>
                <button
                  type="button"
                  className="c-small-action"
                  onClick={() => {
                    setPreviewKey((k) => k + 1);
                    setStatus("HTML preview refreshed.");
                  }}
                  title="Refresh Preview"
                >
                  <RotateCw size={12} /> Refresh
                </button>
              </div>
            </div>
            <div className="p-3 bg-[var(--surface-primary)] flex justify-center items-start flex-1 min-h-[360px] overflow-auto">
              <iframe
                key={previewKey}
                sandbox="allow-scripts"
                srcDoc={source}
                title="HTML Live Sandbox Preview"
                style={{
                  width: previewMode === "mobile" ? "375px" : "100%",
                  minWidth: previewMode === "mobile" ? "375px" : undefined,
                  maxWidth: previewMode === "mobile" ? "375px" : "100%",
                  minHeight: "360px",
                  height: "100%",
                  background: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid var(--border-subtle)",
                  boxShadow: previewMode === "mobile" ? "0 4px 20px rgba(0,0,0,0.15)" : "none",
                }}
              />
            </div>
          </section>
        ) : (
          <section className="c-output-pane" aria-label="Program input and output">
            <div className="c-pane-heading">
              <div>
                <Terminal size={15} />
                <strong>Terminal</strong>
                <span>{activeLanguage === "c" ? compilerStatus : `${langDetails.tag} ready`}</span>
              </div>
              {stage === "idle" ? (
                <div className="c-run-actions">
                  {needsStdinConfirm && (
                    <button type="button" className="c-small-action c-run-eof-button" onClick={() => void runProgram(true)}>
                      Run with empty input (EOF)
                    </button>
                  )}
                  <button
                    type="button"
                    className="c-run-button"
                    onClick={() => void runProgram(false)}
                    disabled={activeLanguage === "c" && compilerState === "initializing"}
                  >
                    <Play size={14} />
                    {activeLanguage === "sql" ? "Execute SQL" : "Run code"}
                  </button>
                </div>
              ) : (
                <button type="button" className="c-stop-button" onClick={stopRun}>
                  <Square size={12} />
                  Stop
                </button>
              )}
            </div>
            {activeLanguage === "c" && compilerState === "initializing" && (
              <div className="c-compiler-progress" role="status">
                <LoaderCircle size={14} className="c-loading-icon" />
                <span>{downloadProgress || "Checking the browser cache and preparing C11…"}</span>
              </div>
            )}
            {activeLanguage === "c" && compilerState === "failed" && (
              <div className="c-compiler-failure" role="alert">
                <span>{error || "Compiler initialization failed."}</span>
                <button type="button" className="secondary-button" onClick={() => void ensureCompiler().catch(() => undefined)}>
                  Retry compiler setup
                </button>
              </div>
            )}
            <label className="c-stdin-label" htmlFor="c-playground-stdin">
              {activeLanguage === "sql" ? "Schema Setup & Input (Optional)" : "Program input"} <span>stdin · one line at a time</span>
              {expectsInput && <span className="c-stdin-hint">Input expected</span>}
            </label>
            <textarea
              id="c-playground-stdin"
              className={`c-stdin-editor${needsStdinConfirm ? " needs-input" : ""}`}
              value={stdin}
              onChange={(event) => updateStdin(event.target.value)}
              placeholder={activeLanguage === "sql" ? "Optional: Enter DDL/DML statements to execute before the main query." : "Enter values here when your program reads input."}
              maxLength={activeLanguage === "python" ? PYTHON_PLAYGROUND_STDIN_LIMIT : C_PLAYGROUND_STDIN_LIMIT}
              spellCheck={false}
            />
            <div className="c-console-heading">
              <span>Output</span>
              <span className={`c-run-status outcome-${outcome}`} role="status">
                {stage !== "idle" && <LoaderCircle size={13} className="c-loading-icon" />}
                {outcome === "success" && <Check size={13} />}
                {status}
              </span>
              <button
                type="button"
                className="c-small-action"
                onClick={clearOutput}
                disabled={stage !== "idle"}
                aria-label="Clear terminal output"
              >
                Clear output
              </button>
            </div>
            <div className="c-console-output" aria-live="polite" aria-label="Program output">
              <div className="c-output-stream">
                <span>stdout</span>
                <pre>{stdout || (stage === "idle" ? "Run the example to see its output here." : "Waiting for program output…")}</pre>
              </div>
              {stderr && (
                <div className="c-output-stream stderr">
                  <span>stderr</span>
                  <pre>{stderr}</pre>
                </div>
              )}
            </div>
            {diagnostics && (
              <details className="c-compiler-diagnostics" open={outcome === "compile-error"}>
                <summary>{outcome === "compile-error" ? "Compiler errors" : "Compiler messages"}</summary>
                <pre>{diagnostics}</pre>
              </details>
            )}
            {error && (activeLanguage !== "c" || compilerState !== "failed") && (
              <div className="c-playground-error" role="alert">
                {error}
              </div>
            )}
          </section>
        )}
      </div>
      <p className="c-playground-footnote">
        {langDetails.engine}
      </p>
        </>
      )}
    </section>
  );
}

// Backwards-compatible alias
export { CPlayground as Playground };
