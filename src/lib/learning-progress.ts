import { z } from "zod";
import { findLesson, flattenLessons } from "./learning-model";
import type { LearningPath } from "./learning-model";
import { learningPaths } from "@/data/curriculum/learning-index";

export const LEARNING_PROGRESS_KEY = "katalyst.learning.v1";
export const MAX_LEARNING_PROGRESS_BYTES = 256_000;
const MAX_ACTIVITY = 100;

export type ExerciseProgressStatus = "not-started" | "attempted" | "completed" | "needs-review";

export type ExerciseProgressRecord = {
  exerciseId: string;
  status: ExerciseProgressStatus;
  updatedAt: number;
};

export type LearningActivity = {
  kind: "enrolled" | "lesson-opened" | "lesson-completed" | "exercise-status-updated";
  at: number;
  lessonId?: string;
  exerciseId?: string;
  status?: ExerciseProgressStatus;
};

export type LearningEnrollment = {
  pathId: string;
  enrolledAt: number;
  lastOpenedLessonId: string | null;
  completedLessons: Array<{ lessonId: string; completedAt: number }>;
  exerciseProgress?: ExerciseProgressRecord[];
  verifiedExerciseIds?: string[];
  activity: LearningActivity[];
};

export type LearningProgress = { version: 1; enrollments: LearningEnrollment[] };

export type LearningProgressRead =
  | { kind: "missing"; progress: LearningProgress }
  | { kind: "valid"; progress: LearningProgress }
  | { kind: "corrupt"; issue: string }
  | { kind: "unsupported"; issue: string };

export const exerciseProgressStatusSchema = z.enum(["not-started", "attempted", "completed", "needs-review"]);

const exerciseProgressSchema = z.object({
  exerciseId: z.string().min(1).max(120),
  status: exerciseProgressStatusSchema,
  updatedAt: z.number().int().nonnegative(),
}).strict();

const activitySchema = z.object({
  kind: z.enum(["enrolled", "lesson-opened", "lesson-completed", "exercise-status-updated"]),
  at: z.number().int().nonnegative(),
  lessonId: z.string().min(1).max(120).optional(),
  exerciseId: z.string().min(1).max(120).optional(),
  status: exerciseProgressStatusSchema.optional(),
}).strict();

const enrollmentSchema = z.object({
  pathId: z.string().min(1).max(120),
  enrolledAt: z.number().int().nonnegative(),
  lastOpenedLessonId: z.string().min(1).max(120).nullable(),
  completedLessons: z.array(z.object({ lessonId: z.string().min(1).max(120), completedAt: z.number().int().nonnegative() }).strict()).max(500),
  exerciseProgress: z.array(exerciseProgressSchema).max(500).optional(),
  verifiedExerciseIds: z.array(z.string().min(1).max(120)).max(500).optional().default([]),
  activity: z.array(activitySchema).max(MAX_ACTIVITY),
}).strict();

const progressSchema = z.object({ version: z.literal(1), enrollments: z.array(enrollmentSchema).max(100) }).strict();

