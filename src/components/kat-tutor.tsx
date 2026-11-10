"use client";

import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, Bot, BookOpen, Code2, Lightbulb, MessageSquareText, Settings2, Terminal, WandSparkles } from "lucide-react";
import { AssistantMarkdown } from "@/components/assistant-markdown";
import { BrandMark } from "@/components/brand-mark";
import { CLOUDFLARE_ACCOUNT_HEADER, OLLAMA_URL_HEADER, SESSION_KEY_HEADER } from "@/lib/providers/constants";
import { providerCatalog, type ProviderId } from "@/lib/providers/catalog";
import { trackAIRequestFinish, trackAIRequestStart } from "@/lib/ai-activity";
import { boundTutorHistory, composeTutorReference, composeTutorSkillContext, tutorModes, type TutorMessage, type TutorMode, type TutorWorkspaceActivity } from "@/lib/tutor-request";
import type { LearningLesson, LearningModule, LearningPath } from "@/lib/learning-curriculum";
import type { AppliedSkill, SkillOmission, WorkspaceSkill } from "@/lib/skills";

export type TutorLessonContext = { path: LearningPath; module: LearningModule; lesson: LearningLesson };

type Props = {
  provider: ProviderId;
  model: string;
  modelName: string;
  sessionKey: string;
  cloudflareAccountId: string;
  ollamaBaseUrl: string;
  configured: boolean;
  context?: TutorLessonContext;
  workspaceActivity?: TutorWorkspaceActivity;
  skills: WorkspaceSkill[];
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

export function KatTutor({
  provider,
  model,
  modelName,
  sessionKey,
  cloudflareAccountId,
  ollamaBaseUrl,
  configured,
  context,
  workspaceActivity,
  skills,
  onOpenSettings,
  onOpenLesson,
}: Props) {
  const [mode, setMode] = useState<TutorMode>("Concept teacher");
  const [applySkills, setApplySkills] = useState(false);
  const [messages, setMessages] = useState<Array<TutorMessage & { appliedSkills?: AppliedSkill[]; omittedSkills?: SkillOmission[]; responseProvider?: ProviderId; responseModel?: string }>>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const conversationRef = useRef<HTMLDivElement>(null);
  const composerInputRef = useRef<HTMLTextAreaElement>(null);
  const followConversationRef = useRef(true);
  const enabledSkillCount = skills.filter((skill) => skill.enabled).length;

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

  const ask = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || pending) return;
    if (!model) {
      setError(`Choose a supported ${providerCatalog[provider].name} model before asking Kat.`);
      return;
    }
    const nextMessages = boundTutorHistory(messages, trimmed);
    const skillComposition = composeTutorSkillContext(skills, applySkills);
    const lessonContext = composeTutorReference(mode, context, workspaceActivity, skillComposition.context);
    setInput("");
    setError("");
    setPending(true);
    const activityId = trackAIRequestStart(provider, model);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionKey.trim() ? { [SESSION_KEY_HEADER]: sessionKey.trim() } : {}),
          ...(provider === "cloudflare" && cloudflareAccountId.trim() ? { [CLOUDFLARE_ACCOUNT_HEADER]: cloudflareAccountId.trim() } : {}),
          ...(provider === "ollama" ? { [OLLAMA_URL_HEADER]: ollamaBaseUrl } : {}),
        },
        body: JSON.stringify({ provider, model, assistantSurface: "kat", messages: nextMessages, context: lessonContext }),
      });
      const result = await response.json() as { text?: string; error?: string; usage?: { inputTokens?: number; outputTokens?: number } };
      if (!response.ok) throw new Error(result.error ?? "Kat could not answer this request.");
      if (!result.text?.trim()) throw new Error("The provider returned an empty response. Try again.");
      trackAIRequestFinish(activityId, "complete", result.usage);
      setMessages([...nextMessages.map((message, index) => index === nextMessages.length - 1
        ? { ...message, appliedSkills: skillComposition.appliedSkills, omittedSkills: skillComposition.omittedSkills }
        : message), { role: "assistant" as const, content: result.text, responseProvider: provider, responseModel: model }].slice(-20));
    } catch (requestError) {
      trackAIRequestFinish(activityId, "failed");
      setInput(trimmed);
      setError(requestError instanceof Error ? requestError.message : "Could not reach the selected model provider.");
    } finally {
      setPending(false);
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
      <div><span className="eyebrow">YOUR LEARNING COMPANION</span><h2>Kat</h2><p>{context ? `${context.module.title} · ${context.lesson.title}` : "A tutor for your engineering questions"}</p></div>
      <span className="tutor-provider">{providerCatalog[provider].name}{modelName ? ` · ${modelName}` : ""}</span>
    </div>
    <div className="tutor-modes" aria-label="Tutor style">
      {tutorModes.map((item) => <button key={item.name} type="button" className={mode === item.name ? "selected" : ""} aria-pressed={mode === item.name} title={item.description} onClick={() => setMode(item.name)}>{item.name}</button>)}
    </div>
    {context && <div className="tutor-context-note"><BookOpen size={15} /><span><strong>Lesson context:</strong> Kat uses the lesson and coding activity when they help answer your question.</span>{onOpenLesson && <button type="button" onClick={onOpenLesson}>View lesson</button>}</div>}
    <div className="tutor-skill-controls">
      <label><input type="checkbox" aria-label="Use enabled workspace skills" checked={applySkills} disabled={!enabledSkillCount} onChange={(event) => setApplySkills(event.target.checked)} /><span>Use enabled workspace skills</span><small>{enabledSkillCount ? `${enabledSkillCount} available · off by default` : "No enabled skills"}</small></label>
      <p>Skills are optional, untrusted guidance. Your question stays primary.</p>
    </div>
    {availableWorkspaceActions.length > 0 && <div className="tutor-action-list" aria-label="Ask Kat about your workspace">
      {availableWorkspaceActions.map(({ label, icon: Icon, prompt }) => <button key={label} type="button" className="tutor-action" disabled={!configured || !model || pending} onClick={() => void ask(prompt)} title={label}><Icon size={14} />{label}</button>)}
    </div>}
    {!configured && <div className="tutor-setup" role="status"><span>{provider === "ollama" ? "Load an installed local model" : provider === "cloudflare" ? "Add a Cloudflare account ID and API token" : `Add a ${providerCatalog[provider].name} API key`} to ask Kat. Credentials are configured in Settings.</span><button className="secondary-button" type="button" onClick={onOpenSettings}><Settings2 size={14} /> Open Settings</button></div>}
    <div ref={conversationRef} className="tutor-conversation" aria-live="polite" onScroll={(event) => {
      const element = event.currentTarget;
      followConversationRef.current = element.scrollHeight - element.scrollTop - element.clientHeight <= 72;
    }}>
      {!messages.length ? <div className="tutor-empty"><BrandMark className="mini-brand" /><p>{context ? "Choose an action above or ask a question. Kat uses this lesson only when it helps." : "What are you working through? Kat can explain a concept, ask guiding questions, or help you practice."}</p></div> : messages.map((message, index) => <article key={`${index}-${message.role}`} className={`tutor-message ${message.role}`}><span className="tutor-message-label">{message.role === "assistant" ? "Kat" : "You"}</span>{message.role === "assistant" ? <AssistantMarkdown content={message.content} /> : <p>{message.content}</p>}{message.role === "assistant" && message.responseProvider && message.responseModel && <div className="tutor-response-route" aria-label={`Response from ${providerCatalog[message.responseProvider].name}, model ${message.responseModel}`}>Via {providerCatalog[message.responseProvider].name} · {message.responseModel}</div>}{message.role === "user" && message.appliedSkills?.length ? <div className="tutor-applied-skills" aria-label="Skills applied to this Kat request">Skills used: {message.appliedSkills.map((skill) => skill.name).join(", ")}</div> : null}{message.role === "user" && message.omittedSkills?.length ? <div className="tutor-omitted-skills">Not included: {message.omittedSkills.map((skill) => `${skill.name} (${skill.reason === "prompt-limit" ? "prompt limit" : "duplicate instructions"})`).join(", ")}</div> : null}</article>)}
      {pending && <div className="tutor-pending" role="status"><span className="pending-dot" /> Kat is thinking…</div>}
    </div>
    {error && <div className="send-error tutor-error" role="alert"><strong>Kat could not answer</strong><span>{error}</span><button type="button" onClick={onOpenSettings}>Open provider settings</button></div>}
    <form className="tutor-composer" onSubmit={send}><textarea ref={composerInputRef} aria-label="Ask Kat a question" value={input} maxLength={8_000} rows={2} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder={configured ? "Ask about the lesson, code, or output…" : "Connect a provider to ask Kat…"} disabled={pending} /><button className="send-button" aria-label="Send question to Kat" disabled={!input.trim() || pending || !configured || !model}><ArrowUp size={17} /></button></form>
    <p className="tutor-footnote">Kat has no web-browsing or code-execution tools and does not claim to run code. Replies are model-generated; check technical details against trusted references. Conversation stays in page memory.</p>
  </section>;
}
