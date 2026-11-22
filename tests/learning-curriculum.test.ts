import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  cProgrammingPath,
  cppProgrammingCourse,
  arduinoEmbeddedCourse,
  esp32IotCourse,
  breadboardElectronicsCourse,
  flattenLessons,
  getPublishedLearningCourses,
  learningCatalog,
  publishedLearningCourses,
  pythonProgrammingPath,
  javascriptProgrammingPath,
  digitalCircuitsPath,
  circuitsEeeCorePath,
  controlAndSignalsPath,
  embeddedCapstonesPath,
  creativeEngineeringPath,
  sqlDatabasesPath,
  htmlCssWebPath,
  dsaMasteryPath,
  promptEngineeringPath,
  photoEditingMediaPath,
  resolveLessonExecution,
  resolveLessonHints,
  resolveLessonType,
  safeValidateCourse,
  safeValidateLesson,
  validateLearningCatalog,
} from "../src/lib/learning-curriculum";
import { extractCCode } from "../src/lib/c-playground";

const hasSystemCCompiler = spawnSync("cc", ["--version"], { encoding: "utf8" }).status === 0;

describe("authored learning catalog", () => {
  it("validates reusable course, module, lesson, exercise, and checkpoint content", () => {
    expect(validateLearningCatalog(learningCatalog).success).toBe(true);
    expect(cProgrammingPath).toMatchObject({
      id: "c-programming-foundations",
      subjectId: "c-programming",
      level: "Beginner",
      estimatedDurationMinutes: null,
      publicationStatus: "published",
    });
    expect(cProgrammingPath.learningOutcomes.length).toBeGreaterThan(0);
    expect(flattenLessons(cProgrammingPath)).toHaveLength(22);
    for (const { lesson } of flattenLessons(cProgrammingPath)) {
      expect(lesson.content).toContain("~~~c");
      expect(lesson.objectiveIds).toContain(lesson.exercise.objectiveId);
      expect(lesson.exercise.expectedOutcome.length).toBeGreaterThan(0);
      expect(lesson.checkpoint.prompt.length).toBeGreaterThan(0);
      expect(lesson.checkpoint.answer.length).toBeGreaterThan(0);
      expect(lesson.exampleRun?.expectedOutput.length).toBeGreaterThan(0);
    }
  });

  it.skipIf(!hasSystemCCompiler)("compiles all C lessons and matches their documented sample runs", () => {
    for (const { lesson } of flattenLessons(cProgrammingPath)) {
      const source = extractCCode(lesson.content);
      expect(source, `${lesson.id} must include a complete C example`).toBeTruthy();
      expect(lesson.exampleRun, `${lesson.id} must document its sample run`).toBeDefined();
      const directory = mkdtempSync(join(tmpdir(), `katalyst-${lesson.id}-`));
      try {
        const sourcePath = join(directory, "main.c");
        const binaryPath = join(directory, "example");
        writeFileSync(sourcePath, source ?? "");
        const compiled = spawnSync("cc", ["-std=c11", "-Wall", "-Wextra", "-Werror", "-pedantic", sourcePath, "-o", binaryPath], { cwd: directory, encoding: "utf8", timeout: 10_000 });
        expect(compiled.status, `${lesson.id} compile failed: ${compiled.stderr}`).toBe(0);
        const run = spawnSync(binaryPath, [], { cwd: directory, encoding: "utf8", input: lesson.exampleRun?.sampleInput ?? "", timeout: 5_000 });
        expect(run.status, `${lesson.id} exited unsuccessfully: ${run.stderr}`).toBe(0);
        expect(run.stdout, `${lesson.id} sample output`).toBe(lesson.exampleRun?.expectedOutput);
        for (const file of lesson.exampleRun?.expectedFiles ?? []) {
          expect(readFileSync(join(directory, file.path), "utf8"), `${lesson.id} output file ${file.path}`).toBe(file.content);
        }
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    }
  });

  it("keeps the original path and six lesson IDs while covering the rest of the requested topics", () => {
    const ids = flattenLessons(cProgrammingPath).map(({ lesson }) => lesson.id);
    expect(ids.slice(0, 2)).toEqual(["source-to-output", "variables-and-types"]);
    for (const preservedId of ["source-to-output", "variables-and-types", "if-else", "for-loop", "functions", "arrays"]) {
      expect(ids).toContain(preservedId);
    }
    expect(ids).toEqual([
      "source-to-output", "variables-and-types", "input-output", "operators", "if-else", "for-loop",
      "functions", "arrays", "strings", "pointers", "structures-unions", "file-handling", "practical-programming",
      "bitwise-registers", "dynamic-memory", "function-pointers",
      "recursion-callstack", "preprocessor-macros", "structures-padding-alignment", "error-handling-errno",
      "defensive-programming-assert", "c-foundations-capstone-quiz",
    ]);
  });

  it("uses explicit, consecutive module and lesson ordering with earlier prerequisites", () => {
    const entries = flattenLessons(cProgrammingPath);
    expect(cProgrammingPath.modules.map((module) => module.order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(entries.map(({ lesson }) => lesson.order)).toEqual(Array.from({ length: 22 }, (_, index) => index + 1));
    for (const [index, { lesson }] of entries.entries()) {
      for (const prerequisiteId of lesson.prerequisiteLessonIds) {
        expect(entries.findIndex(({ lesson: candidate }) => candidate.id === prerequisiteId)).toBeLessThan(index);
      }
    }
  });

  it("accepts a future draft course without exposing it to the published learning UI", () => {
    const additionalSubject = { id: "rust", title: "Rust", description: "Systems programming with ownership." };
    const draftCourse = {
      id: "rust-introduction", subjectId: additionalSubject.id, title: "Rust Introduction", description: "A draft course.", level: "Beginner" as const,
      prerequisites: [], objectives: [{ id: "rust-basics", title: "Explain a Rust function." }], learningOutcomes: ["Write a small Rust function."],
      estimatedDurationMinutes: null, publicationStatus: "draft" as const,
      modules: [{ id: "rust-module-1", order: 1, title: "First steps", summary: "Meet a Rust function.", lessons: [{
        id: "rust-first-function", order: 1, title: "A first function", summary: "Read a function declaration.", objectiveIds: ["rust-basics"], prerequisiteLessonIds: [],
        content: "A function names a reusable operation. This example shows a complete function and its return value.\n\n~~~rust\nfn answer() -> i32 { 42 }\n~~~",
        exercise: { id: "rust-write-function", title: "Write a function", prompt: "Return 42.", solution: "Use an i32 return value.", objectiveId: "rust-basics", difficulty: "Beginner" as const, expectedOutcome: "Return an integer from a function." },
        checkpoint: { prompt: "What does -> i32 describe?", answer: "The function's return type." },
      }] }],
    };
    const expanded = { subjects: [...learningCatalog.subjects, additionalSubject], courses: [...learningCatalog.courses, draftCourse] };
    expect(validateLearningCatalog(expanded).success).toBe(true);
    expect(getPublishedLearningCourses(expanded).map((course) => course.id)).toEqual(
      learningCatalog.courses.map((course) => course.id)
    );
  });

  it("rejects duplicate IDs, invalid references, broken order, and malformed code fences", () => {
    const duplicate = JSON.parse(JSON.stringify(learningCatalog)) as typeof learningCatalog;
    duplicate.courses[0].modules[1].lessons[0].id = duplicate.courses[0].modules[0].lessons[0].id;
    expect(validateLearningCatalog(duplicate).success).toBe(false);

    const badOrder = JSON.parse(JSON.stringify(learningCatalog)) as typeof learningCatalog;
    badOrder.courses[0].modules[0].lessons[0].order = 2;
    expect(validateLearningCatalog(badOrder).success).toBe(false);

    const malformed = JSON.parse(JSON.stringify(learningCatalog)) as typeof learningCatalog;
    malformed.courses[0].modules[0].lessons[0].content += "\n~~~";
    expect(validateLearningCatalog(malformed).success).toBe(false);

    const mismatched = JSON.parse(JSON.stringify(learningCatalog)) as typeof learningCatalog;
    mismatched.courses[0].modules[0].lessons[0].content = "A complete lesson with a mismatched markdown fence.\n\n~~~c\nint main(void) { return 0; }\n```";
    expect(validateLearningCatalog(mismatched).success).toBe(false);
  });

  it("rejects unsafe paths in expected example files", () => {
    const unsafe = JSON.parse(JSON.stringify(learningCatalog)) as typeof learningCatalog;
    unsafe.courses[0].modules[4].lessons[1].exampleRun!.expectedFiles = [{ path: "../../outside.txt", content: "not a real file" }];
    expect(validateLearningCatalog(unsafe).success).toBe(false);
  });

  it("validates courses and lessons using safeValidateCourse and safeValidateLesson", () => {
    const courseValidation = safeValidateCourse(cProgrammingPath);
    expect(courseValidation.success).toBe(true);
    if (courseValidation.success) {
      expect(courseValidation.data.version).toBe("1.0.0");
    }

    for (const { lesson } of flattenLessons(cProgrammingPath)) {
      const lessonValidation = safeValidateLesson(lesson);
      expect(lessonValidation.success).toBe(true);
      expect(resolveLessonType(lesson)).toBe("guided-coding");
      expect(resolveLessonExecution(cProgrammingPath, lesson)).toEqual({
        language: "c",
        target: "browser-wasm",
      });
      expect(resolveLessonHints(lesson.exercise).length).toBeGreaterThan(0);
    }
  });

  it("keeps embedded hardware lesson examples in C while running JavaScript exercise starters", () => {
    const hardwareCourses = [arduinoEmbeddedCourse, esp32IotCourse, breadboardElectronicsCourse];
    let starterCount = 0;

    for (const course of hardwareCourses) {
      for (const { lesson } of flattenLessons(course)) {
        expect(lesson.exercise.language).toBe("javascript");
        expect(lesson.exercise.starterCode).toBeTruthy();
        expect(lesson.codeExamples?.every((example) => example.language === "c")).toBe(true);
        expect(resolveLessonExecution(course, lesson)).toEqual({
          language: "javascript",
          target: "browser-wasm",
        });
        starterCount += 1;
      }
    }

    expect(starterCount).toBe(hardwareCourses.reduce((acc, c) => acc + flattenLessons(c).length, 0));
  });

  it("supports all lesson types, theory sections, code examples, demos, and progressive hints", () => {
    const richLesson = {
      id: "rich-demo-lesson",
      order: 14,
      title: "Rich Modular Lesson",
      summary: "Demonstrates theory sections, code examples, interactive demo, and resources.",
      type: "interactive-simulation" as const,
      objectiveIds: ["source-to-output"],
      prerequisiteLessonIds: ["source-to-output"],
      estimatedDurationMinutes: 15,
      content: "This is a comprehensive overview of rich modular lessons demonstrating diverse pedagogical content and features.",
      theorySections: [
        { id: "sec-1", title: "Theory Part 1", content: "Detailed explanation." },
      ],
      codeExamples: [
        { title: "Example 1", language: "c" as const, code: "int x = 42;", description: "Small sample" },
      ],
      interactiveDemo: {
        kind: "memory-diagram" as const,
        title: "Memory Visualizer",
        description: "Visualizes stack growth.",
        config: { showAddresses: true },
      },
      resources: [
        { title: "C11 Draft", url: "https://example.com/c11", description: "Standard draft", type: "specification" as const },
      ],
      execution: {
        language: "c" as const,
        target: "browser-wasm" as const,
      },
      exercise: {
        id: "rich-ex",
        title: "Practice Challenge",
        prompt: "Write a small snippet.",
        hints: ["First hint", "Second hint"],
        solution: "int x = 42;",
        objectiveId: "source-to-output",
        difficulty: "Developing" as const,
        expectedOutcome: "Correct syntax.",
      },
      checkpoint: {
        prompt: "Self check?",
        answer: "Self answer.",
      },
    };

    const validated = safeValidateLesson(richLesson);
    expect(validated.success).toBe(true);
    expect(resolveLessonType(richLesson)).toBe("interactive-simulation");
    expect(resolveLessonHints(richLesson.exercise)).toEqual(["First hint", "Second hint"]);
    expect(resolveLessonExecution(cProgrammingPath, richLesson)).toEqual({
      language: "c",
      target: "browser-wasm",
    });
  });

  it("fails validation on invalid lesson types, negative duration, or corrupt schemas", () => {
    const baseLesson = flattenLessons(cProgrammingPath)[0].lesson;

    const invalidType = safeValidateLesson({ ...baseLesson, type: "unsupported-mode" });
    expect(invalidType.success).toBe(false);

    const negativeDuration = safeValidateLesson({ ...baseLesson, estimatedDurationMinutes: -5 });
    expect(negativeDuration.success).toBe(false);

    const invalidDifficulty = safeValidateLesson({
      ...baseLesson,
      exercise: { ...baseLesson.exercise, difficulty: "SuperHard" },
    });
    expect(invalidDifficulty.success).toBe(false);

    const invalidLanguage = safeValidateLesson({
      ...baseLesson,
      execution: { language: "brainfuck" as unknown },
    });
    expect(invalidLanguage.success).toBe(false);

    const invalidCourse = safeValidateCourse({ ...cProgrammingPath, level: "Master" });
    expect(invalidCourse.success).toBe(false);
  });
});

describe("Python Programming Foundations course", () => {
  it("registers Python in the catalog and validates the full course schema", () => {
    expect(pythonProgrammingPath).toMatchObject({
      id: "python-programming-foundations",
      subjectId: "python-programming",
      title: "Python Programming Foundations",
      level: "Beginner",
      version: "1.0.0",
      publicationStatus: "published",
    });
    expect(learningCatalog.subjects.some((s) => s.id === "python-programming")).toBe(true);
    expect(learningCatalog.courses.some((c) => c.id === "python-programming-foundations")).toBe(true);

    const validation = safeValidateCourse(pythonProgrammingPath);
    expect(validation.success).toBe(true);
    if (validation.success) {
      expect(validation.data.modules).toHaveLength(8);
    }
  });

  it("validates all 25 Python lessons, module ordering, and prerequisite DAG constraints", () => {
    const pythonLessons = flattenLessons(pythonProgrammingPath);
    expect(pythonLessons).toHaveLength(25);
    expect(pythonProgrammingPath.modules.map((m) => m.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(pythonLessons.map(({ lesson }) => lesson.order)).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));

    for (const [index, { lesson }] of pythonLessons.entries()) {
      const lessonValidation = safeValidateLesson(lesson);
      expect(lessonValidation.success, `${lesson.id} failed validation`).toBe(true);
      expect(lesson.content.length).toBeGreaterThanOrEqual(80);
      expect(lesson.exercise.hints?.length).toBeGreaterThanOrEqual(1);

      // Verify prerequisite DAG: all prerequisites must be earlier lessons
      for (const prereqId of lesson.prerequisiteLessonIds) {
        const prereqIdx = pythonLessons.findIndex(({ lesson: candidate }) => candidate.id === prereqId);
        expect(prereqIdx, `${lesson.id} prerequisite ${prereqId} must precede it`).toBeLessThan(index);
      }
    }
  });

  it("resolves diverse lesson types across Python foundations", () => {
    const lessons = flattenLessons(pythonProgrammingPath).map(({ lesson }) => ({
      id: lesson.id,
      type: resolveLessonType(lesson),
    }));

    expect(lessons.find((l) => l.id === "py-source-to-interpreter")?.type).toBe("theory");
    expect(lessons.find((l) => l.id === "py-variables-and-types")?.type).toBe("guided-coding");
    expect(lessons.find((l) => l.id === "py-formatted-strings")?.type).toBe("practical-exercise");
    expect(lessons.find((l) => l.id === "py-lists-and-tuples")?.type).toBe("interactive-simulation");
    expect(lessons.find((l) => l.id === "py-engineering-capstone")?.type).toBe("assessment");
  });

  describe("JavaScript & Algorithmic Systems course", () => {
    it("registers JavaScript course and validates schema and modules", () => {
      const validation = safeValidateCourse(javascriptProgrammingPath);
      expect(validation.success).toBe(true);
      if (validation.success) {
        expect(validation.data.modules).toHaveLength(5);
      }
      const lessons = flattenLessons(javascriptProgrammingPath);
      expect(lessons).toHaveLength(14);
      expect(lessons.map(({ lesson }) => lesson.order)).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));

      for (const [index, { lesson }] of lessons.entries()) {
        const lessonValidation = safeValidateLesson(lesson);
        expect(lessonValidation.success, `${lesson.id} failed validation`).toBe(true);
        expect(lesson.content.length).toBeGreaterThanOrEqual(80);
        expect(lesson.exercise.testCases?.length).toBeGreaterThanOrEqual(2);

        for (const prereqId of lesson.prerequisiteLessonIds) {
          const prereqIdx = lessons.findIndex(({ lesson: candidate }) => candidate.id === prereqId);
          expect(prereqIdx, `${lesson.id} prerequisite ${prereqId} must precede it`).toBeLessThan(index);
        }
      }
    });
  });

  describe("Digital Logic & Circuit Foundations course", () => {
    it("registers Circuits course and validates simulation lessons and interactiveDemo", () => {
      const validation = safeValidateCourse(digitalCircuitsPath);
      expect(validation.success).toBe(true);
      if (validation.success) {
        expect(validation.data.modules).toHaveLength(5);
      }
      const lessons = flattenLessons(digitalCircuitsPath);
      expect(lessons).toHaveLength(14);
      expect(lessons.map(({ lesson }) => lesson.order)).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));

      for (const [index, { lesson }] of lessons.entries()) {
        const lessonValidation = safeValidateLesson(lesson);
        expect(lessonValidation.success, `${lesson.id} failed validation`).toBe(true);
        expect(lesson.type).toBe("interactive-simulation");
        expect(lesson.interactiveDemo).toBeDefined();
        expect(lesson.interactiveDemo?.kind).toBe("circuit");
        expect(lesson.exercise.testCases?.length).toBeGreaterThanOrEqual(2);

        for (const prereqId of lesson.prerequisiteLessonIds) {
          const prereqIdx = lessons.findIndex(({ lesson: candidate }) => candidate.id === prereqId);
          expect(prereqIdx, `${lesson.id} prerequisite ${prereqId} must precede it`).toBeLessThan(index);
        }
      }
    });

    it("registers Circuits EEE Core course and validates 10 analog simulation lessons", () => {
      const validation = safeValidateCourse(circuitsEeeCorePath);
      expect(validation.success).toBe(true);
      const lessons = flattenLessons(circuitsEeeCorePath);
      expect(lessons).toHaveLength(10);
      expect(lessons.map(({ lesson }) => lesson.order)).toEqual(Array.from({ length: 10 }, (_, i) => i + 1));

      for (const [index, { lesson }] of lessons.entries()) {
        const lessonValidation = safeValidateLesson(lesson);
        expect(lessonValidation.success, `${lesson.id} failed validation`).toBe(true);
        expect(lesson.type).toBe("interactive-simulation");
        expect(lesson.interactiveDemo).toBeDefined();
        expect(lesson.interactiveDemo?.kind).toBe("circuit");
        expect(lesson.exercise.testCases?.length).toBeGreaterThanOrEqual(2);

        for (const prereqId of lesson.prerequisiteLessonIds) {
          const prereqIdx = lessons.findIndex(({ lesson: candidate }) => candidate.id === prereqId);
          expect(prereqIdx, `${lesson.id} prerequisite ${prereqId} must precede it`).toBeLessThan(index);
        }
      }
    });

    it("registers Control & Signals course and validates 8 simulation and systems lessons", () => {
      const validation = safeValidateCourse(controlAndSignalsPath);
      expect(validation.success).toBe(true);
      const lessons = flattenLessons(controlAndSignalsPath);
      expect(lessons).toHaveLength(8);
      expect(lessons.map(({ lesson }) => lesson.order)).toEqual(Array.from({ length: 8 }, (_, i) => i + 1));

      for (const [index, { lesson }] of lessons.entries()) {
        const lessonValidation = safeValidateLesson(lesson);
        expect(lessonValidation.success, `${lesson.id} failed validation`).toBe(true);
        expect(lesson.type).toBe("interactive-simulation");
        expect(lesson.interactiveDemo).toBeDefined();
        expect(lesson.interactiveDemo?.kind).toBe("circuit");
        expect(lesson.exercise.testCases?.length).toBeGreaterThanOrEqual(2);

        for (const prereqId of lesson.prerequisiteLessonIds) {
          const prereqIdx = lessons.findIndex(({ lesson: candidate }) => candidate.id === prereqId);
          expect(prereqIdx, `${lesson.id} prerequisite ${prereqId} must precede it`).toBeLessThan(index);
        }
      }
    });

    it("registers Embedded Capstones course and validates 6 capstone project lessons", () => {
      const validation = safeValidateCourse(embeddedCapstonesPath);
      expect(validation.success).toBe(true);
      const lessons = flattenLessons(embeddedCapstonesPath);
      expect(lessons).toHaveLength(6);
      expect(lessons.map(({ lesson }) => lesson.order)).toEqual(Array.from({ length: 6 }, (_, i) => i + 1));

      for (const [index, { lesson }] of lessons.entries()) {
        const lessonValidation = safeValidateLesson(lesson);
        expect(lessonValidation.success, `${lesson.id} failed validation`).toBe(true);
        expect(lesson.type).toBe("interactive-simulation");
        expect(lesson.interactiveDemo).toBeDefined();
        expect(lesson.interactiveDemo?.kind).toBe("circuit");
        expect(lesson.exercise.testCases?.length).toBeGreaterThanOrEqual(2);

        for (const prereqId of lesson.prerequisiteLessonIds) {
          const prereqIdx = lessons.findIndex(({ lesson: candidate }) => candidate.id === prereqId);
          expect(prereqIdx, `${lesson.id} prerequisite ${prereqId} must precede it`).toBeLessThan(index);
        }
      }
    });

    it("registers Creative Engineering Lab course and validates 6 creative lessons", () => {
      const validation = safeValidateCourse(creativeEngineeringPath);
      expect(validation.success).toBe(true);
      const lessons = flattenLessons(creativeEngineeringPath);
      expect(lessons).toHaveLength(6);
      expect(lessons.map(({ lesson }) => lesson.order)).toEqual(Array.from({ length: 6 }, (_, i) => i + 1));

      for (const [index, { lesson }] of lessons.entries()) {
        const lessonValidation = safeValidateLesson(lesson);
        expect(lessonValidation.success, `${lesson.id} failed validation`).toBe(true);
        expect(lesson.type).toBe("interactive-simulation");
        expect(lesson.interactiveDemo).toBeDefined();
        expect(lesson.interactiveDemo?.kind).toBe("circuit");
        expect(lesson.exercise.testCases?.length).toBeGreaterThanOrEqual(2);

        for (const prereqId of lesson.prerequisiteLessonIds) {
          const prereqIdx = lessons.findIndex(({ lesson: candidate }) => candidate.id === prereqId);
          expect(prereqIdx, `${lesson.id} prerequisite ${prereqId} must precede it`).toBeLessThan(index);
        }
      }
    });

    it("registers SQL Databases course and validates 12 relational lessons", () => {
      const validation = safeValidateCourse(sqlDatabasesPath);
      expect(validation.success).toBe(true);
      const lessons = flattenLessons(sqlDatabasesPath);
      expect(lessons).toHaveLength(12);
      for (const { lesson } of lessons) {
        expect(safeValidateLesson(lesson).success).toBe(true);
        expect(lesson.exercise.testCases?.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("registers HTML5 & CSS Architecture course and validates 12 web lessons", () => {
      const validation = safeValidateCourse(htmlCssWebPath);
      expect(validation.success).toBe(true);
      const lessons = flattenLessons(htmlCssWebPath);
      expect(lessons).toHaveLength(12);
      for (const { lesson } of lessons) {
        expect(safeValidateLesson(lesson).success).toBe(true);
        expect(lesson.exercise.testCases?.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("registers DSA Mastery course and validates 16 algorithmic lessons", () => {
      const validation = safeValidateCourse(dsaMasteryPath);
      expect(validation.success).toBe(true);
      const lessons = flattenLessons(dsaMasteryPath);
      expect(lessons).toHaveLength(16);
      for (const { lesson } of lessons) {
        expect(safeValidateLesson(lesson).success).toBe(true);
        expect(lesson.exercise.testCases?.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("registers Prompt Engineering course and validates 8 LLM system lessons", () => {
      const validation = safeValidateCourse(promptEngineeringPath);
      expect(validation.success).toBe(true);
      const lessons = flattenLessons(promptEngineeringPath);
      expect(lessons).toHaveLength(8);
      for (const { lesson } of lessons) {
        expect(safeValidateLesson(lesson).success).toBe(true);
        expect(lesson.exercise.testCases?.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("registers Computational Photography course and validates 8 media DSP lessons with Image Lab", () => {
      const validation = safeValidateCourse(photoEditingMediaPath);
      expect(validation.success).toBe(true);
      const lessons = flattenLessons(photoEditingMediaPath);
      expect(lessons).toHaveLength(8);
      for (const { lesson } of lessons) {
        expect(safeValidateLesson(lesson).success).toBe(true);
        expect(lesson.interactiveDemo?.kind).toBe("image-lab");
        expect(lesson.exercise.testCases?.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("registers C++ Systems & Object-Oriented Programming and validates 12 C++17 lessons", () => {
      const validation = safeValidateCourse(cppProgrammingCourse);
      expect(validation.success).toBe(true);
      const lessons = flattenLessons(cppProgrammingCourse);
      expect(lessons).toHaveLength(12);
      for (const { lesson } of lessons) {
        expect(safeValidateLesson(lesson).success).toBe(true);
        expect(lesson.exercise.testCases?.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("registers Arduino Uno Embedded Systems course and validates 12 AVR lessons", () => {
      const validation = safeValidateCourse(arduinoEmbeddedCourse);
      expect(validation.success).toBe(true);
      const lessons = flattenLessons(arduinoEmbeddedCourse);
      expect(lessons).toHaveLength(12);
      for (const { lesson } of lessons) {
        expect(safeValidateLesson(lesson).success).toBe(true);
        expect(lesson.exercise.testCases?.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("registers ESP32 Dual-Core IoT Systems course and validates 12 FreeRTOS lessons", () => {
      const validation = safeValidateCourse(esp32IotCourse);
      expect(validation.success).toBe(true);
      const lessons = flattenLessons(esp32IotCourse);
      expect(lessons).toHaveLength(12);
      for (const { lesson } of lessons) {
        expect(safeValidateLesson(lesson).success).toBe(true);
        expect(lesson.exercise.testCases?.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("registers Practical Breadboard Prototyping course and validates 10 electronics lessons", () => {
      const validation = safeValidateCourse(breadboardElectronicsCourse);
      expect(validation.success).toBe(true);
      const lessons = flattenLessons(breadboardElectronicsCourse);
      expect(lessons).toHaveLength(10);
      for (const { lesson } of lessons) {
        expect(safeValidateLesson(lesson).success).toBe(true);
        expect(lesson.exercise.testCases?.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("enforces pure server-side lessons in published client manifests (Deliverable 3)", () => {
      expect(publishedLearningCourses).toHaveLength(18);
      for (const course of publishedLearningCourses) {
        for (const mod of course.modules) {
          for (const lesson of mod.lessons) {
            // Manifests must NEVER contain heavy markdown content or exercise solutions
            expect((lesson as Record<string, unknown>).content).toBeUndefined();
            expect((lesson as Record<string, unknown>).theorySections).toBeUndefined();
            expect(lesson.exercise.solution).toBeUndefined();
          }
        }
      }
    });
  });
});
