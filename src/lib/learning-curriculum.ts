import { z } from "zod";
import type { ExecutionLanguage, ExecutionTarget } from "./execution/types";

export type LearningSection = "home" | "paths" | "my-learning" | "playground" | "practice" | "progress" | "tutor" | "lesson";
export type LearningObjective = { id: string; title: string };
export type LearningDifficulty = "Beginner" | "Developing" | "Applied";

export type LessonType =
  | "theory"
  | "guided-coding"
  | "practical-exercise"
  | "interactive-simulation"
  | "assessment";

export type LessonTheorySection = {
  id: string;
  title: string;
  content: string;
};

export type LessonCodeExample = {
  title: string;
  language: ExecutionLanguage;
  code: string;
  description?: string;
};

export type LessonResource = {
  title: string;
  url?: string;
  description: string;
  type: "documentation" | "article" | "specification" | "reference";
};

export type LessonInteractiveDemo = {
  kind: "circuit" | "flowchart" | "memory-diagram" | "state-machine" | "image-lab";
  title?: string;
  description?: string;
  config?: Record<string, unknown>;
};

export type LessonExecutionConfig = {
  language: ExecutionLanguage;
  target?: ExecutionTarget;
};

export type ExerciseTestCase = {
  id: string;
  label: string;
  stdin?: string;
  expectedStdout: string;
  matchMode?: "exact" | "trimmed" | "contains";
  hidden?: boolean;
};

export type LearningExercise = {
  id: string;
  title: string;
  prompt: string;
  hint?: string;
  hints?: string[];
  solution: string;
  objectiveId: string;
  difficulty: LearningDifficulty;
  starterCode?: string;
  expectedOutcome: string;
  testCases?: ExerciseTestCase[];
};

export type LearningExerciseSummary = {
  id: string;
  title: string;
  difficulty: LearningDifficulty;
  expectedOutcome: string;
  prompt?: string;
  objectiveId: string;
  starterCode?: string;
  hint?: string;
  hints?: string[];
  solution?: string;
  testCases?: ExerciseTestCase[];
};

export type LearningCheckpoint = { prompt: string; answer: string };
export type LearningExampleFile = { path: string; content: string };
export type LearningExampleRun = { sampleInput?: string; expectedOutput: string; expectedFiles?: LearningExampleFile[] };

export type LearningLessonDetail = {
  id: string;
  order: number;
  title: string;
  summary: string;
  type?: LessonType;
  objectiveIds: string[];
  prerequisiteLessonIds: string[];
  content: string;
  estimatedDurationMinutes?: number | null;
  theorySections?: LessonTheorySection[];
  codeExamples?: LessonCodeExample[];
  resources?: LessonResource[];
  interactiveDemo?: LessonInteractiveDemo;
  execution?: LessonExecutionConfig;
  exampleRun?: LearningExampleRun;
  exercise: LearningExercise;
  checkpoint: LearningCheckpoint;
};

export type LearningLessonSummary = {
  id: string;
  order: number;
  title: string;
  summary: string;
  type?: LessonType;
  objectiveIds: string[];
  prerequisiteLessonIds: string[];
  estimatedDurationMinutes?: number | null;
  execution?: LessonExecutionConfig;
  exercise: LearningExerciseSummary;
  checkpoint?: LearningCheckpoint;
  interactiveDemo?: {
    kind: LessonInteractiveDemo["kind"];
    title?: string;
    description?: string;
  };
};

// LearningLesson alias defaults to full detail for backward compatibility
export type LearningLesson = LearningLessonDetail;

export type LearningModuleDetail = {
  id: string;
  order: number;
  title: string;
  summary: string;
  lessons: LearningLessonDetail[];
};

export type LearningModuleSummary = {
  id: string;
  order: number;
  title: string;
  summary: string;
  lessons: LearningLessonSummary[];
};

// LearningModule alias defaults to full detail
export type LearningModule = LearningModuleDetail;

export type LearningCourseDetail = {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  level: LearningDifficulty;
  version?: string;
  prerequisites: string[];
  objectives: LearningObjective[];
  learningOutcomes: string[];
  estimatedDurationMinutes: number | null;
  publicationStatus: "draft" | "published";
  modules: LearningModuleDetail[];
};

export type LearningCourseSummary = {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  level: LearningDifficulty;
  version?: string;
  prerequisites: string[];
  objectives: LearningObjective[];
  learningOutcomes: string[];
  estimatedDurationMinutes: number | null;
  publicationStatus: "draft" | "published";
  modules: LearningModuleSummary[];
};

