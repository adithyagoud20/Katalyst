"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, ArrowRight, BookOpen, Bot, Check, ChevronRight, Circle, Code2, Compass, FolderKanban, GraduationCap, Lightbulb, LockKeyhole, MessageSquare, Pin, Play, Sparkles, Terminal } from "lucide-react";
import { AssistantMarkdown } from "@/components/assistant-markdown";
import { KatTutor, type TutorLessonContext } from "@/components/kat-tutor";
import { findLesson, flattenLessons, learningSubjects, type LearningCourse, type LearningSection } from "@/lib/learning-curriculum";
import { defaultCProgram, extractCCode, makeRunnableCProgram } from "@/lib/c-playground";
import { completeLesson, emptyLearningProgress, enrollInPath, getLearningDashboardSummary, getPathProgress, LEARNING_PROGRESS_KEY, readLearningProgress, recordLessonOpened, writeLearningProgress, type LearningProgress } from "@/lib/learning-progress";
import { AI_ACTIVITY_KEY, getAIActivitySummary, readAIActivity, type AIRequestActivity } from "@/lib/ai-activity";
import { providerCatalog, type ProviderId } from "@/lib/providers/catalog";
import type { WorkspaceSkill } from "@/lib/skills";
import { ACCOUNT_LOCAL_CHANGE_EVENT, ACCOUNT_SNAPSHOT_APPLIED_EVENT } from "@/lib/account-data";

const CPlayground = dynamic(
  () => import("@/components/c-playground").then((module) => module.CPlayground),
  { loading: () => <div className="c-playground-loading" role="status">Loading the code workspace…</div> },
);

function shortDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ActivityBars({ days, label }: { days: Array<{ label: string; count: number }>; label: string }) {
  const maximum = Math.max(1, ...days.map((day) => day.count));
  return <ol className="activity-bars" aria-label={label}>{days.map((day, index) => <li key={`${day.label}-${index}`} aria-label={`${day.label}: ${day.count} ${day.count === 1 ? "event" : "events"}`}><span className="activity-bar-track"><i style={{ height: `${day.count ? Math.max(10, Math.round((day.count / maximum) * 100)) : 0}%` }} /></span><small>{day.label}</small><span className="activity-bar-count">{day.count}</span></li>)}</ol>;
}

type WorkspaceSummary = {
  projectCount: number;
  conversationCount: number;
  recentConversations: Array<{ title: string; projectName: string; updatedAt: number; pinned: boolean }>;
  pinnedConversations: Array<{ title: string; projectName: string; updatedAt: number; pinned: boolean }>;
};

