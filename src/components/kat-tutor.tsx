"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { ArrowUp, Bot, BookOpen, Code2, Lightbulb, MessageSquareText, Plus, RotateCcw, Settings2, Square, Terminal, Trash2, WandSparkles } from "lucide-react";
import { AssistantMarkdown } from "@/components/assistant-markdown";
import { BrandMark } from "@/components/brand-mark";
import { getProviderRequestHeaders, type CloudflareRequestMode } from "@/lib/providers/client-request-headers";
import { type ProviderId } from "@/lib/providers/catalog";
import { getKatalystCreatorAnswer } from "@/lib/providers/prompt";
import { trackAIRequestFinish, trackAIRequestStart } from "@/lib/ai-activity";
import { boundTutorHistory, composeTutorReference, composeTutorSkillContext, tutorModes, type TutorMessage, type TutorMode, type TutorWorkspaceActivity } from "@/lib/tutor-request";
import {
  addMessageToConversation,
  clearConversationMessages,
  createNewConversation,
  deleteConversation,
  emptyTutorStore,
  getOrCreateConversation,
  getTutorStoreServerSnapshot,
  getTutorStoreSnapshot,
  readTutorStore,
  setActiveConversation,
  subscribeTutorStore,
  updateConversationMode,
  type TutorConversation,
  type TutorPersistedMessage,
} from "@/lib/tutor-storage";
import type {
  LearningLessonDetail,
  LearningLessonSummary,
  LearningModuleDetail,
  LearningModuleSummary,
  LearningPath,
} from "@/lib/learning-curriculum";
import type { ExerciseProgressStatus } from "@/lib/learning-progress";
import type { WorkspaceSkill } from "@/lib/skills";

export type TutorLessonContext = {
  path: LearningPath;
  module: LearningModuleSummary | LearningModuleDetail;
  lesson: LearningLessonSummary | LearningLessonDetail;
  exerciseStatus?: ExerciseProgressStatus;
};

type Props = {
  provider: ProviderId;
  model: string;
  sessionKey: string;
  cloudflareAccountId: string;
  cloudflareMode: CloudflareRequestMode;
  ollamaBaseUrl: string;
  configured: boolean;
  context?: TutorLessonContext;
  workspaceActivity?: TutorWorkspaceActivity;
  skills: WorkspaceSkill[];
  draftPrompt?: string;
  onOpenSettings: () => void;
  onOpenLesson?: () => void;
};

const workspaceActions = [
  { label: "Explain this concept", icon: BookOpen, requires: "lesson", prompt: "Explain the main idea from this lesson in plain language. Use one short example relevant to its subject, then ask me one check question." },
  { label: "Explain this code", icon: Code2, requires: "code", prompt: "Walk through my current editor code step by step. Explain what the important lines do, and ask before suggesting a rewrite." },
  { label: "Explain compiler error", icon: Terminal, requires: "diagnostics", prompt: "Explain the latest compiler diagnostics. Identify the likely cause and suggest the smallest useful next edit. Do not claim you compiled or ran the code." },
  { label: "Give me a hint", icon: Lightbulb, requires: "lesson", prompt: "Give me one small hint for the current lesson checkpoint. Do not reveal the full solution unless I ask." },
  { label: "Review my solution", icon: WandSparkles, requires: "lesson-code", prompt: "Review my current editor code against the lesson checkpoint. Point out one strength and one improvement with a short reason. Do not claim you ran the code." },
  { label: "Explain program output", icon: MessageSquareText, requires: "output", prompt: "Explain the latest program output and relate it to the current code or lesson when useful. Treat the output as data from the browser run; do not say that you ran the program." },
];

