import { describe, expect, it } from "vitest";
import { cProgrammingPath } from "../src/lib/learning-curriculum";
import {
  completeLesson,
  emptyLearningProgress,
  enrollInPath,
  getPathProgress,
  getLearningDashboardSummary,
  LEARNING_PROGRESS_KEY,
  MAX_LEARNING_PROGRESS_BYTES,
  readLearningProgress,
  recordLessonOpened,
  writeLearningProgress,
} from "../src/lib/learning-progress";

describe("learning curriculum and local progress", () => {
  it("starts with no fabricated enrollment or completion", () => {
    expect(emptyLearningProgress()).toEqual({ version: 1, enrollments: [] });
    expect(getPathProgress(emptyLearningProgress(), cProgrammingPath)).toMatchObject({ totalLessons: 13, completedCount: 0, completionPercent: 0 });
  });

  it("records enrollment, lesson navigation, and explicit completion independently from chats", () => {
    let progress = enrollInPath(emptyLearningProgress(), cProgrammingPath.id, 100);
    progress = recordLessonOpened(progress, cProgrammingPath.id, "source-to-output", 200);
    progress = completeLesson(progress, cProgrammingPath.id, "source-to-output", 300);
    expect(progress.enrollments[0]).toMatchObject({ enrolledAt: 100, lastOpenedLessonId: "source-to-output", completedLessons: [{ lessonId: "source-to-output", completedAt: 300 }] });
    expect(getPathProgress(progress, cProgrammingPath).completionPercent).toBe(8);
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
    expect(getPathProgress(read.progress, cProgrammingPath)).toMatchObject({ totalLessons: 13, completedCount: 2, completionPercent: 15 });
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

    expect(summary).toMatchObject({ lessonsCompleted: 1, totalLessons: 13, pathsStarted: 1, totalPaths: 1, pathsCompleted: 0, streak: 3 });
    expect(summary.recentLessons[0]).toMatchObject({ lessonId: "source-to-output", lessonTitle: "From source code to output", kind: "lesson-completed" });
    expect(summary.days.slice(-3).map((day) => day.count)).toEqual([2, 1, 1]);
  });

  it("does not infer any activity for a new learner or continue a stale streak", () => {
    const now = new Date(2026, 10, 9, 12).getTime();
    expect(getLearningDashboardSummary(emptyLearningProgress(), now)).toMatchObject({ lessonsCompleted: 0, pathsStarted: 0, pathsCompleted: 0, streak: 0, recentActivity: [] });
    const prior = enrollInPath(emptyLearningProgress(), cProgrammingPath.id, new Date(2026, 10, 6, 12).getTime());
    expect(getLearningDashboardSummary(prior, now).streak).toBe(0);
  });
});