export function emptyLearningProgress(): LearningProgress {
  return { version: 1, enrollments: [] };
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function validForCurriculum(progress: LearningProgress): boolean {
  const enrollmentIds = new Set<string>();
  for (const enrollment of progress.enrollments) {
    if (enrollmentIds.has(enrollment.pathId)) return false;
    enrollmentIds.add(enrollment.pathId);
    const path = learningPaths.find((item) => item.id === enrollment.pathId);
    if (!path) return false;
    const lessons = flattenLessons(path);
    const lessonIds = new Set(lessons.map(({ lesson }) => lesson.id));
    const exerciseIds = new Set(lessons.map(({ lesson }) => lesson.exercise.id));
    if (enrollment.lastOpenedLessonId && !lessonIds.has(enrollment.lastOpenedLessonId)) return false;
    const completed = new Set<string>();
    for (const lesson of enrollment.completedLessons) {
      if (!lessonIds.has(lesson.lessonId) || completed.has(lesson.lessonId)) return false;
      completed.add(lesson.lessonId);
    }
    if (enrollment.exerciseProgress) {
      const seenExercises = new Set<string>();
      for (const ex of enrollment.exerciseProgress) {
        if (!exerciseIds.has(ex.exerciseId) || seenExercises.has(ex.exerciseId)) return false;
        seenExercises.add(ex.exerciseId);
      }
    }
    if (enrollment.verifiedExerciseIds) {
      for (const exId of enrollment.verifiedExerciseIds) {
        if (!exerciseIds.has(exId)) return false;
      }
    }
    if (enrollment.activity.some((item) => item.lessonId && !lessonIds.has(item.lessonId))) return false;
    if (enrollment.activity.some((item) => item.exerciseId && !exerciseIds.has(item.exerciseId))) return false;
  }
  return true;
}

export function readLearningProgress(raw: string | null): LearningProgressRead {
  if (raw === null) return { kind: "missing", progress: emptyLearningProgress() };
  if (byteLength(raw) > MAX_LEARNING_PROGRESS_BYTES) return { kind: "corrupt", issue: "Saved learning progress is larger than the supported limit. It has not been changed." };
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { kind: "corrupt", issue: "Saved learning progress is not valid JSON. It has not been changed." };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { kind: "corrupt", issue: "Saved learning progress has an invalid shape. It has not been changed." };
  }
  if ((value as { version?: unknown }).version !== 1) {
    return { kind: "unsupported", issue: "This learning progress version is not supported. It has not been changed." };
  }
  const parsed = progressSchema.safeParse(value);
  if (!parsed.success || !validForCurriculum(parsed.data)) {
    return { kind: "corrupt", issue: "Saved learning progress contains invalid or unknown curriculum records. It has not been changed." };
  }
  return { kind: "valid", progress: parsed.data };
}

export function writeLearningProgress(storage: Pick<Storage, "setItem">, progress: LearningProgress): void {
  if (!validForCurriculum(progress)) throw new Error("Learning progress contains an unknown path or lesson.");
  const serialized = JSON.stringify(progressSchema.parse(progress));
  if (byteLength(serialized) > MAX_LEARNING_PROGRESS_BYTES) throw new Error("Learning progress reached the 256 KB storage limit.");
  storage.setItem(LEARNING_PROGRESS_KEY, serialized);
}

function appendActivity(enrollment: LearningEnrollment, activity: LearningActivity): LearningEnrollment {
  return { ...enrollment, activity: [...enrollment.activity, activity].slice(-MAX_ACTIVITY) };
}

export function enrollInPath(progress: LearningProgress, pathId: string, at = Date.now()): LearningProgress {
  const path = learningPaths.find((item) => item.id === pathId);
  if (!path || progress.enrollments.some((item) => item.pathId === pathId)) return progress;
  return {
    ...progress,
    enrollments: [...progress.enrollments, {
      pathId,
      enrolledAt: at,
      lastOpenedLessonId: null,
      completedLessons: [],
      activity: [{ kind: "enrolled", at }],
    }],
  };
}

export function recordLessonOpened(progress: LearningProgress, pathId: string, lessonId: string, at = Date.now()): LearningProgress {
  const path = learningPaths.find((item) => item.id === pathId);
  if (!path || !findLesson(path, lessonId)) return progress;
  return {
    ...progress,
    enrollments: progress.enrollments.map((enrollment) => enrollment.pathId === pathId
      ? appendActivity({ ...enrollment, lastOpenedLessonId: lessonId }, { kind: "lesson-opened", lessonId, at })
      : enrollment),
  };
}

export function completeLesson(progress: LearningProgress, pathId: string, lessonId: string, at = Date.now()): LearningProgress {
  const path = learningPaths.find((item) => item.id === pathId);
  const enrollment = progress.enrollments.find((item) => item.pathId === pathId);
  if (!path || !enrollment || !findLesson(path, lessonId) || enrollment.completedLessons.some((item) => item.lessonId === lessonId)) return progress;
  return {
    ...progress,
    enrollments: progress.enrollments.map((item) => item.pathId === pathId
      ? appendActivity({ ...item, completedLessons: [...item.completedLessons, { lessonId, completedAt: at }] }, { kind: "lesson-completed", lessonId, at })
      : item),
  };
}

