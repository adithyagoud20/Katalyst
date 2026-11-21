import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { serverSubjects, serverCourses } from "../src/data/curriculum/server-catalog";
import type { LearningCourseDetail, LearningLessonDetail, LearningModuleDetail } from "../src/lib/learning-curriculum";

function toLessonSummary(lesson: LearningLessonDetail) {
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
      ...(lesson.exercise.language ? { language: lesson.exercise.language } : {}),
      ...(lesson.exercise.starterCode ? { starterCode: lesson.exercise.starterCode } : {}),
    },
    ...(lesson.checkpoint ? { checkpoint: lesson.checkpoint } : {}),
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

function toLearningIndexCourse(course: LearningCourseDetail) {
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
    modules: course.modules.map((module: LearningModuleDetail) => ({
      id: module.id,
      order: module.order,
      title: module.title,
      summary: module.summary,
      lessons: module.lessons.map((lesson) => ({
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
          objectiveId: lesson.exercise.objectiveId,
          ...(lesson.exercise.language ? { language: lesson.exercise.language } : {}),
        },
        ...(lesson.interactiveDemo
          ? { interactiveDemo: { kind: lesson.interactiveDemo.kind, ...(lesson.interactiveDemo.title ? { title: lesson.interactiveDemo.title } : {}), ...(lesson.interactiveDemo.description ? { description: lesson.interactiveDemo.description } : {}) } }
          : {}),
      })),
    })),
  };
}

function toCourseSummary(course: LearningCourseDetail) {
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
    modules: course.modules.map((m: LearningModuleDetail) => ({
      id: m.id,
      order: m.order,
      title: m.title,
      summary: m.summary,
      lessons: m.lessons.map(toLessonSummary),
    })),
  };
}

const subjects = serverSubjects;
const fullCourses = serverCourses;
const courseSummaries = fullCourses.map(toCourseSummary);
const publishedCourses = fullCourses.filter((course) => course.publicationStatus === "published");
const listSummaries = publishedCourses.map((course) => ({
  id: course.id,
  slug: course.id,
  title: course.title,
  lessonCount: course.modules.reduce((total, module) => total + module.lessons.length, 0),
  estimatedDurationMinutes: course.estimatedDurationMinutes,
  description: course.description,
  level: course.level,
  subjectId: course.subjectId,
  subjectTitle: subjects.find((subject) => subject.id === course.subjectId)?.title ?? "Technical studies",
  moduleCount: course.modules.length,
}));
const lessonRouteParams = publishedCourses.flatMap((course) => course.modules.flatMap((module) => module.lessons.map((lesson) => ({ courseId: course.id, lessonSlug: lesson.id }))));
const learningIndex = publishedCourses.map(toLearningIndexCourse);

const manifestContent = `// Auto-generated by scripts/generate-manifests.ts - DO NOT EDIT MANUALLY
import type {
  LearningCatalogManifest,
  LearningCourseSummary,
  LearningSubject,
} from "@/lib/learning-curriculum";

export const learningSubjects: LearningSubject[] = ${JSON.stringify(subjects, null, 2)};

export const publishedLearningCourses: LearningCourseSummary[] = ${JSON.stringify(courseSummaries, null, 2)};

export const learningPaths: LearningCourseSummary[] = publishedLearningCourses;

export const learningCatalogManifest: LearningCatalogManifest = {
  subjects: learningSubjects,
  courses: publishedLearningCourses,
};
`;

const outputPath = resolve("src/data/curriculum/manifests.ts");
let existingManifest = "";
try { existingManifest = readFileSync(outputPath, "utf8"); } catch { /* The generated output may not exist yet. */ }
if (existingManifest !== manifestContent) writeFileSync(outputPath, manifestContent, "utf8");
console.log(`Manifests successfully generated at ${outputPath}`);

const listOutputPath = resolve("src/data/curriculum/course-summaries.ts");
writeFileSync(listOutputPath, `// Auto-generated by scripts/generate-manifests.ts - DO NOT EDIT MANUALLY\nexport type PublishedCourseSummary = { id: string; slug: string; title: string; lessonCount: number; estimatedDurationMinutes: number | null; description: string; level: "Beginner" | "Developing" | "Applied"; subjectId: string; subjectTitle: string; moduleCount: number };\n\nexport const publishedCourseSummaries: PublishedCourseSummary[] = ${JSON.stringify(listSummaries)};\n\nexport const publishedLessonRouteParams = ${JSON.stringify(lessonRouteParams)} as const;\n`, "utf8");
console.log(`Course summaries successfully generated at ${listOutputPath}`);

const indexOutputPath = resolve("src/data/curriculum/learning-index.ts");
writeFileSync(indexOutputPath, `// Auto-generated by scripts/generate-manifests.ts - DO NOT EDIT MANUALLY\nimport type { LearningCatalogManifest, LearningCourseSummary, LearningSubject } from "@/lib/learning-curriculum";\n\nexport const learningSubjects: LearningSubject[] = ${JSON.stringify(subjects)};\n\nexport const publishedLearningCourses: LearningCourseSummary[] = ${JSON.stringify(learningIndex)};\n\nexport const learningPaths: LearningCourseSummary[] = publishedLearningCourses;\n\nexport const learningCatalogManifest: LearningCatalogManifest = { subjects: learningSubjects, courses: publishedLearningCourses };\n`, "utf8");
console.log(`Client learning index successfully generated at ${indexOutputPath}`);
