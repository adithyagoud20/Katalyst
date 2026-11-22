"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, Code2, Cpu, LoaderCircle, Sparkles } from "lucide-react";
import type { LessonInteractiveDemo, LessonExecutionConfig } from "@/lib/learning-curriculum";
import type { ExerciseTestCase } from "@/lib/learning-curriculum";
import { completeLesson, emptyLearningProgress, enrollInPath, getExerciseProgress, LEARNING_PROGRESS_KEY, readLearningProgress, updateExerciseProgress, writeLearningProgress } from "@/lib/learning-progress";
import type { ExerciseProgressStatus, LearningProgress } from "@/lib/learning-progress";
import { maskHiddenTestCase, verifyExerciseSubmission } from "@/lib/exercise-verifier";
import type { ExerciseVerificationReport, TestCaseResult } from "@/lib/exercise-verifier";
import type { PendingExample, PlaygroundLanguage } from "@/components/c-playground";

const CodeWorkspace = dynamic(() => import("@/components/code-workspace").then((module) => module.CodeWorkspace), {
  ssr: false,
  loading: () => <div className="lab-component-loading" aria-busy="true">Loading code editor…</div>,
});
const CPlayground = dynamic(() => import("@/components/c-playground").then((module) => module.CPlayground), {
  ssr: false,
  loading: () => <div className="lab-component-loading" aria-busy="true">Loading C compiler…</div>,
});
const CircuitSimulator = dynamic(() => import("@/components/simulators/circuit-simulator").then((module) => module.CircuitSimulator), {
  ssr: false,
  loading: () => <div className="lab-component-loading" aria-busy="true">Loading circuit simulator…</div>,
});
const MemoryVisualizer = dynamic(() => import("@/components/simulators/memory-visualizer").then((module) => module.MemoryVisualizer), {
  ssr: false,
  loading: () => <div className="lab-component-loading" aria-busy="true">Loading memory visualizer…</div>,
});
const ImageLabVisualizer = dynamic(() => import("@/components/simulators/image-lab-visualizer").then((module) => module.ImageLabVisualizer), {
  ssr: false,
  loading: () => <div className="lab-component-loading" aria-busy="true">Loading image lab…</div>,
});

export type LessonToolsProps = {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  exerciseId: string;
  execution?: LessonExecutionConfig;
  initialCode: string;
  exerciseStarterCode?: string;
  testCases: ExerciseTestCase[];
  sampleInput?: string;
  interactiveDemo?: LessonInteractiveDemo;
};

function readSavedProgress(): LearningProgress {
  try {
    const result = readLearningProgress(window.localStorage.getItem(LEARNING_PROGRESS_KEY));
    return result.kind === "valid" || result.kind === "missing" ? result.progress : emptyLearningProgress();
  } catch {
    return emptyLearningProgress();
  }
}