export function getExerciseProgress(
  progress: LearningProgress,
  pathId: string,
  exerciseId: string,
): ExerciseProgressStatus {
  const enrollment = progress.enrollments.find((item) => item.pathId === pathId);
  if (!enrollment) return "not-started";

  const record = enrollment.exerciseProgress?.find((item) => item.exerciseId === exerciseId);
  if (record) return record.status;

  const path = learningPaths.find((item) => item.id === pathId);
  if (path) {
    const lessonEntry = flattenLessons(path).find(({ lesson }) => lesson.exercise.id === exerciseId);
    if (lessonEntry && enrollment.completedLessons.some((l) => l.lessonId === lessonEntry.lesson.id)) {
      return "completed";
    }
  }

  return "not-started";
}

export function updateExerciseProgress(
  progress: LearningProgress,
  pathId: string,
  exerciseId: string,
  status: ExerciseProgressStatus,
  at = Date.now(),
): LearningProgress {
  const path = learningPaths.find((item) => item.id === pathId);
  const enrollment = progress.enrollments.find((item) => item.pathId === pathId);
  if (!path || !enrollment) return progress;

  const exerciseExists = flattenLessons(path).some(({ lesson }) => lesson.exercise.id === exerciseId);
  if (!exerciseExists) return progress;

  const currentRecords = enrollment.exerciseProgress ?? [];
  const existingIndex = currentRecords.findIndex((r) => r.exerciseId === exerciseId);

  let nextRecords: ExerciseProgressRecord[];
  if (existingIndex >= 0) {
    nextRecords = currentRecords.map((r, i) =>
      i === existingIndex ? { ...r, status, updatedAt: at } : r,
    );
  } else {
    nextRecords = [...currentRecords, { exerciseId, status, updatedAt: at }];
  }

  const currentVerified = enrollment.verifiedExerciseIds ?? [];
  let nextVerified = currentVerified;
  if (status === "completed" && !currentVerified.includes(exerciseId)) {
    nextVerified = [...currentVerified, exerciseId];
  } else if (status !== "completed" && currentVerified.includes(exerciseId)) {
    nextVerified = currentVerified.filter((id) => id !== exerciseId);
  }

  return {
    ...progress,
    enrollments: progress.enrollments.map((item) =>
      item.pathId === pathId
        ? appendActivity(
            { ...item, exerciseProgress: nextRecords, verifiedExerciseIds: nextVerified },
            { kind: "exercise-status-updated", exerciseId, status, at },
          )
        : item,
    ),
  };
}

export function getPathProgress(progress: LearningProgress, path: LearningPath) {
  const enrollment = progress.enrollments.find((item) => item.pathId === path.id);
  const lessons = flattenLessons(path);
  const completed = new Set(enrollment?.completedLessons.map((item) => item.lessonId) ?? []);
  const next = lessons.find(({ lesson }) => !completed.has(lesson.id));
  const last = enrollment?.lastOpenedLessonId ? findLesson(path, enrollment.lastOpenedLessonId) : undefined;
  return {
    enrollment,
    totalLessons: lessons.length,
    completedCount: completed.size,
    completionPercent: lessons.length ? Math.round((completed.size / lessons.length) * 100) : 0,
    nextLesson: next,
    lastOpenedLesson: last,
  };
}

export function getPathById(pathId: string): LearningPath | undefined {
  return learningPaths.find((path) => path.id === pathId);
}

