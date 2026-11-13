# KATALYST Curriculum Authoring Guide

KATALYST is a learning-first engineering platform. This document defines the authoring format, schema contracts, validation rules, and publication checklist for engineering and programming courses.

The curriculum engine in KATALYST is designed to be **scalable and provider-independent**:
- Courses and lessons are declarative, type-safe data structures validated by Zod schemas in `src/lib/learning-curriculum.ts`.
- Content is independent of specific AI providers or backend execution runtimes.
- Lessons support multiple pedagogical modalities without requiring custom page implementations for every course.
- Kat AI tutor and the code workspace consume lesson context through structured, bounded interfaces.

---

## 1. Hierarchy and Core Types

The curriculum structure follows an ordered 4-level hierarchy:

```
Catalog
└── Subjects (Domain categories, e.g. "c-programming")
    └── Courses (Structured learning paths, e.g. "c-programming-foundations")
        └── Modules (Ordered instructional units)
            └── Lessons (Individual learning units with theory, exercises, and checkpoints)
```

### Supported Lesson Types (`LessonType`)

| Type | Purpose | UI Behavior (M17.3) |
| :--- | :--- | :--- |
| `theory` | Conceptual understanding, deep dives, architecture walkthroughs | Full reading view (100% width); opens to 2 panels when Kat is toggled on demand. No empty code tab on mobile. |
| `guided-coding` | Step-by-step code explanation with interactive playground | Default 2-panel layout (Theory 50% + Code Sandbox 50%). Kat is closed by default; toggles to 3 panels (35/35/30) on demand. |
| `practical-exercise` | Challenge-oriented practice with starter code and solution | Default 2-panel layout (Theory 50% + Code Sandbox 50%) pre-populating starter code; Kat opens on demand for progressive hints. |
| `interactive-simulation`| System models (memory diagrams, state machines, logic circuits) | Interactive demonstration component with responsive splitters and optional Kat assistance. |
| `assessment` | Capstone project or self-check evaluation | Focused self-evaluation with checkpoints and progressive hints. |

---

## 2. Schema Specification

### 2.1 Course (`LearningCourse`)

```typescript
type LearningCourse = {
  id: string;                                // Unique slug: e.g. "c-programming-foundations"
  subjectId: string;                         // References an authored subject ID
  title: string;                             // Display title
  description: string;                       // High-level overview
  level: "Beginner" | "Developing" | "Applied";
  version?: string;                          // Semver string: e.g. "1.0.0"
  prerequisites: string[];                   // Required prior knowledge
  objectives: Array<{ id: string; title: string }>; // Course-level objectives referenced by lessons
  learningOutcomes: string[];                // Concrete capabilities gained upon completion
  estimatedDurationMinutes: number | null;   // Estimated total study time in minutes
  publicationStatus: "published" | "draft" | "archived";
  modules: LearningModule[];                 // Ordered modules (order: 1, 2, 3...)
};
```

### 2.2 Module (`LearningModule`)

```typescript
type LearningModule = {
  id: string;                                // Unique slug: e.g. "c-basics"
  order: number;                             // 1-based sequential integer
  title: string;                             // Module heading
  summary: string;                           // Concise module objective
  lessons: LearningLesson[];                 // Ordered lessons (order: 1, 2, 3...)
};
```

### 2.3 Lesson (`LearningLesson`)

```typescript
type LearningLesson = {
  id: string;                                // Unique slug: e.g. "pointers"
  order: number;                             // 1-based sequential integer across path
  title: string;                             // Lesson title
  summary: string;                           // Single-sentence synopsis
  type?: LessonType;                         // Defaults to "guided-coding" if omitted
  objectiveIds: string[];                    // IDs of objectives covered (must exist in course)
  prerequisiteLessonIds: string[];           // IDs of preceding lessons required
  content: string;                           // Primary markdown content or overview
  estimatedDurationMinutes?: number | null;  // Recommended duration in minutes

  // Modular sections (Optional)
  theorySections?: Array<{
    id: string;
    title: string;
    content: string;                         // Markdown formatted theory
  }>;

  codeExamples?: Array<{
    title: string;
    language: "c" | "python" | "javascript" | "typescript" | "sql";
    code: string;
    description?: string;
  }>;

  interactiveDemo?: {
    kind: "circuit" | "flowchart" | "memory-diagram" | "state-machine";
    title?: string;
    description?: string;
    config?: Record<string, unknown>;
  };

  resources?: Array<{
    title: string;
    url?: string;
    description: string;
    type: "documentation" | "article" | "specification" | "reference";
  }>;

  execution?: {
    language: "c" | "python" | "javascript" | "typescript" | "sql";
    target?: "browser-wasm" | "server-sandbox" | "simulated";
  };

  exampleRun?: {
    sampleInput?: string;                    // Pre-fed standard input
    expectedOutput: string;                  // Standard output verification string
    expectedFiles?: Array<{ path: string; content: string }>; // Output files
  };

  exercise: {
    id: string;                              // Unique exercise slug
    title: string;                           // Exercise title
    prompt: string;                          // Problem statement
    hint?: string;                           // Single hint (backward-compatible)
    hints?: string[];                        // Ordered progressive hints
    solution: string;                        // Reference solution with markdown
    objectiveId: string;                     // Primary objective validated
    difficulty: "Beginner" | "Developing" | "Applied";
    starterCode?: string;                    // Initial boilerplate for editor
    expectedOutcome: string;                 // Target learning verification
  };

  checkpoint: {
    prompt: string;                          // Self-check question
    answer: string;                          // Explanation revealed on demand
  };
};
```

