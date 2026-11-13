"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { cpp } from "@codemirror/lang-cpp";
import {
  bracketMatching,
  foldGutter,
  HighlightStyle,
  indentOnInput,
  StreamLanguage,
  syntaxHighlighting,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { EditorView, highlightActiveLineGutter, keymap, lineNumbers } from "@codemirror/view";
import {
  Bot,
  Check,
  Code2,
  Copy,
  LoaderCircle,
  Play,
  RotateCcw,
  Square,
  Terminal,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { executeProgram } from "@/lib/execution/runner";
import { ExecutionLanguage } from "@/lib/execution/types";
import { parseDiagnostics, type ParsedDiagnostic } from "@/lib/execution/diagnostics-parser";

export type CodeWorkspaceActivity = {
  source: string;
  diagnostics: string;
  output: string;
};

export interface CodeWorkspaceProps {
  language: ExecutionLanguage;
  initialCode: string;
  sampleInput?: string;
  lessonId: string;
  lessonTitle: string;
  onActivityChange?: (activity: CodeWorkspaceActivity) => void;
  onAskKatAboutError?: (errorText: string, line?: number) => void;
}

// Custom CodeMirror syntax highlight style for dark graphite theme
const codeThemeHighlight = HighlightStyle.define([
  { tag: [tags.keyword, tags.controlKeyword, tags.modifier], color: "var(--code-keyword)" },
  { tag: [tags.string, tags.special(tags.string)], color: "var(--code-string)" },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: "var(--code-comment)", fontStyle: "italic" },
  { tag: [tags.number, tags.integer, tags.float], color: "var(--code-number)" },
  { tag: [tags.function(tags.variableName), tags.typeName, tags.className], color: "var(--code-name)" },
  { tag: [tags.definition(tags.variableName), tags.variableName], color: "var(--code-foreground)" },
  { tag: [tags.operator, tags.punctuation], color: "var(--code-name)" },
]);

// Stream parser for Python syntax highlighting without heavyweight external dependencies
const pythonKeywords = new Set([
  "and", "as", "assert", "async", "await", "break", "class", "continue", "def",
  "del", "elif", "else", "except", "False", "finally", "for", "from", "global",
  "if", "import", "in", "is", "lambda", "None", "nonlocal", "not", "or", "pass",
  "raise", "return", "True", "try", "while", "with", "yield"
]);

const pythonBuiltins = new Set([
  "abs", "all", "any", "bin", "bool", "bytearray", "bytes", "callable", "chr",
  "dict", "dir", "divmod", "enumerate", "filter", "float", "format", "frozenset",
  "getattr", "hasattr", "hash", "help", "hex", "id", "input", "int", "isinstance",
  "issubclass", "iter", "len", "list", "map", "max", "min", "next", "object",
  "oct", "open", "ord", "pow", "print", "range", "repr", "reversed", "round",
  "set", "slice", "sorted", "str", "sum", "super", "tuple", "type", "vars", "zip"
]);

export const pythonStreamParser = StreamLanguage.define<{ inString: string | null }>({
  startState() {
    return { inString: null };
  },
  token(stream, state) {
    if (state.inString) {
      while (!stream.eol()) {
        const ch = stream.next();
        if (ch === "\\") {
          stream.next();
        } else if (ch === state.inString) {
          state.inString = null;
          break;
        }
      }
      return "string";
    }

    if (stream.eatSpace()) return null;

    const ch = stream.peek();

    if (ch === "#") {
      stream.skipToEnd();
      return "comment";
    }

    if (ch === '"' || ch === "'") {
      state.inString = stream.next() || null;
      while (!stream.eol()) {
        const nextCh = stream.next();
        if (nextCh === "\\") {
          stream.next();
        } else if (nextCh === state.inString) {
          state.inString = null;
          break;
        }
      }
      return "string";
    }

    if (/\d/.test(ch ?? "")) {
      stream.match(/^[0-9]+(\.[0-9]+)?/);
      return "number";
    }

    if (/[a-zA-Z_]/.test(ch ?? "")) {
      stream.match(/^[a-zA-Z0-9_]+/);
      const word = stream.current();
      if (pythonKeywords.has(word)) return "keyword";
      if (pythonBuiltins.has(word)) return "variableName";
      return "variable";
    }

    stream.next();
    return "operator";
  },
});

export function CodeWorkspace({
  language,
  initialCode,
  sampleInput = "",
  lessonId,
  lessonTitle,
  onActivityChange,
  onAskKatAboutError,
}: CodeWorkspaceProps) {
  const [source, setSource] = useState(initialCode);
  const [stdin, setStdin] = useState(sampleInput);
  const [stdout, setStdout] = useState("");
  const [stderr, setStderr] = useState("");
  const [status, setStatus] = useState<"idle" | "running" | "ready" | "error">("ready");
  const [statusMessage, setStatusMessage] = useState("Ready");
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [stdinOpen, setStdinOpen] = useState(Boolean(sampleInput));

  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const filename =
    language === "python" ? "main.py" : language === "javascript" ? "main.js" : "main.c";
  const languageLabel =
    language === "python"
      ? "PYTHON 3.12"
      : language === "javascript"
      ? "JAVASCRIPT (ES2024)"
      : "C11";

  const parsedDiagnostics: ParsedDiagnostic[] = useMemo(() => {
    if (!stderr) return [];
    return parseDiagnostics(stderr, language);
  }, [stderr, language]);

  // Broadcast activity to Kat AI
  useEffect(() => {
    onActivityChange?.({
      source,
      diagnostics: stderr,
      output: stdout,
    });
  }, [source, stderr, stdout, onActivityChange]);

  // Initialize CodeMirror instance
  useEffect(() => {
    if (!editorContainerRef.current) return;

    const languageSupport = language === "python" ? pythonStreamParser : cpp();

    const state = EditorState.create({
      doc: initialCode,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        foldGutter(),
        bracketMatching(),
        indentOnInput(),
        syntaxHighlighting(codeThemeHighlight),
        languageSupport,
        keymap.of([indentWithTab, ...defaultKeymap]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setSource(update.state.doc.toString());
          }
        }),
        EditorView.theme(
          {
            "&": {
              height: "100%",
              backgroundColor: "var(--surface-code)",
              color: "var(--code-foreground)",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
              fontSize: "13px",
            },
            ".cm-scroller": {
              overflow: "auto",
              fontFamily: "inherit",
              lineHeight: "1.6",
            },
            ".cm-gutters": {
              backgroundColor: "var(--surface-code-header)",
              color: "var(--code-gutter)",
              border: "none",
              borderRight: "1px solid var(--border-subtle)",
            },
            ".cm-activeLine": {
              backgroundColor: "var(--code-line-active)",
            },
            ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
              backgroundColor: "var(--code-selection) !important",
            },
            ".cm-cursor": {
              borderLeftColor: "var(--signal)",
            },
          },
          { dark: true }
        ),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorContainerRef.current,
    });

    editorViewRef.current = view;

    return () => {
      view.destroy();
      editorViewRef.current = null;
    };
  }, [language, initialCode]);

  const handleRun = useCallback(async () => {
    if (status === "running") return;

    setStatus("running");
    setStatusMessage("Running…");
    setStdout("");
    setStderr("");

    abortControllerRef.current = new AbortController();

    try {
      const result = await executeProgram({
        language,
        files: [{ path: filename, content: source }],
        stdin,
        signal: abortControllerRef.current.signal,
        onProgress: (_stage, message) => {
          setStatusMessage(message);
        },
      });

      setStdout(result.stdout);
      setStderr(result.stderr || (result.diagnostics ?? ""));
      setExecutionTimeMs(result.executionTimeMs);

      if (result.ok) {
        setStatus("ready");
        setStatusMessage("Completed");
      } else {
        setStatus("error");
        setStatusMessage("Execution finished with errors");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus("error");
      setStatusMessage("Failed");
      setStderr(message);
    } finally {
      abortControllerRef.current = null;
    }
  }, [language, filename, source, stdin, status]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStatus("ready");
      setStatusMessage("Cancelled");
    }
  }, []);

  const handleReset = useCallback(() => {
    setSource(initialCode);
    setStdin(sampleInput);
    if (editorViewRef.current) {
      const currentDoc = editorViewRef.current.state.doc.toString();
      editorViewRef.current.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: initialCode },
      });
    }
  }, [initialCode, sampleInput]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [source]);

  const handleClearOutput = useCallback(() => {
    setStdout("");
    setStderr("");
    setExecutionTimeMs(null);
    setStatus("ready");
    setStatusMessage("Ready");
  }, []);

  return (
    <div className="unified-code-workspace">
      {/* Workspace Top Bar */}
      <header className="workspace-editor-header">
        <div className="editor-file-info">
          <span className="editor-lang-badge">
            <Terminal size={13} />
            {languageLabel}
          </span>
          <span className="editor-filename">{filename}</span>
          {lessonTitle && <span className="editor-lesson-title" title={lessonTitle}>· {lessonTitle}</span>}
          <span className={`editor-status-indicator status-${status}`}>
            {status === "running" && <LoaderCircle size={11} className="spin" />}
            {statusMessage}
          </span>
          {executionTimeMs !== null && (
            <span className="editor-duration-badge">{executionTimeMs} ms</span>
          )}
        </div>

        <div className="editor-actions-row">
          <button
            type="button"
            className="secondary-icon-button"
            onClick={handleCopy}
            title="Copy source code"
            aria-label="Copy source code"
          >
            {copied ? <Check size={14} className="text-positive" /> : <Copy size={14} />}
          </button>
          <button
            type="button"
            className="secondary-icon-button"
            onClick={handleReset}
            title="Reset to starter code"
            aria-label="Reset to starter code"
          >
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            className="secondary-icon-button"
            onClick={handleClearOutput}
            title="Clear output"
            aria-label="Clear output"
          >
            <Trash2 size={14} />
          </button>
          {status === "running" ? (
            <button
              type="button"
              className="c-stop-button"
              onClick={handleStop}
              aria-label="Stop execution"
            >
              <Square size={14} /> Stop
            </button>
          ) : (
            <button
              type="button"
              className="primary-button c-run-button"
              onClick={handleRun}
              aria-label={`Run ${language === "python" ? "Python" : "program"}`}
            >
              <Play size={14} /> Run{language === "python" ? " Python" : ""}
            </button>
          )}
        </div>
      </header>

      {/* CodeMirror Editor Area */}
      <div className="workspace-editor-viewport" ref={editorContainerRef} />

      {/* Bottom Terminal / Output Pane */}
      <div className="workspace-terminal-pane">
        <div className="terminal-header-tabs">
          <div className="terminal-tabs-left">
            <span className="terminal-tab-label active">
              <Code2 size={13} /> Output
            </span>
            <button
              type="button"
              className={`terminal-stdin-toggle ${stdinOpen ? "active" : ""}`}
              onClick={() => setStdinOpen((open) => !open)}
              aria-expanded={stdinOpen}
            >
              Stdin {stdin ? `(${stdin.length} chars)` : ""}
              {stdinOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            </button>
          </div>
          {stdout && (
            <button
              type="button"
              className="mini-text-action"
              onClick={handleClearOutput}
            >
              Clear
            </button>
          )}
        </div>

        {stdinOpen && (
          <div className="terminal-stdin-area">
            <label htmlFor={`stdin-input-${lessonId}`} className="terminal-stdin-label">
              STANDARD INPUT (STDIN)
            </label>
            <textarea
              id={`stdin-input-${lessonId}`}
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Provide standard input for scanf(), input(), etc."
              rows={2}
              className="terminal-stdin-input"
            />
          </div>
        )}

        <div className="terminal-output-scroll">
          {stderr && (
            <div className="terminal-stderr-block">
              <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border-subtle)]/40 mb-2">
                <span className="stderr-label">ERRORS / TRACEBACK</span>
                {onAskKatAboutError && (
                  <button
                    type="button"
                    onClick={() => {
                      const firstDiag = parsedDiagnostics[0];
                      const msg = firstDiag
                        ? `Error on line ${firstDiag.line}: ${firstDiag.message}`
                        : stderr;
                      onAskKatAboutError(msg, firstDiag?.line);
                    }}
                    className="flex items-center gap-1.5 rounded bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
                  >
                    <Bot size={13} />
                    <span>Ask Kat to Explain Error</span>
                  </button>
                )}
              </div>

              {parsedDiagnostics.length > 0 && (
                <div className="mb-2.5 rounded border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-200">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                    Detected Diagnostics ({parsedDiagnostics.length}):
                  </div>
                  <ul className="space-y-1 font-mono text-[11px]">
                    {parsedDiagnostics.slice(0, 3).map((diag, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="font-bold text-amber-400">Line {diag.line}{diag.column ? `:${diag.column}` : ""}:</span>
                        <span>{diag.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <pre><code>{stderr}</code></pre>
            </div>
          )}
          {stdout ? (
            <pre className="terminal-stdout-pre"><code>{stdout}</code></pre>
          ) : !stderr && status !== "running" ? (
            <div className="terminal-empty-state">
              <span>Click <strong>Run</strong> to execute code and view output.</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