function localDayStart(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function getLearningDashboardSummary(progress: LearningProgress, now = Date.now()) {
  const pathsStarted = progress.enrollments.length;
  const pathsCompleted = progress.enrollments.filter((enrollment) => {
    const path = getPathById(enrollment.pathId);
    return path !== undefined && getPathProgress(progress, path).completedCount === flattenLessons(path).length;
  }).length;
  const lessonsCompleted = progress.enrollments.reduce((total, enrollment) => total + enrollment.completedLessons.length, 0);
  const totalLessons = learningPaths.reduce((total, path) => total + flattenLessons(path).length, 0);
  const activity = progress.enrollments.flatMap((enrollment) => {
    const path = getPathById(enrollment.pathId);
    if (!path) return [];
    return enrollment.activity.map((item) => ({
      ...item,
      pathId: path.id,
      pathTitle: path.title,
      lessonTitle: item.lessonId ? findLesson(path, item.lessonId)?.lesson.title : undefined,
    }));
  }).filter((item) => item.at <= now).sort((a, b) => b.at - a.at);

  const activeDays = new Set(activity.map((item) => localDayStart(item.at)));
  const today = localDayStart(now);
  let streak = 0;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  let cursor = activeDays.has(today) ? today : yesterday.getTime();
  while (activeDays.has(cursor)) {
    streak += 1;
    const previous = new Date(cursor);
    previous.setDate(previous.getDate() - 1);
    cursor = previous.getTime();
  }

  const days = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - offset));
    const start = date.getTime();
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + 1);
    const end = endDate.getTime();
    return {
      date: start,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      count: activity.filter((item) => item.at >= start && item.at < end).length,
    };
  });

  const exercisesCompleted = progress.enrollments.reduce((total, enrollment) => {
    const path = getPathById(enrollment.pathId);
    if (!path) return total;
    const lessons = flattenLessons(path);
    const completedLessonIds = new Set(enrollment.completedLessons.map((l) => l.lessonId));
    const explicitStatusMap = new Map(
      (enrollment.exerciseProgress ?? []).map((e) => [e.exerciseId, e.status]),
    );
    const verifiedIds = new Set(enrollment.verifiedExerciseIds ?? []);

    let count = 0;
    for (const { lesson } of lessons) {
      const explicit = explicitStatusMap.get(lesson.exercise.id);
      if (verifiedIds.has(lesson.exercise.id)) {
        count += 1;
      } else if (explicit === "completed") {
        count += 1;
      } else if (!explicit && completedLessonIds.has(lesson.id)) {
        count += 1;
      }
    }
    return total + count;
  }, 0);

  const dashboardSummary = {
    lessonsCompleted,
    totalLessons,
    exercisesCompleted,
    pathsStarted,
    pathsCompleted,
    totalPaths: learningPaths.length,
    streak,
    days,
    recentActivity: activity.slice(0, 8),
    recentLessons: activity.filter((item) => item.lessonTitle).slice(0, 5),
  };

  return {
    ...dashboardSummary,
    mastery: computeMasteryFromCounts(lessonsCompleted, exercisesCompleted),
  };
}

export interface EngineeringMastery {
  totalXp: number;
  exerciseXp: number;
  lessonXp: number;
  rank: string;
  nextRank: string | null;
  nextRankXp: number | null;
  progressToNextRank: number;
  verifiedExercisesCount: number;
  completedLessonsCount: number;
}

export const ENGINEERING_RANKS = [
  { minXp: 0, title: "Cadet Engineer" },
  { minXp: 200, title: "Junior Systems Engineer" },
  { minXp: 500, title: "Systems Engineer" },
  { minXp: 1000, title: "Senior Systems Engineer" },
  { minXp: 2000, title: "Staff Systems Architect" },
] as const;

function computeMasteryFromCounts(lessonsCompleted: number, exercisesCompleted: number): EngineeringMastery {
  const lessonXp = lessonsCompleted * 25;
  const exerciseXp = exercisesCompleted * 50;
  const totalXp = lessonXp + exerciseXp;

  let currentRankIndex = 0;
  for (let i = ENGINEERING_RANKS.length - 1; i >= 0; i--) {
    if (totalXp >= ENGINEERING_RANKS[i].minXp) {
      currentRankIndex = i;
      break;
    }
  }

  const currentRank = ENGINEERING_RANKS[currentRankIndex].title;
  const nextRankObj = ENGINEERING_RANKS[currentRankIndex + 1];
  const nextRank = nextRankObj ? nextRankObj.title : null;
  const nextRankXp = nextRankObj ? nextRankObj.minXp : null;

  let progressToNextRank = 100;
  if (nextRankObj) {
    const currentBase = ENGINEERING_RANKS[currentRankIndex].minXp;
    const range = nextRankObj.minXp - currentBase;
    const earned = totalXp - currentBase;
    progressToNextRank = Math.min(100, Math.max(0, Math.round((earned / range) * 100)));
  }

  return {
    totalXp,
    exerciseXp,
    lessonXp,
    rank: currentRank,
    nextRank,
    nextRankXp,
    progressToNextRank,
    verifiedExercisesCount: exercisesCompleted,
    completedLessonsCount: lessonsCompleted,
  };
}

export function getEngineeringMastery(progress: LearningProgress): EngineeringMastery {
  const summary = getLearningDashboardSummary(progress);
  return summary.mastery;
}