// LearningCourse and LearningPath alias defaults
export type LearningCourse = LearningCourseDetail;
export type LearningPath = LearningCourseSummary | LearningCourseDetail;

export type LearningCatalogManifest = {
  subjects: LearningSubject[];
  courses: LearningCourseSummary[];
};

export type LearningCatalog = {
  subjects: LearningSubject[];
  courses: LearningCourse[];
};

export type LearningSubject = { id: string; title: string; description: string };

const idSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const difficultySchema = z.enum(["Beginner", "Developing", "Applied"]);

function hasBalancedMarkdownFences(content: string): boolean {
  const fences = content.match(/^\s*(?:~~~|```)[^\n]*$/gm) ?? [];
  if (fences.length % 2 !== 0) return false;
  for (let index = 0; index < fences.length; index += 2) {
    if (fences[index].trim().slice(0, 3) !== fences[index + 1].trim().slice(0, 3)) return false;
  }
  return true;
}

const subjectSchema: z.ZodType<LearningSubject> = z.object({
  id: idSchema,
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1_000),
}).strict();

const executionLanguageSchema: z.ZodType<ExecutionLanguage> = z.enum([
  "c",
  "cpp",
  "python",
  "java",
  "javascript",
  "sql",
  "html",
  "circuit",
]);

const executionTargetSchema: z.ZodType<ExecutionTarget> = z.enum(["auto", "browser-wasm", "remote-sandbox"]);

const lessonTypeSchema: z.ZodType<LessonType> = z.enum([
  "theory",
  "guided-coding",
  "practical-exercise",
  "interactive-simulation",
  "assessment",
]);

const theorySectionSchema: z.ZodType<LessonTheorySection> = z.object({
  id: idSchema,
  title: z.string().trim().min(1).max(160),
  content: z.string().trim().min(1).max(12_000).refine(hasBalancedMarkdownFences, "Section content must have balanced fenced code blocks."),
}).strict();

const codeExampleSchema: z.ZodType<LessonCodeExample> = z.object({
  title: z.string().trim().min(1).max(160),
  language: executionLanguageSchema,
  code: z.string().trim().min(1).max(12_000),
  description: z.string().trim().max(1_000).optional(),
}).strict();

const resourceSchema: z.ZodType<LessonResource> = z.object({
  title: z.string().trim().min(1).max(160),
  url: z.string().url().max(1_000).optional(),
  description: z.string().trim().min(1).max(1_000),
  type: z.enum(["documentation", "article", "specification", "reference"]),
}).strict();

const interactiveDemoSchema: z.ZodType<LessonInteractiveDemo> = z.object({
  kind: z.enum(["circuit", "flowchart", "memory-diagram", "state-machine", "image-lab"]),
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(1_000).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
}).strict();

const executionConfigSchema: z.ZodType<LessonExecutionConfig> = z.object({
  language: executionLanguageSchema,
  target: executionTargetSchema.optional(),
}).strict();

const exerciseTestCaseSchema: z.ZodType<ExerciseTestCase> = z.object({
  id: idSchema,
  label: z.string().trim().min(1).max(160),
  stdin: z.string().max(8_000).optional(),
  expectedStdout: z.string().max(16_000),
  matchMode: z.enum(["exact", "trimmed", "contains"]).optional(),
  hidden: z.boolean().optional(),
}).strict();

const exerciseSchema: z.ZodType<LearningExercise> = z.object({
  id: idSchema,
  title: z.string().trim().min(1).max(160),
  prompt: z.string().trim().min(1).max(4_000),
  hint: z.string().trim().min(1).max(2_000).optional(),
  hints: z.array(z.string().trim().min(1).max(2_000)).max(10).optional(),
  solution: z.string().trim().min(1).max(4_000),
  objectiveId: idSchema,
  difficulty: difficultySchema,
  starterCode: z.string().max(12_000).optional(),
  expectedOutcome: z.string().trim().min(1).max(1_000),
  testCases: z.array(exerciseTestCaseSchema).max(20).optional(),
}).strict();

const checkpointSchema: z.ZodType<LearningCheckpoint> = z.object({
  prompt: z.string().trim().min(1).max(2_000),
  answer: z.string().trim().min(1).max(2_000),
}).strict();

const exampleFileSchema: z.ZodType<LearningExampleFile> = z.object({
  path: z.string().min(1).max(120).regex(/^[A-Za-z0-9._/-]+$/).refine((path) => path.split("/").every((part) => part && part !== "." && part !== ".."), "Example output paths must be relative and cannot traverse directories."),
  content: z.string().max(4_000),
}).strict();

const exampleRunSchema: z.ZodType<LearningExampleRun> = z.object({
  sampleInput: z.string().max(4_000).optional(),
  expectedOutput: z.string().max(8_000),
  expectedFiles: z.array(exampleFileSchema).max(4).optional(),
}).strict();

const lessonSchema: z.ZodType<LearningLessonDetail> = z.object({
  id: idSchema,
  order: z.number().int().positive(),
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(500),
  type: lessonTypeSchema.optional(),
  objectiveIds: z.array(idSchema).min(1).max(10),
  prerequisiteLessonIds: z.array(idSchema).max(20),
  content: z.string().trim().min(80).max(24_000).refine(hasBalancedMarkdownFences, "Lesson content must have balanced fenced code blocks."),
  estimatedDurationMinutes: z.number().int().positive().max(10_000).nullable().optional(),
  theorySections: z.array(theorySectionSchema).max(20).optional(),
  codeExamples: z.array(codeExampleSchema).max(10).optional(),
  resources: z.array(resourceSchema).max(20).optional(),
  interactiveDemo: interactiveDemoSchema.optional(),
  execution: executionConfigSchema.optional(),
  exampleRun: exampleRunSchema.optional(),
  exercise: exerciseSchema,
  checkpoint: checkpointSchema,
}).strict();

const moduleSchema: z.ZodType<LearningModuleDetail> = z.object({
  id: idSchema,
  order: z.number().int().positive(),
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(500),
  lessons: z.array(lessonSchema).min(1).max(80),
}).strict();

const courseSchema: z.ZodType<LearningCourseDetail> = z.object({
  id: idSchema,
  subjectId: idSchema,
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(2_000),
  level: difficultySchema,
  version: z.string().max(20).optional(),
  prerequisites: z.array(z.string().trim().min(1).max(300)).max(30),
  objectives: z.array(z.object({ id: idSchema, title: z.string().trim().min(1).max(500) }).strict()).min(1).max(100),
  learningOutcomes: z.array(z.string().trim().min(1).max(500)).min(1).max(100),
  estimatedDurationMinutes: z.number().int().positive().max(100_000).nullable(),
  publicationStatus: z.enum(["draft", "published"]),
  modules: z.array(moduleSchema).min(1).max(80),
}).strict();

const learningCatalogSchema = z.object({
  subjects: z.array(subjectSchema).min(1).max(100),
  courses: z.array(courseSchema).min(1).max(500),
}).strict().superRefine((catalog, ctx) => {
  if (!catalog.courses.some((course) => course.publicationStatus === "published")) {
    ctx.addIssue({ code: "custom", path: ["courses"], message: "The catalog must contain at least one published course." });
  }
  const subjectIds = new Set<string>();
  for (const subject of catalog.subjects) {
    if (subjectIds.has(subject.id)) ctx.addIssue({ code: "custom", path: ["subjects"], message: `Duplicate subject id: ${subject.id}` });
    subjectIds.add(subject.id);
  }
  const courseIds = new Set<string>();
  const catalogLessonIds = new Set<string>();
  for (const course of catalog.courses) {
    if (courseIds.has(course.id)) ctx.addIssue({ code: "custom", path: ["courses"], message: `Duplicate course id: ${course.id}` });
    courseIds.add(course.id);
    if (!subjectIds.has(course.subjectId)) ctx.addIssue({ code: "custom", path: ["courses", course.id, "subjectId"], message: `Unknown subject id: ${course.subjectId}` });

    const objectiveIds = new Set<string>();
    for (const objective of course.objectives) {
      if (objectiveIds.has(objective.id)) ctx.addIssue({ code: "custom", path: ["courses", course.id, "objectives"], message: `Duplicate objective id: ${objective.id}` });
      objectiveIds.add(objective.id);
    }
    const moduleIds = new Set<string>();
    const lessonIds = new Set<string>();
    const exerciseIds = new Set<string>();
    const seenLessons = new Set<string>();
    let expectedLessonOrder = 1;
    course.modules.forEach((module, moduleIndex) => {
      if (moduleIds.has(module.id)) ctx.addIssue({ code: "custom", path: ["courses", course.id, "modules", moduleIndex, "id"], message: `Duplicate module id: ${module.id}` });
      moduleIds.add(module.id);
      if (module.order !== moduleIndex + 1) ctx.addIssue({ code: "custom", path: ["courses", course.id, "modules", moduleIndex, "order"], message: "Module order must be consecutive and match its array position." });
      module.lessons.forEach((lesson, lessonIndex) => {
        const path = ["courses", course.id, "modules", moduleIndex, "lessons", lessonIndex] as (string | number)[];
        if (lessonIds.has(lesson.id)) ctx.addIssue({ code: "custom", path: [...path, "id"], message: `Duplicate lesson id: ${lesson.id}` });
        lessonIds.add(lesson.id);
        if (catalogLessonIds.has(lesson.id)) ctx.addIssue({ code: "custom", path: [...path, "id"], message: `Lesson ids must be unique across the catalog: ${lesson.id}` });
        catalogLessonIds.add(lesson.id);
        if (lesson.order !== expectedLessonOrder) ctx.addIssue({ code: "custom", path: [...path, "order"], message: "Lesson order must be consecutive across the course." });
        expectedLessonOrder += 1;
        if (new Set(lesson.objectiveIds).size !== lesson.objectiveIds.length) ctx.addIssue({ code: "custom", path: [...path, "objectiveIds"], message: "Lesson objective ids must not be duplicated." });
        if (new Set(lesson.prerequisiteLessonIds).size !== lesson.prerequisiteLessonIds.length) ctx.addIssue({ code: "custom", path: [...path, "prerequisiteLessonIds"], message: "Lesson prerequisite ids must not be duplicated." });
        for (const objectiveId of lesson.objectiveIds) {
          if (!objectiveIds.has(objectiveId)) ctx.addIssue({ code: "custom", path: [...path, "objectiveIds"], message: `Unknown learning objective: ${objectiveId}` });
        }
        if (!objectiveIds.has(lesson.exercise.objectiveId) || !lesson.objectiveIds.includes(lesson.exercise.objectiveId)) {
          ctx.addIssue({ code: "custom", path: [...path, "exercise", "objectiveId"], message: "Exercise outcome must belong to one of this lesson's learning objectives." });
        }
        if (exerciseIds.has(lesson.exercise.id)) ctx.addIssue({ code: "custom", path: [...path, "exercise", "id"], message: `Duplicate exercise id: ${lesson.exercise.id}` });
        exerciseIds.add(lesson.exercise.id);
        for (const prerequisiteId of lesson.prerequisiteLessonIds) {
          if (prerequisiteId === lesson.id || !seenLessons.has(prerequisiteId)) ctx.addIssue({ code: "custom", path: [...path, "prerequisiteLessonIds"], message: `Prerequisite ${prerequisiteId} must be an earlier lesson in this course.` });
        }
        seenLessons.add(lesson.id);
      });
    });
  }
});

export function validateLearningCatalog(value: unknown) {
  return learningCatalogSchema.safeParse(value);
}

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
  if (course.subjectId === "c-programming") {
    return { language: "c", target: "browser-wasm" };
  }
  if (course.subjectId === "python-programming") {
    return { language: "python", target: "browser-wasm" };
  }
  return null;
}

export function resolveLessonHints(exercise: LearningExerciseSummary | LearningExercise): string[] {
  if (exercise.hints && exercise.hints.length > 0) return exercise.hints;
  if (exercise.hint) return [exercise.hint];
  return [];
}

export function safeValidateCourse(value: unknown): { success: true; data: LearningCourse } | { success: false; issues: string[] } {
  const parsed = courseSchema.safeParse(value);
  if (parsed.success) return { success: true, data: parsed.data };
  return { success: false, issues: parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`) };
}

