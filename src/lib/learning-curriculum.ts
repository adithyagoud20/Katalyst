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
  kind: "circuit" | "flowchart" | "memory-diagram" | "state-machine";
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

export type LearningCheckpoint = { prompt: string; answer: string };
export type LearningExampleFile = { path: string; content: string };
export type LearningExampleRun = { sampleInput?: string; expectedOutput: string; expectedFiles?: LearningExampleFile[] };

export type LearningLesson = {
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

export type LearningModule = { id: string; order: number; title: string; summary: string; lessons: LearningLesson[] };
export type LearningSubject = { id: string; title: string; description: string };
export type LearningCourse = {
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
  modules: LearningModule[];
};

// LearningPath remains as a compatibility name for existing routes, progress records, and callers.
export type LearningPath = LearningCourse;
export type LearningCatalog = { subjects: LearningSubject[]; courses: LearningCourse[] };

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
  kind: z.enum(["circuit", "flowchart", "memory-diagram", "state-machine"]),
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

const lessonSchema: z.ZodType<LearningLesson> = z.object({
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

const moduleSchema: z.ZodType<LearningModule> = z.object({
  id: idSchema,
  order: z.number().int().positive(),
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(500),
  lessons: z.array(lessonSchema).min(1).max(80),
}).strict();

const courseSchema: z.ZodType<LearningCourse> = z.object({
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

export function resolveLessonType(lesson: LearningLesson): LessonType {
  if (lesson.type) return lesson.type;
  if (lesson.exampleRun || lesson.execution?.language === "c") return "guided-coding";
  return "theory";
}

export function resolveLessonExecution(course: LearningCourse, lesson: LearningLesson): LessonExecutionConfig | null {
  if (lesson.execution) return lesson.execution;
  if (course.subjectId === "c-programming") {
    return { language: "c", target: "browser-wasm" };
  }
  if (course.subjectId === "python-programming") {
    return { language: "python", target: "browser-wasm" };
  }
  return null;
}

export function resolveLessonHints(exercise: LearningExercise): string[] {
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

export const cProgrammingSubject: LearningSubject = {
  id: "c-programming",
  title: "C programming",
  description: "A small, systems-oriented language for learning how programs use values, control flow, functions, and memory-backed data.",
};

const objectives: LearningObjective[] = [
  { id: "introduction-to-c", title: "Describe what C is used for and how a C program is built and run." },
  { id: "compile-run", title: "Explain how C source code becomes a running program." },
  { id: "values-types", title: "Choose and use variables with basic C types." },
  { id: "input-output", title: "Read simple input and display formatted output." },
  { id: "operators", title: "Use arithmetic, comparison, and logical operators in expressions." },
  { id: "conditions", title: "Use conditions to choose which statements run." },
  { id: "loops", title: "Trace and write loops with a clear stopping condition." },
  { id: "functions", title: "Break a program into functions with inputs and return values." },
  { id: "arrays", title: "Store a sequence in an array and stay within its bounds." },
  { id: "strings", title: "Read and manipulate null-terminated character arrays safely." },
  { id: "pointers", title: "Explain and use addresses and pointer dereferencing." },
  { id: "records", title: "Group related fields with structures and distinguish union storage." },
  { id: "file-handling", title: "Open, read, write, and close a file while checking errors." },
  { id: "practical-programming", title: "Combine data, functions, loops, and input/output in a small program." },
  { id: "bitwise-registers", title: "Apply bitwise operations to set, clear, and inspect hardware control register flags." },
  { id: "dynamic-memory", title: "Allocate and free heap memory safely while checking for allocation failures." },
  { id: "function-pointers", title: "Store function addresses in pointer variables and dispatch dynamic callbacks." },
];

function exercise(
  id: string,
  title: string,
  prompt: string,
  solution: string,
  objectiveId: string,
  expectedOutcome: string,
  hint?: string,
  difficulty: LearningDifficulty = "Beginner",
  starterCode?: string,
  hints?: string[],
  testCases?: ExerciseTestCase[],
): LearningExercise {
  const allHints = hints && hints.length > 0 ? hints : hint ? [hint] : [];
  return {
    id,
    title,
    prompt,
    solution,
    objectiveId,
    expectedOutcome,
    difficulty,
    hints: allHints,
    ...(allHints[0] ? { hint: allHints[0] } : {}),
    ...(starterCode ? { starterCode } : {}),
    ...(testCases ? { testCases } : {}),
  };
}

function checkpoint(prompt: string, answer: string): LearningCheckpoint { return { prompt, answer }; }

function exampleRun(expectedOutput: string, sampleInput?: string, expectedFiles?: LearningExampleFile[]): LearningExampleRun {
  return { expectedOutput, ...(sampleInput !== undefined ? { sampleInput } : {}), ...(expectedFiles?.length ? { expectedFiles } : {}) };
}

function moduleData(id: string, order: number, title: string, summary: string, lessons: LearningLesson[]): LearningModule {
  return { id, order, title, summary, lessons };
}

const lessons: LearningLesson[] = [
  {
    id: "source-to-output", order: 1, title: "From source code to output",
    summary: "Meet C, compile a source file, and follow a program from entry point to output.",
    objectiveIds: ["introduction-to-c", "compile-run"], prerequisiteLessonIds: [],
    content: `C is a compiled, general-purpose language used in systems software, embedded devices, and performance-sensitive tools. It gives programmers direct control over data and memory, so understanding what each statement does matters.

A C program begins as **source code** in a file such as hello.c. A compiler translates that source into an executable program. Execution starts in main. Editing source does not update an older executable until you compile it again.

Here is a complete C11 program:

~~~c
#include <stdio.h>

int main(void) {
    printf("Hello, C!\\n");
    return 0;
}
~~~

The include line provides printf's declaration. The newline escape ends the printed line, and returning zero reports that main finished successfully. With a compiler that provides cc, a common Unix-like workflow is cc hello.c -o hello followed by ./hello. Commands and executable names vary by system.`,
    exercise: exercise(
      "trace-hello",
      "Trace the first program",
      "Which statement prints the greeting, and what does the newline escape change?",
      "printf writes the greeting. The newline escape moves the cursor to the next line after it.",
      "compile-run",
      "Connect a C statement to the output it produces.",
      "Look inside the parentheses passed to printf.",
      "Beginner",
      "#include <stdio.h>\n\nint main(void) {\n    printf(\"Hello, C!\\n\");\n    return 0;\n}",
      [
        "Look inside the parentheses passed to printf.",
        "Notice the '\\n' escape character at the end of the string.",
        "Observe how the return value communicates exit status to the operating system."
      ],
      [
        {
          id: "test-hello-c",
          label: "Prints 'Hello, C!' greeting",
          expectedStdout: "Hello, C!",
          matchMode: "trimmed",
        },
        {
          id: "test-hello-c-hidden",
          label: "Exact newline verification",
          expectedStdout: "Hello, C!\n",
          matchMode: "exact",
          hidden: true,
        },
      ]
    ),
    exampleRun: exampleRun("Hello, C!\n"),
    checkpoint: checkpoint("Where does a C program begin running, and what does returning zero from main conventionally indicate?", "Execution begins in main. Returning zero conventionally indicates that the program finished successfully."),
  },
  {
    id: "variables-and-types", order: 2, title: "Give values a name",
    summary: "Declare variables and choose a type that fits the value.",
    objectiveIds: ["values-types"], prerequisiteLessonIds: ["source-to-output"],
    content: `A **variable** gives a value a name. In C, each variable has a type that describes the kind of value it stores. An int holds an integer, a double holds a floating-point value, and a char holds one character.

~~~c
#include <stdio.h>

int main(void) {
    int room_count = 28;
    double temperature = 21.5;
    char section = 'B';
    printf("Rooms: %d\\n", room_count);
    printf("Temperature: %.1f\\n", temperature);
    printf("Section: %c\\n", section);
    return 0;
}
~~~

The format markers describe the values supplied after the format string: %d is for an int, %f for a double, and %c for a char. The precision in %.1f prints one digit after the decimal point. Initialize a variable before reading it so its value is explicit.`,
    exercise: exercise(
      "choose-a-type",
      "Choose a type for a measurement",
      "Write a C declaration for a voltage of 3.3 using a useful variable name.",
      "double voltage = 3.3; stores a fractional value in a variable named voltage.",
      "values-types",
      "Select a floating-point type and make a named value.",
      "The measurement includes a fractional part.",
      "Beginner",
      "#include <stdio.h>\n\nint main(void) {\n    double voltage = 3.3;\n    printf(\"Voltage: %.1f V\\n\", voltage);\n    return 0;\n}",
      [
        "The measurement includes a fractional part.",
        "Use 'double' rather than 'int' to preserve decimal precision.",
        "In printf, format doubles with '%.1f' to specify one decimal place."
      ],
      [
        {
          id: "test-voltage-output",
          label: "Prints voltage formatted to one decimal place",
          expectedStdout: "Voltage: 3.3 V",
          matchMode: "trimmed",
        },
        {
          id: "test-voltage-exact",
          label: "Exact output with unit and newline",
          expectedStdout: "Voltage: 3.3 V\n",
          matchMode: "exact",
          hidden: true,
        },
      ]
    ),
    exampleRun: exampleRun("Rooms: 28\nTemperature: 21.5\nSection: B\n"),
    checkpoint: checkpoint("Which type would you choose for 21.5, and which format marker prints it with one decimal place?", "Use double for the value and %.1f to print one digit after the decimal point."),
  },
  {
    id: "input-output", order: 3, title: "Read input and show results",
    summary: "Use scanf for a simple number and printf to report the result.",
    objectiveIds: ["input-output"], prerequisiteLessonIds: ["variables-and-types"],
    content: `Programs can read data typed by a user and report a result. printf formats output. scanf stores input in a variable; for an int, use %d and pass the variable's address with &. Always check whether scanf successfully read the expected value.

~~~c
#include <stdio.h>

int main(void) {
    int age;
    printf("Enter your age: ");
    if (scanf("%d", &age) != 1) {
        printf("Please enter a whole number.\\n");
        return 1;
    }
    printf("You entered %d.\\n", age);
    return 0;
}
~~~

The comparison checks the number of values scanf converted. If the input is not an integer, the program reports the problem and stops instead of using an uninitialized value. The browser C workbench can provide this input through its stdin field.`,
    exercise: exercise(
      "read-two-values",
      "Read and report a value",
      "Adapt the example to read a whole-number count and print `Count: ` followed by that value.",
      "Declare an int, read it with scanf(\"%d\", &count), check that scanf returns 1, then print it with printf(\"Count: %d\\n\", count).",
      "input-output",
      "Read one validated integer and display it with a matching format marker.",
      "Use %d for both reading and printing an int.",
      "Beginner",
      "#include <stdio.h>\n\nint main(void) {\n    int count;\n    if (scanf(\"%d\", &count) != 1) {\n        return 1;\n    }\n    printf(\"Count: %d\\n\", count);\n    return 0;\n}",
      [
        "Use %d for both reading and printing an int.",
        "Pass the address of the variable (&count) to scanf.",
      ],
      [
        {
          id: "test-count-5",
          label: "Input 5 produces 'Count: 5'",
          stdin: "5\n",
          expectedStdout: "Count: 5",
          matchMode: "trimmed",
        },
        {
          id: "test-count-42",
          label: "Input 42 produces 'Count: 42'",
          stdin: "42\n",
          expectedStdout: "Count: 42",
          matchMode: "trimmed",
        },
        {
          id: "test-count-negative",
          label: "Handles negative integer -7",
          stdin: "-7\n",
          expectedStdout: "Count: -7",
          matchMode: "trimmed",
          hidden: true,
        },
      ]
    ),
    exampleRun: exampleRun("Enter your age: You entered 21.\n", "21\n"),
    checkpoint: checkpoint("Why does scanf receive &age for an int, and what does checking its return value protect against?", "&age gives scanf the variable's address so it can store the input. Checking the return value avoids using a value that was not successfully read."),
  },
  {
    id: "operators", order: 4, title: "Build expressions with operators",
    summary: "Combine values with arithmetic, comparisons, and logical operators.",
    objectiveIds: ["operators"], prerequisiteLessonIds: ["input-output"],
    content: `Arithmetic operators make new values: +, -, *, and / perform addition, subtraction, multiplication, and division. When both operands are integers, division discards the fractional part. Comparison operators such as < and == produce a true or false result, and && combines two conditions.

~~~c
#include <stdio.h>

int main(void) {
    int total = 17;
    int people = 5;
    int whole_per_person = total / people;
    int remainder = total % people;
    printf("Each gets %d; %d remain.\\n", whole_per_person, remainder);
    printf("Enough for one each: %s\\n", people > 0 && total >= people ? "yes" : "no");
    return 0;
}
~~~

Here integer division produces 3 and the remainder operator % produces 2. Parentheses can make grouping clear, and comparison results can be combined before they control an if statement. Avoid dividing by zero; C does not define a useful result for that operation.`,
    exercise: exercise(
      "integer-division",
      "Trace integer division",
      "What values do 17 / 5 and 17 % 5 produce when both operands are int?",
      "17 / 5 produces 3 and 17 % 5 produces 2.",
      "operators",
      "Distinguish an integer quotient from its remainder.",
      "Integer division drops the fractional part.",
      "Beginner",
      "#include <stdio.h>\n\nint main(void) {\n    int a = 17, b = 5;\n    printf(\"Quotient: %d, Remainder: %d\\n\", a / b, a % b);\n    return 0;\n}",
      [
        "Integer division in C truncates toward zero.",
        "The modulus operator '%' computes the remainder of integer division.",
        "To get a floating-point quotient, cast at least one operand: (double)17 / 5."
      ],
      [
        {
          id: "tc-int-div-1",
          label: "Computes quotient 3 and remainder 2",
          expectedStdout: "Quotient: 3, Remainder: 2",
          matchMode: "trimmed",
        },
        {
          id: "tc-int-div-hidden",
          label: "Exact quotient and remainder line format",
          expectedStdout: "Quotient: 3, Remainder: 2\n",
          matchMode: "exact",
          hidden: true,
        },
      ]
    ),
    exampleRun: exampleRun("Each gets 3; 2 remain.\nEnough for one each: yes\n"),
    checkpoint: checkpoint("What is the difference between = and == in a C expression?", "= assigns a value. == compares two values for equality."),
  },
  {
    id: "if-else", order: 5, title: "Choose a path with if",
    summary: "Use a condition to select between two pieces of work.",
    objectiveIds: ["conditions"], prerequisiteLessonIds: ["operators"],
    content: `An if statement runs its body when a condition is true. An optional else body runs when it is false. In C, zero is false and nonzero is true. Braces clearly show which statements belong to each branch.

~~~c
#include <stdio.h>

int main(void) {
    int score = 72;
    if (score >= 50) {
        printf("Pass\\n");
    } else {
        printf("Try again\\n");
    }
    return 0;
}
~~~

The condition is checked before a branch runs. The operators == and != test equality and inequality; <, <=, >, and >= compare ordering. A single = assigns a value; it does not test equality. Trace a conditional by evaluating the condition first, then following only the matching branch.`,
    exercise: exercise(
      "trace-condition",
      "Trace a condition",
      "If score is 48, which message prints, and why?",
      "Try again prints because 48 >= 50 is false, so the else branch runs.",
      "conditions",
      "Evaluate a boundary comparison and identify the selected branch.",
      "Compare 48 with the boundary value 50.",
      "Beginner",
      "#include <stdio.h>\n\nint main(void) {\n    int score = 48;\n    if (score >= 50) {\n        printf(\"Pass\\n\");\n    } else {\n        printf(\"Try again\\n\");\n    }\n    return 0;\n}",
      [
        "Compare 48 with the boundary value 50.",
        "Since 48 is strictly less than 50, the 'if' condition evaluates to false (0).",
        "The execution jumps directly to the 'else' block."
      ],
      [
        {
          id: "tc-cond-1",
          label: "Evaluates score < 50 to print Try again",
          expectedStdout: "Try again",
          matchMode: "trimmed",
        },
        {
          id: "tc-cond-hidden",
          label: "Contains expected failure message",
          expectedStdout: "Try again",
          matchMode: "contains",
          hidden: true,
        },
      ]
    ),
    exampleRun: exampleRun("Pass\n"),
    checkpoint: checkpoint("What output does the example produce when score is 72?", "It prints Pass because 72 is greater than or equal to 50."),
  },
  {
    id: "for-loop", order: 6, title: "Repeat work with a loop",
    summary: "Use a loop counter and a stopping condition to repeat a task.",
    objectiveIds: ["loops"], prerequisiteLessonIds: ["if-else"],
    content: `A loop repeats a block while its condition allows another pass. A for loop puts initialization, continuation, and update in one header. Its condition is checked before each pass.

~~~c
#include <stdio.h>

int main(void) {
    for (int i = 0; i < 4; i++) {
        printf("%d\\n", i);
    }
    return 0;
}
~~~

The counter starts at zero. The body runs while i < 4; after each pass, i++ increases it by one. The printed values are 0, 1, 2, and 3. When i becomes four, the condition is false and the loop stops. Before writing a loop, name its starting value, stopping condition, and update to reduce off-by-one errors.`,
    exercise: exercise(
      "count-loop-passes",
      "Count the passes",
      "How many times does this loop body run, and what is the last value printed?",
      "The body runs four times. The last value printed is 3; 4 fails the condition.",
      "loops",
      "Trace a loop from its initial value through the final passing condition.",
      "List the values of i that satisfy i < 4.",
      "Beginner",
      "#include <stdio.h>\n\nint main(void) {\n    for (int i = 0; i < 4; i++) {\n        printf(\"%d\\n\", i);\n    }\n    return 0;\n}",
      [
        "List the values of i that satisfy i < 4: 0, 1, 2, 3.",
        "When i reaches 4, the test 4 < 4 evaluates to false.",
        "The loop terminates immediately without executing the body for 4."
      ],
      [
        {
          id: "tc-loop-1",
          label: "Prints 0 to 3 sequentially",
          expectedStdout: "0\n1\n2\n3",
          matchMode: "trimmed",
        },
        {
          id: "tc-loop-hidden",
          label: "Loop strictly terminates before 4",
          expectedStdout: "3\n",
          matchMode: "contains",
          hidden: true,
        },
      ]
    ),
    exampleRun: exampleRun("0\n1\n2\n3\n"),
    checkpoint: checkpoint("Why does this loop not print 4?", "The condition is checked before each pass. Once i is 4, i < 4 is false and the body does not run."),
  },
  {
    id: "functions", order: 7, title: "Package logic in a function",
    summary: "Give an operation a name, parameters, and a return value.",
    objectiveIds: ["functions"], prerequisiteLessonIds: ["for-loop"],
    content: `A function names a task so it can be called from another part of a program. Parameters receive input values, and the return type describes the result. Defining a small function before main keeps this example easy to follow.

~~~c
#include <stdio.h>

int square(int value) {
    return value * value;
}

int main(void) {
    int result = square(5);
    printf("%d\\n", result);
    return 0;
}
~~~

When square(5) is called, value is 5 and the function returns 25. The caller stores that value in result. The signature describes the return type, function name, and parameter. Keep an example small enough that you can trace the argument to the returned result.`,
    exercise: exercise(
      "write-square",
      "Describe a square function",
      "What value does square(-3) return, and why is the result an int?",
      "It returns 9 because -3 multiplied by -3 is 9. The parameter and result are integers.",
      "functions",
      "Trace a function call from an integer argument to its return value.",
      "Substitute -3 for value in value * value.",
      "Beginner",
      "#include <stdio.h>\n\nint square(int value) {\n    return value * value;\n}\n\nint main(void) {\n    printf(\"%d\\n\", square(-3));\n    return 0;\n}",
      [
        "Substitute -3 for value in value * value.",
        "Multiplying two negative numbers produces a positive product.",
        "The return type 'int' ensures the integer result 9 is returned to the caller."
      ],
      [
        {
          id: "tc-square-1",
          label: "Squares -3 to return 9",
          expectedStdout: "9",
          matchMode: "trimmed",
        },
        {
          id: "tc-square-hidden",
          label: "Exact output with trailing newline",
          expectedStdout: "9\n",
          matchMode: "exact",
          hidden: true,
        },
      ]
    ),
    exampleRun: exampleRun("25\n"),
    checkpoint: checkpoint("In `int square(int value)`, which part is the parameter and which part is the return type?", "value is the parameter name and int before square is the return type."),
  },
  {
    id: "arrays", order: 8, title: "Keep values in an array",
    summary: "Store same-type values in order and address them by index.",
    objectiveIds: ["arrays"], prerequisiteLessonIds: ["functions"],
    content: `An array stores a fixed number of values of one type in order. C array indexing starts at zero, so an array with length elements has valid indexes from zero through length minus one.

~~~c
#include <stdio.h>

int main(void) {
    int readings[3] = {18, 21, 19};
    for (int i = 0; i < 3; i++) {
        printf("%d\\n", readings[i]);
    }
    return 0;
}
~~~

The array contains three integers. The loop reads indexes zero, one, and two. Accessing readings[3] is outside the array's valid range; C does not automatically check array bounds. Keep the element count and the last valid index distinct: for three elements, the count is three and the final index is two.`,
    exercise: exercise(
      "array-index",
      "Find a valid final index",
      "An array has 8 elements. What are its first and last valid indexes?",
      "The first valid index is 0 and the last valid index is 7.",
      "arrays",
      "Calculate an array's valid index range from its element count.",
      "C array indexes start at zero, not one.",
      "Beginner",
      "#include <stdio.h>\n\nint main(void) {\n    int data[8] = {1, 2, 3, 4, 5, 6, 7, 8};\n    printf(\"First: %d, Last: %d\\n\", data[0], data[7]);\n    return 0;\n}",
      [
        "C array indexes start at zero, not one.",
        "For N elements, the index range spans from 0 to N - 1.",
        "Accessing data[8] is an off-by-one error leading to undefined behavior."
      ],
      [
        {
          id: "tc-arr-1",
          label: "Prints first and last elements",
          expectedStdout: "First: 1, Last: 8",
          matchMode: "trimmed",
        },
        {
          id: "tc-arr-hidden",
          label: "Contains first element",
          expectedStdout: "First: 1",
          matchMode: "contains",
          hidden: true,
        },
      ]
    ),
    exampleRun: exampleRun("18\n21\n19\n"),
    checkpoint: checkpoint("How many valid elements are in `int values[3]`, and what is the final valid index?", "There are three elements, at indexes 0, 1, and 2. The final valid index is 2."),
  },
  {
    id: "strings", order: 9, title: "Work with C strings",
    summary: "Treat text as a bounded character array ending with a null character.",
    objectiveIds: ["strings"], prerequisiteLessonIds: ["arrays"],
    content: `C does not have a built-in string type. A string is a character array terminated by the special null character. Leave room for that terminator when choosing the array size. Use bounded input such as fgets so a line cannot overflow the array.

~~~c
#include <stdio.h>
#include <string.h>

int main(void) {
    char name[32];
    printf("Name: ");
    if (fgets(name, sizeof name, stdin) == NULL) {
        return 1;
    }
    name[strcspn(name, "\\n")] = '\\0';
    printf("Hello, %s!\\n", name);
    return 0;
}
~~~

fgets reads at most one less than the array capacity and then adds a null terminator. strcspn finds the first newline, if present, so the example can remove it without writing past the array. The %s format marker prints characters up to the string terminator.`,
    exercise: exercise(
      "bounded-string",
      "Size a character array",
      "How large must a char array be to store up to 20 visible characters as a C string?",
      "It needs at least 21 characters: 20 for the visible characters and one for the terminating '\\0'.",
      "strings",
      "Account for the null terminator when sizing a character array.",
      "A C string needs one extra character after its visible text.",
      "Developing",
      "#include <stdio.h>\n\nint main(void) {\n    char buffer[21] = \"12345678901234567890\";\n    printf(\"Buffer allocated: %zu bytes\\n\", sizeof(buffer));\n    return 0;\n}",
      [
        "A C string needs one extra byte after its visible text for the null terminator '\\0'.",
        "20 characters + 1 null byte = 21 bytes minimum.",
        "Functions like printf('%s') and strlen() rely on '\\0' to know where the string ends."
      ],
      [
        {
          id: "tc-str-1",
          label: "Allocates 21 bytes for 20 characters plus null terminator",
          expectedStdout: "Buffer allocated: 21 bytes",
          matchMode: "trimmed",
        },
        {
          id: "tc-str-hidden",
          label: "Exact output check",
          expectedStdout: "Buffer allocated: 21 bytes\n",
          matchMode: "exact",
          hidden: true,
        },
      ]
    ),
    exampleRun: exampleRun("Name: Hello, Ada!\n", "Ada\n"),
    checkpoint: checkpoint("What marks the end of a C string, and what does fgets do to limit input?", "The null character '\\0' marks the end. fgets reads at most the buffer capacity minus one and terminates the stored string."),
  },
  {
    id: "pointers", order: 10, title: "Follow a pointer",
    summary: "Store an address and use it to access the pointed-to value.",
    objectiveIds: ["pointers"], prerequisiteLessonIds: ["strings"],
    content: `A pointer variable stores an address. The address operator & obtains the address of an object, and the unary * operator dereferences a pointer to access the object there. A pointer should point to a valid object before it is dereferenced.

~~~c
#include <stdio.h>

int main(void) {
    int score = 7;
    int *score_address = &score;
    printf("Value: %d\\n", *score_address);
    *score_address = 9;
    printf("Updated: %d\\n", score);
    return 0;
}
~~~

score_address stores the address of score. Dereferencing it reads or updates the same integer. The pointer type, int *, says what kind of object the address is expected to point to. An uninitialized or invalid pointer must not be dereferenced.`,
    exercise: exercise(
      "pointer-value",
      "Trace a pointer update",
      "After `*score_address = 9`, what value does `score` contain?",
      "score contains 9 because dereferencing score_address accesses the original score object.",
      "pointers",
      "Relate a pointer dereference to the object at its address.",
      "The pointer refers to score, not to a separate copy.",
      "Developing",
      "#include <stdio.h>\n\nint main(void) {\n    int score = 7;\n    int *score_address = &score;\n    *score_address = 9;\n    printf(\"score: %d\\n\", score);\n    return 0;\n}",
      [
        "The pointer refers to score, not to a separate copy.",
        "Dereferencing '*score_address' directly modifies the memory allocated for 'score'.",
        "Therefore, reading 'score' immediately reflects the updated value 9."
      ],
      [
        {
          id: "tc-ptr-1",
          label: "Updates score to 9 through pointer dereference",
          expectedStdout: "score: 9",
          matchMode: "trimmed",
        },
        {
          id: "tc-ptr-hidden",
          label: "Exact output check",
          expectedStdout: "score: 9\n",
          matchMode: "exact",
          hidden: true,
        },
      ]
    ),
    exampleRun: exampleRun("Value: 7\nUpdated: 9\n"),
    checkpoint: checkpoint("What does &score produce, and what does *score_address mean in this example?", "&score produces the address of score. *score_address accesses the integer stored at that address."),
  },
  {
    id: "structures-unions", order: 11, title: "Group data with structures and unions",
    summary: "Use a structure for related fields and understand shared union storage.",
    objectiveIds: ["records"], prerequisiteLessonIds: ["pointers"],
    content: `A structure groups named fields that can have different types. Each field has its own storage, so a record can hold several values at once. A union also has named members, but those members share storage; a program should read the member it most recently wrote.

~~~c
#include <stdio.h>

struct Point {
    int x;
    int y;
};

union Number {
    int whole;
    double decimal;
};

int main(void) {
    struct Point origin = {0, 0};
    union Number measurement;
    measurement.whole = 42;
    printf("Point: (%d, %d)\\n", origin.x, origin.y);
    printf("Whole measurement: %d\\n", measurement.whole);
    return 0;
}
~~~

The Point stores x and y together. Number has enough storage for its largest member, and assigning decimal after whole would replace the active value. A structure is the usual choice when all fields need to be available together.`,
    exercise: exercise(
      "structure-fields",
      "Choose a record",
      "For a book with a title and page count that must both be available, would you use a struct or a union? Explain.",
      "Use a struct because both fields should be stored and read at the same time. Union members share storage.",
      "records",
      "Select a structure when independent fields must coexist.",
      "Ask whether the values need separate storage at the same time.",
      "Developing",
      "#include <stdio.h>\n\nstruct Book {\n    char title[64];\n    int pages;\n};\n\nint main(void) {\n    struct Book b = {\"The C Programming Language\", 272};\n    printf(\"Book: %s (%d pages)\\n\", b.title, b.pages);\n    return 0;\n}",
      [
        "Ask whether the values need separate storage at the same time.",
        "In a struct, each member has its own dedicated offset and memory space.",
        "In a union, all members overlap in the same memory, holding only one active value."
      ],
      [
        {
          id: "tc-struct-1",
          label: "Prints title and page count from struct",
          expectedStdout: "Book: The C Programming Language (272 pages)",
          matchMode: "trimmed",
        },
        {
          id: "tc-struct-hidden",
          label: "Contains page count",
          expectedStdout: "272 pages",
          matchMode: "contains",
          hidden: true,
        },
      ]
    ),
    exampleRun: exampleRun("Point: (0, 0)\nWhole measurement: 42\n"),
    checkpoint: checkpoint("How does the storage of a struct differ from that of a union?", "A struct gives each field its own storage. Union members share the same storage, so only the most recently written member should be read."),
  },
  {
    id: "file-handling", order: 12, title: "Read and write a file",
    summary: "Use a FILE pointer, check each operation, and close the file.",
    objectiveIds: ["file-handling"], prerequisiteLessonIds: ["structures-unions"],
    content: `C file operations use a FILE pointer from stdio.h. fopen opens a path and returns NULL if it fails. Check that result, check reads and writes where appropriate, and close every successfully opened file.

~~~c
#include <stdio.h>

int main(void) {
    FILE *file = fopen("notes.txt", "w");
    if (file == NULL) {
        perror("notes.txt");
        return 1;
    }
    if (fprintf(file, "First note\\n") < 0) {
        fclose(file);
        return 1;
    }
    if (fclose(file) != 0) {
        return 1;
    }
    printf("Saved notes.txt\\n");
    return 0;
}
~~~

The mode "w" creates or replaces the file for writing. The standard C library reports errors through return values; checking them makes failure visible. In KATALYST, this file exists only inside the temporary browser sandbox for that run; it is not saved to your device.`,
    exercise: exercise(
      "check-file-open",
      "Handle an open failure",
      "What should a program do if `fopen` returns NULL?",
      "It should report or handle the failure and must not call file operations through the NULL pointer.",
      "file-handling",
      "Check a file handle before using it and handle failure safely.",
      "fopen returns NULL when it cannot open the requested file.",
      "Developing",
      "#include <stdio.h>\n\nint main(void) {\n    FILE *fp = fopen(\"missing.txt\", \"r\");\n    if (fp == NULL) {\n        printf(\"Failed to open file\\n\");\n        return 0;\n    }\n    fclose(fp);\n    return 0;\n}",
      [
        "fopen returns NULL when it cannot open the requested file.",
        "Passing a NULL pointer to fread, fwrite, or fprintf results in a crash (segmentation fault).",
        "Always check 'if (fp == NULL)' and either return an error or handle the missing resource gracefully."
      ],
      [
        {
          id: "tc-file-1",
          label: "Handles missing file safely without crashing",
          expectedStdout: "Failed to open file",
          matchMode: "trimmed",
        },
        {
          id: "tc-file-hidden",
          label: "Exact error message",
          expectedStdout: "Failed to open file\n",
          matchMode: "exact",
          hidden: true,
        },
      ]
    ),
    exampleRun: exampleRun("Saved notes.txt\n", undefined, [{ path: "notes.txt", content: "First note\n" }]),
    checkpoint: checkpoint("What does fopen return when opening fails, and why must a successful file be closed?", "It returns NULL on failure. A successful file should be closed to finish the operation and release its resource."),
  },
  {
    id: "practical-programming", order: 13, title: "Build a small program from parts",
    summary: "Combine a structure, array, function, loop, and formatted output.",
    objectiveIds: ["practical-programming"], prerequisiteLessonIds: ["file-handling"],
    content: `A small program becomes easier to reason about when its data and operations have clear roles. This example groups a student's name and scores, uses a function for one calculation, and loops over the scores to display them.

~~~c
#include <stdio.h>

struct Student {
    char name[24];
    int scores[3];
};

double average(const int scores[], int count) {
    int total = 0;
    for (int i = 0; i < count; i++) {
        total += scores[i];
    }
    return (double) total / count;
}

int main(void) {
    struct Student student = {"Mina", {82, 91, 87}};
    printf("Scores for %s:", student.name);
    for (int i = 0; i < 3; i++) {
        printf(" %d", student.scores[i]);
    }
    printf("\\nAverage: %.1f\\n", average(student.scores, 3));
    return 0;
}
~~~

The cast to double makes the division keep a fractional result. The function receives an array and its element count; C does not pass the array length automatically. When designing a small program, list its data, operations, and input/output before writing code.`,
    exercise: exercise(
      "extend-score-summary",
      "Extend a score summary",
      "Add a fourth score to the Student data and update the loops and average call so all four scores are included.",
      "Add one integer to the scores initializer, change both loop limits to 4, and pass 4 to average. The array and its count must agree.",
      "practical-programming",
      "Coordinate an array size with every loop and function call that uses its elements.",
      "Find all places where the example currently uses the count 3.",
      "Applied",
      "#include <stdio.h>\n\nstruct Student {\n    char name[24];\n    int scores[4];\n};\n\ndouble average(const int scores[], int count) {\n    int total = 0;\n    for (int i = 0; i < count; i++) {\n        total += scores[i];\n    }\n    return (double) total / count;\n}\n\nint main(void) {\n    struct Student student = {\"Mina\", {82, 91, 87, 95}};\n    printf(\"Scores for %s:\", student.name);\n    for (int i = 0; i < 4; i++) {\n        printf(\" %d\", student.scores[i]);\n    }\n    printf(\"\\nAverage: %.1f\\n\", average(student.scores, 4));\n    return 0;\n}",
      [
        "Find all places where the example currently uses the count 3.",
        "Update the scores array initializer to hold 4 scores, e.g., {82, 91, 87, 95}.",
        "Change the loop bound to i < 4 and pass 4 as the count argument to average()."
      ],
      [
        {
          id: "tc-prac-1",
          label: "Computes 4-score average 88.8",
          expectedStdout: "Scores for Mina: 82 91 87 95\nAverage: 88.8",
          matchMode: "trimmed",
        },
        {
          id: "tc-prac-hidden",
          label: "Contains calculated average",
          expectedStdout: "Average: 88.8",
          matchMode: "contains",
          hidden: true,
        },
      ]
    ),
    exampleRun: exampleRun("Scores for Mina: 82 91 87\nAverage: 86.7\n"),
    checkpoint: checkpoint("Why does average receive both an array and a count?", "A function parameter does not carry the array's element count in C. The count lets the function know how many values it may read."),
  },
  {
    id: "bitwise-registers", order: 14, title: "Bitwise operations and hardware registers",
    summary: "Manipulate individual bits using &, |, ^, ~, and shifts to configure hardware control registers.",
    objectiveIds: ["bitwise-registers"], prerequisiteLessonIds: ["practical-programming"],
    content: `Embedded systems and low-level drivers communicate with hardware through **control registers** where individual bits represent status flags or peripheral settings. C provides bitwise operators (&, |, ^, ~, <<, >>) to manipulate bits directly without modifying adjacent flags.

~~~c
#include <stdio.h>

int main(void) {
    unsigned int flags = 0x04;
    unsigned int enable_mask = 0x01;
    flags |= enable_mask;
    printf("Control register: 0x%02X\\n", flags);
    return 0;
}
~~~

The bitwise OR operator (\`|\`) sets specific bits to 1. The bitwise AND operator (\`&\`) with an inverted mask (\`~mask\`) clears bits to 0, while the XOR operator (\`^\`) toggles bits. Hexadecimal literals such as \`0x04\` allow natural visualization of 8-bit, 16-bit, and 32-bit register layouts.`,
    interactiveDemo: {
      kind: "memory-diagram",
      title: "Bitwise Register Layout",
      description: "Step through bitmask operations and register bit toggles.",
    },
    exercise: exercise(
      "set-register-bit",
      "Set a control register bit",
      "Given an initial register value of 0x24 (0010 0100), set bit 3 using the mask 0x08 and print the result in hex formatted with 0x%02X.",
      "Use the bitwise OR assignment operator (reg |= 0x08) to set bit 3 without disturbing other flags.",
      "bitwise-registers",
      "Apply bitwise OR masks to set control flags.",
      "Use the |= operator with 0x08.",
      "Developing",
      "#include <stdio.h>\n\nint main(void) {\n    unsigned int reg = 0x24;\n    reg |= 0x08;\n    printf(\"Register: 0x%02X\\n\", reg);\n    return 0;\n}",
      [
        "Use the bitwise OR assignment operator 'reg |= 0x08'.",
        "The format specifier '0x%02X' ensures uppercase 2-digit hex representation."
      ],
      [
        {
          id: "tc-bit-1",
          label: "Sets bit 3 to yield 0x2C",
          expectedStdout: "Register: 0x2C",
          matchMode: "trimmed",
        },
        {
          id: "tc-bit-hidden",
          label: "Hex formatting check",
          expectedStdout: "0x2C",
          matchMode: "contains",
          hidden: true,
        },
      ]
    ),
    exampleRun: exampleRun("Control register: 0x05\n"),
    checkpoint: checkpoint("Why is bitwise OR used to set a flag rather than addition?", "Bitwise OR guarantees the target bit is set to 1 regardless of its initial state, without arithmetic carries that could corrupt adjacent bits."),
  },
  {
    id: "dynamic-memory", order: 15, title: "Dynamic memory allocation and cleanup",
    summary: "Allocate heap memory with malloc, check for allocation failure, and release it with free to avoid leaks.",
    objectiveIds: ["dynamic-memory"], prerequisiteLessonIds: ["bitwise-registers"],
    content: `Stack allocation is automatic but fixed in size. When the size of data is determined at runtime, C programs request dynamic memory from the **heap** using \`malloc\`. Dynamic memory persists until explicitly released with \`free\`.

~~~c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int *readings = (int *)malloc(3 * sizeof(int));
    if (readings == NULL) {
        return 1;
    }
    readings[0] = 12;
    readings[1] = 15;
    readings[2] = 18;
    int total = readings[0] + readings[1] + readings[2];
    printf("Allocated sum: %d\\n", total);
    free(readings);
    return 0;
}
~~~

Always verify that \`malloc\` returns a non-null address before dereferencing it. Every successful \`malloc\` must have exactly one corresponding \`free\` call. Failing to free memory causes memory leaks, while freeing a pointer twice causes undefined behavior.`,
    interactiveDemo: {
      kind: "memory-diagram",
      title: "Stack & Heap Memory Layout",
      description: "Step through malloc and free allocations.",
    },
    exercise: exercise(
      "heap-buffer-calc",
      "Allocate and clean up a buffer",
      "Dynamically allocate an array of 3 integers with malloc, store 10, 20, 30, print their sum as 'Heap sum: <sum>', and free the pointer.",
      "Allocate with malloc(3 * sizeof(int)), verify non-null, assign elements, print sum, and call free(buffer).",
      "dynamic-memory",
      "Allocate, verify, and safely free dynamic memory.",
      "Multiply the element count by sizeof(int).",
      "Applied",
      "#include <stdio.h>\n#include <stdlib.h>\n\nint main(void) {\n    int *buffer = (int *)malloc(3 * sizeof(int));\n    if (buffer == NULL) {\n        return 1;\n    }\n    buffer[0] = 10;\n    buffer[1] = 20;\n    buffer[2] = 30;\n    printf(\"Heap sum: %d\\n\", buffer[0] + buffer[1] + buffer[2]);\n    free(buffer);\n    return 0;\n}",
      [
        "Check if the returned pointer is NULL before accessing elements.",
        "Sum the 3 integers and print with 'Heap sum: %d\\n'.",
        "Always call free() on the allocated pointer before exiting."
      ],
      [
        {
          id: "tc-dyn-1",
          label: "Allocates 3 ints and computes Heap sum: 60",
          expectedStdout: "Heap sum: 60",
          matchMode: "trimmed",
        },
        {
          id: "tc-dyn-hidden",
          label: "Contains sum 60",
          expectedStdout: "60",
          matchMode: "contains",
          hidden: true,
        },
      ]
    ),
    exampleRun: exampleRun("Allocated sum: 45\n"),
    checkpoint: checkpoint("What catastrophic failure occurs if free() is omitted in long-running processes?", "Memory leaks occur, continuously consuming heap memory until the system runs out of memory (OOM) and crashes."),
  },
  {
    id: "function-pointers", order: 16, title: "Function pointers and state machines",
    summary: "Store executable function addresses in pointer variables and build flexible state machine dispatchers.",
    objectiveIds: ["function-pointers"], prerequisiteLessonIds: ["dynamic-memory"],
    content: `In C, functions reside in executable memory and possess memory addresses. A **function pointer** stores the address of a function, allowing code to pass operations as arguments, build dispatch tables, and implement state machines.

~~~c
#include <stdio.h>

static int add_offset(int value, int offset) {
    return value + offset;
}

static int apply_transform(int input, int param, int (*operation)(int, int)) {
    return operation(input, param);
}

int main(void) {
    int result = apply_transform(10, 5, add_offset);
    printf("Transformed: %d\\n", result);
    return 0;
}
~~~

The declaration \`int (*operation)(int, int)\` defines a pointer to a function returning an int and taking two int parameters. Function pointers decouple higher-level logic from specific implementations, forming the foundation of callbacks and object-oriented patterns in C.`,
    exercise: exercise(
      "dynamic-callback-dispatch",
      "Dispatch operations with function pointers",
      "Write a program with add(a, b) and multiply(a, b) functions. Use a compute(x, y, op) function that calls the function pointer op to print 'Sum: 9' and 'Product: 20'.",
      "Declare compute(int x, int y, int (*op)(int, int)) and call op(x, y).",
      "function-pointers",
      "Pass function addresses to parameter pointers for dynamic dispatch.",
      "Function pointer syntax is return_type (*name)(param_types).",
      "Applied",
      "#include <stdio.h>\n\nstatic int add(int a, int b) { return a + b; }\nstatic int multiply(int a, int b) { return a * b; }\n\nstatic int compute(int x, int y, int (*op)(int, int)) {\n    return op(x, y);\n}\n\nint main(void) {\n    printf(\"Sum: %d\\n\", compute(4, 5, add));\n    printf(\"Product: %d\\n\", compute(4, 5, multiply));\n    return 0;\n}",
      [
        "Declare function pointers with parentheses around (*op): int (*op)(int, int).",
        "Pass the function name directly without parentheses: compute(4, 5, add).",
        "Call the function pointer inside compute using op(x, y)."
      ],
      [
        {
          id: "tc-fnptr-1",
          label: "Dispatches add and multiply to print Sum: 9 and Product: 20",
          expectedStdout: "Sum: 9\nProduct: 20",
          matchMode: "trimmed",
        },
        {
          id: "tc-fnptr-hidden",
          label: "Product check",
          expectedStdout: "Product: 20",
          matchMode: "contains",
          hidden: true,
        },
      ]
    ),
    exampleRun: exampleRun("Transformed: 15\n"),
    checkpoint: checkpoint("How does a function pointer enable flexible state machines and event-driven architectures?", "Instead of using monolithic switch-case blocks, event handlers or state transition callbacks can be registered and invoked dynamically."),
  },
];

export const cProgrammingPath: LearningPath = {
  id: "c-programming-foundations",
  subjectId: cProgrammingSubject.id,
  title: "C Programming Foundations",
  description: "Build a working foundation in C: compile a first program, handle input and data, control execution, and combine functions, collections, memory, records, and files in practical code.",
  level: "Beginner",
  version: "1.0.0",
  prerequisites: ["No prior C experience is required.", "The browser C Playground runs C11 programs locally in a WebAssembly sandbox."],
  objectives,
  learningOutcomes: [
    "Compile, run, and explain a small C11 program.",
    "Read and print simple values and choose suitable C types and operators.",
    "Use decisions, loops, functions, arrays, and null-terminated strings.",
    "Explain basic pointer use and group related values with structures and unions.",
    "Check file operations and combine core concepts in a small practical program.",
    "Apply bitwise operators to hardware registers, manage dynamic heap memory, and dispatch function pointers.",
  ],
  estimatedDurationMinutes: null,
  publicationStatus: "published",
  modules: [
    moduleData("first-programs", 1, "Your first C programs", "Understand what C is and give basic values clear names.", lessons.slice(0, 2)),
    moduleData("control-the-flow", 2, "Data and decisions", "Read values, form expressions, and control which work runs.", lessons.slice(2, 6)),
    moduleData("functions-and-sequences", 3, "Functions and sequences", "Name reusable work and handle ordered collections of data.", lessons.slice(6, 9)),
    moduleData("memory-and-records", 4, "Memory and records", "Follow addresses and model related data with C record types.", lessons.slice(9, 11)),
    moduleData("files-and-practice", 5, "Files and practical programming", "Check file operations and bring the course ideas together.", lessons.slice(11, 13)),
    moduleData("systems-engineering", 6, "Systems & low-level engineering", "Manipulate bitwise registers, manage dynamic heap memory, and dispatch function pointers.", lessons.slice(13)),
  ],
};

import { pythonProgrammingSubject, pythonProgrammingPath } from "./curriculum/python-foundations";
import { javascriptProgrammingSubject, javascriptProgrammingPath } from "./curriculum/javascript-algorithms";
import { digitalCircuitsSubject, digitalCircuitsPath } from "./curriculum/digital-circuits";
export {
  pythonProgrammingSubject,
  pythonProgrammingPath,
  javascriptProgrammingSubject,
  javascriptProgrammingPath,
  digitalCircuitsSubject,
  digitalCircuitsPath,
};

const catalogValidation = validateLearningCatalog({
  subjects: [
    cProgrammingSubject,
    pythonProgrammingSubject,
    javascriptProgrammingSubject,
    digitalCircuitsSubject,
  ],
  courses: [
    cProgrammingPath,
    pythonProgrammingPath,
    javascriptProgrammingPath,
    digitalCircuitsPath,
  ],
});
if (!catalogValidation.success) throw new Error(`The authored learning catalog failed validation: ${catalogValidation.error.issues.map((issue) => issue.message).join("; ")}`);
export const learningCatalog: LearningCatalog = catalogValidation.data;

export const learningSubjects = learningCatalog.subjects;
export function getPublishedLearningCourses(catalog: LearningCatalog): LearningCourse[] {
  return catalog.courses.filter((course) => course.publicationStatus === "published");
}
export const publishedLearningCourses = getPublishedLearningCourses(learningCatalog);
export const learningPaths: LearningPath[] = publishedLearningCourses;

export function flattenLessons(path: LearningPath): Array<{ lesson: LearningLesson; module: LearningModule }> {
  return [...path.modules].sort((a, b) => a.order - b.order).flatMap((item) => [...item.lessons].sort((a, b) => a.order - b.order).map((lesson) => ({ lesson, module: item })));
}

export function findLesson(path: LearningPath, lessonId: string): { lesson: LearningLesson; module: LearningModule } | undefined {
  return flattenLessons(path).find(({ lesson }) => lesson.id === lessonId);
}
