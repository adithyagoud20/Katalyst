import { describe, expect, it } from "vitest";
import { cProgrammingPath, flattenLessons, learningPaths, pythonProgrammingPath } from "../src/lib/learning-curriculum";
import {
  completeLesson,
  emptyLearningProgress,
  enrollInPath,
  getEngineeringMastery,
  getExerciseProgress,
  getPathProgress,
  getLearningDashboardSummary,
  LEARNING_PROGRESS_KEY,
  MAX_LEARNING_PROGRESS_BYTES,
  readLearningProgress,
  recordLessonOpened,
  updateExerciseProgress,
  writeLearningProgress,
} from "../src/lib/learning-progress";

describe("learning curriculum and local progress", () => {
  it("starts with no fabricated enrollment or completion", () => {
    expect(emptyLearningProgress()).toEqual({ version: 1, enrollments: [] });
    const cTotalLessons = flattenLessons(cProgrammingPath).length;
    expect(getPathProgress(emptyLearningProgress(), cProgrammingPath)).toMatchObject({ totalLessons: cTotalLessons, completedCount: 0, completionPercent: 0 });
  });

  it("records enrollment, lesson navigation, and explicit completion independently from chats", () => {
    const cTotalLessons = flattenLessons(cProgrammingPath).length;
    let progress = enrollInPath(emptyLearningProgress(), cProgrammingPath.id, 100);
    progress = recordLessonOpened(progress, cProgrammingPath.id, "source-to-output", 200);
    progress = completeLesson(progress, cProgrammingPath.id, "source-to-output", 300);
    expect(progress.enrollments[0]).toMatchObject({ enrolledAt: 100, lastOpenedLessonId: "source-to-output", completedLessons: [{ lessonId: "source-to-output", completedAt: 300 }] });
    expect(getPathProgress(progress, cProgrammingPath).completionPercent).toBe(Math.round((1 / cTotalLessons) * 100));
    expect(completeLesson(progress, cProgrammingPath.id, "source-to-output", 400)).toEqual(progress);
  });

  it("ignores invalid paths and lessons", () => {
    const empty = emptyLearningProgress();
    expect(enrollInPath(empty, "not-a-real-path")).toBe(empty);
    expect(recordLessonOpened(empty, cProgrammingPath.id, "missing-lesson")).toBe(empty);
    expect(completeLesson(empty, cProgrammingPath.id, "source-to-output")).toBe(empty);
  });

  it("reads valid, missing, corrupt, oversized, and future records without auto-replacing them", () => {
    const valid = JSON.stringify(enrollInPath(emptyLearningProgress(), cProgrammingPath.id, 100));
    expect(readLearningProgress(null).kind).toBe("missing");
    expect(readLearningProgress(valid).kind).toBe("valid");
    expect(readLearningProgress("{").kind).toBe("corrupt");
    expect(readLearningProgress("x".repeat(MAX_LEARNING_PROGRESS_BYTES + 1)).kind).toBe("corrupt");
    expect(readLearningProgress(JSON.stringify({ version: 2, enrollments: [] })).kind).toBe("unsupported");
    expect(readLearningProgress(JSON.stringify({ version: 1, enrollments: [{ pathId: cProgrammingPath.id, enrolledAt: 1, lastOpenedLessonId: "unknown", completedLessons: [], activity: [] }] })).kind).toBe("corrupt");
  });

  it("preserves an existing version 1 completion after lessons are added to the same course", () => {
    const legacyRecord = JSON.stringify({
      version: 1,
      enrollments: [{
        pathId: "c-programming-foundations",
        enrolledAt: 10,
        lastOpenedLessonId: "arrays",
        completedLessons: [{ lessonId: "source-to-output", completedAt: 20 }, { lessonId: "arrays", completedAt: 30 }],
        activity: [{ kind: "enrolled", at: 10 }, { kind: "lesson-completed", lessonId: "arrays", at: 30 }],
      }],
    });
    const read = readLearningProgress(legacyRecord);
    expect(read.kind).toBe("valid");
    if (read.kind !== "valid") return;
    expect(read.progress.enrollments[0].completedLessons.map((item) => item.lessonId)).toEqual(["source-to-output", "arrays"]);
    const cTotalLessons = flattenLessons(cProgrammingPath).length;
    expect(getPathProgress(read.progress, cProgrammingPath)).toMatchObject({ totalLessons: cTotalLessons, completedCount: 2, completionPercent: Math.round((2 / cTotalLessons) * 100) });
  });

  it("writes a bounded versioned record under a separate key", () => {
    let writtenKey = "";
    let writtenValue = "";
    const storage = { setItem(key: string, value: string) { writtenKey = key; writtenValue = value; } };
    writeLearningProgress(storage as Storage, enrollInPath(emptyLearningProgress(), cProgrammingPath.id, 100));
    expect(writtenKey).toBe(LEARNING_PROGRESS_KEY);
    expect(readLearningProgress(writtenValue).kind).toBe("valid");
  });

  it("builds dashboard totals, daily activity, recent lessons, and a streak only from recorded events", () => {
    const now = new Date(2026, 10, 9, 12).getTime();
    const dayOne = new Date(2026, 10, 7, 12).getTime();
    const dayTwo = new Date(2026, 10, 8, 12).getTime();
    let progress = enrollInPath(emptyLearningProgress(), cProgrammingPath.id, dayOne);
    progress = recordLessonOpened(progress, cProgrammingPath.id, "source-to-output", dayOne + 1_000);
    progress = recordLessonOpened(progress, cProgrammingPath.id, "source-to-output", dayTwo);
    progress = completeLesson(progress, cProgrammingPath.id, "source-to-output", now);
    const summary = getLearningDashboardSummary(progress, now);
    const totalLessons = learningPaths.reduce((total, path) => total + flattenLessons(path).length, 0);

    expect(summary).toMatchObject({ lessonsCompleted: 1, totalLessons, pathsStarted: 1, totalPaths: learningPaths.length, pathsCompleted: 0, streak: 3 });
    expect(summary.recentLessons[0]).toMatchObject({ lessonId: "source-to-output", lessonTitle: "From source code to output", kind: "lesson-completed" });
    expect(summary.days.slice(-3).map((day) => day.count)).toEqual([2, 1, 1]);
  });

  it("does not infer any activity for a new learner or continue a stale streak", () => {
    const now = new Date(2026, 10, 9, 12).getTime();
    expect(getLearningDashboardSummary(emptyLearningProgress(), now)).toMatchObject({ lessonsCompleted: 0, pathsStarted: 0, pathsCompleted: 0, streak: 0, recentActivity: [] });
    const prior = enrollInPath(emptyLearningProgress(), cProgrammingPath.id, new Date(2026, 10, 6, 12).getTime());
    expect(getLearningDashboardSummary(prior, now).streak).toBe(0);
  });

  it("manages exercise progress statuses and infers completion when the lesson is complete", () => {
    let progress = enrollInPath(emptyLearningProgress(), cProgrammingPath.id, 100);
    const exerciseId = "trace-hello";

    // Default status is not-started
    expect(getExerciseProgress(progress, cProgrammingPath.id, exerciseId)).toBe("not-started");

    // Explicit update to attempted
    progress = updateExerciseProgress(progress, cProgrammingPath.id, exerciseId, "attempted", 150);
    expect(getExerciseProgress(progress, cProgrammingPath.id, exerciseId)).toBe("attempted");
    expect(progress.enrollments[0].activity.at(-1)).toMatchObject({
      kind: "exercise-status-updated",
      exerciseId,
      status: "attempted",
      at: 150,
    });

    // Explicit update to completed
    progress = updateExerciseProgress(progress, cProgrammingPath.id, exerciseId, "completed", 200);
    expect(getExerciseProgress(progress, cProgrammingPath.id, exerciseId)).toBe("completed");

    // Explicit update to needs-review
    progress = updateExerciseProgress(progress, cProgrammingPath.id, exerciseId, "needs-review", 250);
    expect(getExerciseProgress(progress, cProgrammingPath.id, exerciseId)).toBe("needs-review");

    // Another exercise with no explicit record, but its lesson is completed
    const secondExerciseId = "choose-a-type";
    expect(getExerciseProgress(progress, cProgrammingPath.id, secondExerciseId)).toBe("not-started");
    progress = completeLesson(progress, cProgrammingPath.id, "variables-and-types", 300);
    expect(getExerciseProgress(progress, cProgrammingPath.id, secondExerciseId)).toBe("completed");

    // Dashboard summary reports completed exercises
    const summary = getLearningDashboardSummary(progress);
    expect(summary.exercisesCompleted).toBe(1); // secondExerciseId inferred completed
  });

  it("safely reads and validates progress records with or without exerciseProgress", () => {
    const withExercises = JSON.stringify({
      version: 1,
      enrollments: [{
        pathId: "c-programming-foundations",
        enrolledAt: 10,
        lastOpenedLessonId: "source-to-output",
        completedLessons: [],
        exerciseProgress: [
          { exerciseId: "trace-hello", status: "completed", updatedAt: 25 },
        ],
        activity: [{ kind: "enrolled", at: 10 }],
      }],
    });
    const result = readLearningProgress(withExercises);
    expect(result.kind).toBe("valid");
    if (result.kind === "valid") {
      expect(result.progress.enrollments[0].exerciseProgress?.[0].status).toBe("completed");
    }
  });

  it("manages Python course progress, exercises, and dual-enrollment with C course", () => {
    let progress = enrollInPath(emptyLearningProgress(), pythonProgrammingPath.id, 100);
    progress = recordLessonOpened(progress, pythonProgrammingPath.id, "py-source-to-interpreter", 150);
    progress = updateExerciseProgress(progress, pythonProgrammingPath.id, "ex-py-first-script", "attempted", 200);
    expect(getExerciseProgress(progress, pythonProgrammingPath.id, "ex-py-first-script")).toBe("attempted");

    progress = updateExerciseProgress(progress, pythonProgrammingPath.id, "ex-py-first-script", "completed", 250);
    expect(getExerciseProgress(progress, pythonProgrammingPath.id, "ex-py-first-script")).toBe("completed");

    // Inferred completion when lesson is completed and exercise has no prior record
    const secondExerciseId = "ex-py-sensor-variables";
    expect(getExerciseProgress(progress, pythonProgrammingPath.id, secondExerciseId)).toBe("not-started");
    progress = completeLesson(progress, pythonProgrammingPath.id, "py-variables-and-types", 300);
    expect(getPathProgress(progress, pythonProgrammingPath).completedCount).toBe(1);
    expect(getExerciseProgress(progress, pythonProgrammingPath.id, secondExerciseId)).toBe("completed");

    // Dual enrollment with C course
    progress = enrollInPath(progress, cProgrammingPath.id, 400);
    progress = completeLesson(progress, cProgrammingPath.id, "source-to-output", 500);

    expect(getPathProgress(progress, pythonProgrammingPath).completedCount).toBe(1);
    expect(getPathProgress(progress, cProgrammingPath).completedCount).toBe(1);

    // Serialize and read
    const serialized = JSON.stringify(progress);
    const read = readLearningProgress(serialized);
    expect(read.kind).toBe("valid");
    if (read.kind === "valid") {
      expect(read.progress.enrollments).toHaveLength(2);
      expect(getPathProgress(read.progress, pythonProgrammingPath).completedCount).toBe(1);
      expect(getPathProgress(read.progress, cProgrammingPath).completedCount).toBe(1);
    }
  });

  it("calculates engineering mastery, XP, and rank progression", () => {
    let progress = emptyLearningProgress();
    expect(getEngineeringMastery(progress)).toMatchObject({
      totalXp: 0,
      lessonXp: 0,
      exerciseXp: 0,
      rank: "Cadet Engineer",
      nextRank: "Junior Systems Engineer",
      nextRankXp: 200,
      progressToNextRank: 0,
    });

    // Complete 1 lesson (+25 XP) and 1 exercise (+50 XP) -> 75 XP
    progress = enrollInPath(progress, cProgrammingPath.id, 100);
    progress = completeLesson(progress, cProgrammingPath.id, "source-to-output", 200);
    progress = updateExerciseProgress(progress, cProgrammingPath.id, "trace-hello", "completed", 300);

    const mastery = getEngineeringMastery(progress);
    expect(mastery.completedLessonsCount).toBe(1);
    expect(mastery.verifiedExercisesCount).toBe(1);
    expect(mastery.totalXp).toBe(75);
    expect(mastery.rank).toBe("Cadet Engineer");
    expect(mastery.progressToNextRank).toBe(Math.round((75 / 200) * 100)); // 38%
  });

  it("migrates legacy progress records without verifiedExerciseIds and accurately computes XP", () => {
    const legacyJson = JSON.stringify({
      version: 1,
      enrollments: [
        {
          pathId: cProgrammingPath.id,
          enrolledAt: 1000,
          lastOpenedLessonId: "source-to-output",
          completedLessons: [
            { lessonId: "source-to-output", completedAt: 1100 },
            { lessonId: "variables-and-types", completedAt: 1200 },
          ],
          activity: [
            { kind: "enrolled", at: 1000 },
            { kind: "lesson-opened", lessonId: "source-to-output", at: 1050 },
            { kind: "lesson-completed", lessonId: "source-to-output", at: 1100 },
            { kind: "lesson-opened", lessonId: "variables-and-types", at: 1150 },
            { kind: "lesson-completed", lessonId: "variables-and-types", at: 1200 },
          ],
        },
      ],
    });

    const read = readLearningProgress(legacyJson);
    expect(read.kind).toBe("valid");
    if (read.kind === "valid") {
      const enrollment = read.progress.enrollments[0];
      expect(enrollment.verifiedExerciseIds).toEqual([]);
      const mastery = getEngineeringMastery(read.progress);
      expect(mastery.completedLessonsCount).toBe(2);
      expect(mastery.verifiedExercisesCount).toBe(2);
      expect(mastery.totalXp).toBe(150);
      expect(mastery.rank).toBe("Cadet Engineer");
    }
  });
});