export function LessonTools(props: LessonToolsProps) {
  const [progress, setProgress] = useState<LearningProgress>(() => emptyLearningProgress());
  const [progressReady, setProgressReady] = useState(false);
  const [activeTool, setActiveTool] = useState<"code" | "simulator">(() =>
    /arduino|esp32|breadboard/.test(props.courseId) && props.interactiveDemo?.kind === "circuit"
      ? "simulator"
      : props.execution || props.exerciseStarterCode ? "code" : "simulator"
  );
  const [editorSource, setEditorSource] = useState(props.initialCode || props.exerciseStarterCode || "");
  const [verificationReport, setVerificationReport] = useState<ExerciseVerificationReport | null>(null);
  const [verificationRunning, setVerificationRunning] = useState(false);
  const hasCode = Boolean(props.execution || props.exerciseStarterCode);
  const hasDemo = Boolean(props.interactiveDemo);
  const isComplete = useMemo(() => progress.enrollments
    .find((enrollment) => enrollment.pathId === props.courseId)
    ?.completedLessons.some((item) => item.lessonId === props.lessonId) ?? false,
  [progress, props.courseId, props.lessonId]);
  const exerciseStatus: ExerciseProgressStatus = getExerciseProgress(progress, props.courseId, props.exerciseId);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProgress(readSavedProgress());
      setProgressReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggleComplete = () => {
    const enrolled = progress.enrollments.some((enrollment) => enrollment.pathId === props.courseId);
    const next = completeLesson(
      enrolled ? progress : enrollInPath(progress, props.courseId),
      props.courseId,
      props.lessonId,
    );
    setProgress(next);
    try {
      writeLearningProgress(window.localStorage, next);
    } catch {
      // Keep this session's progress visible when browser storage is unavailable.
    }
  };

  const setExerciseStatus = (status: ExerciseProgressStatus) => {
    const enrolled = progress.enrollments.some((enrollment) => enrollment.pathId === props.courseId);
    if (!enrolled) return;
    const next = updateExerciseProgress(progress, props.courseId, props.exerciseId, status);
    setProgress(next);
    try { writeLearningProgress(window.localStorage, next); } catch { /* Preserve this session's progress if storage is unavailable. */ }
  };

  const verifyExercise = async () => {
    if (!props.execution || props.testCases.length === 0 || verificationRunning) return;
    setVerificationRunning(true);
    setVerificationReport(null);
    try {
      const report = await verifyExerciseSubmission({ language: props.execution.language, code: editorSource, testCases: props.testCases });
      setVerificationReport(report);
      setExerciseStatus(report.allPassed ? "completed" : "attempted");
    } finally {
      setVerificationRunning(false);
    }
  };

  const initialCode = props.initialCode || props.exerciseStarterCode || "";
  const cFamily = props.execution?.language === "c" || props.execution?.language === "cpp";
  const cLanguage: PlaygroundLanguage = props.execution?.language === "cpp" ? "cpp" : "c";
  const pendingExample: PendingExample | null = cFamily && initialCode ? {
    code: initialCode,
    lessonId: props.lessonId,
    lessonTitle: props.lessonTitle,
    requestId: 1,
    sampleInput: props.sampleInput,
    language: cLanguage,
  } : null;

  return (
    <section className="lesson-tools" aria-label="Interactive lesson tools">
      <div className="lesson-tools-heading">
        <div><span className="eyebrow">LEARN BY DOING</span><h2>Put this lesson into practice</h2></div>
        {progressReady && <button type="button" className={isComplete ? "secondary-button" : "primary-button"} onClick={toggleComplete} disabled={isComplete}>
          <Check size={15} /> {isComplete ? "Lesson completed" : "Mark lesson complete"}
        </button>}
      </div>
      <div className="lesson-tools-actions">
        {hasCode && <button type="button" className={activeTool === "code" ? "active" : ""} onClick={() => setActiveTool("code")}><Code2 size={15} /> Code</button>}
        {hasDemo && <button type="button" className={activeTool === "simulator" ? "active" : ""} onClick={() => setActiveTool("simulator")}><Cpu size={15} /> Simulator</button>}
        <Link href={`/tutor?lesson=${encodeURIComponent(props.lessonId)}`}><Sparkles size={15} /> Ask Kat</Link>
      </div>
      {activeTool === "code" && hasCode && cFamily && (
        <CPlayground
          compact
          initialLanguage={cLanguage}
          pendingExample={pendingExample}
          onActivityChange={(activity) => setEditorSource(activity.source)}
        />
      )}
      {activeTool === "code" && hasCode && props.execution && !cFamily && (
        <CodeWorkspace
          language={props.execution.language}
          initialCode={initialCode}
          sampleInput={props.sampleInput}
          lessonId={props.lessonId}
          lessonTitle={props.lessonTitle}
          onActivityChange={(activity) => setEditorSource(activity.source)}
        />
      )}
      {props.execution && props.testCases.length > 0 && activeTool === "code" && <div className="lesson-verifier-card">
        <div><strong>Exercise checks</strong><span>{props.testCases.length} checks</span></div>
        <button type="button" onClick={() => void verifyExercise()} disabled={verificationRunning}>
          {verificationRunning ? <><LoaderCircle size={14} className="spin-icon" /> Checking…</> : "Verify exercise"}
        </button>
        {verificationReport ? <p role="status">{verificationReport.allPassed ? "All checks passed." : `${verificationReport.passedCount} of ${verificationReport.totalCount} checks passed.`}</p> : null}
        {verificationReport?.results.map((result) => {
          const masked: TestCaseResult = maskHiddenTestCase(result);
          return <div className="lesson-verifier-result" key={result.id}><span>{result.passed ? "Passed" : result.skipped ? "Skipped" : "Needs work"}</span><span>{result.label}</span>{!result.hidden && result.error ? <pre>{masked.error}</pre> : null}</div>;
        })}
      </div>}
      {activeTool === "simulator" && props.interactiveDemo && (
        <div className="lesson-simulator-stage">
          {props.interactiveDemo.kind === "circuit" ? <CircuitSimulator initialMode={
            /arduino|breadboard/.test(props.courseId) ? "arduino"
              : /esp32/.test(props.courseId) ? "esp32"
                : props.interactiveDemo.config?.mode === "kmap" ? "kmap"
                  : props.interactiveDemo.config?.mode === "fsm" ? "fsm"
                    : props.interactiveDemo.config?.mode === "toycpu" ? "toycpu"
                      : props.interactiveDemo.config?.mode === "analog" || /circuits-eee/.test(props.courseId) ? "analog"
                        : props.interactiveDemo.config?.mode === "pid" || (/control/.test(props.courseId) && !props.interactiveDemo.config?.mode) ? "pid"
                          : props.interactiveDemo.config?.mode === "fft" ? "fft"
                            : props.interactiveDemo.config?.mode === "dsa" ? "dsa"
                              : props.interactiveDemo.config?.mode === "melody" || props.interactiveDemo.config?.mode === "morse" || props.interactiveDemo.config?.mode === "snake" || props.interactiveDemo.config?.mode === "maze" || props.interactiveDemo.config?.mode === "creative" || /creative/.test(props.courseId)
                                ? (props.interactiveDemo.config?.mode as "melody" | "morse" | "snake" | "maze" | "creative" || "melody")
                                : "digital"
          } />
            : props.interactiveDemo.kind === "memory-diagram" ? <MemoryVisualizer initialScenario={props.interactiveDemo.config?.mode === "heap" ? "heap-lifecycle" : props.interactiveDemo.config?.mode === "pointers" ? "pointers" : "stack-frames"} />
              : props.interactiveDemo.kind === "image-lab" ? <ImageLabVisualizer initialFilter={typeof props.interactiveDemo.config?.filter === "string" ? props.interactiveDemo.config.filter : "none"} />
                : <div className="demo-stage-card">This lesson includes a {props.interactiveDemo.kind} demonstration.</div>}
        </div>
      )}
      {!hasCode && !hasDemo && <p>This lesson is ready to explore. Open the lesson workspace to continue your practice.</p>}
      <div className="lesson-exercise-progress" role="group" aria-label="Exercise progress">
        <span>Exercise status: {exerciseStatus.replaceAll("-", " ")}</span>
        {(["not-started", "attempted", "completed", "needs-review"] as const).map((status) => <button key={status} type="button" aria-pressed={exerciseStatus === status} onClick={() => setExerciseStatus(status)} disabled={!progress.enrollments.some((enrollment) => enrollment.pathId === props.courseId)}>{status.replaceAll("-", " ")}</button>)}
      </div>
    </section>
  );
}