---

## 3. Exercise Progress Foundation

Learner progress on exercises is tracked separately from lesson completion. It supports four states:

- `not-started`: Default initial state.
- `attempted`: Learner has worked on the exercise or loaded starter code.
- `completed`: Learner has verified their solution. (Inferred automatically if lesson was marked complete in legacy progress).
- `needs-review`: Learner flags the exercise to revisit later.

Both the **Lesson view** and the **Practice Lab** provide direct controls for learners to set their progress status.

---

## 4. Complete Reference Example

Below is a complete, copy-pasteable example of an advanced, fully-featured lesson authored for the curriculum engine:

```typescript
import type { LearningLesson } from "@/lib/learning-curriculum";

export const sampleMemoryDiagramLesson: LearningLesson = {
  id: "memory-stack-and-heap",
  order: 9,
  title: "Stack vs. Heap Memory Allocation",
  summary: "Understand memory segments, automatic stack allocation, dynamic heap allocation, and lifetime boundaries.",
  type: "interactive-simulation",
  objectiveIds: ["memory-management-foundations"],
  prerequisiteLessonIds: ["pointers-and-addresses"],
  estimatedDurationMinutes: 25,
  content: `Memory management in systems programming separates **automatic storage** (the stack) from **dynamic storage** (the heap).