export function LearningExperience({
  section,
  onNavigate,
  routeLessonId,
  onOpenSettings,
  provider,
  model,
  modelName,
  sessionKey,
  cloudflareAccountId,
  ollamaBaseUrl,
  configured,
  workspaceSummary,
  skills,
  courses,
}: {
  section: LearningSection;
  onNavigate: (section: LearningSection | "workspace", lessonId?: string) => void;
  routeLessonId?: string;
  onOpenSettings: () => void;
  provider: ProviderId;
  model: string;
  modelName: string;
  sessionKey: string;
  cloudflareAccountId: string;
  ollamaBaseUrl: string;
  configured: boolean;
  workspaceSummary: WorkspaceSummary;
  skills: WorkspaceSkill[];
  courses: LearningCourse[];
}) {
  const [progress, setProgress] = useState<LearningProgress>(emptyLearningProgress);
  const [progressReady, setProgressReady] = useState(false);
  const [progressIssue, setProgressIssue] = useState("");
  const [aiRequests, setAIRequests] = useState<AIRequestActivity[]>([]);
  const [aiActivityIssue, setAIActivityIssue] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id ?? "");
  const course = courses.find((item) => item.id === selectedCourseId) ?? courses[0]!;
  const courseSubject = learningSubjects.find((item) => item.id === course.subjectId);
  const courseMark = (courseSubject?.title ?? course.title).slice(0, 1).toUpperCase();
  const [activeLessonId, setActiveLessonId] = useState(flattenLessons(courses[0]!)[0]?.lesson.id ?? "");
  const [tutorLessonId, setTutorLessonId] = useState("");
  const [workspacePanel, setWorkspacePanel] = useState<"learn" | "code" | "kat">("learn");
  const [smallWorkspace, setSmallWorkspace] = useState(false);
  const [editorActivity, setEditorActivity] = useState({ source: defaultCProgram, diagnostics: "", output: "" });
  const [pendingExample, setPendingExample] = useState<{ code: string; lessonId: string; lessonTitle: string; requestId: number } | null>(null);
  const exampleRequestId = useRef(0);
  const canPersist = useRef(false);
  const savedSnapshot = useRef<string | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1120px)");
    const sync = () => setSmallWorkspace(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const result = readLearningProgress(window.localStorage.getItem(LEARNING_PROGRESS_KEY));
        if (result.kind === "valid" || result.kind === "missing") {
          setProgress(result.progress);
          if (result.kind === "valid" && !result.progress.enrollments.some((item) => item.pathId === courses[0]?.id)) {
            const savedCourse = result.progress.enrollments.find((enrollment) => courses.some((item) => item.id === enrollment.pathId));
            if (savedCourse) setSelectedCourseId(savedCourse.pathId);
          }
          canPersist.current = true;
        } else {
          setProgressIssue(result.issue);
        }
        savedSnapshot.current = result.kind === "valid" ? JSON.stringify(result.progress) : null;
      } catch {
        setProgressIssue("Browser storage is unavailable. Learning progress will stay in memory for this visit.");
      }
      setProgressReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [courses]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const result = readAIActivity(window.localStorage.getItem(AI_ACTIVITY_KEY));
        if (result.kind === "valid" || result.kind === "missing") setAIRequests(result.activity.requests);
        else setAIActivityIssue(result.issue);
      } catch {
        setAIActivityIssue("AI request analytics are unavailable because browser storage could not be read.");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const routeCourse = routeLessonId ? courses.find((candidate) => findLesson(candidate, routeLessonId)) : undefined;
    if (section !== "lesson" || !routeLessonId || !routeCourse) return;
    const timer = window.setTimeout(() => {
      setSelectedCourseId(routeCourse.id);
      setActiveLessonId(routeLessonId);
      setWorkspacePanel("learn");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [courses, routeLessonId, section]);

  useEffect(() => {
    if (!progressReady || !canPersist.current) return;
    const snapshot = JSON.stringify(progress);
    if (snapshot === savedSnapshot.current) return;
    try {
      writeLearningProgress(window.localStorage, progress);
      savedSnapshot.current = snapshot;
      window.dispatchEvent(new Event(ACCOUNT_LOCAL_CHANGE_EVENT));
    } catch {
      window.setTimeout(() => setProgressIssue("Learning progress could not be saved. Your existing progress record was left in place."), 0);
    }
  }, [progress, progressReady]);

  useEffect(() => {
    const restoreAccountProgress = () => {
      const result = readLearningProgress(window.localStorage.getItem(LEARNING_PROGRESS_KEY));
      if (result.kind !== "valid" && result.kind !== "missing") {
        setProgressIssue(result.issue);
        return;
      }
      canPersist.current = true;
      savedSnapshot.current = result.kind === "valid" ? JSON.stringify(result.progress) : JSON.stringify(emptyLearningProgress());
      setProgress(result.progress);
      setProgressIssue("");
    };
    window.addEventListener(ACCOUNT_SNAPSHOT_APPLIED_EVENT, restoreAccountProgress);
    return () => window.removeEventListener(ACCOUNT_SNAPSHOT_APPLIED_EVENT, restoreAccountProgress);
  }, []);

  const lessonEntries = useMemo(() => flattenLessons(course), [course]);
  const locatedLesson = findLesson(course, activeLessonId) ?? lessonEntries[0];
  const lesson = locatedLesson?.lesson;
  const lessonModule = locatedLesson?.module;
  const currentIndex = lessonEntries.findIndex((entry) => entry.lesson.id === lesson?.id);
  const pathState = useMemo(() => getPathProgress(progress, course), [course, progress]);
  const learningSummary = useMemo(() => getLearningDashboardSummary(progress), [progress]);
  const aiSummary = useMemo(() => getAIActivitySummary(aiRequests), [aiRequests]);
  const enrollment = pathState.enrollment;
  const enrolled = Boolean(enrollment);
  const completedIds = new Set(enrollment?.completedLessons.map((item) => item.lessonId) ?? []);
  const recentActivity = [...(enrollment?.activity ?? [])].reverse().slice(0, 4);
  const tutorEntry = findLesson(course, tutorLessonId);
  const tutorContext: TutorLessonContext | undefined = tutorEntry
    ? { path: course, module: tutorEntry.module, lesson: tutorEntry.lesson }
    : undefined;
  const currentTutorContext: TutorLessonContext | undefined = lesson && lessonModule
    ? { path: course, module: lessonModule, lesson }
    : tutorContext;
  const usesCPlayground = course.subjectId === "c-programming";

  const openLesson = (lessonId: string, pathId = course.id) => {
    const targetCourse = courses.find((item) => item.id === pathId) ?? course;
    if (targetCourse.id !== course.id) setWorkspacePanel("learn");
    setSelectedCourseId(targetCourse.id);
    setActiveLessonId(lessonId);
    setTutorLessonId("");
    setProgress((current) => recordLessonOpened(current, targetCourse.id, lessonId));
    onNavigate("lesson", lessonId);
  };
  const selectCourse = (nextCourse: LearningCourse) => {
    setSelectedCourseId(nextCourse.id);
    setActiveLessonId(flattenLessons(nextCourse)[0]?.lesson.id ?? "");
    setTutorLessonId("");
    setWorkspacePanel("learn");
  };
  const continueLearning = () => {
    const nextLesson = pathState.nextLesson?.lesson ?? pathState.lastOpenedLesson?.lesson ?? lessonEntries[0]?.lesson;
    if (nextLesson) openLesson(nextLesson.id);
    else onNavigate("paths");
  };
  const startPath = () => {
    if (enrolled) {
      continueLearning();
      return;
    }
    setProgress((current) => enrollInPath(current, course.id));
    const firstLesson = lessonEntries[0]?.lesson;
    if (firstLesson) openLesson(firstLesson.id);
  };
  const askKatAboutLesson = () => {
    setTutorLessonId(lesson?.id ?? "");
    setWorkspacePanel("kat");
  };
  const openExampleInPlayground = () => {
    if (!lesson) return;
    const example = extractCCode(lesson.content);
    if (!example) return;
    exampleRequestId.current += 1;
    setPendingExample({
      code: makeRunnableCProgram(example),
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      requestId: exampleRequestId.current,
    });
  };
  const showTutorPage = section === "tutor";
  const progressBar = <div className="progress-track" role="progressbar" aria-label={`${course.title} progress`} aria-valuenow={pathState.completionPercent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: pathState.completionPercent + "%" }} /></div>;

  return <div className={"learning-view learning-" + section}>
    {progressIssue && <div className="learning-storage-note" role="status">{progressIssue}</div>}

    {showTutorPage && <header className="learning-page-heading tutor-page-heading"><span className="eyebrow">AI TUTOR · KAT</span><h1>Learn it in the way<br /><em>that works for you.</em></h1><p>Choose a teaching style, then ask a question. Kat uses your selected model provider; replies are kept only in this page session.</p>{!enrolled && <button className="learning-text-button" onClick={() => onNavigate("paths")}>Explore a course to ask about a specific lesson <ArrowRight size={14} /></button>}</header>}
    <section className={`learning-tutor-host${showTutorPage ? " page" : ""}`} hidden={!showTutorPage} aria-label="Kat tutor">
      <KatTutor provider={provider} model={model} modelName={modelName} sessionKey={sessionKey} cloudflareAccountId={cloudflareAccountId} ollamaBaseUrl={ollamaBaseUrl} configured={configured} context={tutorContext} skills={skills} onOpenSettings={onOpenSettings} onOpenLesson={() => { if (tutorEntry) { setActiveLessonId(tutorEntry.lesson.id); onNavigate("lesson", tutorEntry.lesson.id); } else onNavigate("paths"); }} />
    </section>
    <div className="learning-playground-host" hidden={section !== "playground"}>
      {section === "playground" && <CPlayground pendingExample={pendingExample} autoInitialize compact={false} onReturnToLesson={(lessonId) => onNavigate("lesson", lessonId)} />}
    </div>

    {section === "home" && <>
      <section className="learning-hero">
        <div className="learning-hero-copy"><span className="eyebrow">YOUR ENGINEERING JOURNEY STARTS HERE</span><h1>Learn by understanding<br /><em>how the pieces work.</em></h1><p>Structured lessons, purposeful practice, and a tutor you can configure around the way you learn.</p><div className="learning-hero-actions"><button className="primary-button" onClick={() => enrolled ? continueLearning() : onNavigate("paths")}>{enrolled ? <Play size={15} /> : <Compass size={15} />}{enrolled ? "Continue learning" : "Explore your first path"}<ArrowRight size={15} /></button><button className="learning-text-button" onClick={() => onNavigate("practice")}>Go to Practice Lab</button></div></div>
        <div className="learning-hero-art" aria-label={`${course.title} learning example`}>{usesCPlayground ? <><div className="hero-art-label"><span className="hero-live-dot" /> A PROGRAM, IN THREE STEPS</div><div className="hero-code-line"><span className="code-number">01</span><span><b>#include</b> &lt;stdio.h&gt;</span></div><div className="hero-code-line"><span className="code-number">02</span><span><b>int</b> main(void) {"{"}</span></div><div className="hero-code-line indent"><span className="code-number">03</span><span>printf(&quot;Hello, C!\n&quot;);</span></div><div className="hero-code-line"><span className="code-number">04</span><span>{"}"}</span></div><div className="hero-art-footer"><span>source</span><i /><span>compile</span><i /><span>run</span><span className="hero-output">Hello, C!</span></div></> : <><div className="hero-art-label"><span className="hero-live-dot" /> YOUR NEXT COURSE</div><div className="hero-code-line"><span className="code-number">01</span><span>{courseSubject?.title ?? "Subject"}</span></div><div className="hero-code-line"><span className="code-number">02</span><span>{course.modules.length} ordered modules</span></div><div className="hero-code-line"><span className="code-number">03</span><span>{lessonEntries.length} focused lessons</span></div><div className="hero-art-footer"><span>learn</span><i /><span>practice</span><i /><span>review</span></div></>}</div>
      </section>
      <div className="learning-section-head"><div><span className="eyebrow">A PLACE TO BEGIN</span><h2>Your learning space</h2></div><button className="learning-text-button" onClick={() => onNavigate("paths")}>Browse paths <ArrowRight size={14} /></button></div>
      <section className="learning-home-grid">
        <article className="home-path-feature"><div className="feature-kicker"><span>{courseMark}</span><span>FEATURED COURSE · {course.level.toUpperCase()}</span></div><h3>{course.title}</h3><p>{course.description}</p>{enrolled ? <>{progressBar}<div className="progress-caption"><span>{pathState.completedCount} of {pathState.totalLessons} lessons completed</span><strong>{pathState.completionPercent}%</strong></div><button className="feature-link" onClick={() => pathState.nextLesson ? openLesson(pathState.nextLesson.lesson.id) : onNavigate("progress")}>{pathState.nextLesson ? "Continue: " + pathState.nextLesson.lesson.title : "Review your progress"}<ArrowRight size={14} /></button></> : <button className="feature-link" onClick={() => onNavigate("paths")}>Preview the curriculum <ArrowRight size={14} /></button>}</article>
        <article className="home-next-feature"><span className="eyebrow">{enrolled ? "PICK UP WHERE YOU LEFT OFF" : "A THOUGHTFUL FIRST STEP"}</span><div className="next-feature-icon"><BookOpen size={18} /></div><h3>{enrolled ? pathState.nextLesson?.lesson.title ?? "Course complete" : "Start with the first idea"}</h3><p>{enrolled ? pathState.nextLesson?.lesson.summary ?? "You have completed every lesson in this course." : lessonEntries[0]?.lesson.summary ?? course.description}</p><button className="secondary-button" onClick={() => enrolled && pathState.nextLesson ? openLesson(pathState.nextLesson.lesson.id) : onNavigate("paths")}>{enrolled && pathState.nextLesson ? "Open next lesson" : "View course"}<ArrowRight size={14} /></button></article>
      </section>
      <section className="learning-activity-strip"><div><span className="eyebrow">RECENT ACTIVITY</span><h2>Your steps, as they happen</h2></div>{recentActivity.length ? <ol>{recentActivity.map((item, index) => { const title = item.lessonId ? findLesson(course, item.lessonId)?.lesson.title : undefined; const action = item.kind === "enrolled" ? `Started ${course.title}` : (item.kind === "lesson-completed" ? "Completed " : "Opened ") + (title ?? "a lesson"); return <li key={item.kind + "-" + item.at + "-" + index}><span className={"activity-mark " + item.kind} /><span>{action}</span><time>{shortDate(item.at)}</time></li>; })}</ol> : <p>Your activity will appear here after you start a path and open a lesson.</p>}</section>
    </>}

    {section === "paths" && <>
      <header className="learning-page-heading"><span className="eyebrow">EXPLORE LEARNING PATHS</span><h1>Build a foundation<br /><em>one clear idea at a time.</em></h1><p>Focused engineering paths with real lesson content and practice. The library starts small on purpose.</p></header>
      {courses.length > 1 && <nav className="course-choice-grid" aria-label="Available courses">{courses.map((item) => <button type="button" key={item.id} className={item.id === course.id ? "selected" : ""} aria-pressed={item.id === course.id} onClick={() => selectCourse(item)}><span>{learningSubjects.find((subject) => subject.id === item.subjectId)?.title ?? "Course"} · {item.level}</span><strong>{item.title}</strong><small>{item.description}</small><small>{flattenLessons(item).length} lessons · {item.modules.length} modules</small></button>)}</nav>}
      <section className="path-detail-shell"><div className="path-detail-main"><div className="path-subject-mark">{courseMark}</div><div className="path-label-row"><span>{(courseSubject?.title ?? "COURSE").toUpperCase()}</span><span>{course.level.toUpperCase()}</span><span>{lessonEntries.length} LESSONS</span></div><h2>{course.title}</h2><p className="path-description">{course.description}</p><div className="path-divider" /><h3>What you will be able to do</h3><ul className="objective-list">{course.learningOutcomes.map((outcome) => <li key={outcome}><Check size={15} />{outcome}</li>)}</ul><h3>Before you begin</h3><ul className="prerequisite-list">{course.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul><button className="primary-button path-start-button" onClick={startPath}><Play size={15} />{enrolled ? "Continue this course" : "Start learning"}<ArrowRight size={15} /></button>{enrolled && <span className="enrollment-confirmation">You started this course on {shortDate(enrollment!.enrolledAt)}.</span>}</div>
        <div className="path-curriculum"><div className="curriculum-heading"><div><span className="eyebrow">THE CURRICULUM</span><h3>{lessonEntries.length} lessons. {course.modules.length} modules.</h3></div><span className="curriculum-count">{enrolled ? pathState.completedCount + "/" + pathState.totalLessons + " done" : "PREVIEW"}</span></div>{course.modules.map((item) => <section className="curriculum-module" key={item.id}><header><span className="module-index">{String(item.order).padStart(2, "0")}</span><div><h4>{item.title}</h4><p>{item.summary}</p></div></header><ol>{item.lessons.map((entry) => { const done = completedIds.has(entry.id); return <li key={entry.id}><button disabled={!enrolled} className={done ? "lesson-complete" : ""} onClick={() => openLesson(entry.id)}><span className="lesson-state">{done ? <Check size={13} /> : enrolled ? <Circle size={12} /> : <LockKeyhole size={12} />}</span><span><strong>{entry.title}</strong><small>{entry.summary}</small></span>{enrolled && <ChevronRight size={14} />}</button></li>; })}</ol></section>)}{!enrolled && <p className="curriculum-lock-note"><LockKeyhole size={13} /> Start this path to open lessons and record your progress.</p>}</div></section>
    </>}

    {section === "my-learning" && <>
      <header className="learning-page-heading compact"><span className="eyebrow">MY LEARNING</span><h1>Your paths,<br /><em>your pace.</em></h1><p>Only paths you choose appear here. There is no streak or score to keep up with.</p></header>
      {enrolled ? <section className="my-learning-row"><div className="path-subject-mark">{courseMark}</div><div className="my-learning-copy"><span className="path-label-row">{(courseSubject?.title ?? "COURSE").toUpperCase()} · STARTED {shortDate(enrollment!.enrolledAt)}</span><h2>{course.title}</h2><p>{course.description}</p>{progressBar}<span className="my-learning-caption">{pathState.completedCount} of {pathState.totalLessons} lessons complete</span></div><button className="secondary-button" onClick={() => pathState.nextLesson ? openLesson(pathState.nextLesson.lesson.id) : onNavigate("progress")}>{pathState.nextLesson ? "Continue" : "View progress"}<ArrowRight size={14} /></button></section> : <section className="learning-empty-state"><div className="empty-state-icon"><GraduationCap size={23} /></div><span className="eyebrow">A FRESH PAGE</span><h2>Your learning starts when you do.</h2><p>Explore the available courses to see their real lessons and decide which fits your goals.</p><button className="primary-button" onClick={() => onNavigate("paths")}>Explore courses <ArrowRight size={15} /></button></section>}
    </>}

    {section === "practice" && <>
      <header className="learning-page-heading compact"><span className="eyebrow">PRACTICE LAB</span><h1>Make your thinking<br /><em>visible.</em></h1><p>Practice exercises from {course.title}. Work through each prompt, then open an optional suggested answer.</p><span className="practice-boundary"><Lightbulb size={15} /> Exercises and checkpoints are self-checks. They are not automatically graded.</span></header>
      <div className="practice-list">{lessonEntries.map((entry, index) => <article className="practice-card" key={entry.lesson.exercise.id}><div className="practice-number">{String(index + 1).padStart(2, "0")}</div><div className="practice-card-content"><span className="eyebrow">{entry.module.title} · {entry.lesson.exercise.difficulty}</span><h2>{entry.lesson.exercise.title}</h2><p>{entry.lesson.exercise.prompt}</p><p className="practice-outcome"><strong>Practice goal:</strong> {entry.lesson.exercise.expectedOutcome}</p>{entry.lesson.exercise.starterCode && <details><summary><span>View starter code</span><ChevronRight size={14} /></summary><pre className="practice-starter-code"><code>{entry.lesson.exercise.starterCode}</code></pre></details>}<details><summary><span>Reveal one possible answer</span><ChevronRight size={14} /></summary><div className="practice-answer"><AssistantMarkdown content={entry.lesson.exercise.solution} />{entry.lesson.exercise.hint && <p>Hint: {entry.lesson.exercise.hint}</p>}</div></details></div><button className="practice-lesson-link" onClick={() => openLesson(entry.lesson.id)} aria-label={"Open lesson: " + entry.lesson.title}><BookOpen size={15} /> Lesson<ArrowRight size={13} /></button></article>)}</div>
    </>}

    {section === "progress" && <>
      <header className="learning-page-heading compact progress-dashboard-heading"><span className="eyebrow">YOUR LOCAL DASHBOARD</span><h1>See what you have<br /><em>worked through.</em></h1><p>Progress is based on activity saved in this browser. Lesson completion is always your choice.</p><span className="local-analytics-label"><span />Local analytics · not synced</span></header>
      <section className="dashboard-metrics" aria-label="Learning overview">
        <article><span>Lessons completed</span><strong>{learningSummary.lessonsCompleted}<small> of {learningSummary.totalLessons} lessons</small></strong><button onClick={() => onNavigate("paths")}>View curriculum <ArrowRight size={13} /></button></article>
        <article><span>Paths started</span><strong>{learningSummary.pathsStarted}<small> of {learningSummary.totalPaths} paths</small></strong><button onClick={() => onNavigate("my-learning")}>My learning <ArrowRight size={13} /></button></article>
        <article><span>Paths completed</span><strong>{learningSummary.pathsCompleted}<small> of {learningSummary.totalPaths} paths</small></strong><span className="metric-caption">Based on completed lessons</span></article>
        <article><span>Learning streak</span><strong>{learningSummary.streak}<small> {learningSummary.streak === 1 ? "day" : "days"}</small></strong><span className="metric-caption">Consecutive days with recorded activity</span></article>
      </section>

      <section className="dashboard-section activity-dashboard-section">
        <div className="dashboard-section-heading"><div><span className="eyebrow">LAST SEVEN DAYS</span><h2>Learning activity</h2></div><span className="dashboard-section-note">Enrollment, lesson opens, and completions</span></div>
        {learningSummary.recentActivity.length ? <div className="dashboard-chart-layout"><ActivityBars days={learningSummary.days} label="Learning events over the last seven days" /><ol className="dashboard-recent-list">{learningSummary.recentActivity.slice(0, 4).map((item, index) => <li key={`${item.pathId}-${item.at}-${index}`}><span className="dashboard-event-icon"><BookOpen size={14} /></span><span><strong>{item.lessonTitle ?? item.pathTitle}</strong><small>{item.kind === "lesson-completed" ? "Lesson marked complete" : item.kind === "lesson-opened" ? "Lesson opened" : "Path started"} · {shortDate(item.at)}</small></span></li>)}</ol></div> : <div className="dashboard-empty"><BookOpen size={17} /><span>Learning activity will appear after you start a path or open a lesson.</span><button className="learning-text-button" onClick={() => onNavigate("paths")}>Explore paths <ArrowRight size={13} /></button></div>}
        {learningSummary.recentLessons.length > 0 && <div className="dashboard-recent-lessons"><span>Recent lessons</span>{learningSummary.recentLessons.slice(0, 3).map((item, index) => <button key={`${item.pathId}-${item.lessonId}-${item.at}-${index}`} onClick={() => item.lessonId && openLesson(item.lessonId, item.pathId)}>{item.lessonTitle}<small>{item.kind === "lesson-completed" ? "Completed" : "Opened"} · {shortDate(item.at)}</small></button>)}</div>}
      </section>

      <section className="dashboard-section ai-dashboard-section">
        <div className="dashboard-section-heading"><div><span className="eyebrow">MODEL REQUESTS</span><h2>AI activity</h2></div><button className="learning-text-button" onClick={onOpenSettings}>Provider settings <ArrowRight size={13} /></button></div>
        {aiActivityIssue ? <p className="dashboard-data-issue" role="status">{aiActivityIssue}</p> : aiSummary.requestCount ? <>
          <div className="ai-summary-line"><strong>{aiSummary.requestCount}</strong><span>{aiSummary.requestCount === 1 ? " request" : " requests"} recorded · failed and stopped attempts are included</span></div>
          <p className="analytics-retention-note">These totals cover up to 500 recent requests stored in this browser.</p>
          <div className="dashboard-chart-layout"><ActivityBars days={aiSummary.days} label="AI requests over the last seven days" /><div className="ai-activity-details">
            <div><h3>By provider</h3>{aiSummary.providers.map(({ provider: providerId, count }) => <p key={providerId}><span>{providerCatalog[providerId].name}</span><strong>{count}</strong></p>)}</div>
            <div><h3>Most recent models</h3>{aiSummary.models.slice(0, 3).map(({ key, provider: providerId, count }) => <p key={key}><span>{providerCatalog[providerId].name} · {key.slice(providerId.length + 1)}</span><strong>{count}</strong></p>)}</div>
          </div></div>
          <div className="reported-usage" aria-label="Provider-reported token usage"><span><strong>{aiSummary.inputTokens?.toLocaleString() ?? "—"}</strong>{" "}input tokens reported in {aiSummary.inputTokenRequests} {aiSummary.inputTokenRequests === 1 ? "request" : "requests"}</span><span><strong>{aiSummary.outputTokens?.toLocaleString() ?? "—"}</strong>{" "}output tokens reported in {aiSummary.outputTokenRequests} {aiSummary.outputTokenRequests === 1 ? "request" : "requests"}</span></div>
        </> : <div className="dashboard-empty"><Bot size={17} /><span>AI requests will appear here after you ask Kat or send a workspace message. Prompts and credentials are not included.</span><button className="learning-text-button" onClick={() => onNavigate("workspace")}>Open workspace <ArrowRight size={13} /></button></div>}
      </section>

      <section className="dashboard-section workspace-dashboard-section">
        <div className="dashboard-section-heading"><div><span className="eyebrow">YOUR WORKSPACE</span><h2>Projects and conversations</h2></div><button className="learning-text-button" onClick={() => onNavigate("workspace")}>Open workspace <ArrowRight size={13} /></button></div>
        <div className="workspace-dashboard-counts"><span><FolderKanban size={15} />{workspaceSummary.projectCount} {workspaceSummary.projectCount === 1 ? "project" : "projects"}</span><span><MessageSquare size={15} />{workspaceSummary.conversationCount} {workspaceSummary.conversationCount === 1 ? "conversation" : "conversations"}</span><span><Pin size={15} />{workspaceSummary.pinnedConversations.length} pinned shown</span></div>
        <div className="workspace-dashboard-lists"><div><h3>Recent conversations</h3>{workspaceSummary.recentConversations.length ? <ol>{workspaceSummary.recentConversations.map((conversation, index) => <li key={`${conversation.projectName}-${conversation.title}-${index}`}><span><strong>{conversation.title || "Untitled conversation"}</strong><small>{conversation.projectName}</small></span><time dateTime={new Date(conversation.updatedAt).toISOString()}>{shortDate(conversation.updatedAt)}</time></li>)}</ol> : <p>No conversations saved yet.</p>}</div><div><h3>Pinned conversations</h3>{workspaceSummary.pinnedConversations.length ? <ol>{workspaceSummary.pinnedConversations.map((conversation, index) => <li key={`${conversation.projectName}-${conversation.title}-${index}`}><span><strong>{conversation.title || "Untitled conversation"}</strong><small>{conversation.projectName}</small></span></li>)}</ol> : <p>Pin a conversation from the workspace sidebar to keep it here.</p>}</div></div>
      </section>
    </>}

    {section === "lesson" && lesson && lessonModule && <section className="learning-workspace" aria-label="Integrated learning workspace">
      <header className="learning-workspace-header">
        <nav className="lesson-topline" aria-label="Breadcrumb"><button className="learning-back-button" onClick={() => onNavigate("paths")}><ArrowLeft size={14} /> Learning paths</button><span className="lesson-crumb-separator">/</span><button className="lesson-path-crumb" onClick={() => onNavigate("paths")}>{course.title}</button><span className="lesson-crumb-separator">/</span><span className="lesson-current-crumb" aria-current="page">{lesson.title}</span><span>{String(currentIndex + 1).padStart(2, "0")} / {String(lessonEntries.length).padStart(2, "0")}</span></nav>
        <div className="learning-workspace-mobile-tabs" role="tablist" aria-label="Learning workspace panels">
          <button type="button" role="tab" aria-selected={workspacePanel === "learn"} aria-controls="learning-panel" onClick={() => setWorkspacePanel("learn")}><BookOpen size={15} />Learn</button>
          {usesCPlayground && <button type="button" role="tab" aria-selected={workspacePanel === "code"} aria-controls="coding-panel" onClick={() => setWorkspacePanel("code")}><Code2 size={15} />Code</button>}
          <button type="button" role="tab" aria-selected={workspacePanel === "kat"} aria-controls="kat-panel" onClick={() => setWorkspacePanel("kat")}><Bot size={15} />Kat</button>
        </div>
      </header>
      <div className={`learning-workspace-grid${usesCPlayground ? "" : " learning-workspace-grid-no-code"}`}>
        <aside id="learning-panel" className={`learning-workspace-panel learning-panel${workspacePanel === "learn" ? " panel-active" : ""}`} role="tabpanel" aria-label="Lesson and course content" aria-hidden={smallWorkspace && workspacePanel !== "learn"} inert={smallWorkspace && workspacePanel !== "learn"}>
          <div className="workspace-panel-heading"><span className="eyebrow">LEARN · {course.title}</span><h1>{lesson.title}</h1><p>{lesson.summary}</p></div>
          <details className="workspace-course-nav"><summary><Compass size={15} />Course navigation<ChevronRight size={14} /></summary>
            {course.modules.map((item) => <section key={item.id}><h3><span>{String(item.order).padStart(2, "0")}</span>{item.title}</h3><ol>{item.lessons.map((entry) => <li key={entry.id}><button className={(entry.id === lesson.id ? "current " : "") + (completedIds.has(entry.id) ? "completed" : "")} onClick={() => openLesson(entry.id)}><span>{completedIds.has(entry.id) ? <Check size={12} /> : <Circle size={10} />}</span>{entry.title}</button></li>)}</ol></section>)}
          </details>
          <div className="lesson-objectives"><span>LESSON OBJECTIVES</span><ul>{lesson.objectiveIds.map((id) => { const objective = course.objectives.find((item) => item.id === id); return objective ? <li key={id}><Check size={13} />{objective.title}</li> : null; })}</ul></div>
          <article className="lesson-panel-content"><div className="lesson-meta"><span>{lessonModule.title}</span><span>{course.level}</span></div><div className="lesson-copy"><AssistantMarkdown content={lesson.content} /></div></article>
          {lesson.exampleRun && <section className="lesson-example-run" aria-label="Expected output for the lesson example">
            <div className="lesson-example-run-heading"><span>EXAMPLE RUN</span><p>Expected result for the code above. This reference is not graded.</p></div>
            {lesson.exampleRun.sampleInput !== undefined && <div className="lesson-example-input"><span>Sample input</span><pre><code>{lesson.exampleRun.sampleInput}</code></pre></div>}
            <div className="lesson-example-output"><span>Expected output</span><pre><code>{lesson.exampleRun.expectedOutput}</code></pre></div>
            {lesson.exampleRun.expectedFiles?.map((file) => <div className="lesson-example-file" key={file.path}><span>Expected file</span><strong>{file.path}</strong><pre><code>{file.content}</code></pre></div>)}
          </section>}
          {usesCPlayground && extractCCode(lesson.content) && <section className="lesson-experiment"><div><span className="eyebrow">TRY IT IN THE EDITOR</span><h2>Change one thing, then predict the result.</h2><p>This loads the lesson example into the local C11 editor. Your edits remain in this browser.</p></div><button type="button" className="secondary-button" onClick={openExampleInPlayground}><Code2 size={14} /> Load lesson example</button></section>}
          <section className="lesson-checkpoint"><div className="checkpoint-kicker"><Lightbulb size={15} /> CHECK YOUR UNDERSTANDING</div><p>{lesson.checkpoint.prompt}</p><details><summary>Reveal a short explanation <ChevronRight size={14} /></summary><p>{lesson.checkpoint.answer}</p></details><button className="secondary-button" onClick={askKatAboutLesson}><Sparkles size={14} /> Ask Kat for a hint</button></section>
          {enrolled ? <button className={"lesson-complete-button" + (completedIds.has(lesson.id) ? " is-complete" : "")} onClick={() => setProgress((current) => completeLesson(current, course.id, lesson.id))}>{completedIds.has(lesson.id) ? <><Check size={15} /> Lesson completed</> : <>Mark lesson complete <Check size={15} /></>}</button> : <div className="lesson-enroll-callout"><span>Start the path to save your learning progress.</span><button className="primary-button" onClick={() => setProgress((current) => enrollInPath(current, course.id))}>Start this path <ArrowRight size={14} /></button></div>}
          <div className="lesson-progress-mini"><span className="eyebrow">PATH PROGRESS</span><strong>{pathState.completedCount} / {pathState.totalLessons}</strong><span>lessons completed · {pathState.completionPercent}%</span>{progressBar}</div>
          <nav className="lesson-pagination" aria-label="Lesson navigation"><button disabled={currentIndex <= 0} onClick={() => openLesson(lessonEntries[currentIndex - 1]?.lesson.id ?? lesson.id)}><ArrowLeft size={14} /><span><small>PREVIOUS</small>{lessonEntries[currentIndex - 1]?.lesson.title ?? "First lesson"}</span></button><button disabled={currentIndex >= lessonEntries.length - 1} onClick={() => openLesson(lessonEntries[currentIndex + 1]?.lesson.id ?? lesson.id)}><span><small>NEXT LESSON</small>{lessonEntries[currentIndex + 1]?.lesson.title ?? "Path complete"}</span><ArrowRight size={14} /></button></nav>
        </aside>
        {usesCPlayground && <section id="coding-panel" className={`learning-workspace-panel learning-code-panel${workspacePanel === "code" ? " panel-active" : ""}`} role="tabpanel" aria-label="C11 coding workspace" aria-hidden={smallWorkspace && workspacePanel !== "code"} inert={smallWorkspace && workspacePanel !== "code"}>
          <div className="workspace-panel-heading code-panel-heading"><span className="eyebrow"><Terminal size={13} /> CODE · LOCAL C11 SANDBOX</span><h2>Try the idea yourself</h2><p>Edit, compile, and inspect output without leaving this lesson.</p></div>
          <CPlayground pendingExample={pendingExample} autoInitialize compact onReturnToLesson={(lessonId) => onNavigate("lesson", lessonId)} onActivityChange={setEditorActivity} />
        </section>}
        <section id="kat-panel" className={`learning-workspace-panel learning-kat-panel${workspacePanel === "kat" ? " panel-active" : ""}`} role="tabpanel" aria-label="Kat AI tutor" aria-hidden={smallWorkspace && workspacePanel !== "kat"} inert={smallWorkspace && workspacePanel !== "kat"}>
          <KatTutor provider={provider} model={model} modelName={modelName} sessionKey={sessionKey} cloudflareAccountId={cloudflareAccountId} ollamaBaseUrl={ollamaBaseUrl} configured={configured} context={currentTutorContext} workspaceActivity={usesCPlayground ? editorActivity : undefined} skills={skills} onOpenSettings={onOpenSettings} onOpenLesson={() => setWorkspacePanel("learn")} />
        </section>
      </div>
    </section>}

  </div>;
}
