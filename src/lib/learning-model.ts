export type {
  LearningCatalogManifest,
  LearningCourseDetail,
  LearningCourseSummary,
  LearningExercise,
  LearningExerciseSummary,
  LearningLessonDetail,
  LearningLessonSummary,
  LearningModuleDetail,
  LearningModuleSummary,
  LearningPath,
  LearningSection,
  LearningSubject,
  LessonType,
} from "./learning-curriculum";
export type { ExecutionLanguage } from "./execution/types";

import type {
  LearningCourseDetail,
  LearningCourseSummary,
  LearningExercise,
  LearningExerciseSummary,
  LearningLessonDetail,
  LearningLessonSummary,
  LessonExecutionConfig,
  LessonType,
} from "./learning-curriculum";

export function resolveLessonType(lesson: LearningLessonSummary | LearningLessonDetail): LessonType {
  if (lesson.type) return lesson.type;
  if ("exampleRun" in lesson && lesson.exampleRun) return "guided-coding";
  if (lesson.execution?.language === "c") return "guided-coding";
  return "theory";
}

export function resolveLessonExecution(
  course: LearningCourseSummary | LearningCourseDetail,
  lesson: LearningLessonSummary | LearningLessonDetail
): LessonExecutionConfig | null {
  if (lesson.execution) return lesson.execution;
  if (course.subjectId === "c-programming") return { language: "c", target: "browser-wasm" };
  if (course.subjectId === "python-programming") return { language: "python", target: "browser-wasm" };
  if (lesson.exercise.language) return { language: lesson.exercise.language, target: "browser-wasm" };
  return null;
}

export function resolveLessonHints(exercise: LearningExerciseSummary | LearningExercise): string[] {
  if (exercise.hints && exercise.hints.length > 0) return exercise.hints;
  return exercise.hint ? [exercise.hint] : [];
}

export function flattenLessons<TModule extends { order: number; lessons: Array<{ order: number }> }>(
  path: { modules: TModule[] }
): Array<{ lesson: TModule["lessons"][number]; module: TModule }> {
  return [...path.modules]
    .sort((a, b) => a.order - b.order)
    .flatMap((module) => [...module.lessons]
      .sort((a, b) => a.order - b.order)
      .map((lesson) => ({ lesson, module })));
}

export function findLesson<TModule extends { order: number; lessons: Array<{ id: string; order: number }> }>(
  path: { modules: TModule[] },
  lessonId: string
): { lesson: TModule["lessons"][number]; module: TModule } | undefined {
  return flattenLessons(path).find(({ lesson }) => lesson.id === lessonId);
}