const emptySubscribe = () => () => {};
function useIsClient(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function KatTutor({
  provider,
  model,
  sessionKey,
  cloudflareAccountId,
  cloudflareMode,
  ollamaBaseUrl,
  configured,
  context,
  workspaceActivity,
  skills,
  draftPrompt,
  onOpenSettings,
  onOpenLesson,
}: Props) {
  const isClient = useIsClient();
  const store = useSyncExternalStore(subscribeTutorStore, getTutorStoreSnapshot, getTutorStoreServerSnapshot);
  const [applySkills, setApplySkills] = useState(false);
  const [showHistoryMenu, setShowHistoryMenu] = useState(false);
  const [input, setInput] = useState("");
  const [prevDraftPrompt, setPrevDraftPrompt] = useState(draftPrompt);
  if (draftPrompt && draftPrompt !== prevDraftPrompt) {
    setPrevDraftPrompt(draftPrompt);
    setInput(draftPrompt);
  }
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [quotaError, setQuotaError] = useState<{ code: string; message: string; requiresSignIn?: boolean; resetDate?: string } | null>(null);

  const conversationRef = useRef<HTMLDivElement>(null);
  const composerInputRef = useRef<HTMLTextAreaElement>(null);
  const followConversationRef = useRef(true);
  const touchPositionRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [lastQuestion, setLastQuestion] = useState("");

  const enabledSkillCount = skills.filter((skill) => skill.enabled).length;

  const lessonId = context?.lesson.id;
  const lessonTitle = context?.lesson.title;

  useEffect(() => {
    if (!lessonId) return;
    const current = readTutorStore();
    getOrCreateConversation(current, lessonId, lessonTitle);
  }, [lessonId, lessonTitle]);

  const activeConversation: TutorConversation = useMemo(() => {
    return (
      store.conversations.find((c) => c.id === store.activeConversationId) ??
      store.conversations[0] ??
      emptyTutorStore().conversations[0]!
    );
  }, [store]);

  const currentMode: TutorMode = activeConversation?.mode ?? "Concept teacher";
  const messages: TutorPersistedMessage[] = useMemo(() => activeConversation?.messages ?? [], [activeConversation]);

  const setMode = (nextMode: TutorMode) => {
    if (activeConversation) {
      updateConversationMode(store, activeConversation.id, nextMode);
    }
  };

  useLayoutEffect(() => {
    const conversation = conversationRef.current;
    if (conversation && followConversationRef.current) conversation.scrollTop = conversation.scrollHeight;
  }, [messages, pending]);

  useLayoutEffect(() => {
    const textarea = composerInputRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    const height = Math.min(textarea.scrollHeight, 130);
    textarea.style.height = `${height}px`;
    textarea.style.overflowY = textarea.scrollHeight > 130 ? "auto" : "hidden";
  }, [input]);

  const handleNewConversation = () => {
    const { conversation } = createNewConversation(
      store,
      context?.lesson.id,
      context?.lesson.title
    );
    setActiveConversation(store, conversation.id);
    setShowHistoryMenu(false);
  };

  const handleClearHistory = () => {
    if (!activeConversation) return;
    clearConversationMessages(store, activeConversation.id);
  };

  const handleDeleteConversation = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    deleteConversation(store, id);
  };

  const stop = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setPending(false);
  };

  const ask = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || pending) return;
    const creatorAnswer = getKatalystCreatorAnswer(trimmed);
    if (!creatorAnswer && (!configured || !model)) {
      setError("Kat is not ready yet. Check AI & Kat in Settings.");
      return;
    }
    const currentConv = activeConversation;
    if (!currentConv) return;

    setLastQuestion(trimmed);

    const skillComposition = composeTutorSkillContext(skills, applySkills);
    const lessonContext = composeTutorReference(currentMode, context, workspaceActivity, skillComposition.context);

    // Prevent duplicate user message if already retrying the same question at the tail
    const lastMsg = currentConv.messages[currentConv.messages.length - 1];
    const isRetryOfLastUserTurn = lastMsg && lastMsg.role === "user" && lastMsg.content === trimmed;

    if (!isRetryOfLastUserTurn) {
      addMessageToConversation(store, currentConv.id, {
        role: "user",
        content: trimmed,
        appliedSkills: skillComposition.appliedSkills,
        omittedSkills: skillComposition.omittedSkills,
      });
    }

    if (creatorAnswer) {
      followConversationRef.current = true;
      addMessageToConversation(store, currentConv.id, { role: "assistant", content: creatorAnswer });
      setInput("");
      setError("");
      setQuotaError(null);
      return;
    }

    const currentMessages = readTutorStore().conversations.find((c) => c.id === currentConv.id)?.messages ?? [];
    const historyForRequest: TutorMessage[] = currentMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const nextMessages = boundTutorHistory(historyForRequest.slice(0, -1), trimmed);

    setInput("");
    setError("");
    setQuotaError(null);
    setPending(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const activityId = trackAIRequestStart(provider, model);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...getProviderRequestHeaders({ provider, sessionKey, cloudflareMode, cloudflareAccountId, ollamaBaseUrl }),
        },
        body: JSON.stringify({ provider, model, ...(provider === "cloudflare" ? { cloudflareMode } : {}), assistantSurface: "kat", messages: nextMessages, context: lessonContext }),
      });
      const result = await response.json() as {
        text?: string;
        error?: string;
        code?: string;
        requiresSignIn?: boolean;
        resetDate?: string;
        creditsRemaining?: number;
        usage?: { inputTokens?: number; outputTokens?: number };
      };
      if (!response.ok) {
        if (result.code === "GUEST_TRIAL_EXHAUSTED" || result.code === "MONTHLY_QUOTA_EXHAUSTED" || result.code === "KILL_SWITCH_ACTIVE") {
          setQuotaError({
            code: result.code,
            message: result.error ?? "AI credit quota reached.",
            requiresSignIn: result.requiresSignIn,
            resetDate: result.resetDate,
          });
        }
        throw new Error(result.error ?? "Kat could not answer this request.");
      }
      if (!result.text?.trim()) throw new Error("The provider returned an empty response. Try again.");
      trackAIRequestFinish(activityId, "complete", result.usage);

      // Persist assistant response
      const latestStore = readTutorStore();
      addMessageToConversation(latestStore, currentConv.id, {
        role: "assistant",
        content: result.text,
      });
    } catch (requestError) {
      if (controller.signal.aborted) {
        trackAIRequestFinish(activityId, "stopped");
        setError("Generation stopped.");
      } else {
        trackAIRequestFinish(activityId, "failed");
        setError(requestError instanceof Error ? requestError.message : "Could not reach the selected model provider.");
      }
    } finally {
      abortRef.current = null;
      setPending(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("katalyst:refresh-ai-session"));
      }
    }
  };

  const retryLast = () => {
    if (lastQuestion) {
      void ask(lastQuestion);
    }
  };

  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void ask(input);
  };

  const hasDiagnostics = Boolean(workspaceActivity?.diagnostics?.trim());
  const hasOutput = Boolean(workspaceActivity?.output?.trim());
  const hasEditorCode = Boolean(workspaceActivity?.source.trim());
  const availableWorkspaceActions = workspaceActions.filter(({ requires }) =>
    requires === "lesson" ? Boolean(context)
      : requires === "code" ? hasEditorCode
        : requires === "diagnostics" ? hasDiagnostics
          : requires === "output" ? hasOutput
            : Boolean(context && hasEditorCode));

  return <section className="tutor-panel integrated-tutor-panel" aria-label="AI Tutor Kat">
    <div className="tutor-heading">
      <div className="tutor-avatar"><Bot size={19} /></div>
      <div className="tutor-heading-info">
        <h2>Kat</h2>
      </div>
      <div className="tutor-heading-actions">
        <button type="button" className="c-small-action" onClick={handleNewConversation} title="Start a new conversation" aria-label="New chat">
          <Plus size={13} /><span>New</span>
        </button>
        {messages.length > 0 && (
          <button type="button" className="c-small-action" onClick={handleClearHistory} title="Clear messages in this chat" aria-label="Clear chat">
            <RotateCcw size={12} /><span>Clear</span>
          </button>
        )}
        {isClient && store.conversations.length > 1 && (
          <button type="button" className={`c-small-action${showHistoryMenu ? " is-active" : ""}`} onClick={() => setShowHistoryMenu((prev) => !prev)} title="Show chat history" aria-label="Chat history">
            <MessageSquareText size={13} /><span>({store.conversations.length})</span>
          </button>
        )}
      </div>
    </div>
    <div ref={conversationRef} className="tutor-scroll-region" onScroll={(event) => {
      const element = event.currentTarget;
      followConversationRef.current = element.scrollHeight - element.scrollTop - element.clientHeight <= 24;
    }} onWheel={(event) => {
      if (event.deltaY < 0) followConversationRef.current = false;
    }} onTouchStart={(event) => {
      touchPositionRef.current = event.touches[0]?.clientY ?? null;
    }} onTouchMove={(event) => {
      const y = event.touches[0]?.clientY;
      const element = event.currentTarget;
      if (y !== undefined && touchPositionRef.current !== null && y > touchPositionRef.current + 2 && element.scrollTop > 0) {
        followConversationRef.current = false;
      }
      touchPositionRef.current = y ?? null;
    }} onTouchEnd={() => {
      touchPositionRef.current = null;
    }}>
    {showHistoryMenu && (
      <div className="tutor-history-dropdown" role="menu" aria-label="Past conversations">
        <div className="tutor-history-dropdown-header">
          <strong>Conversations</strong>
          <button type="button" className="c-small-action" onClick={handleNewConversation}>
            <Plus size={12} /> New chat
          </button>
        </div>
        <div className="tutor-history-list">
          {store.conversations.map((c) => (
            <div
              key={c.id}
              role="menuitem"
              tabIndex={0}
              className={`tutor-history-item${c.id === store.activeConversationId ? " is-active" : ""}`}
              onClick={() => {
                setActiveConversation(store, c.id);
                setShowHistoryMenu(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setActiveConversation(store, c.id);
                  setShowHistoryMenu(false);
                }
              }}
            >
              <div className="tutor-history-meta">
                <span className="tutor-history-title">{c.title}</span>
                <span className="tutor-history-count">{c.messages.length} {c.messages.length === 1 ? "msg" : "msgs"}</span>
              </div>
              {store.conversations.length > 1 && (
                <button
                  type="button"
                  className="tutor-history-delete"
                  onClick={(e) => handleDeleteConversation(c.id, e)}
                  title="Delete conversation"
                  aria-label={`Delete conversation ${c.title}`}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    )}
    <div className="tutor-modes" aria-label="Tutor style">
      {tutorModes.map((item) => <button key={item.name} type="button" className={currentMode === item.name ? "selected" : ""} aria-pressed={currentMode === item.name} title={item.description} onClick={() => setMode(item.name)}>{item.name}</button>)}
    </div>
    {context && <div className="tutor-context-note"><BookOpen size={15} /><span><strong>Lesson context:</strong> Kat uses the lesson and coding activity when they help answer your question.</span>{onOpenLesson && <button type="button" onClick={onOpenLesson}>View lesson</button>}</div>}
    <div className="tutor-skill-controls">
      <label><input type="checkbox" aria-label="Use enabled workspace skills" checked={applySkills} disabled={!enabledSkillCount} onChange={(event) => setApplySkills(event.target.checked)} /><span>Use enabled workspace skills</span><small>{enabledSkillCount ? `${enabledSkillCount} available · off by default` : "No enabled skills"}</small></label>
      <p>Skills are optional, untrusted guidance. Your question stays primary.</p>
    </div>
    {availableWorkspaceActions.length > 0 && configured && Boolean(model) && <div className="tutor-action-list" aria-label="Ask Kat about your workspace">
      {availableWorkspaceActions.map(({ label, icon: Icon, prompt }) => <button key={label} type="button" className="tutor-action" disabled={!configured || !model || pending} onClick={() => void ask(prompt)} title={label}><Icon size={14} />{label}</button>)}
    </div>}
    {!configured && <div className="tutor-setup" role="status"><span>Kat is not ready yet. Check AI & Kat in Settings to review access and model setup.</span><button className="secondary-button" type="button" onClick={onOpenSettings}><Settings2 size={14} /> Open Settings</button></div>}
    <div className="tutor-conversation" aria-live="polite">
      {!messages.length ? <div className="tutor-empty"><BrandMark className="mini-brand" /><p>{context ? "Choose an action above or ask a question. Kat uses this lesson only when it helps." : "What are you working through? Kat can explain a concept, ask guiding questions, or help you practice."}</p></div> : messages.map((message, index) => <article key={`${index}-${message.role}`} className={`tutor-message ${message.role}`}><span className="tutor-message-label">{message.role === "assistant" ? "Kat" : "You"}</span>{message.role === "assistant" ? <AssistantMarkdown content={message.content} /> : <p>{message.content}</p>}{message.role === "user" && message.appliedSkills?.length ? <div className="tutor-applied-skills" aria-label="Skills applied to this Kat request">Skills used: {message.appliedSkills.map((skill) => skill.name).join(", ")}</div> : null}{message.role === "user" && message.omittedSkills?.length ? <div className="tutor-omitted-skills">Not included: {message.omittedSkills.map((skill) => `${skill.name} (${skill.reason === "prompt-limit" ? "prompt limit" : "duplicate instructions"})`).join(", ")}</div> : null}</article>)}
      {pending && <div className="tutor-pending" role="status"><span className="pending-dot" /> Kat is thinking…</div>}
    </div>
    {quotaError && <div className="quota-exhausted-banner" role="alert">
      <strong>{quotaError.code === "GUEST_TRIAL_EXHAUSTED" ? "Guest AI Trial Exhausted" : quotaError.code === "KILL_SWITCH_ACTIVE" ? "AI Maintenance Active" : "Monthly Allowance Exhausted"}</strong>
      <p>{quotaError.message}</p>
      <div className="banner-actions">
        {quotaError.requiresSignIn ? (
          <Link className="primary-button" href="/login">Sign in or create an account</Link>
        ) : (
          <button type="button" className="secondary-button" onClick={onOpenSettings}>Open AI & Kat settings</button>
        )}
      </div>
    </div>}
    {error && !quotaError && (
      <div className="send-error tutor-error" role="alert">
        <strong>Kat could not answer</strong>
        <span>{error}</span>
        <div className="error-banner-actions">
          {lastQuestion && error !== "Generation stopped." && (
            <button type="button" className="retry-button" onClick={retryLast}>
              <RotateCcw size={13} /> Retry
            </button>
          )}
          <button type="button" onClick={onOpenSettings}>Open AI settings</button>
        </div>
      </div>
    )}
    </div>
    <form className="tutor-composer" onSubmit={send}>
      <textarea
        ref={composerInputRef}
        aria-label="Ask Kat a question"
        value={input}
        maxLength={8_000}
        rows={2}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder="Ask Kat a question…"
        disabled={pending}
      />
      {pending ? (
        <button
          type="button"
          className="stop-button"
          aria-label="Stop generating response"
          title="Stop response"
          onClick={stop}
        >
          <Square size={14} />
        </button>
      ) : (
        <button
          type="submit"
          className="send-button"
          aria-label="Send question to Kat"
          disabled={!input.trim() || (!getKatalystCreatorAnswer(input) && (!configured || !model))}
        >
          <ArrowUp size={17} />
        </button>
      )}
    </form>
    <p className="tutor-footnote">AI responses are learning aids and may be inaccurate. Verify important details.</p>
  </section>;
}