export function safeValidateLesson(value: unknown): { success: true; data: LearningLesson } | { success: false; issues: string[] } {
  const parsed = lessonSchema.safeParse(value);
  if (parsed.success) return { success: true, data: parsed.data };
  return { success: false, issues: parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`) };
}

export { courseSchema as learningCourseSchema, lessonSchema as learningLessonSchema };

export function flattenLessons<TModule extends { order: number; lessons: Array<{ order: number }> }>(
  path: { modules: TModule[] }
): Array<{ lesson: TModule["lessons"][number]; module: TModule }> {
  return [...path.modules]
    .sort((a, b) => a.order - b.order)
    .flatMap((item) =>
      [...item.lessons]
        .sort((a, b) => a.order - b.order)
        .map((lesson) => ({ lesson, module: item }))
    );
}

export function findLesson<TModule extends { order: number; lessons: Array<{ id: string; order: number }> }>(
  path: { modules: TModule[] },
  lessonId: string
): { lesson: TModule["lessons"][number]; module: TModule } | undefined {
  return flattenLessons(path).find(({ lesson }) => lesson.id === lessonId);
}

export function toLessonSummary(lesson: LearningLessonDetail): LearningLessonSummary {
  return {
    id: lesson.id,
    order: lesson.order,
    title: lesson.title,
    summary: lesson.summary,
    ...(lesson.type ? { type: lesson.type } : {}),
    objectiveIds: lesson.objectiveIds,
    prerequisiteLessonIds: lesson.prerequisiteLessonIds,
    ...(lesson.estimatedDurationMinutes !== undefined ? { estimatedDurationMinutes: lesson.estimatedDurationMinutes } : {}),
    ...(lesson.execution ? { execution: lesson.execution } : {}),
    exercise: {
      id: lesson.exercise.id,
      title: lesson.exercise.title,
      difficulty: lesson.exercise.difficulty,
      expectedOutcome: lesson.exercise.expectedOutcome,
      prompt: lesson.exercise.prompt,
      objectiveId: lesson.exercise.objectiveId,
      ...(lesson.exercise.starterCode ? { starterCode: lesson.exercise.starterCode } : {}),
    },
    ...(lesson.interactiveDemo
      ? {
          interactiveDemo: {
            kind: lesson.interactiveDemo.kind,
            ...(lesson.interactiveDemo.title ? { title: lesson.interactiveDemo.title } : {}),
            ...(lesson.interactiveDemo.description ? { description: lesson.interactiveDemo.description } : {}),
          },
        }
      : {}),
  };
}

export function toCourseSummary(course: LearningCourseDetail): LearningCourseSummary {
  return {
    id: course.id,
    subjectId: course.subjectId,
    title: course.title,
    description: course.description,
    level: course.level,
    ...(course.version ? { version: course.version } : {}),
    prerequisites: course.prerequisites,
    objectives: course.objectives,
    learningOutcomes: course.learningOutcomes,
    estimatedDurationMinutes: course.estimatedDurationMinutes,
    publicationStatus: course.publicationStatus,
    modules: course.modules.map((m) => ({
      id: m.id,
      order: m.order,
      title: m.title,
      summary: m.summary,
      lessons: m.lessons.map(toLessonSummary),
    })),
  };
}

// Re-export full server-side curriculum catalog and course paths for server/test usage
export {
  cProgrammingSubject,
  cProgrammingPath,
  cppProgrammingSubject,
  cppProgrammingCourse,
  pythonProgrammingSubject,
  pythonProgrammingPath,
  aiAppWebDevSubject,
  aiAppWebDevCourse,
  arduinoEmbeddedSubject,
  arduinoEmbeddedCourse,
  esp32IotSubject,
  esp32IotCourse,
  breadboardElectronicsSubject,
  breadboardElectronicsCourse,
  javascriptProgrammingSubject,
  javascriptProgrammingPath,
  digitalCircuitsSubject,
  digitalCircuitsPath,
  sqlDatabasesSubject,
  sqlDatabasesPath,
  htmlCssWebSubject,
  htmlCssWebPath,
  dsaMasterySubject,
  dsaMasteryPath,
  promptEngineeringSubject,
  promptEngineeringPath,
  photoEditingMediaSubject,
  photoEditingMediaPath,
  serverCatalog,
  getServerCatalog,
  getServerCourses,
  getServerCourse,
  getServerLesson,
} from "@/data/curriculum/server-catalog";

import { serverCatalog } from "@/data/curriculum/server-catalog";
export const learningCatalog = {
  get subjects() {
    return serverCatalog.subjects;
  },
  get courses() {
    return serverCatalog.courses;
  },
};

export function getPublishedLearningCourses<TCourse extends { publicationStatus: string }>(catalog: { courses: TCourse[] }): TCourse[] {
  return catalog.courses.filter((course) => course.publicationStatus === "published");
}

// Re-export client-safe manifests
export {
  learningCatalogManifest,
  publishedLearningCourses,
  learningPaths,
  learningSubjects,
} from "@/data/curriculum/manifests";
