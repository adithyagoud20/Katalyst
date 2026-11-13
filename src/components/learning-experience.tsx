"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Code2,
  Compass,
  FolderKanban,
  GraduationCap,
  Lightbulb,
  Loader2,
  LockKeyhole,
  MessageSquare,
  Pin,
  Play,
  Sparkles,
  Terminal,
  X,
  XCircle,
} from "lucide-react";
import { AssistantMarkdown } from "@/components/assistant-markdown";
import { KatTutor, type TutorLessonContext } from "@/components/kat-tutor";
import { CodeWorkspace } from "@/components/code-workspace";
import { MemoryVisualizer } from "@/components/simulators/memory-visualizer";
import { CircuitSimulator } from "@/components/simulators/circuit-simulator";
import { SimulatorErrorBoundary } from "@/components/simulators/simulator-error-boundary";
import type { ExecutionLanguage } from "@/lib/execution/types";
import {
  verifyExerciseSubmission,
  maskHiddenTestCase,
  type ExerciseVerificationReport,
  type TestCaseResult,
} from "@/lib/exercise-verifier";
import {
  findLesson,
  flattenLessons,
  learningSubjects,
  resolveLessonExecution,
  resolveLessonHints,
  resolveLessonType,
  type LearningCourse,
  type LearningSection,
  type LessonType,
} from "@/lib/learning-curriculum";
import { defaultCProgram, extractCCode, makeRunnableCProgram } from "@/lib/c-playground";
import {
  completeLesson,
  emptyLearningProgress,
  enrollInPath,
  getExerciseProgress,
  getLearningDashboardSummary,
  getPathProgress,
  LEARNING_PROGRESS_KEY,
  readLearningProgress,
  recordLessonOpened,
  updateExerciseProgress,
  writeLearningProgress,
  type ExerciseProgressStatus,
  type LearningProgress,
} from "@/lib/learning-progress";
import { AI_ACTIVITY_KEY, getAIActivitySummary, readAIActivity, type AIRequestActivity } from "@/lib/ai-activity";
import { providerCatalog, type ProviderId } from "@/lib/providers/catalog";
import type { WorkspaceSkill } from "@/lib/skills";
import { ACCOUNT_LOCAL_CHANGE_EVENT, ACCOUNT_SNAPSHOT_APPLIED_EVENT } from "@/lib/account-data";
import {
  readWorkspaceLayout,
  writeWorkspaceLayout,
  DEFAULT_WORKSPACE_LAYOUT,
  type WorkspaceLayout,
} from "@/lib/workspace-layout";

import { CPlayground } from "@/components/c-playground";

const defaultPythonProgram = `# Python Sandbox
# Write Python code below and click "Run"

def main():
    print("Hello from KATALYST Python sandbox!")

if __name__ == "__main__":
    main()
`;

const defaultJavaScriptProgram = `// JavaScript Sandbox
// Write ES2024 JavaScript below and click "Run"

function main() {
  console.log("Hello from KATALYST JavaScript sandbox!");
}

main();
`;

function extractLessonCode(
  lesson: { content: string; codeExamples?: Array<{ language?: string; code: string }> },
  language: ExecutionLanguage
): string | null {
  if (lesson.codeExamples && lesson.codeExamples.length > 0) {
    const matching = lesson.codeExamples.find((ex) => ex.language === language);
    if (matching?.code) return matching.code;
  }
  if (language === "c") {
    return extractCCode(lesson.content) ?? null;
  }
  const tag = language === "python" ? "(?:python|py)" : language === "javascript" ? "(?:javascript|js)" : language;
  const regex = new RegExp(`(?:^|\\n)(?:~~~|\`\`\`)[ \\t]*${tag}[ \\t]*\\r?\\n([\\s\\S]*?)\\r?\\n(?:~~~|\`\`\`)`, "i");
  const match = regex.exec(lesson.content);
  return match ? match[1].replace(/\r\n/g, "\n").trim() : null;
}

function shortDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ActivityBars({ days, label }: { days: Array<{ label: string; count: number }>; label: string }) {
  const maximum = Math.max(1, ...days.map((day) => day.count));
  return (
    <ol className="activity-bars" aria-label={label}>
      {days.map((day, index) => (
        <li key={`${day.label}-${index}`} aria-label={`${day.label}: ${day.count} ${day.count === 1 ? "event" : "events"}`}>
          <span className="activity-bar-track">
            <i style={{ height: `${day.count ? Math.max(10, Math.round((day.count / maximum) * 100)) : 0}%` }} />
          </span>
          <small>{day.label}</small>
          <span className="activity-bar-count">{day.count}</span>
        </li>
      ))}
    </ol>
  );
}

function formatLessonType(type: LessonType): string {
  switch (type) {
    case "theory":
      return "Theory";
    case "guided-coding":
      return "Guided Coding";
    case "practical-exercise":
      return "Practical Exercise";
    case "interactive-simulation":
      return "Interactive Simulation";
    case "assessment":
      return "Assessment";
    default:
      return "Lesson";
  }
}

