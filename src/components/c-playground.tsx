"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Compartment, EditorState } from "@codemirror/state";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { cpp } from "@codemirror/lang-cpp";
import { bracketMatching, foldGutter, HighlightStyle, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { EditorView, highlightActiveLineGutter, keymap, lineNumbers } from "@codemirror/view";
import { ArrowLeft, ArrowRight, Check, Code2, Copy, Cpu, Database, Globe, Laptop, LayoutGrid, LoaderCircle, Play, RotateCcw, RotateCw, Smartphone, Sparkles, Square, Terminal } from "lucide-react";
import { CircuitSimulator, type CircuitSimulatorMode } from "@/components/simulators/circuit-simulator";
import { SimulatorErrorBoundary } from "@/components/simulators/simulator-error-boundary";
import { defaultCppProgram } from "@/lib/playground-templates";
export { defaultCppProgram } from "@/lib/playground-templates";
import {
  C_PLAYGROUND_SOURCE_LIMIT,
  C_PLAYGROUND_STDIN_LIMIT,
  C_PLAYGROUND_STORAGE_KEY,
  defaultCProgram,
  limitCPlaygroundRecord,
  normalizeStdin,
  programExpectsStdinC,
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

const C_RUN_FLAG_ENABLED = process.env.NEXT_PUBLIC_C_RUN_ENABLED !== "false";
const C_RUN_RUNTIME_AVAILABLE = true;
const C_RUN_ENABLED = C_RUN_FLAG_ENABLED && C_RUN_RUNTIME_AVAILABLE;
const C_RUN_UNAVAILABLE_MESSAGE = "C run is being upgraded, lesson is readable.";
const CPP_RUN_UNAVAILABLE_MESSAGE = "C++ compiler coming soon";
const NATIVE_RUN_UNAVAILABLE = (language: PlaygroundLanguage) =>
  language === "cpp" ? true : language === "c" && !C_RUN_ENABLED;

export type PlaygroundLanguage = "c" | "cpp" | "python" | "javascript" | "sql" | "html" | "circuit";
export type PlaygroundRuntimeSelection = {
  language: PlaygroundLanguage;
  mode: "code" | "circuits";
  circuitMode: CircuitSimulatorMode;
  launcherOpen: boolean;
};

export const CPP_PLAYGROUND_STORAGE_KEY = "katalyst.cpp.playground.v1";
export const JS_PLAYGROUND_STORAGE_KEY = "katalyst.js.playground.v1";
export const SQL_PLAYGROUND_STORAGE_KEY = "katalyst.sql.playground.v1";
export const HTML_PLAYGROUND_STORAGE_KEY = "katalyst.html.playground.v1";
export const CIRCUIT_PLAYGROUND_STORAGE_KEY = "katalyst.circuit.playground.v1";

const legacyDefaultCppProgram = `// C++17 browser workbench: templates and interactive standard input
#include <stdio.h>

template <typename T>
T doubleValue(T value) {
  return value + value;
}

int main() {
  int value = 0;
  printf("Enter an integer: ");
  if (scanf("%d", &value) != 1) return 1;
  printf("Twice: %d\\n", doubleValue(value));
  return 0;
}
`;

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
    .interaction-demo summary {
      display: inline-block;
      background: #2563eb;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      list-style: none;
    }
    .interaction-demo summary::-webkit-details-marker { display: none; }
    .interaction-demo summary:hover,
    .interaction-demo summary:focus-visible { background: #1d4ed8; }
    .interaction-demo p { margin: 12px 0 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>KATALYST Web Sandbox</h1>
    <p>Live, client-side HTML5 &amp; CSS3 preview. Edits in the editor appear here instantly.</p>
    <details class="interaction-demo">
      <summary>Test Interaction</summary>
      <p>Hello from KATALYST!</p>
    </details>
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
  initialSelection?: PlaygroundRuntimeSelection | null;
  onSelectionChange?: (selection: PlaygroundRuntimeSelection) => void;
  onActivityChange?: (activity: Activity) => void;
};

type RunStage = "idle" | "compiling" | "running";
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

function getPlaygroundStorageKey(lang: PlaygroundLanguage): string {
  switch (lang) {
    case "c":
      return C_PLAYGROUND_STORAGE_KEY;
    case "cpp":
      return CPP_PLAYGROUND_STORAGE_KEY;
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
    case "cpp":
      return defaultCppProgram;
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
    if (lang === "c" || lang === "cpp") {
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
  autoInitialize: _autoInitialize = false,
  compact = false,
  initialLanguage = "c",
  initialSelection = null,
  onSelectionChange,
  onActivityChange,
}: PlaygroundProps) {
  void _autoInitialize;
  const [activeLanguage, setActiveLanguage] = useState<PlaygroundLanguage>(initialSelection?.language ?? initialLanguage);
  const [playgroundMode, setPlaygroundMode] = useState<"code" | "circuits">(
    initialSelection?.mode ?? (initialLanguage === "circuit" ? "circuits" : "code")
  );
  const [circuitInitialMode, setCircuitInitialMode] = useState<CircuitSimulatorMode>(initialSelection?.circuitMode ?? "digital");
  const [isLauncherOpen, setIsLauncherOpen] = useState<boolean>(initialSelection?.launcherOpen ?? (!pendingExample && !compact));
  const [outputOpen, setOutputOpen] = useState(compact);
  const [source, setSource] = useState(getDefaultProgramForLang(initialSelection?.language ?? initialLanguage));
  const sourceRef = useRef(source);
  useEffect(() => {
    sourceRef.current = source;
  }, [source]);
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
  const [activeLesson, setActiveLesson] = useState<Pick<PendingExample, "lessonId" | "lessonTitle"> | null>(null);
  const [needsStdinConfirm, setNeedsStdinConfirm] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [previewKey, setPreviewKey] = useState(0);

  const editorHostRef = useRef<HTMLDivElement>(null);
  const terminalOutputRef = useRef<HTMLDivElement>(null);
  const ideRunRef = useRef<(forceEmptyStdin?: boolean) => Promise<void>>(async () => undefined);
  const ideStopRef = useRef<() => void>(() => undefined);
  const editorViewRef = useRef<EditorView | null>(null);
  const [languageCompartment] = useState(() => new Compartment());
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);
  const handledExampleRef = useRef(0);
  const isSwitchingRef = useRef(false);

  useEffect(() => {
    const terminal = terminalOutputRef.current;
    if (!terminal) return;
    const wasNearBottom = terminal.scrollHeight - terminal.scrollTop - terminal.clientHeight < 48;
    if (wasNearBottom) terminal.scrollTop = terminal.scrollHeight;
  }, [stdout, stderr]);

  // Initialize drafts from localStorage
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = readDraftForLang(activeLanguage);
        if (saved) {
          const migrateCppStarter = activeLanguage === "cpp" && saved.source === legacyDefaultCppProgram;
          const savedSource = migrateCppStarter ? defaultCppProgram : saved.source;
          setSource(savedSource);
          setStdin(saved.stdin);
          if (migrateCppStarter) saveDraftForLang("cpp", savedSource, saved.stdin);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLauncherOpen(false);
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
    if (isLauncherOpen) return;
    const host = editorHostRef.current;
    if (!host || editorViewRef.current) return;
    const initialDoc = sourceRef.current || (activeLanguage === "python" ? defaultPythonProgram : defaultCProgram);
    const editor = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: initialDoc,
        extensions: [
          EditorView.cspNonce.of(document.querySelector<HTMLScriptElement>("script[nonce]")?.nonce ?? ""),
          lineNumbers(),
          highlightActiveLineGutter(),
          foldGutter(),
          languageCompartment.of(activeLanguage === "python" ? pythonStreamParser : cpp()),
          indentOnInput(),
          bracketMatching(),
          syntaxHighlighting(cSyntaxHighlight),
          keymap.of([...defaultKeymap, indentWithTab]),
          EditorView.contentAttributes.of({
            "aria-label": activeLanguage === "c"
              ? "C source code"
              : activeLanguage === "cpp"
                ? "C++ source code"
                : activeLanguage === "python"
                  ? "Python source code"
                  : activeLanguage === "javascript"
                    ? "JavaScript source code"
                    : activeLanguage === "sql"
                      ? "SQL query source code"
                      : activeLanguage === "html"
                        ? "HTML source code"
                        : "Program source code",
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
  }, [activeLanguage, isLauncherOpen, languageCompartment]);

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

  // Stop local browser executions when this workbench unmounts.
  useEffect(() => () => {
    runIdRef.current += 1;
    abortRef.current?.abort(new DOMException("Run stopped.", "AbortError"));
  }, []);

  const switchLanguage = (targetLang: PlaygroundLanguage, circuitMode?: CircuitSimulatorMode) => {
    setIsLauncherOpen(false);
    if (!compact) setOutputOpen(false);
    const nextCircuitMode = circuitMode ?? circuitInitialMode;
    onSelectionChange?.({
      language: targetLang,
      mode: targetLang === "circuit" ? "circuits" : "code",
      circuitMode: nextCircuitMode,
      launcherOpen: false,
    });
    if (circuitMode) {
      setCircuitInitialMode(circuitMode);
    }
    if (targetLang === activeLanguage) {
      if (targetLang === "circuit") {
        setPlaygroundMode("circuits");
      } else {
        setPlaygroundMode("code");
      }
      return;
    }
    // 1. Save current language draft
    saveCurrentDraft(activeLanguage, source, stdin);

    isSwitchingRef.current = true;
    try {
      setActiveLanguage(targetLang);
      if (targetLang === "circuit") {
        setPlaygroundMode("circuits");
        setNeedsStdinConfirm(false);
        setStatus("Hardware & Circuit Simulator ready.");
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
      } else if (targetLang === "cpp") {
        setStatus(CPP_RUN_UNAVAILABLE_MESSAGE);
      } else if (targetLang === "c") {
        setStatus(C_RUN_ENABLED ? "Clang WebAssembly compiler ready." : C_RUN_UNAVAILABLE_MESSAGE);
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

  const stopRun = useCallback(() => {
    runIdRef.current += 1;
    abortRef.current?.abort(new DOMException("Run stopped.", "AbortError"));
    abortRef.current = null;
    setStage("idle");
    setOutcome("none");
    setStatus("Run stopped.");
  }, []);

  const runProgram = useCallback(async (forceEmptyStdin = false) => {
    if (NATIVE_RUN_UNAVAILABLE(activeLanguage)) {
      setOutputOpen(true);
      const msg = activeLanguage === "cpp" ? CPP_RUN_UNAVAILABLE_MESSAGE : C_RUN_UNAVAILABLE_MESSAGE;
      setError(msg);
      setStatus(msg);
      return;
    }
    if (stage !== "idle") return;

    setOutputOpen(true);

    const expectsInput =
      (activeLanguage === "python" && programExpectsStdinPython(source)) ||
      (activeLanguage === "c" && programExpectsStdinC(source));

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

    if (!forceEmptyStdin && expectsInput && !stdin.trim() && (activeLanguage === "python" || activeLanguage === "c")) {
      setNeedsStdinConfirm(true);
      setError(
        activeLanguage === "c"
          ? "This program reads standard input (scanf/getchar/fgets), but no input was provided in the Standard input box above. Enter your values or click “Run with empty input (EOF)”."
          : "This program reads standard input (input()), but no input was provided in the Standard input box above. Enter your values or click “Run with empty input (EOF)”."
      );
      setStatus("Input required before running.");
      return;
    }
    setNeedsStdinConfirm(false);

    // C, Python, JavaScript, and SQL execution via unified executeProgram
    if (activeLanguage === "c" || activeLanguage === "python" || activeLanguage === "javascript" || activeLanguage === "sql") {
      const runId = ++runIdRef.current;
      const controller = new AbortController();
      abortRef.current = controller;
      const isCurrent = () => runIdRef.current === runId;

      setStage("running");
      setOutcome("none");
      setStatus(
        activeLanguage === "c"
          ? "Compiling and running C program in WebAssembly…"
          : activeLanguage === "sql"
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
          activeLanguage === "c"
            ? "main.c"
            : activeLanguage === "sql"
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
            compileTimeoutMs: 20_000,
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
        if (result.diagnostics) {
          setDiagnostics(result.diagnostics);
        }

        let fullOutput = [result.stdout, result.stderr && `stderr:\n${result.stderr}`, noOutputMessage].filter(Boolean).join("\n");
        if (result.artifacts && result.artifacts.length > 0) {
          const filesSummary = result.artifacts.map((a) => `[In-memory file: ${a.path} (${a.content.length} bytes)]`).join("\n");
          fullOutput = fullOutput ? `${fullOutput}\n\n${filesSummary}` : filesSummary;
        }
        setOutput(fullOutput);

        if (result.ok) {
          setOutcome("success");
          setStatus(`Execution completed in ${result.executionTimeMs} ms in local sandbox.`);
        } else {
          const timedOut = result.stage === "timeout" || result.error?.includes("timeout");
          const isCompile = result.stage === "compile";
          setOutcome(timedOut ? "timeout" : isCompile ? "compile-error" : "runtime-error");
          setError(result.stderr || result.error || `Execution failed with status ${result.exitCode}.`);
          setStatus(timedOut ? "Execution timed out." : isCompile ? "Compilation failed." : `Execution finished with an error.`);
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

  }, [activeLanguage, source, stage, stdin]);

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

  const isCOrCpp = activeLanguage === "c" || activeLanguage === "cpp";
  const nativeRunUnavailable = NATIVE_RUN_UNAVAILABLE(activeLanguage);
  const compilerStatus = nativeRunUnavailable
    ? activeLanguage === "cpp"
      ? "C++ run unavailable"
      : "C run unavailable"
    : "Ready";
  const isStandaloneIde = !compact && !isLauncherOpen;
  const ideStatus = nativeRunUnavailable ? "Run unavailable" : stage === "running" ? "Running…" : status;

  useEffect(() => {
    ideRunRef.current = runProgram;
    ideStopRef.current = stopRun;
  }, [runProgram, stopRun]);

  useEffect(() => {
    if (!isStandaloneIde) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key !== "Enter") return;
      event.preventDefault();
      if (stage !== "idle") ideStopRef.current();
      else void ideRunRef.current(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isStandaloneIde, stage]);

  const expectsInput =
    (activeLanguage === "python" && programExpectsStdinPython(source)) ||
    (activeLanguage === "c" && programExpectsStdinC(source));
  const stdinDescription = activeLanguage === "python"
    ? "Each input() call reads the next line. Enter responses in order, one per line."
    : activeLanguage === "sql"
      ? "Optional SQL setup statements run before the selected query."
      : activeLanguage === "c"
      ? "Enter standard input lines for scanf, getchar, or fgets before running; lines are read sequentially."
      : "Enter any standard input your program reads before running; values are passed in order, one line at a time.";
  const stdinPlaceholder = activeLanguage === "sql"
    ? "Optional: CREATE TABLE or INSERT statements to run before the query."
    : activeLanguage === "python"
      ? "First input() response\nSecond input() response"
      : activeLanguage === "c"
      ? "e.g. 42 or first input line\nsecond input line"
      : "Enter standard input values here, one per line.";
  const showStdinGuidance = expectsInput || activeLanguage === "sql" || (activeLanguage === "c" && Boolean(stdin.trim()));
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
      desc: C_RUN_ENABLED
        ? "Compile and run C11 code directly in your browser via WebAssembly."
        : "Edit C11 lesson examples in your browser. Running is being upgraded.",
      badge: "C · C11",
      filename: "main.c",
      tag: "C11",
      engine: C_RUN_ENABLED
        ? "Engine: Clang & LLD WebAssembly · In-browser compiler & WASI sandbox. Memory capped to 32 MB, run capped to 10s. Temporary in-memory virtual filesystem."
        : C_RUN_UNAVAILABLE_MESSAGE,
      notice: C_RUN_ENABLED
        ? "C11 compiles and runs in this browser tab via Clang WebAssembly; KATALYST does not upload your code. File operations use an in-memory virtual filesystem."
        : C_RUN_UNAVAILABLE_MESSAGE,
      poweredBy: C_RUN_ENABLED ? "Powered by Clang WebAssembly" : "C execution paused",
    },
    cpp: {
      eyebrow: "C++ SYSTEMS · WORKBENCH",
      title: "C++17 Workbench",
      desc: "Edit C++17 lesson examples in your browser. Running is being upgraded.",
      badge: "C++ · C++17",
      filename: "main.cpp",
      tag: "C++17",
      engine: CPP_RUN_UNAVAILABLE_MESSAGE,
      notice: CPP_RUN_UNAVAILABLE_MESSAGE,
      poweredBy: "C/C++ execution paused",
    },
  }[activeLanguage === "circuit" ? "c" : activeLanguage];

  return (
    <section
      className={`c-playground${compact ? " c-playground-compact" : ""}${isStandaloneIde && !outputOpen ? " ide-output-closed" : ""}`}
      aria-labelledby="c-playground-title"
      data-compiler-state={nativeRunUnavailable ? "disabled" : "ready"}
    >
      {!compact && !isLauncherOpen && (
        <div className="playground-runtime-header" role="region" aria-label="Runtime Controls">
          <div className="runtime-header-left">
            <button
              type="button"
              className="all-labs-btn switch-runtime-btn"
              onClick={() => {
                setIsLauncherOpen(true);
                onSelectionChange?.({ language: activeLanguage, mode: playgroundMode, circuitMode: circuitInitialMode, launcherOpen: true });
              }}
              title="Return to All Labs & Runtimes Grid"
            >
              <LayoutGrid size={14} />
              <span>All Labs</span>
            </button>
            <span className="runtime-header-divider">/</span>
            <span className="runtime-header-title">
              {playgroundMode === "circuits"
                ? circuitInitialMode === "arduino"
                  ? "Arduino Uno Lab (ATmega328P)"
                  : circuitInitialMode === "esp32"
                  ? "ESP32 IoT Lab (Dual-Core)"
                  : circuitInitialMode === "breadboard"
                  ? "Breadboard Circuit Lab"
                  : circuitInitialMode === "kmap"
                  ? "K-Map Minimizer"
                  : circuitInitialMode === "fsm"
                  ? "FSM State Machine"
                  : circuitInitialMode === "toycpu"
                  ? "8-Bit Simple CPU"
                  : circuitInitialMode === "analog"
                  ? "Analog Circuits & EEE"
                  : "Digital Logic Gates"
                : langDetails.title}
            </span>
            <span className="runtime-badge badge-wasm">
              {playgroundMode === "circuits"
                ? "Simulator"
                : activeLanguage === "javascript"
                ? "Web Worker"
                : activeLanguage === "html"
                ? "Live Preview"
                : activeLanguage === "c" || activeLanguage === "cpp"
                  ? "Run upgrading"
                : "WebAssembly"}
            </span>
          </div>

          <div className="runtime-header-right">
            <label htmlFor="runtime-switcher-select" className="sr-only">Switch Runtime or Lab</label>
            <select
              id="runtime-switcher-select"
              className="runtime-select-switcher"
              disabled={stage !== "idle"}
              value={playgroundMode === "circuits" ? `circuit:${circuitInitialMode}` : `code:${activeLanguage}`}
              onChange={(e) => {
                const val = e.target.value;
                if (val.startsWith("circuit:")) {
                  const m = val.split(":")[1] as CircuitSimulatorMode;
                  switchLanguage("circuit", m);
                } else if (val.startsWith("code:")) {
                  const lang = val.split(":")[1] as PlaygroundLanguage;
                  switchLanguage(lang);
                }
              }}
            >
              <optgroup label="Programming Runtimes">
                <option value="code:c">C (C11 editor)</option>
                <option value="code:python">Python (3.12 · WASM)</option>
                <option value="code:javascript">JavaScript (ES2024)</option>
                <option value="code:sql">SQL (SQLite WASM)</option>
                <option value="code:html">HTML &amp; CSS Sandbox</option>
                <option value="code:cpp">C++ (C++17 editor · Coming soon)</option>
              </optgroup>
              <optgroup label="Hardware Labs &amp; Simulators">
                <option value="circuit:arduino">Arduino Uno Lab</option>
                <option value="circuit:esp32">ESP32 IoT Lab</option>
                <option value="circuit:breadboard">Breadboard Circuit Lab</option>
                <option value="circuit:digital">Digital Logic Gates</option>
                <option value="circuit:kmap">K-Map Minimizer</option>
                <option value="circuit:fsm">FSM State Machine</option>
                <option value="circuit:toycpu">8-Bit Simple CPU</option>
                <option value="circuit:analog">Analog Circuits &amp; EEE</option>
              </optgroup>
            </select>
            <span className="ide-file-status" title={status}>
              <code>{playgroundMode === "circuits" ? "simulator" : langDetails.filename}</code>
              <span className={`ide-status-indicator ${stage !== "idle" ? "active" : ""}`}>{ideStatus}</span>
            </span>
            {playgroundMode === "code" && <>
              {stage === "idle" ? <button type="button" className="ide-action ide-run" onClick={() => void runProgram(false)} disabled={nativeRunUnavailable} title={nativeRunUnavailable ? (activeLanguage === "cpp" ? CPP_RUN_UNAVAILABLE_MESSAGE : C_RUN_UNAVAILABLE_MESSAGE) : "Run (Ctrl+Enter)"}><Play size={13} /><span>{nativeRunUnavailable ? "Unavailable" : "Run"}</span></button> : <button type="button" className="ide-action ide-stop" onClick={stopRun}><Square size={12} /><span>Stop</span></button>}
              <button type="button" className="ide-action" onClick={resetSource} disabled={stage !== "idle"} title="Reset starter file"><RotateCcw size={13} /><span className="ide-action-label">Reset</span></button>
              <button type="button" className="ide-action" onClick={() => void copySource()} title="Copy source"><Copy size={13} /><span className="ide-action-label">Copy</span></button>
              <button type="button" className="ide-action" onClick={() => setOutputOpen((open) => !open)} aria-label={outputOpen ? "Hide output" : "Output"} aria-expanded={outputOpen} aria-controls="playground-output-panel"><Terminal size={13} /><span className="ide-action-label">{outputOpen ? "Hide output" : "Output"}</span></button>
            </>}
          </div>
        </div>
      )}

      {isLauncherOpen && !compact ? (
        <div className="playground-launcher-view">
          <header className="playground-launcher-header">
            <span className="eyebrow">
              <Sparkles size={13} className="text-blue-500" /> EXECUTION ENVIRONMENTS · CLIENT-SIDE ISOLATION
            </span>
            <h1 id="c-playground-title">Runtime &amp; Lab Launcher</h1>
            <p>
              Choose a local execution environment or simulation workbench. Every compiler, interpreter, and hardware model runs 100% client-side in your browser with zero data egress.
            </p>
          </header>

          <div className="playground-launcher-grid">
            <div
              className="launcher-card"
              role="button"
              tabIndex={0}
              onClick={() => switchLanguage("c")}
              onKeyDown={(e) => e.key === "Enter" && switchLanguage("c")}
            >
              <div className="launcher-card-top">
                <div className="launcher-card-icon-row">
                  <div className="launcher-icon-box text-blue-500">
                    <Code2 size={20} />
                  </div>
                  <span className="runtime-badge badge-wasm">WebAssembly · Clang</span>
                </div>
                <h3>C (C11 · WebAssembly)</h3>
                <p>
                  Compile and execute ISO C11 code client-side via clang WebAssembly with real standard I/O (stdin/stdout/stderr), diagnostics, and deterministic memory limits.
                </p>
              </div>
              <div className="launcher-card-action">
                <span>Launch C Workbench</span>
                <ArrowRight size={14} />
              </div>
            </div>

            <div
              className="launcher-card"
              role="button"
              tabIndex={0}
              onClick={() => switchLanguage("python")}
              onKeyDown={(e) => e.key === "Enter" && switchLanguage("python")}
            >
              <div className="launcher-card-top">
                <div className="launcher-card-icon-row">
                  <div className="launcher-icon-box text-emerald-500">
                    <Code2 size={20} />
                  </div>
                  <span className="runtime-badge badge-wasm">WebAssembly · Pyodide</span>
                </div>
                <h3>Python (3.12 · WebAssembly)</h3>
                <p>
                  Run modern Python 3.12 scripts in browser WebAssembly via Pyodide. Supports standard algorithms, interactive input, and Python runtime diagnostics.
                </p>
              </div>
              <div className="launcher-card-action">
                <span>Launch Python Workbench</span>
                <ArrowRight size={14} />
              </div>
            </div>

            <div
              className="launcher-card"
              role="button"
              tabIndex={0}
              onClick={() => switchLanguage("javascript")}
              onKeyDown={(e) => e.key === "Enter" && switchLanguage("javascript")}
            >
              <div className="launcher-card-top">
                <div className="launcher-card-icon-row">
                  <div className="launcher-icon-box text-amber-500">
                    <Code2 size={20} />
                  </div>
                  <span className="runtime-badge badge-wasm">Isolated Web Worker</span>
                </div>
                <h3>JavaScript (ES2024 · Worker)</h3>
                <p>
                  Benchmark algorithms, async pipelines, and modern ECMAScript features inside a sandboxed Web Worker isolated from the main thread.
                </p>
              </div>
              <div className="launcher-card-action">
                <span>Launch JS Workbench</span>
                <ArrowRight size={14} />
              </div>
            </div>

            <div
              className="launcher-card"
              role="button"
              tabIndex={0}
              onClick={() => switchLanguage("sql")}
              onKeyDown={(e) => e.key === "Enter" && switchLanguage("sql")}
            >
              <div className="launcher-card-top">
                <div className="launcher-card-icon-row">
                  <div className="launcher-icon-box text-cyan-500">
                    <Database size={20} />
                  </div>
                  <span className="runtime-badge badge-wasm">SQLite WASM · sql.js</span>
                </div>
                <h3>SQL (SQLite · WebAssembly)</h3>
                <p>
                  Design relational schemas, populate in-memory database tables, and run multi-table joins and analytical queries with live tabular output.
                </p>
              </div>
              <div className="launcher-card-action">
                <span>Launch SQL Workbench</span>
                <ArrowRight size={14} />
              </div>
            </div>

            <div
              className="launcher-card"
              role="button"
              tabIndex={0}
              onClick={() => switchLanguage("html")}
              onKeyDown={(e) => e.key === "Enter" && switchLanguage("html")}
            >
              <div className="launcher-card-top">
                <div className="launcher-card-icon-row">
                  <div className="launcher-icon-box text-purple-500">
                    <Globe size={20} />
                  </div>
                  <span className="runtime-badge badge-wasm">Live Isolated Iframe</span>
                </div>
                <h3>HTML &amp; CSS (Live Sandbox)</h3>
                <p>
                  Frontend web playground featuring instantaneous client-side rendering, desktop and mobile responsive viewport toggles, and live DOM interaction.
                </p>
              </div>
              <div className="launcher-card-action">
                <span>Launch Web Sandbox</span>
                <ArrowRight size={14} />
              </div>
            </div>

            <div
              className="launcher-card"
              role="button"
              tabIndex={0}
              onClick={() => switchLanguage("cpp")}
              onKeyDown={(e) => e.key === "Enter" && switchLanguage("cpp")}
            >
              <div className="launcher-card-top">
                <div className="launcher-card-icon-row">
                  <div className="launcher-icon-box text-indigo-500">
                    <Code2 size={20} />
                  </div>
                  <span className="runtime-badge badge-wasm">Coming soon</span>
                </div>
                <h3>C++ (C++17 · Coming soon)</h3>
                <p>
                  Practice C++17 language features, templates, and systems concepts. Full lessons are readable; in-browser C++ compiler coming soon.
                </p>
              </div>
              <div className="launcher-card-action">
                <span>Preview C++ Workbench</span>
                <ArrowRight size={14} />
              </div>
            </div>

            <div
              className="launcher-card"
              role="button"
              tabIndex={0}
              onClick={() => switchLanguage("circuit", "arduino")}
              onKeyDown={(e) => e.key === "Enter" && switchLanguage("circuit", "arduino")}
            >
              <div className="launcher-card-top">
                <div className="launcher-card-icon-row">
                  <div className="launcher-icon-box text-blue-500">
                    <Cpu size={20} />
                  </div>
                  <span className="runtime-badge badge-wasm">Arduino 5V · 10-bit ADC</span>
                </div>
                <h3>Arduino Uno Lab</h3>
                <p>
                  Interactive ATmega328P microcontroller simulation with digital I/O pins, 10-bit ADC channels, PWM duty cycles, and real-time generated C++ firmware.
                </p>
              </div>
              <div className="launcher-card-action">
                <span>Launch Arduino Lab</span>
                <ArrowRight size={14} />
              </div>
            </div>

            <div
              className="launcher-card"
              role="button"
              tabIndex={0}
              onClick={() => switchLanguage("circuit", "esp32")}
              onKeyDown={(e) => e.key === "Enter" && switchLanguage("circuit", "esp32")}
            >
              <div className="launcher-card-top">
                <div className="launcher-card-icon-row">
                  <div className="launcher-icon-box text-teal-500">
                    <Cpu size={20} />
                  </div>
                  <span className="runtime-badge badge-wasm">ESP32 3.3V · 12-bit ADC</span>
                </div>
                <h3>ESP32 IoT Lab</h3>
                <p>
                  Explore 3.3 V GPIO safety, ADC input, boot strapping pins, and generated Arduino-style firmware. Radio networking and physical board I/O are not executed.
                </p>
              </div>
              <div className="launcher-card-action">
                <span>Launch ESP32 Lab</span>
                <ArrowRight size={14} />
              </div>
            </div>

            <div
              className="launcher-card"
              role="button"
              tabIndex={0}
              onClick={() => switchLanguage("circuit", "breadboard")}
              onKeyDown={(e) => e.key === "Enter" && switchLanguage("circuit", "breadboard")}
            >
              <div className="launcher-card-top">
                <div className="launcher-card-icon-row">
                  <div className="launcher-icon-box text-amber-500">
                    <Cpu size={20} />
                  </div>
                  <span className="runtime-badge badge-wasm">Solderless Prototyping</span>
                </div>
                <h3>Breadboard Circuit Lab</h3>
                <p>
                  Solderless breadboard wiring workbench with dual power rails, current-limiting LEDs, tactile pushbuttons with pull-up networks, and digital multimeter probe testing.
                </p>
              </div>
              <div className="launcher-card-action">
                <span>Launch Breadboard Lab</span>
                <ArrowRight size={14} />
              </div>
            </div>

            <div
              className="launcher-card"
              role="button"
              tabIndex={0}
              onClick={() => switchLanguage("circuit", "digital")}
              onKeyDown={(e) => e.key === "Enter" && switchLanguage("circuit", "digital")}
            >
              <div className="launcher-card-top">
                <div className="launcher-card-icon-row">
                  <div className="launcher-icon-box text-rose-500">
                    <Cpu size={20} />
                  </div>
                  <span className="runtime-badge badge-wasm">Combinational Logic</span>
                </div>
                <h3>Digital Logic Gates</h3>
                <p>
                  Construct combinational logic circuits using AND, OR, NOT, NAND, NOR, and XOR gates with interactive inputs and automated truth table verification.
                </p>
              </div>
              <div className="launcher-card-action">
                <span>Launch Logic Lab</span>
                <ArrowRight size={14} />
              </div>
            </div>

            <div
              className="launcher-card"
              role="button"
              tabIndex={0}
              onClick={() => switchLanguage("circuit", "kmap")}
              onKeyDown={(e) => e.key === "Enter" && switchLanguage("circuit", "kmap")}
            >
              <div className="launcher-card-top">
                <div className="launcher-card-icon-row">
                  <div className="launcher-icon-box text-indigo-500">
                    <Cpu size={20} />
                  </div>
                  <span className="runtime-badge badge-wasm">SOP Minimization</span>
                </div>
                <h3>K-Map Minimizer</h3>
                <p>
                  Interactive 2, 3, and 4-variable Gray code Karnaugh maps, prime implicant reduction, and minimal SOP derivation.
                </p>
              </div>
              <div className="launcher-card-action">
                <span>Launch K-Map Solver</span>
                <ArrowRight size={14} />
              </div>
            </div>

            <div
              className="launcher-card"
              role="button"
              tabIndex={0}
              onClick={() => switchLanguage("circuit", "fsm")}
              onKeyDown={(e) => e.key === "Enter" && switchLanguage("circuit", "fsm")}
            >
              <div className="launcher-card-top">
                <div className="launcher-card-icon-row">
                  <div className="launcher-icon-box text-cyan-500">
                    <Cpu size={20} />
                  </div>
                  <span className="runtime-badge badge-wasm">Sequential Logic</span>
                </div>
                <h3>FSM State Machine</h3>
                <p>
                  Model Mealy and Moore finite state machines with live state graph nodes, clock pulse stepping, and transition table logs.
                </p>
              </div>
              <div className="launcher-card-action">
                <span>Launch FSM Designer</span>
                <ArrowRight size={14} />
              </div>
            </div>

            <div
              className="launcher-card"
              role="button"
              tabIndex={0}
              onClick={() => switchLanguage("circuit", "toycpu")}
              onKeyDown={(e) => e.key === "Enter" && switchLanguage("circuit", "toycpu")}
            >
              <div className="launcher-card-top">
                <div className="launcher-card-icon-row">
                  <div className="launcher-icon-box text-amber-500">
                    <Cpu size={20} />
                  </div>
                  <span className="runtime-badge badge-wasm">SAP-1 Architecture</span>
                </div>
                <h3>8-Bit Simple CPU</h3>
                <p>
                  Trace 8-bit registers, 16-byte RAM, micro-instruction clock cycles (T1–T6), and ALU arithmetic instruction execution.
                </p>
              </div>
              <div className="launcher-card-action">
                <span>Launch CPU Simulator</span>
                <ArrowRight size={14} />
              </div>
            </div>

            <div
              className="launcher-card"
              role="button"
              tabIndex={0}
              onClick={() => switchLanguage("circuit", "analog")}
              onKeyDown={(e) => e.key === "Enter" && switchLanguage("circuit", "analog")}
            >
              <div className="launcher-card-top">
                <div className="launcher-card-icon-row">
                  <div className="launcher-icon-box text-emerald-500">
                    <Cpu size={20} />
                  </div>
                  <span className="runtime-badge badge-wasm">Analog &amp; Network</span>
                </div>
                <h3>Analog &amp; EEE Studio</h3>
                <p>
                  Solve Kirchhoff 2-mesh loops, Thevenin equivalents, RLC resonance ringing, Op-Amp stages, and dual-trace oscilloscope waveforms.
                </p>
              </div>
              <div className="launcher-card-action">
                <span>Launch Analog Studio</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </div>
        </div>
      ) : playgroundMode === "circuits" ? (
        <div className="mt-4">
          <SimulatorErrorBoundary fallbackTitle="Circuit Simulator Encountered an Error">
            <CircuitSimulator key={circuitInitialMode} initialMode={circuitInitialMode} hideModeSwitcher={true} />
          </SimulatorErrorBoundary>
        </div>
      ) : (
        <>
          {!compact ? (
            <header className={`c-playground-heading${isStandaloneIde ? " ide-hidden-heading" : ""}`}>
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

      <div className={`c-playground-notice${isStandaloneIde ? " ide-hidden-heading" : ""}`}>
        <span className="c-playground-status-dot" />
        <p>
          {langDetails.notice}{" "}
        </p>
        <span>{langDetails.poweredBy}</span>
      </div>
      {nativeRunUnavailable && <div className="c-run-upgrade-message" role="status">{activeLanguage === "cpp" ? CPP_RUN_UNAVAILABLE_MESSAGE : C_RUN_UNAVAILABLE_MESSAGE}</div>}
      {storageMessage && <p className={`c-playground-storage${isStandaloneIde ? " ide-hidden-heading" : ""}`} role="status">{storageMessage}</p>}

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
            {`${activeLanguage === "c" ? "C" : langDetails.tag} source code`}
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
          <section className="c-output-pane flex flex-col" id="playground-output-panel" aria-label="HTML and CSS live preview" aria-hidden={isStandaloneIde && !outputOpen}>
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
                className={`c-html-preview-frame ${previewMode === "mobile" ? "c-html-preview-frame--mobile" : "c-html-preview-frame--desktop"}`}
              />
            </div>
          </section>
        ) : (
          <section className="c-output-pane" id="playground-output-panel" aria-label="Program input and output" aria-hidden={isStandaloneIde && !outputOpen}>
            <div className="c-pane-heading">
              <div>
                <Terminal size={15} />
                <strong>Terminal</strong>
                <span>{isCOrCpp ? compilerStatus : `${langDetails.tag} ready`}</span>
              </div>
              {stage === "idle" ? (
                <div className="c-run-actions">
                  {needsStdinConfirm && (
                    <button type="button" className="c-small-action c-run-eof-button" onClick={() => void runProgram(true)} disabled={nativeRunUnavailable}>
                      Run with empty input (EOF)
                    </button>
                  )}
                  <button
                    type="button"
                    className={`c-run-button${nativeRunUnavailable ? " c-run-upgrading" : ""}`}
                    onClick={() => void runProgram(false)}
                    disabled={nativeRunUnavailable}
                    title={nativeRunUnavailable ? (activeLanguage === "cpp" ? CPP_RUN_UNAVAILABLE_MESSAGE : C_RUN_UNAVAILABLE_MESSAGE) : undefined}
                  >
                    <Play size={14} />
                    {nativeRunUnavailable ? "Unavailable" : activeLanguage === "sql" ? "Execute SQL" : activeLanguage === "cpp" ? "Run C++" : expectsInput && stdin.trim() ? "Run with input" : "Run code"}
                  </button>
                </div>
              ) : (
                <button type="button" className="c-stop-button" onClick={stopRun}>
                  <Square size={12} />
                  Stop
                </button>
              )}
            </div>
            {activeLanguage !== "cpp" && <label className="c-stdin-label" htmlFor="c-playground-stdin">
              {activeLanguage === "sql" ? "Schema Setup & Input (Optional)" : "Standard input (stdin)"} <span>preloaded before run</span>
              {expectsInput && <span className="c-stdin-hint">Input expected</span>}
            </label>}
            {activeLanguage !== "cpp" && showStdinGuidance && <p className="c-stdin-description" id="c-playground-stdin-description">{stdinDescription}</p>}
            {activeLanguage !== "cpp" && <textarea
              id="c-playground-stdin"
              className={`c-stdin-editor${needsStdinConfirm ? " needs-input" : ""}`}
              value={stdin}
              onChange={(event) => updateStdin(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  void runProgram(false);
                }
              }}
              aria-describedby={showStdinGuidance ? "c-playground-stdin-description" : undefined}
              placeholder={stdinPlaceholder}
              maxLength={activeLanguage === "python" ? PYTHON_PLAYGROUND_STDIN_LIMIT : C_PLAYGROUND_STDIN_LIMIT}
              spellCheck={false}
            />}
            <div className="c-console-heading">
              {isStandaloneIde && <span className="terminal-title"><Terminal size={14} /> Terminal</span>}
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
              {isStandaloneIde && <button type="button" className="c-small-action terminal-close" onClick={() => setOutputOpen(false)} aria-label="Close terminal" title="Close terminal">×</button>}
            </div>
            <div className="c-console-output" aria-live="polite" aria-label="Program output">
              <div className="c-output-stream">
                <span>{isStandaloneIde && nativeRunUnavailable ? "session" : "stdout"}</span>
                <pre>{isStandaloneIde && nativeRunUnavailable ? (activeLanguage === "cpp" ? CPP_RUN_UNAVAILABLE_MESSAGE : C_RUN_UNAVAILABLE_MESSAGE) : stdout || (stage === "idle" ? "Run the example to see its output here." : "Waiting for program output…")}</pre>
              </div>
              {stderr && (
                <div className="c-output-stream stderr">
                  <span>stderr</span>
                  <pre>{stderr}</pre>
                </div>
              )}
            </div>
            {activeLanguage === "c" && C_RUN_ENABLED && (
              <p className="c-stdin-description c-vfs-notice">
                Note: File operations (fopen) use a temporary in-memory virtual filesystem for this session; files are not saved to your device.
              </p>
            )}
            {diagnostics && (
              <details className="c-compiler-diagnostics" open={outcome === "compile-error"}>
                <summary>{outcome === "compile-error" ? "Compiler errors" : "Compiler messages"}</summary>
                <pre>{diagnostics}</pre>
              </details>
            )}
            {error && (
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
