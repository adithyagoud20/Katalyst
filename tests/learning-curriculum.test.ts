import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { cProgrammingPath, flattenLessons, getPublishedLearningCourses, learningCatalog, validateLearningCatalog } from "../src/lib/learning-curriculum";
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
    expect(flattenLessons(cProgrammingPath)).toHaveLength(13);
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
    ]);
  });

  it("uses explicit, consecutive module and lesson ordering with earlier prerequisites", () => {
    const entries = flattenLessons(cProgrammingPath);
    expect(cProgrammingPath.modules.map((module) => module.order)).toEqual([1, 2, 3, 4, 5]);
    expect(entries.map(({ lesson }) => lesson.order)).toEqual(Array.from({ length: 13 }, (_, index) => index + 1));
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
    expect(getPublishedLearningCourses(expanded).map((course) => course.id)).toEqual([cProgrammingPath.id]);
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
});