function formatExerciseStatus(status: ExerciseProgressStatus): string {
  switch (status) {
    case "not-started":
      return "Not started";
    case "attempted":
      return "Attempted";
    case "completed":
      return "Completed";
    case "needs-review":
      return "Needs review";
    default:
      return status;
  }
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
  const [pendingExample, setPendingExample] = useState<{
    code: string;
    lessonId: string;
    lessonTitle: string;
    requestId: number;
    sampleInput?: string;
    language?: "c" | "python";
  } | null>(null);
  const [layout, setLayout] = useState<WorkspaceLayout>(() => readWorkspaceLayout());
  const [katOpen, setKatOpen] = useState<boolean>(() => layout.katOpen ?? false);
  const [katDraftPrompt, setKatDraftPrompt] = useState<string>("");
  const isDraggingRef = useRef<{ index: number; startX: number; startWidths: number[] } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const exampleRequestId = useRef(0);
  const canPersist = useRef(false);
  const savedSnapshot = useRef<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationReport, setVerificationReport] = useState<ExerciseVerificationReport | null>(null);
  const verifierAbortRef = useRef<AbortController | null>(null);

  const toggleKat = useCallback(() => {
    setKatOpen((prev) => {
      const next = !prev;
      const updated: WorkspaceLayout = { ...layout, katOpen: next };
      setLayout(updated);
      writeWorkspaceLayout(updated);
      return next;
    });
  }, [layout]);

  const lessonEntries = useMemo(() => flattenLessons(course), [course]);
  const locatedLesson = findLesson(course, activeLessonId) ?? lessonEntries[0];
  const lesson = locatedLesson?.lesson;
  const lessonModule = locatedLesson?.module;
  const currentIndex = lessonEntries.findIndex((entry) => entry.lesson.id === lesson?.id);

  const lessonType: LessonType = lesson ? resolveLessonType(lesson) : "guided-coding";
  const executionConfig = lesson ? resolveLessonExecution(course, lesson) : null;
  const showCodeWorkspace = Boolean(
    (executionConfig?.language === "c" || executionConfig?.language === "python" || executionConfig?.language === "javascript") &&
    (lessonType === "guided-coding" || lessonType === "practical-exercise" || lessonType === "assessment" || lesson?.exampleRun)
  );

  const [loadedExampleCode, setLoadedExampleCode] = useState<{
    lessonId: string;
    code: string;
    sampleInput?: string;
  } | null>(null);

  const activeLanguage: ExecutionLanguage = executionConfig?.language ?? "c";

  const lessonCode = useMemo(() => {
    const defaultProg = activeLanguage === "python" ? defaultPythonProgram : activeLanguage === "javascript" ? defaultJavaScriptProgram : defaultCProgram;
    if (!lesson) return defaultProg;
    if (loadedExampleCode && loadedExampleCode.lessonId === lesson.id) {
      return loadedExampleCode.code;
    }
    if (lesson.exercise.starterCode) {
      return lesson.exercise.starterCode;
    }
    const extracted = extractLessonCode(lesson, activeLanguage);
    if (extracted) {
      return activeLanguage === "c" ? makeRunnableCProgram(extracted) : extracted;
    }
    return defaultProg;
  }, [lesson, activeLanguage, loadedExampleCode]);

  const lessonSampleInput = (loadedExampleCode && loadedExampleCode.lessonId === lesson?.id)
    ? loadedExampleCode.sampleInput
    : lesson?.exampleRun?.sampleInput;

  useEffect(() => {
    return () => {
      verifierAbortRef.current?.abort();
    };
  }, []);

  const pathState = useMemo(() => getPathProgress(progress, course), [course, progress]);
  const learningSummary = useMemo(() => getLearningDashboardSummary(progress), [progress]);
  const activeDaysCount = useMemo(() => new Set(progress.enrollments.flatMap((e) => e.activity.map((a) => new Date(a.at).toDateString()))).size, [progress]);
  const aiSummary = useMemo(() => getAIActivitySummary(aiRequests), [aiRequests]);
  const enrollment = pathState.enrollment;
  const enrolled = Boolean(enrollment);
  const completedIds = new Set(enrollment?.completedLessons.map((item) => item.lessonId) ?? []);
  const recentActivity = [...(enrollment?.activity ?? [])].reverse().slice(0, 4);

  const activeResumeCourse = useMemo(() => {
    if (!progress.enrollments || progress.enrollments.length === 0) return null;
    const sorted = [...progress.enrollments].sort((a, b) => {
      const aTime = a.activity.length > 0 ? a.activity[a.activity.length - 1]!.at : a.enrolledAt;
      const bTime = b.activity.length > 0 ? b.activity[b.activity.length - 1]!.at : b.enrolledAt;
      return bTime - aTime;
    });
    const topEnrollment = sorted[0];
    if (!topEnrollment) return null;
    const targetCourse = courses.find((c) => c.id === topEnrollment.pathId);
    if (!targetCourse) return null;
    const state = getPathProgress(progress, targetCourse);
    const resumeLesson = state.nextLesson ?? state.lastOpenedLesson ?? flattenLessons(targetCourse)[0];
    return {
      course: targetCourse,
      enrollment: topEnrollment,
      pathState: state,
      resumeLesson,
    };
  }, [progress, courses]);

  const currentExerciseStatus: ExerciseProgressStatus = lesson && enrolled
    ? getExerciseProgress(progress, course.id, lesson.exercise.id)
    : "not-started";

  const tutorEntry = findLesson(course, tutorLessonId);
  const tutorExerciseStatus: ExerciseProgressStatus = tutorEntry && enrolled
    ? getExerciseProgress(progress, course.id, tutorEntry.lesson.exercise.id)
    : "not-started";

  const [userPracticeFilter, setUserPracticeFilter] = useState<string | null>(null);
  const [prevCourseId, setPrevCourseId] = useState(course.id);
  if (course.id !== prevCourseId) {
    setPrevCourseId(course.id);
    setUserPracticeFilter(null);
  }
  const practiceCourseFilter = userPracticeFilter ?? course.id;
  const setPracticeCourseFilter = setUserPracticeFilter;
  const [practiceDifficultyFilter, setPracticeDifficultyFilter] = useState<string>("all");

  const practiceEntries = useMemo(() => {
    const targetCourses =
      practiceCourseFilter === "all"
        ? courses
        : courses.filter((c) => c.id === practiceCourseFilter);
    return targetCourses
      .flatMap((c) => {
        const isEnrolled = progress.enrollments.some((e) => e.pathId === c.id);
        return flattenLessons(c).map((entry) => ({
          ...entry,
          course: c,
          status: isEnrolled
            ? getExerciseProgress(progress, c.id, entry.lesson.exercise.id)
            : ("not-started" as ExerciseProgressStatus),
        }));
      })
      .filter((entry) => {
        if (
          practiceDifficultyFilter !== "all" &&
          entry.lesson.exercise.difficulty !== practiceDifficultyFilter
        ) {
          return false;
        }
        return true;
      });
  }, [courses, practiceCourseFilter, practiceDifficultyFilter, progress]);
  const tutorContext: TutorLessonContext | undefined = tutorEntry
    ? { path: course, module: tutorEntry.module, lesson: tutorEntry.lesson, exerciseStatus: tutorExerciseStatus }
    : undefined;

  const currentTutorContext: TutorLessonContext | undefined = lesson && lessonModule
    ? { path: course, module: lessonModule, lesson, exerciseStatus: currentExerciseStatus }
    : tutorContext;

  const effectiveWorkspacePanel = !showCodeWorkspace && workspacePanel === "code" ? "learn" : workspacePanel;

  const handleSplitterPointerDown = (index: number, e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = {
      index,
      startX: e.clientX,
      startWidths: [...(katOpen && showCodeWorkspace ? layout.threePanelWidths : layout.twoPanelWidths)],
    };
  };

  const handleSplitterPointerMove = (index: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || isDraggingRef.current.index !== index || !gridRef.current) return;
    const gridWidth = gridRef.current.clientWidth;
    if (gridWidth < 200) return;
    const deltaX = e.clientX - isDraggingRef.current.startX;
    const deltaPercent = (deltaX / gridWidth) * 100;

    if (katOpen && showCodeWorkspace) {
      const [w0, w1, w2] = isDraggingRef.current.startWidths as [number, number, number];
      let newLayout: [number, number, number];
      if (index === 0) {
        const next0 = Math.max(18, Math.min(55, w0 + deltaPercent));
        const diff = next0 - w0;
        const next1 = Math.max(20, w1 - diff);
        newLayout = [Number(next0.toFixed(1)), Number(next1.toFixed(1)), w2];
      } else {
        const next1 = Math.max(20, Math.min(65, w1 + deltaPercent));
        const diff = next1 - w1;
        const next2 = Math.max(18, w2 - diff);
        newLayout = [w0, Number(next1.toFixed(1)), Number(next2.toFixed(1))];
      }
      const updated: WorkspaceLayout = { ...layout, threePanelWidths: newLayout, katOpen };
      setLayout(updated);
      writeWorkspaceLayout(updated);
    } else {
      const [w0] = isDraggingRef.current.startWidths as [number, number];
      const next0 = Math.max(25, Math.min(75, w0 + deltaPercent));
      const updated: WorkspaceLayout = {
        ...layout,
        twoPanelWidths: [Number(next0.toFixed(1)), Number((100 - next0).toFixed(1))],
        katOpen,
      };
      setLayout(updated);
      writeWorkspaceLayout(updated);
    }
  };

  const handleSplitterPointerUp = (index: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current?.index === index) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture already released
      }
      isDraggingRef.current = null;
    }
  };

  const handleSplitterKeyDown = (index: number, e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = 2;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const deltaPercent = e.key === "ArrowLeft" ? -step : step;
      if (katOpen && showCodeWorkspace) {
        const [w0, w1, w2] = layout.threePanelWidths;
        let newWidths: [number, number, number];
        if (index === 0) {
          const next0 = Math.max(18, Math.min(55, w0 + deltaPercent));
          const diff = next0 - w0;
          newWidths = [Number(next0.toFixed(1)), Number((w1 - diff).toFixed(1)), w2];
        } else {
          const next1 = Math.max(20, Math.min(65, w1 + deltaPercent));
          const diff = next1 - w1;
          newWidths = [w0, Number(next1.toFixed(1)), Number((w2 - diff).toFixed(1))];
        }
        const updated = { ...layout, threePanelWidths: newWidths, katOpen };
        setLayout(updated);
        writeWorkspaceLayout(updated);
      } else {
        const [w0] = layout.twoPanelWidths;
        const next0 = Math.max(25, Math.min(75, w0 + deltaPercent));
        const updated = {
          ...layout,
          twoPanelWidths: [Number(next0.toFixed(1)), Number((100 - next0).toFixed(1))] as [number, number],
          katOpen,
        };
        setLayout(updated);
        writeWorkspaceLayout(updated);
      }
    } else if (e.key === "Home") {
      e.preventDefault();
      setLayout(DEFAULT_WORKSPACE_LAYOUT);
      writeWorkspaceLayout(DEFAULT_WORKSPACE_LAYOUT);
    }
  };

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
            const savedCourse = result.progress.enrollments.find((enrollmentItem) => courses.some((item) => item.id === enrollmentItem.pathId));
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

  const openLesson = (lessonId: string, pathId = course.id) => {
    const targetCourse = courses.find((item) => item.id === pathId) ?? course;
    if (targetCourse.id !== course.id) setWorkspacePanel("learn");
    setSelectedCourseId(targetCourse.id);
    setActiveLessonId(lessonId);
    setTutorLessonId("");
    setLoadedExampleCode(null);
    setPendingExample(null);
    setVerificationReport(null);
    setIsVerifying(false);
    verifierAbortRef.current?.abort();
    setProgress((current) => recordLessonOpened(current, targetCourse.id, lessonId));
    onNavigate("lesson", lessonId);
  };

  const selectCourse = (nextCourse: LearningCourse) => {
    setSelectedCourseId(nextCourse.id);
    setActiveLessonId(flattenLessons(nextCourse)[0]?.lesson.id ?? "");
    setTutorLessonId("");
    setLoadedExampleCode(null);
    setPendingExample(null);
    setVerificationReport(null);
    setIsVerifying(false);
    verifierAbortRef.current?.abort();
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
    if (!katOpen) {
      setKatOpen(true);
      const updated: WorkspaceLayout = { ...layout, katOpen: true };
      setLayout(updated);
      writeWorkspaceLayout(updated);
    }
    if (smallWorkspace) {
      setWorkspacePanel("kat");
    }
    setTutorLessonId(lesson?.id ?? "");
  };

  const askKatAboutError = (errorText?: string, line?: number) => {
    if (!katOpen) {
      setKatOpen(true);
      const updated: WorkspaceLayout = { ...layout, katOpen: true };
      setLayout(updated);
      writeWorkspaceLayout(updated);
    }
    if (smallWorkspace) {
      setWorkspacePanel("kat");
    }
    setTutorLessonId(lesson?.id ?? "");
    const errorMsg = errorText
      ? `Can you explain this error${line ? ` on line ${line}` : ""}? ${errorText}`
      : "Can you explain the error in my code and suggest how to fix it?";
    setKatDraftPrompt(errorMsg);
  };

  const openExampleInPlayground = () => {
    if (!lesson) return;
    const extracted = extractLessonCode(lesson, activeLanguage);
    if (!extracted) return;
    const runnable = activeLanguage === "c" ? makeRunnableCProgram(extracted) : extracted;
    setLoadedExampleCode({
      lessonId: lesson.id,
      code: runnable,
      sampleInput: lesson.exampleRun?.sampleInput,
    });
    exampleRequestId.current += 1;
    setPendingExample({
      code: runnable,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      requestId: exampleRequestId.current,
      sampleInput: lesson.exampleRun?.sampleInput,
      language: activeLanguage === "python" ? "python" : "c",
    });
    if (smallWorkspace) {
      setWorkspacePanel("code");
    }
  };

  const handleVerifyExercise = async () => {
    if (!lesson?.exercise.testCases || lesson.exercise.testCases.length === 0 || isVerifying) {
      return;
    }
    const codeToVerify =
      editorActivity.source && editorActivity.source.trim()
        ? editorActivity.source
        : lessonCode;
    setIsVerifying(true);
    setVerificationReport(null);

    verifierAbortRef.current?.abort();
    const controller = new AbortController();
    verifierAbortRef.current = controller;

    try {
      const report = await verifyExerciseSubmission({
        language: activeLanguage === "python" ? "python" : "c",
        code: codeToVerify,
        testCases: lesson.exercise.testCases,
        signal: controller.signal,
      });

      setVerificationReport(report);

      if (enrolled) {
        if (report.allPassed) {
          setProgress((curr) =>
            updateExerciseProgress(curr, course.id, lesson.exercise.id, "completed")
          );
        } else if (currentExerciseStatus !== "completed") {
          setProgress((curr) =>
            updateExerciseProgress(curr, course.id, lesson.exercise.id, "attempted")
          );
        }
      }
    } catch {
      // Runner error or cancelled
    } finally {
      setIsVerifying(false);
    }
  };

  const showTutorPage = section === "tutor";
  const progressBar = (
    <div
      className="progress-track"
      role="progressbar"
      aria-label={`${course.title} progress`}
      aria-valuenow={pathState.completionPercent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: pathState.completionPercent + "%" }} />
    </div>
  );

  const lessonHints = lesson ? resolveLessonHints(lesson.exercise) : [];

  return (
    <div className={"learning-view learning-" + section}>
      {progressIssue && <div className="learning-storage-note" role="status">{progressIssue}</div>}

      {showTutorPage && (
        <header className="learning-page-heading tutor-page-heading">
          <span className="eyebrow">AI TUTOR · KAT</span>
          <h1>
            Learn it in the way<br />
            <em>that works for you.</em>
          </h1>
          <p>Choose a teaching style, then ask a question. Kat uses your selected model provider; replies are kept only in this page session.</p>
          {!enrolled && (
            <button className="learning-text-button" onClick={() => onNavigate("paths")}>
              Explore a course to ask about a specific lesson <ArrowRight size={14} />
            </button>
          )}
        </header>
      )}

      {showTutorPage && (
        <section className="learning-tutor-host page" aria-label="Kat tutor">
          <KatTutor
            provider={provider}
            model={model}
            modelName={modelName}
            sessionKey={sessionKey}
            cloudflareAccountId={cloudflareAccountId}
            ollamaBaseUrl={ollamaBaseUrl}
            configured={configured}
            context={tutorContext}
            skills={skills}
            draftPrompt={katDraftPrompt}
            onOpenSettings={onOpenSettings}
            onOpenLesson={() => {
              if (tutorEntry) {
                setActiveLessonId(tutorEntry.lesson.id);
                onNavigate("lesson", tutorEntry.lesson.id);
              } else {
                onNavigate("paths");
              }
            }}
          />
        </section>
      )}

      <div className="learning-playground-host" hidden={section !== "playground"}>
        {section === "playground" && (
          <CPlayground
            pendingExample={pendingExample}
            autoInitialize
            compact={false}
            onReturnToLesson={(lessonId) => onNavigate("lesson", lessonId)}
          />
        )}
      </div>

      {section === "home" && (
        <>
          {activeResumeCourse ? (
            <aside className="home-resume-card home-continue-banner" aria-label="Resume current path">
              <div className="home-resume-content home-continue-info">
                <span className="home-resume-eyebrow home-course-pill">{activeResumeCourse.course.title}</span>
                <h3 className="home-resume-title home-continue-title">{activeResumeCourse.resumeLesson?.lesson.title ?? activeResumeCourse.course.title}</h3>
                <span className="home-resume-meta home-continue-meta">
                  Module: {activeResumeCourse.resumeLesson?.module.title ?? "Overview"} · {activeResumeCourse.pathState.completedCount} of {activeResumeCourse.pathState.totalLessons} lessons completed
                </span>
                <div className="progress-track" role="progressbar" aria-valuenow={activeResumeCourse.pathState.completionPercent} aria-valuemin={0} aria-valuemax={100} style={{ marginTop: 6, maxWidth: 360 }}>
                  <span style={{ width: `${activeResumeCourse.pathState.completionPercent}%` }} />
                </div>
              </div>
              <button
                className="primary-button"
                onClick={() => {
                  if (activeResumeCourse.resumeLesson) {
                    openLesson(activeResumeCourse.resumeLesson.lesson.id, activeResumeCourse.course.id);
                  } else {
                    onNavigate("paths");
                  }
                }}
              >
                <Play size={14} /> Resume lesson <ArrowRight size={14} />
              </button>
            </aside>
          ) : (
            <div className="home-welcome-banner" aria-label="Welcome banner">
              <span className="home-course-pill">WELCOME TO KATALYST</span>
              <p>Explore engineering paths with rigorous theory, browser compilers, and Kat AI tutor.</p>
            </div>
          )}

          <section className="learning-hero">
            <div className="learning-hero-copy">
              <span className="eyebrow">ENGINEERING FOUNDATIONS</span>
              <h1>
                Learn by understanding<br />
                <em>how the pieces work.</em>
              </h1>
              <p>
                KATALYST is a learning-first engineering platform designed for engineers, computer science students, and self-directed learners who want to build deep, intuitive comprehension of code, memory, and systems.
              </p>
              <div className="learning-hero-actions">
                <button
                  className="primary-button"
                  onClick={continueLearning}
                >
                  <Sparkles size={15} />
                  {enrolled ? "Continue learning" : "Start learning"}
                  <ArrowRight size={15} />
                </button>
                <button
                  className="secondary-button"
                  onClick={() => onNavigate("paths")}
                >
                  <Compass size={15} />
                  Browse courses
                </button>
                <button
                  className="secondary-button"
                  onClick={() => {
                    const pyCourse = courses.find((c) => c.id === "python-programming-foundations") ?? courses[1];
                    if (pyCourse) selectCourse(pyCourse);
                    onNavigate("paths");
                  }}
                >
                  Explore Python
                </button>
              </div>
            </div>
            <div className="learning-hero-art" aria-label="Interactive multi-language engineering sandbox preview">
              <div className="hero-art-label"><span className="hero-live-dot" /> MULTI-LANGUAGE SANDBOX</div>
              <div className="hero-code-line"><span className="code-number">01</span><span><b>C11:</b> Wasmer WebAssembly (zero-install, memory-safe)</span></div>
              <div className="hero-code-line"><span className="code-number">02</span><span><b>Python 3.12:</b> Pyodide client runtime in browser</span></div>
              <div className="hero-code-line"><span className="code-number">03</span><span><b>Kat:</b> On-demand conversational AI engineering tutor</span></div>
              <div className="hero-code-line"><span className="code-number">04</span><span><b>Progress:</b> Local-first, private, and snapshot-synced</span></div>
              <div className="hero-art-footer"><span>learn</span><i /><span>code</span><i /><span>ask Kat</span><span className="hero-output">C &amp; Python ready</span></div>
            </div>
          </section>

          <section className="home-how-it-works" aria-label="How KATALYST works">
            <article className="how-step-card">
              <span className="step-card-num">STEP 01</span>
              <h3>Learn the concept</h3>
              <p>Targeted, rigorous theory covering architecture, memory layout, and systems mechanics. No fluff, no busywork.</p>
            </article>
            <article className="how-step-card">
              <span className="step-card-num">STEP 02</span>
              <h3>Code in the sandbox</h3>
              <p>Run real C11 and Python 3.12 programs directly in your browser. Standard input, console output, and instant feedback.</p>
            </article>
            <article className="how-step-card">
              <span className="step-card-num">STEP 03</span>
              <h3>Review &amp; ask Kat</h3>
              <p>Test your comprehension with checkpoints, explore progressive hints, or toggle Kat AI tutor whenever you want an explanation.</p>
            </article>
          </section>

          <div className="learning-section-head">
            <div><span className="eyebrow">COURSES</span><h2>Available learning paths</h2></div>
            <button className="learning-text-button" onClick={() => onNavigate("paths")}>All courses <ArrowRight size={14} /></button>
          </div>
          <section className="courses-choice-grid" aria-label="Available engineering courses">
            {courses.map((c) => {
              const cState = getPathProgress(progress, c);
              const cLessons = flattenLessons(c);
              const cEnrolled = Boolean(cState.enrollment);
              const isComplete = cEnrolled && cState.completedCount === cState.totalLessons && cState.totalLessons > 0;
              const inProgress = cEnrolled && cState.completedCount > 0 && !isComplete;
              const statusText = isComplete ? "Completed" : inProgress ? "In progress" : cEnrolled ? "Started" : "Not started";
              const statusClass = isComplete ? "completed" : inProgress ? "in-progress" : cEnrolled ? "started" : "not-started";

              return (
                <article className="course-card-unified" key={c.id}>
                  <div className="course-card-header">
                    <span className="course-lang-tag">
                      {c.id.includes("python") ? "PYTHON 3.12" : "C11"}
                    </span>
                    <span className={`course-level-tag status-${statusClass}`}>
                      {statusText}
                    </span>
                  </div>
                  <h3>{c.title}</h3>
                  <p>{c.description}</p>
                  <div className="course-card-metrics">
                    <span><BookOpen size={13} /> {cLessons.length} lessons</span>
                    <span><Compass size={13} /> {c.modules.length} modules</span>
                    <span><Clock size={13} /> ~{cLessons.length * 20}m</span>
                  </div>
                  <div className="progress-track" role="progressbar" aria-valuenow={cState.completionPercent} aria-valuemin={0} aria-valuemax={100}>
                    <span style={{ width: `${cState.completionPercent}%` }} />
                  </div>
                  <div className="course-card-footer" style={{ marginTop: "auto", display: "flex", gap: "8px" }}>
                    <button
                      className="primary-button"
                      style={{ flex: 1 }}
                      onClick={() => {
                        selectCourse(c);
                        if (cEnrolled && cState.nextLesson) {
                          openLesson(cState.nextLesson.lesson.id, c.id);
                        } else {
                          onNavigate("paths");
                        }
                      }}
                    >
                      {cEnrolled ? "Continue" : "Start course"}
                      <ArrowRight size={14} />
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => {
                        selectCourse(c);
                        onNavigate("paths");
                      }}
                    >
                      Syllabus
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          <div className="learning-section-head">
            <div><span className="eyebrow">YOUR PROGRESS</span><h2>Learning analytics &amp; quick access</h2></div>
          </div>

          {learningSummary.mastery && (
            <div className="mastery-summary-card mb-4 rounded-xl border border-blue-500/30 bg-[var(--surface-secondary)] p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/40 font-bold text-xs">
                    XP
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Engineering Rank</span>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">{learningSummary.mastery.rank}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="rounded bg-blue-500/10 px-2.5 py-1 text-blue-400 font-semibold border border-blue-500/20">
                    {learningSummary.mastery.totalXp} Total XP
                  </span>
                  {learningSummary.mastery.nextRank && (
                    <span className="text-xs text-[var(--text-muted)]">
                      Target: {learningSummary.mastery.nextRank} ({learningSummary.mastery.nextRankXp} XP)
                    </span>
                  )}
                </div>
              </div>
              {learningSummary.mastery.nextRank && (
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-[var(--text-secondary)] mb-1">
                    <span>Rank Progress ({learningSummary.mastery.progressToNextRank}%)</span>
                    <span>{learningSummary.mastery.totalXp} / {learningSummary.mastery.nextRankXp} XP</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--surface-primary)] border border-[var(--border-subtle)] overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                      style={{ width: `${learningSummary.mastery.progressToNextRank}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-[var(--text-muted)]">
                <span>• +50 XP per verified exercise ({learningSummary.mastery.exerciseXp} XP)</span>
                <span>• +25 XP per completed lesson ({learningSummary.mastery.lessonXp} XP)</span>
              </div>
            </div>
          )}

          <div className="home-stats-strip" aria-label="Learning metrics">
            <article className="stat-card">
              <span className="stat-label">Lessons Completed</span>
              <strong className="stat-value">{learningSummary.lessonsCompleted}</strong>
              <span className="stat-subtext">of {learningSummary.totalLessons} total lessons</span>
            </article>
            <article className="stat-card">
              <span className="stat-label">Exercises Attempted</span>
              <strong className="stat-value">{learningSummary.exercisesCompleted}</strong>
              <span className="stat-subtext">interactive checks solved</span>
            </article>
            <article className="stat-card">
              <span className="stat-label">Active Days</span>
              <strong className="stat-value">{activeDaysCount}</strong>
              <span className="stat-subtext">{learningSummary.streak > 0 ? `${learningSummary.streak} day streak` : "Start your streak today"}</span>
            </article>
          </div>
          <section className="learning-home-grid">
            <article className="home-path-feature">
              <div className="feature-kicker">
                <span><Lightbulb size={14} /></span>
                <span>HANDS-ON EXERCISES</span>
              </div>
              <h3>Practice Lab</h3>
              <p>Test your knowledge with exercises from {course.title}, progressive hints, starter code, and optional suggested answers.</p>
              <button className="secondary-button" onClick={() => onNavigate("practice")}>
                Open Practice Lab <ArrowRight size={14} />
              </button>
            </article>
            <article className="home-next-feature">
              <span className="eyebrow">LOCAL DASHBOARD</span>
              <div className="next-feature-icon"><GraduationCap size={18} /></div>
              <h3>Learning Progress</h3>
              <p>{learningSummary.lessonsCompleted} of {learningSummary.totalLessons} lessons completed across all paths. Private and stored locally in this browser.</p>
              <button className="secondary-button" onClick={() => onNavigate("progress")}>
                View progress analytics <ArrowRight size={14} />
              </button>
            </article>
          </section>

          <section className="learning-activity-strip">
            <div><span className="eyebrow">RECENT ACTIVITY</span><h2>Your steps, as they happen</h2></div>
            {recentActivity.length ? (
              <ol>
                {recentActivity.map((item, index) => {
                  const title = item.lessonId ? findLesson(course, item.lessonId)?.lesson.title : undefined;
                  const action = item.kind === "enrolled"
                    ? `Started ${course.title}`
                    : item.kind === "lesson-completed"
                    ? "Completed " + (title ?? "a lesson")
                    : item.kind === "exercise-status-updated" && item.status
                    ? `Exercise status updated to ${formatExerciseStatus(item.status)}`
                    : "Opened " + (title ?? "a lesson");
                  return (
                    <li key={item.kind + "-" + item.at + "-" + index}>
                      <span className={"activity-mark " + item.kind} />
                      <span>{action}</span>
                      <time>{shortDate(item.at)}</time>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p>Your activity will appear here after you start a path and open a lesson.</p>
            )}
          </section>
        </>
      )}

      {section === "paths" && (
        <>
          <header className="learning-page-heading">
            <span className="eyebrow">EXPLORE LEARNING PATHS</span>
            <h1>
              Build a foundation<br />
              <em>one clear idea at a time.</em>
            </h1>
            <p>Focused engineering paths with real lesson content and practice. Choose a path to inspect its modules and start learning.</p>
          </header>
          {courses.length > 1 && (
            <nav className="courses-choice-grid" aria-label="Available courses" style={{ marginBottom: 28 }}>
              {courses.map((item) => {
                const itemState = getPathProgress(progress, item);
                const itemLessons = flattenLessons(item);
                const isSelected = item.id === course.id;
                const isEnrolled = Boolean(itemState.enrollment);
                const isComplete = isEnrolled && itemState.completedCount === itemState.totalLessons && itemState.totalLessons > 0;
                const inProgress = isEnrolled && itemState.completedCount > 0 && !isComplete;
                const statusText = isComplete ? "Completed" : inProgress ? "In progress" : isEnrolled ? "Started" : "Not started";
                const statusClass = isComplete ? "completed" : inProgress ? "in-progress" : isEnrolled ? "started" : "not-started";

                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`course-card-unified ${isSelected ? "selected" : ""}`}
                    style={{
                      cursor: "pointer",
                      textAlign: "left",
                      borderWidth: isSelected ? "2px" : "1px",
                      borderColor: isSelected ? "var(--signal)" : "var(--border-subtle)",
                      background: isSelected ? "var(--surface-accent-soft)" : "var(--surface-primary)",
                    }}
                    aria-pressed={isSelected}
                    onClick={() => selectCourse(item)}
                  >
                    <div className="course-card-header">
                      <span className="course-lang-tag">
                        {item.id.includes("python")
                          ? "PYTHON 3.12"
                          : item.id.includes("js")
                          ? "JAVASCRIPT (ES2024)"
                          : item.id.includes("circuits")
                          ? "DIGITAL LOGIC"
                          : "C11"}
                      </span>
                      <span className={`course-level-tag status-${statusClass}`}>
                        {statusText}
                      </span>
                    </div>
                    <strong className="course-card-title" style={{ fontSize: 16, display: "block", color: "var(--text-primary)" }}>{item.title}</strong>
                    <p style={{ fontSize: 12 }}>{item.description}</p>
                    <div className="course-card-metrics">
                      <span><BookOpen size={13} /> {itemLessons.length} lessons</span>
                      <span><Compass size={13} /> {item.modules.length} modules</span>
                      <span><Clock size={13} /> ~{itemLessons.length * 20}m</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          )}
          <section className="path-detail-shell">
            <div className="path-detail-main">
              <div className="path-subject-mark">{courseMark}</div>
              <div className="path-label-row">
                <span>{(courseSubject?.title ?? "COURSE").toUpperCase()}</span>
                <span>{course.level.toUpperCase()}</span>
                <span>{lessonEntries.length} LESSONS</span>
                {course.version && <span>V{course.version}</span>}
              </div>
              <h2>{course.title}</h2>
              <p className="path-description">{course.description}</p>
              <div className="path-divider" />
              <h3>What you will be able to do</h3>
              <ul className="objective-list">
                {course.learningOutcomes.map((outcome) => (
                  <li key={outcome}><Check size={15} />{outcome}</li>
                ))}
              </ul>
              <h3>Before you begin</h3>
              <ul className="prerequisite-list">
                {course.prerequisites.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <button className="primary-button path-start-button" onClick={startPath}>
                <Play size={15} />
                {enrolled ? "Continue this course" : "Start learning"}
                <ArrowRight size={15} />
              </button>
              {enrolled && (
                <span className="enrollment-confirmation">
                  You started this course on {shortDate(enrollment!.enrolledAt)}.
                </span>
              )}
            </div>
            <div className="path-curriculum">
              <div className="curriculum-heading">
                <div>
                  <span className="eyebrow">THE CURRICULUM</span>
                  <h3>{lessonEntries.length} lessons. {course.modules.length} modules.</h3>
                </div>
                <span className="curriculum-count">
                  {enrolled ? pathState.completedCount + "/" + pathState.totalLessons + " done" : "PREVIEW"}
                </span>
              </div>
              {course.modules.map((item) => (
                <section className="curriculum-module" key={item.id}>
                  <header>
                    <span className="module-index">{String(item.order).padStart(2, "0")}</span>
                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.summary}</p>
                    </div>
                  </header>
                  <ol>
                    {item.lessons.map((entry) => {
                      const done = completedIds.has(entry.id);
                      const isNext = enrolled && pathState.nextLesson?.lesson.id === entry.id;
                      const type = resolveLessonType(entry);
                      return (
                        <li key={entry.id}>
                          <button
                            disabled={!enrolled}
                            className={(done ? "lesson-complete " : "") + (isNext ? "lesson-next " : "")}
                            onClick={() => openLesson(entry.id)}
                          >
                            <span className="lesson-state">
                              {done ? <Check size={13} /> : isNext ? <Circle size={12} fill="var(--signal)" /> : enrolled ? <Circle size={12} /> : <LockKeyhole size={12} />}
                            </span>
                            <span>
                              <strong>{entry.title}</strong>
                              <small>{entry.summary}</small>
                            </span>
                            <span className="module-lesson-meta">
                              <span className="lesson-type-chip">{formatLessonType(type)}</span>
                              {entry.estimatedDurationMinutes ? (
                                <span className="lesson-duration-chip">{entry.estimatedDurationMinutes}m</span>
                              ) : null}
                            </span>
                            {enrolled && <ChevronRight size={14} />}
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              ))}
              {!enrolled && (
                <p className="curriculum-lock-note">
                  <LockKeyhole size={13} /> Start this path to open lessons and record your progress.
                </p>
              )}
            </div>
          </section>
        </>
      )}

      {section === "my-learning" && (
        <>
          <header className="learning-page-heading compact">
            <span className="eyebrow">MY LEARNING</span>
            <h1>
              Your paths,<br />
              <em>your pace.</em>
            </h1>
            <p>Only paths you choose appear here. There is no streak or score to keep up with.</p>
          </header>
          {enrolled ? (
            <section className="my-learning-row">
              <div className="path-subject-mark">{courseMark}</div>
              <div className="my-learning-copy">
                <span className="path-label-row">
                  {(courseSubject?.title ?? "COURSE").toUpperCase()} · STARTED {shortDate(enrollment!.enrolledAt)}
                </span>
                <h2>{course.title}</h2>
                <p>{course.description}</p>
                {progressBar}
                <span className="my-learning-caption">
                  {pathState.completedCount} of {pathState.totalLessons} lessons complete
                </span>
              </div>
              <button
                className="secondary-button"
                onClick={() => (pathState.nextLesson ? openLesson(pathState.nextLesson.lesson.id) : onNavigate("progress"))}
              >
                {pathState.nextLesson ? "Continue" : "View progress"}
                <ArrowRight size={14} />
              </button>
            </section>
          ) : (
            <section className="learning-empty-state">
              <div className="empty-state-icon"><GraduationCap size={23} /></div>
              <span className="eyebrow">A FRESH PAGE</span>
              <h2>Your learning starts when you do.</h2>
              <p>Explore the available courses to see their real lessons and decide which fits your goals.</p>
              <button className="primary-button" onClick={() => onNavigate("paths")}>
                Explore courses <ArrowRight size={15} />
              </button>
            </section>
          )}
        </>
      )}

      {section === "practice" && (
        <>
          <header className="learning-page-heading compact">
            <span className="eyebrow">PRACTICE LAB &amp; CHALLENGE HUB</span>
            <h1>
              Make your thinking<br />
              <em>visible.</em>
            </h1>
            <p>Hands-on engineering exercises with progressive hints, starter code, and verified automated checks.</p>
            <span className="practice-boundary">
              <Lightbulb size={15} /> Exercises and checkpoints are self-checks. Run code in the workspace to verify against test cases.
            </span>
          </header>

          {/* Practice Lab Multi-Course Filter Bar */}
          <div className="practice-filter-bar mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mr-1">
                Course:
              </span>
              <button
                type="button"
                onClick={() => setPracticeCourseFilter("all")}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  practiceCourseFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-[var(--surface-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
                }`}
              >
                All Courses
              </button>
              {courses.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setPracticeCourseFilter(c.id)}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                    practiceCourseFilter === c.id
                      ? "bg-blue-600 text-white"
                      : "bg-[var(--surface-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
                  }`}
                >
                  {c.id.includes("python")
                    ? "Python"
                    : c.id.includes("js")
                    ? "JavaScript"
                    : c.id.includes("circuits")
                    ? "Circuits"
                    : "C"}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mr-1">
                Difficulty:
              </span>
              {(["all", "Beginner", "Developing", "Applied"] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setPracticeDifficultyFilter(diff)}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                    practiceDifficultyFilter === diff
                      ? "bg-blue-600 text-white"
                      : "bg-[var(--surface-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
                  }`}
                >
                  {diff === "all" ? "All" : diff}
                </button>
              ))}
            </div>
          </div>

          <div className="practice-list">
            {practiceEntries.map((entry, index) => {
              const exerciseStatus = entry.status;
              const hints = resolveLessonHints(entry.lesson.exercise);
              const isItemEnrolled = progress.enrollments.some((e) => e.pathId === entry.course.id);
              return (
                <article className="practice-card" key={entry.lesson.exercise.id}>
                  <div className="practice-number">{String(index + 1).padStart(2, "0")}</div>
                  <div className="practice-card-content">
                    <div className="practice-card-topline">
                      <span className="eyebrow">
                        {entry.course.title.split(" ")[0]} · {entry.module.title} · {entry.lesson.exercise.difficulty}
                      </span>
                      <span className={`practice-status-badge status-${exerciseStatus}`}>
                        {formatExerciseStatus(exerciseStatus)}
                      </span>
                    </div>
                    <h2>{entry.lesson.exercise.title}</h2>
                    <p>{entry.lesson.exercise.prompt}</p>
                    <p className="practice-outcome">
                      <strong>Practice goal:</strong> {entry.lesson.exercise.expectedOutcome}
                    </p>
                    {entry.lesson.exercise.starterCode && (
                      <details>
                        <summary><span>View starter code</span><ChevronRight size={14} /></summary>
                        <pre className="practice-starter-code"><code>{entry.lesson.exercise.starterCode}</code></pre>
                      </details>
                    )}
                    {hints.length > 0 && (
                      <div className="practice-hints-container">
                        {hints.map((hint, hIdx) => (
                          <details key={hIdx} className="practice-hint-item">
                            <summary>
                              <span>{hints.length > 1 ? `Hint #${hIdx + 1}` : "Hint"}</span>
                              <ChevronRight size={14} />
                            </summary>
                            <p className="practice-hint-text">{hint}</p>
                          </details>
                        ))}
                      </div>
                    )}
                    <details>
                      <summary><span>Reveal one possible answer</span><ChevronRight size={14} /></summary>
                      <div className="practice-answer">
                        <AssistantMarkdown content={entry.lesson.exercise.solution} />
                      </div>
                    </details>
                    <div className="practice-status-selector-row" role="group" aria-label={`Status for ${entry.lesson.exercise.title}`}>
                      <span className="selector-label">Status:</span>
                      <div className="status-button-group">
                        {(["not-started", "attempted", "completed", "needs-review"] as const).map((status) => (
                          <button
                            key={status}
                            type="button"
                            className={`practice-status-button status-${status} ${exerciseStatus === status ? "active" : ""}`}
                            aria-pressed={exerciseStatus === status}
                            onClick={() => {
                              if (isItemEnrolled) {
                                setProgress((curr) => updateExerciseProgress(curr, entry.course.id, entry.lesson.exercise.id, status));
                              }
                            }}
                            disabled={!isItemEnrolled}
                          >
                            {formatExerciseStatus(status)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    className="practice-lesson-link"
                    onClick={() => {
                      selectCourse(entry.course);
                      openLesson(entry.lesson.id, entry.course.id);
                    }}
                    aria-label={"Open lesson: " + entry.lesson.title}
                  >
                    <BookOpen size={15} /> Lesson<ArrowRight size={13} />
                  </button>
                </article>
              );
            })}
          </div>
        </>
      )}

      {section === "progress" && (
        <>
          <header className="learning-page-heading compact progress-dashboard-heading">
            <span className="eyebrow">YOUR LOCAL DASHBOARD</span>
            <h1>
              See what you have<br />
              <em>worked through.</em>
            </h1>
            <p>Progress is based on activity saved in this browser. Lesson completion is always your choice.</p>
            <span className="local-analytics-label"><span />Local analytics · not synced</span>
          </header>

          {learningSummary.mastery && (
            <div className="mastery-summary-card mb-6 rounded-xl border border-blue-500/30 bg-[var(--surface-secondary)] p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/40 font-bold text-xs">
                    XP
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Engineering Rank</span>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">{learningSummary.mastery.rank}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="rounded bg-blue-500/10 px-2.5 py-1 text-blue-400 font-semibold border border-blue-500/20">
                    {learningSummary.mastery.totalXp} Total XP
                  </span>
                  {learningSummary.mastery.nextRank && (
                    <span className="text-xs text-[var(--text-muted)]">
                      Target: {learningSummary.mastery.nextRank} ({learningSummary.mastery.nextRankXp} XP)
                    </span>
                  )}
                </div>
              </div>
              {learningSummary.mastery.nextRank && (
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-[var(--text-secondary)] mb-1">
                    <span>Rank Progress ({learningSummary.mastery.progressToNextRank}%)</span>
                    <span>{learningSummary.mastery.totalXp} / {learningSummary.mastery.nextRankXp} XP</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--surface-primary)] border border-[var(--border-subtle)] overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                      style={{ width: `${learningSummary.mastery.progressToNextRank}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <section className="dashboard-metrics" aria-label="Learning overview">
            <article>
              <span>Lessons completed</span>
              <strong>
                {learningSummary.lessonsCompleted}
                <small> of {learningSummary.totalLessons} lessons</small>
              </strong>
              <button onClick={() => onNavigate("paths")}>View curriculum <ArrowRight size={13} /></button>
            </article>
            <article>
              <span>Exercises completed</span>
              <strong>{learningSummary.exercisesCompleted}</strong>
              <span className="metric-caption">Self-reported practice status</span>
            </article>
            <article>
              <span>Paths started</span>
              <strong>
                {learningSummary.pathsStarted}
                <small> of {learningSummary.totalPaths} paths</small>
              </strong>
              <button onClick={() => onNavigate("my-learning")}>My learning <ArrowRight size={13} /></button>
            </article>
            <article>
              <span>Paths completed</span>
              <strong>
                {learningSummary.pathsCompleted}
                <small> of {learningSummary.totalPaths} paths</small>
              </strong>
              <span className="metric-caption">Based on completed lessons</span>
            </article>
            <article>
              <span>Learning streak</span>
              <strong>
                {learningSummary.streak}
                <small> {learningSummary.streak === 1 ? "day" : "days"}</small>
              </strong>
              <span className="metric-caption">Consecutive days with recorded activity</span>
            </article>
          </section>

          <section className="dashboard-section activity-dashboard-section">
            <div className="dashboard-section-heading">
              <div><span className="eyebrow">LAST SEVEN DAYS</span><h2>Learning activity</h2></div>
              <span className="dashboard-section-note">Enrollment, lesson opens, and completions</span>
            </div>
            {learningSummary.recentActivity.length ? (
              <div className="dashboard-chart-layout">
                <ActivityBars days={learningSummary.days} label="Learning events over the last seven days" />
                <ol className="dashboard-recent-list">
                  {learningSummary.recentActivity.slice(0, 4).map((item, index) => (
                    <li key={`${item.pathId}-${item.at}-${index}`}>
                      <span className="dashboard-event-icon"><BookOpen size={14} /></span>
                      <span>
                        <strong>{item.lessonTitle ?? item.pathTitle}</strong>
                        <small>
                          {item.kind === "lesson-completed"
                            ? "Lesson marked complete"
                            : item.kind === "exercise-status-updated"
                            ? "Exercise status updated"
                            : item.kind === "lesson-opened"
                            ? "Lesson opened"
                            : "Path started"} · {shortDate(item.at)}
                        </small>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <div className="dashboard-empty">
                <BookOpen size={17} />
                <span>Learning activity will appear after you start a path or open a lesson.</span>
                <button className="learning-text-button" onClick={() => onNavigate("paths")}>
                  Explore paths <ArrowRight size={13} />
                </button>
              </div>
            )}
            {learningSummary.recentLessons.length > 0 && (
              <div className="dashboard-recent-lessons">
                <span>Recent lessons</span>
                {learningSummary.recentLessons.slice(0, 3).map((item, index) => (
                  <button key={`${item.pathId}-${item.lessonId}-${item.at}-${index}`} onClick={() => item.lessonId && openLesson(item.lessonId, item.pathId)}>
                    {item.lessonTitle}
                    <small>{item.kind === "lesson-completed" ? "Completed" : "Opened"} · {shortDate(item.at)}</small>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-section ai-dashboard-section">
            <div className="dashboard-section-heading">
              <div><span className="eyebrow">MODEL REQUESTS</span><h2>AI activity</h2></div>
              <button className="learning-text-button" onClick={onOpenSettings}>Provider settings <ArrowRight size={13} /></button>
            </div>
            {aiActivityIssue ? (
              <p className="dashboard-data-issue" role="status">{aiActivityIssue}</p>
            ) : aiSummary.requestCount ? (
              <>
                <div className="ai-summary-line">
                  <strong>{aiSummary.requestCount}</strong>
                  <span>{aiSummary.requestCount === 1 ? " request" : " requests"} recorded · failed and stopped attempts are included</span>
                </div>
                <p className="analytics-retention-note">These totals cover up to 500 recent requests stored in this browser.</p>
                <div className="dashboard-chart-layout">
                  <ActivityBars days={aiSummary.days} label="AI requests over the last seven days" />
                  <div className="ai-activity-details">
                    <div>
                      <h3>By provider</h3>
                      {aiSummary.providers.map(({ provider: providerId, count }) => (
                        <p key={providerId}>
                          <span>{providerCatalog[providerId].name}</span>
                          <strong>{count}</strong>
                        </p>
                      ))}
                    </div>
                    <div>
                      <h3>Most recent models</h3>
                      {aiSummary.models.slice(0, 3).map(({ key, provider: providerId, count }) => (
                        <p key={key}>
                          <span>{providerCatalog[providerId].name} · {key.slice(providerId.length + 1)}</span>
                          <strong>{count}</strong>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="reported-usage" aria-label="Provider-reported token usage">
                  <span>
                    <strong>{aiSummary.inputTokens?.toLocaleString() ?? "—"}</strong>{" "}
                    input tokens reported in {aiSummary.inputTokenRequests} {aiSummary.inputTokenRequests === 1 ? "request" : "requests"}
                  </span>
                  <span>
                    <strong>{aiSummary.outputTokens?.toLocaleString() ?? "—"}</strong>{" "}
                    output tokens reported in {aiSummary.outputTokenRequests} {aiSummary.outputTokenRequests === 1 ? "request" : "requests"}
                  </span>
                </div>
              </>
            ) : (
              <div className="dashboard-empty">
                <Bot size={17} />
                <span>AI requests will appear here after you ask Kat or send a workspace message. Prompts and credentials are not included.</span>
                <button className="learning-text-button" onClick={() => onNavigate("workspace")}>Open workspace <ArrowRight size={13} /></button>
              </div>
            )}
          </section>

          <section className="dashboard-section workspace-dashboard-section">
            <div className="dashboard-section-heading">
              <div><span className="eyebrow">YOUR WORKSPACE</span><h2>Projects and conversations</h2></div>
              <button className="learning-text-button" onClick={() => onNavigate("workspace")}>Open workspace <ArrowRight size={13} /></button>
            </div>
            <div className="workspace-dashboard-counts">
              <span><FolderKanban size={15} />{workspaceSummary.projectCount} {workspaceSummary.projectCount === 1 ? "project" : "projects"}</span>
              <span><MessageSquare size={15} />{workspaceSummary.conversationCount} {workspaceSummary.conversationCount === 1 ? "conversation" : "conversations"}</span>
              <span><Pin size={15} />{workspaceSummary.pinnedConversations.length} pinned shown</span>
            </div>
            <div className="workspace-dashboard-lists">
              <div>
                <h3>Recent conversations</h3>
                {workspaceSummary.recentConversations.length ? (
                  <ol>
                    {workspaceSummary.recentConversations.map((conversation, index) => (
                      <li key={`${conversation.projectName}-${conversation.title}-${index}`}>
                        <span>
                          <strong>{conversation.title || "Untitled conversation"}</strong>
                          <small>{conversation.projectName}</small>
                        </span>
                        <time dateTime={new Date(conversation.updatedAt).toISOString()}>{shortDate(conversation.updatedAt)}</time>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p>No conversations saved yet.</p>
                )}
              </div>
              <div>
                <h3>Pinned conversations</h3>
                {workspaceSummary.pinnedConversations.length ? (
                  <ol>
                    {workspaceSummary.pinnedConversations.map((conversation, index) => (
                      <li key={`${conversation.projectName}-${conversation.title}-${index}`}>
                        <span>
                          <strong>{conversation.title || "Untitled conversation"}</strong>
                          <small>{conversation.projectName}</small>
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p>Pin a conversation from the workspace sidebar to keep it here.</p>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {section === "lesson" && lesson && lessonModule && (
        <section className="learning-workspace" aria-label="Integrated learning workspace">
          <header className="learning-workspace-header">
            <nav className="lesson-topline" aria-label="Breadcrumb">
              <button className="learning-back-button" onClick={() => onNavigate("paths")}><ArrowLeft size={14} /> Learning paths</button>
              <span className="lesson-crumb-separator">/</span>
              <button className="lesson-path-crumb" onClick={() => onNavigate("paths")}>{course.title}</button>
              <span className="lesson-crumb-separator">/</span>
              <span className="lesson-current-crumb" aria-current="page">{lesson.title}</span>
              <span>{String(currentIndex + 1).padStart(2, "0")} / {String(lessonEntries.length).padStart(2, "0")}</span>
            </nav>
            <div className="lesson-topbar-actions">
              <button
                type="button"
                className={`kat-toggle-button ${katOpen ? "active" : ""}`}
                onClick={toggleKat}
                aria-expanded={katOpen}
                title={katOpen ? "Hide Kat AI tutor" : "Open Kat AI tutor"}
              >
                <Bot size={15} />
                <span>{katOpen ? "Hide Kat" : "Ask Kat"}</span>
              </button>
            </div>
            <div className="learning-workspace-mobile-tabs" role="tablist" aria-label="Learning workspace panels">
              <button type="button" role="tab" aria-selected={effectiveWorkspacePanel === "learn"} aria-controls="learning-panel" onClick={() => setWorkspacePanel("learn")}>
                <BookOpen size={15} />Learn
              </button>
              {showCodeWorkspace && (
                <button type="button" role="tab" aria-selected={effectiveWorkspacePanel === "code"} aria-controls="code-panel" onClick={() => setWorkspacePanel("code")}>
                  <Code2 size={15} />Code
                </button>
              )}
              <button type="button" role="tab" aria-selected={effectiveWorkspacePanel === "kat"} aria-controls="kat-panel" onClick={() => setWorkspacePanel("kat")}>
                <Bot size={15} />Kat
              </button>
            </div>
          </header>
          <div ref={gridRef} className={`learning-workspace-grid${showCodeWorkspace ? "" : " learning-workspace-grid-no-code"}`}>
            <aside
              id="learning-panel"
              style={
                !smallWorkspace
                  ? {
                      flex: `0 0 ${
                        katOpen
                          ? showCodeWorkspace
                            ? layout.threePanelWidths[0]
                            : layout.twoPanelWidths[0]
                          : showCodeWorkspace
                          ? layout.twoPanelWidths[0]
                          : 100
                      }%`,
                    }
                  : undefined
              }
              className={`learning-workspace-panel learning-panel${effectiveWorkspacePanel === "learn" ? " panel-active" : ""}`}
              role="tabpanel"
              aria-label="Lesson and course content"
              aria-hidden={smallWorkspace && effectiveWorkspacePanel !== "learn"}
              inert={smallWorkspace && effectiveWorkspacePanel !== "learn"}
            >
              <div className="workspace-panel-heading">
                <div className="lesson-badge-row">
                  <span className="eyebrow">LEARN · {course.title}</span>
                  <span className="lesson-type-badge">{formatLessonType(lessonType)}</span>
                  {lesson.estimatedDurationMinutes ? (
                    <span className="lesson-duration-badge">
                      <Clock size={11} />
                      {lesson.estimatedDurationMinutes} min
                    </span>
                  ) : null}
                </div>
                <h1>{lesson.title}</h1>
                <p>{lesson.summary}</p>
              </div>

              <details className="workspace-course-nav">
                <summary><Compass size={15} />Course navigation<ChevronRight size={14} /></summary>
                {course.modules.map((item) => (
                  <section key={item.id}>
                    <h3><span>{String(item.order).padStart(2, "0")}</span>{item.title}</h3>
                    <ol>
                      {item.lessons.map((entry) => (
                        <li key={entry.id}>
                          <button className={(entry.id === lesson.id ? "current " : "") + (completedIds.has(entry.id) ? "completed" : "")} onClick={() => openLesson(entry.id)}>
                            <span>{completedIds.has(entry.id) ? <Check size={12} /> : <Circle size={10} />}</span>
                            {entry.title}
                          </button>
                        </li>
                      ))}
                    </ol>
                  </section>
                ))}
              </details>

              <div className="lesson-objectives">
                <span>LESSON OBJECTIVES</span>
                <ul>
                  {lesson.objectiveIds.map((id) => {
                    const objective = course.objectives.find((item) => item.id === id);
                    return objective ? <li key={id}><Check size={13} />{objective.title}</li> : null;
                  })}
                </ul>
              </div>

              <article className="lesson-panel-content">
                <div className="lesson-meta">
                  <span>{lessonModule.title}</span>
                  <span>{course.level}</span>
                </div>
                <div className="lesson-copy">
                  {lesson.theorySections && lesson.theorySections.length > 0 ? (
                    <div className="lesson-theory-sections">
                      {lesson.theorySections.map((sec, idx) => (
                        <section key={sec.id || idx} className="lesson-theory-section">
                          {sec.title && <h3>{sec.title}</h3>}
                          <AssistantMarkdown content={sec.content} />
                        </section>
                      ))}
                    </div>
                  ) : (
                    <AssistantMarkdown content={lesson.content} />
                  )}
                </div>
              </article>

              {lesson.codeExamples && lesson.codeExamples.length > 0 && (
                <section className="lesson-code-examples" aria-label="Code examples">
                  <span className="eyebrow">CODE EXAMPLES</span>
                  {lesson.codeExamples.map((ex, idx) => (
                    <article key={`${ex.title}-${idx}`} className="lesson-code-example-card">
                      <div className="code-example-header">
                        <h4>{ex.title}</h4>
                        {ex.language && <span className="code-example-lang">{ex.language.toUpperCase()}</span>}
                      </div>
                      {ex.description && <p>{ex.description}</p>}
                      <pre className="code-example-block"><code>{ex.code}</code></pre>
                    </article>
                  ))}
                </section>
              )}

              {lesson.interactiveDemo && (
                <section className="lesson-interactive-demo" aria-label="Interactive demonstration">
                  <div className="demo-header">
                    <span className="eyebrow">INTERACTIVE DEMO · {lesson.interactiveDemo.kind.toUpperCase()}</span>
                    <h3>{lesson.interactiveDemo.title ?? "Interactive Demonstration"}</h3>
                    {lesson.interactiveDemo.description && <p>{lesson.interactiveDemo.description}</p>}
                  </div>
                  {lesson.interactiveDemo.kind === "circuit" ? (
                    <div className="mt-3">
                      <SimulatorErrorBoundary fallbackTitle="Circuit Simulator Encountered an Error">
                        <CircuitSimulator
                          initialMode={lesson.interactiveDemo.config?.mode === "analog" ? "analog" : "digital"}
                          initialGate={
                            typeof lesson.interactiveDemo.config?.gate === "string" &&
                            ["AND", "OR", "NOT", "NAND", "NOR", "XOR"].includes(lesson.interactiveDemo.config.gate)
                              ? (lesson.interactiveDemo.config.gate as "AND" | "OR" | "NOT" | "NAND" | "NOR" | "XOR")
                              : "AND"
                          }
                        />
                      </SimulatorErrorBoundary>
                    </div>
                  ) : lesson.interactiveDemo.kind === "memory-diagram" ? (
                    <div className="mt-3">
                      <SimulatorErrorBoundary fallbackTitle="Memory Visualizer Encountered an Error">
                        <MemoryVisualizer
                          initialScenario={
                            lesson.interactiveDemo.config?.mode === "heap"
                              ? "heap-lifecycle"
                              : lesson.interactiveDemo.config?.mode === "pointers"
                              ? "pointers"
                              : "stack-frames"
                          }
                        />
                      </SimulatorErrorBoundary>
                    </div>
                  ) : (
                    <div className="demo-stage-card">
                      <div className="demo-stage-note">
                        <Sparkles size={16} />
                        <span>Demonstration type: {lesson.interactiveDemo.kind}</span>
                      </div>
                      {lesson.interactiveDemo.config && (
                        <div className="demo-initial-state">
                          <span>Configured parameters:</span>
                          <pre><code>{JSON.stringify(lesson.interactiveDemo.config, null, 2)}</code></pre>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}

              {lesson.resources && lesson.resources.length > 0 && (
                <section className="lesson-resources" aria-label="Lesson resources and references">
                  <div className="resources-header">
                    <span className="eyebrow">RESOURCES &amp; REFERENCES</span>
                  </div>
                  <ul className="resources-list">
                    {lesson.resources.map((res, idx) => (
                      <li key={idx} className="resource-item">
                        <div className="resource-info">
                          <div className="resource-title-row">
                            <strong>{res.title}</strong>
                            <span className="resource-type-tag">{res.type}</span>
                          </div>
                          {res.description && <p>{res.description}</p>}
                        </div>
                        {res.url && (
                          <a href={res.url} target="_blank" rel="noopener noreferrer" className="resource-link">
                            <span>Open resource</span>
                            <ArrowRight size={12} />
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {lesson.exampleRun && (
                <section className="lesson-example-run" aria-label="Expected output for the lesson example">
                  <div className="lesson-example-run-heading">
                    <span>EXAMPLE RUN</span>
                    <p>Expected result for the code above. This reference is not graded.</p>
                  </div>
                  {lesson.exampleRun.sampleInput !== undefined && (
                    <div className="lesson-example-input">
                      <span>Sample input</span>
                      <pre><code>{lesson.exampleRun.sampleInput}</code></pre>
                    </div>
                  )}
                  <div className="lesson-example-output">
                    <span>Expected output</span>
                    <pre><code>{lesson.exampleRun.expectedOutput}</code></pre>
                  </div>
                  {lesson.exampleRun.expectedFiles?.map((file) => (
                    <div className="lesson-example-file" key={file.path}>
                      <span>Expected file</span>
                      <strong>{file.path}</strong>
                      <pre><code>{file.content}</code></pre>
                    </div>
                  ))}
                </section>
              )}

              {showCodeWorkspace && extractLessonCode(lesson, activeLanguage) && (
                <section className="lesson-experiment">
                  <div>
                    <span className="eyebrow">TRY IT IN THE EDITOR</span>
                    <h2>Change one thing, then predict the result.</h2>
                    <p>This loads the lesson example into the local {activeLanguage === "python" ? "Python" : "C11"} editor. Your edits remain in this browser.</p>
                  </div>
                  <button type="button" className="secondary-button" onClick={openExampleInPlayground}>
                    <Code2 size={14} /> Load lesson example
                  </button>
                </section>
              )}

              <section className="lesson-exercise-section" aria-label="Practical exercise">
                <div className="exercise-section-header">
                  <div className="exercise-eyebrow-row">
                    <span className="eyebrow">PRACTICAL EXERCISE · {lesson.exercise.difficulty.toUpperCase()}</span>
                    <span className={`exercise-status-chip status-${currentExerciseStatus}`}>
                      {formatExerciseStatus(currentExerciseStatus)}
                    </span>
                  </div>
                  <h3>{lesson.exercise.title}</h3>
                </div>
                <p className="exercise-prompt">{lesson.exercise.prompt}</p>
                <p className="exercise-outcome"><strong>Practice goal:</strong> {lesson.exercise.expectedOutcome}</p>
                {lesson.exercise.starterCode && (
                  <details className="exercise-starter-details">
                    <summary><span>Starter code</span><ChevronRight size={14} /></summary>
                    <pre className="practice-starter-code"><code>{lesson.exercise.starterCode}</code></pre>
                  </details>
                )}
                {lessonHints.length > 0 && (
                  <div className="exercise-hints-wrapper">
                    {lessonHints.map((hint, hIdx) => (
                      <details key={hIdx} className="exercise-hint-details">
                        <summary>
                          <span>{lessonHints.length > 1 ? `Hint #${hIdx + 1}` : "View hint"}</span>
                          <ChevronRight size={14} />
                        </summary>
                        <p className="exercise-hint-text">{hint}</p>
                      </details>
                    ))}
                  </div>
                )}
                {lesson.exercise.testCases && lesson.exercise.testCases.length > 0 && (
                  <div className="exercise-verifier-card" aria-label="Automated test cases">
                    <div className="verifier-header">
                      <div>
                        <span className="eyebrow"><CheckCircle2 size={13} /> AUTOMATED VERIFIER</span>
                        <h4>Solution Test Cases ({lesson.exercise.testCases.length})</h4>
                      </div>
                      <button
                        type="button"
                        className="verify-solution-btn"
                        onClick={handleVerifyExercise}
                        disabled={isVerifying}
                      >
                        {isVerifying ? (
                          <>
                            <Loader2 size={14} className="spin-icon" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <Play size={14} />
                            <span>Verify Solution</span>
                          </>
                        )}
                      </button>
                    </div>

                    {verificationReport && (
                      <div className={`verifier-summary-banner ${verificationReport.allPassed ? "all-passed" : "has-failures"}`}>
                        <div className="summary-status-line">
                          {verificationReport.allPassed ? (
                            <>
                              <CheckCircle2 size={16} />
                              <strong>All test cases passed! ({verificationReport.passedCount} / {verificationReport.totalCount})</strong>
                            </>
                          ) : (
                            <>
                              <XCircle size={16} />
                              <strong>
                                {verificationReport.shortCircuited
                                  ? "Compilation Error — tests halted"
                                  : `Passed ${verificationReport.passedCount} of ${verificationReport.totalCount} test cases`}
                              </strong>
                            </>
                          )}
                        </div>
                        {verificationReport.compileError && (
                          <pre className="verifier-compile-error">
                            <code>{verificationReport.compileError}</code>
                          </pre>
                        )}
                      </div>
                    )}

                    <div className="verifier-cases-list">
                      {(verificationReport
                        ? verificationReport.results
                        : lesson.exercise.testCases.map((tc): TestCaseResult => ({
                            id: tc.id,
                            label: tc.label,
                            passed: false,
                            hidden: Boolean(tc.hidden),
                            matchMode: tc.matchMode ?? "trimmed",
                            actualStdout: "",
                            expectedStdout: tc.expectedStdout,
                            exitCode: 0,
                            executionTimeMs: 0,
                            skipped: false,
                            stderr: undefined,
                          }))
                      ).map((tc, idx) => {
                        const masked = maskHiddenTestCase(tc);
                        const hasRun = Boolean(verificationReport);
                        const passed = hasRun && tc.passed;
                        const skipped = hasRun && tc.skipped;

                        return (
                          <div
                            key={tc.id || idx}
                            className={`test-case-item ${hasRun ? (passed ? "case-pass" : skipped ? "case-skipped" : "case-fail") : "case-pending"}`}
                          >
                            <div className="test-case-header">
                              <span className="case-status-indicator">
                                {hasRun ? (
                                  passed ? (
                                    <CheckCircle2 size={15} className="text-success" />
                                  ) : skipped ? (
                                    <AlertCircle size={15} className="text-muted" />
                                  ) : (
                                    <XCircle size={15} className="text-danger" />
                                  )
                                ) : (
                                  <Circle size={15} className="text-muted" />
                                )}
                              </span>
                              <span className="case-label">{tc.label}</span>
                              {tc.hidden && <span className="case-hidden-tag">Private test</span>}
                              {hasRun && !skipped && tc.executionTimeMs > 0 && (
                                <span className="case-runtime">{tc.executionTimeMs} ms</span>
                              )}
                              {skipped && <span className="case-runtime">Skipped</span>}
                            </div>

                            {hasRun && !passed && !skipped && (
                              <div className="test-case-details">
                                {!tc.hidden ? (
                                  <div className="diff-comparison">
                                    <div className="diff-col">
                                      <span className="diff-heading">Expected stdout:</span>
                                      <pre className="diff-pre"><code>{masked.expectedStdout}</code></pre>
                                    </div>
                                    <div className="diff-col">
                                      <span className="diff-heading">Actual stdout:</span>
                                      <pre className="diff-pre diff-actual"><code>{masked.actualStdout || "(no output)"}</code></pre>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="hidden-test-note">This is a hidden evaluation case. Check your edge conditions and format constraints.</p>
                                )}
                                {tc.stderr && !tc.hidden && (
                                  <pre className="case-stderr"><code>{tc.stderr}</code></pre>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <details className="exercise-solution-details">
                  <summary><span>Reveal suggested answer</span><ChevronRight size={14} /></summary>
                  <div className="practice-answer">
                    <AssistantMarkdown content={lesson.exercise.solution} />
                  </div>
                </details>
                <div className="exercise-status-tracker" role="group" aria-label="Exercise progress status">
                  <span className="status-tracker-label">Your exercise status:</span>
                  <div className="status-pill-group">
                    {(["not-started", "attempted", "completed", "needs-review"] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={`status-pill status-${status} ${currentExerciseStatus === status ? "active" : ""}`}
                        aria-pressed={currentExerciseStatus === status}
                        onClick={() => {
                          if (enrolled) {
                            setProgress((curr) => updateExerciseProgress(curr, course.id, lesson.exercise.id, status));
                          }
                        }}
                        disabled={!enrolled}
                      >
                        {formatExerciseStatus(status)}
                      </button>
                    ))}
                  </div>
                  {!enrolled && <small className="status-enroll-tip">Start this path to record exercise status.</small>}
                </div>
              </section>

              <section className="lesson-checkpoint">
                <div className="checkpoint-kicker"><Lightbulb size={15} /> CHECK YOUR UNDERSTANDING</div>
                <p>{lesson.checkpoint.prompt}</p>
                <details>
                  <summary>Reveal a short explanation <ChevronRight size={14} /></summary>
                  <p>{lesson.checkpoint.answer}</p>
                </details>
                <button className="secondary-button" onClick={askKatAboutLesson}>
                  <Sparkles size={14} /> Ask Kat for a hint
                </button>
              </section>

              {enrolled ? (
                <button
                  className={"lesson-complete-button" + (completedIds.has(lesson.id) ? " is-complete" : "")}
                  onClick={() => setProgress((current) => completeLesson(current, course.id, lesson.id))}
                >
                  {completedIds.has(lesson.id) ? (
                    <><Check size={15} /> Lesson completed</>
                  ) : (
                    <>Mark lesson complete <Check size={15} /></>
                  )}
                </button>
              ) : (
                <div className="lesson-enroll-callout">
                  <span>Start the path to save your learning progress.</span>
                  <button className="primary-button" onClick={() => setProgress((current) => enrollInPath(current, course.id))}>
                    Start this path <ArrowRight size={14} />
                  </button>
                </div>
              )}

              <div className="lesson-progress-mini">
                <span className="eyebrow">PATH PROGRESS</span>
                <strong>{pathState.completedCount} / {pathState.totalLessons}</strong>
                <span>lessons completed · {pathState.completionPercent}%</span>
                {progressBar}
              </div>

              <nav className="lesson-pagination" aria-label="Lesson navigation">
                <button disabled={currentIndex <= 0} onClick={() => openLesson(lessonEntries[currentIndex - 1]?.lesson.id ?? lesson.id)}>
                  <ArrowLeft size={14} />
                  <span><small>PREVIOUS</small>{lessonEntries[currentIndex - 1]?.lesson.title ?? "First lesson"}</span>
                </button>
                <button disabled={currentIndex >= lessonEntries.length - 1} onClick={() => openLesson(lessonEntries[currentIndex + 1]?.lesson.id ?? lesson.id)}>
                  <span><small>NEXT LESSON</small>{lessonEntries[currentIndex + 1]?.lesson.title ?? "Path complete"}</span>
                  <ArrowRight size={14} />
                </button>
              </nav>
            </aside>

            {!smallWorkspace && (showCodeWorkspace || katOpen) && (
              <div
                role="separator"
                tabIndex={0}
                aria-orientation="vertical"
                aria-label={
                  katOpen && showCodeWorkspace
                    ? "Resize Theory and Code panels"
                    : katOpen && !showCodeWorkspace
                    ? "Resize Theory and Kat panels"
                    : "Resize Theory and Code panels"
                }
                aria-valuenow={
                  katOpen && showCodeWorkspace
                    ? layout.threePanelWidths[0]
                    : layout.twoPanelWidths[0]
                }
                className="workspace-splitter"
                onPointerDown={(e) => handleSplitterPointerDown(0, e)}
                onPointerMove={(e) => handleSplitterPointerMove(0, e)}
                onPointerUp={(e) => handleSplitterPointerUp(0, e)}
                onKeyDown={(e) => handleSplitterKeyDown(0, e)}
              />
            )}

            {showCodeWorkspace && (
              <>
                <section
                  id="code-panel"
                  style={
                    !smallWorkspace
                      ? {
                          flex: `0 0 ${
                            katOpen
                              ? layout.threePanelWidths[1]
                              : layout.twoPanelWidths[1]
                          }%`,
                        }
                      : undefined
                  }
                  className={`learning-workspace-panel learning-code-panel${effectiveWorkspacePanel === "code" ? " panel-active" : ""}`}
                  role="tabpanel"
                  aria-label={`${activeLanguage === "python" ? "Python 3.12" : "C11"} coding workspace`}
                  aria-hidden={smallWorkspace && effectiveWorkspacePanel !== "code"}
                  inert={smallWorkspace && effectiveWorkspacePanel !== "code"}
                >
                  {activeLanguage === "python" || activeLanguage === "javascript" ? (
                    <CodeWorkspace
                      key={`${lesson.id}-${loadedExampleCode?.lessonId === lesson.id ? loadedExampleCode.code.length : "default"}`}
                      language={activeLanguage}
                      initialCode={lessonCode}
                      sampleInput={lessonSampleInput}
                      lessonId={lesson.id}
                      lessonTitle={lesson.title}
                      onActivityChange={setEditorActivity}
                      onAskKatAboutError={askKatAboutError}
                    />
                  ) : (
                    <>
                      <div className="workspace-panel-heading code-panel-heading">
                        <span className="eyebrow"><Terminal size={13} /> CODE · LOCAL C11 SANDBOX</span>
                        <h2>Try the idea yourself</h2>
                        <p>Edit, compile, and inspect output without leaving this lesson.</p>
                      </div>
                      <CPlayground
                        key={`c-playground-${lesson.id}`}
                        initialLanguage="c"
                        pendingExample={
                          pendingExample && pendingExample.lessonId === lesson.id
                            ? pendingExample
                            : {
                                code: lessonCode,
                                lessonId: lesson.id,
                                lessonTitle: lesson.title,
                                requestId: 1,
                                sampleInput: lessonSampleInput,
                                language: "c",
                              }
                        }
                        autoInitialize
                        compact
                        onReturnToLesson={(lessonId) => onNavigate("lesson", lessonId)}
                        onActivityChange={setEditorActivity}
                      />
                    </>
                  )}
                </section>

                {!smallWorkspace && katOpen && (
                  <div
                    role="separator"
                    tabIndex={0}
                    aria-orientation="vertical"
                    aria-label="Resize Code and Kat panels"
                    aria-valuenow={layout.threePanelWidths[1]}
                    className="workspace-splitter"
                    onPointerDown={(e) => handleSplitterPointerDown(1, e)}
                    onPointerMove={(e) => handleSplitterPointerMove(1, e)}
                    onPointerUp={(e) => handleSplitterPointerUp(1, e)}
                    onKeyDown={(e) => handleSplitterKeyDown(1, e)}
                  />
                )}
              </>
            )}

            <section
              id="kat-panel"
              style={
                !smallWorkspace
                  ? {
                      display: katOpen ? "flex" : "none",
                      flex: `0 0 ${
                        showCodeWorkspace
                          ? layout.threePanelWidths[2]
                          : layout.twoPanelWidths[1]
                      }%`,
                      flexDirection: "column",
                    }
                  : undefined
              }
              className={`learning-workspace-panel learning-kat-panel${effectiveWorkspacePanel === "kat" ? " panel-active" : ""}`}
              role="tabpanel"
              aria-label="Kat AI tutor"
              aria-hidden={smallWorkspace ? effectiveWorkspacePanel !== "kat" : !katOpen}
              inert={smallWorkspace ? effectiveWorkspacePanel !== "kat" : !katOpen}
            >
              {!smallWorkspace && (
                <div className="kat-panel-header-bar">
                  <span className="kat-panel-title">
                    <Bot size={14} /> Kat AI Tutor
                  </span>
                  <button
                    type="button"
                    className="close-kat-button"
                    onClick={toggleKat}
                    aria-label="Close Kat panel"
                    title="Close Kat panel"
                  >
                    <X size={15} />
                    <span>Close</span>
                  </button>
                </div>
              )}
              <KatTutor
                provider={provider}
                model={model}
                modelName={modelName}
                sessionKey={sessionKey}
                cloudflareAccountId={cloudflareAccountId}
                ollamaBaseUrl={ollamaBaseUrl}
                configured={configured}
                context={currentTutorContext}
                workspaceActivity={showCodeWorkspace ? editorActivity : undefined}
                skills={skills}
                draftPrompt={katDraftPrompt}
                onOpenSettings={onOpenSettings}
                onOpenLesson={() => setWorkspacePanel("learn")}
              />
            </section>
          </div>
        </section>
      )}
    </div>
  );
}