Stack frames are allocated and deallocated automatically on function entry and exit. Heap memory persists until explicitly freed with \`free()\`.`,

  theorySections: [
    {
      id: "stack-frames-explanation",
      title: "Stack Allocation Mechanics",
      content: "Local variables live inside stack frames. Each function call pushes a new frame; returning pops it. Stack allocation is O(1) pointer adjustment and cache-friendly.",
    },
    {
      id: "heap-allocation-mechanics",
      title: "Heap Allocation Mechanics",
      content: "Dynamic memory request through \`malloc()\` traverses allocator metadata to reserve a contiguous block of bytes. If not released, leaks occur.",
    },
  ],

  codeExamples: [
    {
      title: "Stack Allocation Example",
      language: "c",
      code: "void stack_example(void) {\n    int local_val = 42;\n    printf(\"Stack address: %p\\n\", (void*)&local_val);\n}",
      description: "Local variable allocated automatically inside the stack frame.",
    },
    {
      title: "Heap Allocation Example",
      language: "c",
      code: "int *heap_example(void) {\n    int *ptr = malloc(sizeof(int));\n    if (ptr != NULL) *ptr = 100;\n    return ptr; // caller must free(ptr)\n}",
      description: "Dynamic allocation outliving the function call scope.",
    },
  ],

  interactiveDemo: {
    kind: "memory-diagram",
    title: "Stack vs Heap Segment Visualizer",
    description: "Visualizes the high memory stack growing downward and the low memory heap growing upward.",
    config: {
      stackGrowth: "downward",
      heapGrowth: "upward",
      showAddresses: true,
      initialFrames: ["main()", "process_buffer()"],
    },
  },

  resources: [
    {
      title: "ISO/IEC 9899:2011 (C11) §6.2.4",
      url: "https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf",
      description: "Storage durations of objects in the C standard specification.",
      type: "specification",
    },
    {
      title: "Valgrind Memcheck Manual",
      url: "https://valgrind.org/docs/manual/mc-manual.html",
      description: "Detailed guide to tracking memory leaks and invalid accesses.",
      type: "documentation",
    },
  ],

  execution: {
    language: "c",
    target: "browser-wasm",
  },

  exampleRun: {
    expectedOutput: "Allocated 4 integers on heap.\nCleaned up heap memory.\n",
  },

  exercise: {
    id: "ex-stack-heap-safe-free",
    title: "Allocate and Clean Up Dynamic Memory",
    prompt: "Write a function that dynamically allocates an array of 4 integers, fills them with multiples of 10, prints the sum, and properly frees the allocated memory.",
    hints: [
      "Remember to check if malloc returned NULL before dereferencing.",
      "Calculate array size using 4 * sizeof(int).",
      "Always call free() on the allocated pointer before returning.",
    ],
    starterCode: `#include <stdio.h>\n#include <stdlib.h>\n\nint main(void) {\n    // 1. Allocate space for 4 ints\n    // 2. Populate values: 10, 20, 30, 40\n    // 3. Print the sum\n    // 4. Free allocated memory\n    return 0;\n}\n`,
    solution: `#include <stdio.h>\n#include <stdlib.h>\n\nint main(void) {\n    int *arr = malloc(4 * sizeof(int));\n    if (arr == NULL) return 1;\n    int sum = 0;\n    for (int i = 0; i < 4; i++) {\n        arr[i] = (i + 1) * 10;\n        sum += arr[i];\n    }\n    printf("Sum: %d\\n", sum);\n    free(arr);\n    return 0;\n}\n`,
    objectiveId: "memory-management-foundations",
    difficulty: "Developing",
    expectedOutcome: "Proper allocation, null check, loop accumulation, and leak-free deallocation.",
    testCases: [
      {
        id: "tc-sum-check",
        description: "Evaluates correct summation and output format",
        expectedStdout: "Sum: 100\n",
        matchMode: "trimmed",
      },
      {
        id: "tc-leak-free-check",
        description: "Hidden edge validation for clean process termination",
        expectedStdout: "Sum: 100\n",
        matchMode: "trimmed",
        hidden: true,
      },
    ],
  },

  checkpoint: {
    prompt: "What happens to heap-allocated memory when a function returns if free() was not called?",
    answer: "The memory remains allocated on the heap, but the pointer variable storing its address goes out of scope on the stack, causing a memory leak.",
  },
};
```

---

## 5. Publication Checklist & Validation Rules

Before publishing or adding a course into `learningCatalog`:

1. **Unique Identifiers**:
   - Course IDs, Module IDs, Lesson IDs, Exercise IDs, and Objective IDs must be globally unique across the catalog.
2. **Sequential Ordering**:
   - Modules must be numbered consecutively starting from `1`.
   - Lessons must be numbered consecutively starting from `1` through `N` across the course.
3. **Prerequisite Integrity (DAG)**:
   - `prerequisiteLessonIds` must only refer to lesson IDs that appear **earlier** in the sequential order of the course. Cyclic or forward references are strictly forbidden.
4. **Objective Mapping**:
   - Every `objectiveId` referenced in a lesson or exercise must exist in the course's `objectives` array.
5. **Code & Markdown Fences**:
   - Markdown code fences must be properly matched (e.g., `~~~c ... ~~~` or ```` ... ````).
   - If an `exampleRun` is provided, code examples should compile and execute reliably.
6. **Execution Target Safety**:
   - `expectedFiles` paths must be relative and cannot contain path traversal (`../`).
7. **Safe Schema Validation**:
   - Run the programmatic validation helpers:
     ```typescript
     import { safeValidateCourse, safeValidateLesson } from "@/lib/learning-curriculum";

     const courseCheck = safeValidateCourse(myNewCourse);
     if (!courseCheck.success) {
       console.error("Course validation errors:", courseCheck.issues);
     }
     ```
8. **Kat Tutor Alignment**:
   - Tutor guidance must strictly instruct Kat **never to claim code execution** unless an execution runtime actually returned verified stdout/stderr.

---

## 6. Official Catalog Courses (Milestone M19)

As of Milestone M19, the KATALYST catalog features four foundational engineering and computing tracks spanning 53 lessons and 20 modules:

| Course ID | Title | Subject | Modules | Lessons | Execution Language |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `c-programming-foundations` | C Programming Foundations | `c-programming` | 6 | 16 | `c` (Wasmer C11 WebAssembly) |
| `python-programming-foundations` | Python Programming Foundations | `python-programming` | 7 | 19 | `python` (Pyodide 3.12 WebAssembly) |
| `js-systems-algorithms` | JavaScript & Algorithmic Systems | `js-programming` | 4 | 10 | `javascript` (Isolated Web Worker) |
| `digital-logic-circuits` | Digital Logic & Circuit Foundations | `digital-circuits` | 3 | 8 | `circuit` (Interactive SVG Simulators) |

