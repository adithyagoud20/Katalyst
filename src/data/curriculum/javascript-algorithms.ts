import type {
  ExerciseTestCase,
  LearningCheckpoint,
  LearningCourse,
  LearningDifficulty,
  LearningExampleRun,
  LearningExercise,
  LearningLesson,
  LearningModule,
  LearningObjective,
  LearningSubject,
} from "@/lib/learning-curriculum";

export const javascriptProgrammingSubject: LearningSubject = {
  id: "js-programming",
  title: "JavaScript & Algorithms",
  description: "High-performance event-driven computing, memory management with TypedArrays, and classic data structures for modern systems and browser runtimes.",
};

export const javascriptObjectives: LearningObjective[] = [
  { id: "js-scope-closures", title: "Master lexical scope, execution contexts, closures, and private variable encapsulation." },
  { id: "js-event-loop", title: "Analyze the asynchronous event loop, microtask vs. macrotask queues, and job scheduling." },
  { id: "js-async-promises", title: "Handle asynchronous control flow with Promises, async/await, and defensive retry logic." },
  { id: "js-buffers-typedarrays", title: "Allocate binary memory buffers and unpack structured telemetry with ArrayBuffer and DataView." },
  { id: "js-stacks-queues-obj", title: "Implement stacks and queues for syntax validation and monotonic sequence processing." },
  { id: "js-trees-bst", title: "Construct binary search trees and execute recursive and iterative in-order traversals." },
  { id: "js-graphs-search", title: "Traverse graphs and compute unweighted shortest paths using Breadth-First Search (BFS)." },
  { id: "js-heaps-pq", title: "Build binary min-heaps with bubble-up and sink-down operations for priority queue scheduling." },
  { id: "js-dp-memo", title: "Optimize recursive subproblems through dynamic programming memoization and bottom-up tabulation." },
  { id: "js-capstone-systems", title: "Architect an event-driven telemetry engine with publish-subscribe decoupling and listener management." },
  { id: "js-microtask-queue", title: "Trace job queue microtask execution priorities against timer macrotasks in the event loop." },
  { id: "js-web-workers", title: "Coordinate background thread operations using Web Workers and structured messaging." },
  { id: "js-streams-transform", title: "Process chunks of high-frequency data using ReadableStream pipeline transforms." },
  { id: "js-binary-protocol", title: "Serialize and parse custom binary framing packets with TypedArrays." },
];

function exercise(
  id: string,
  title: string,
  prompt: string,
  solution: string,
  objectiveId: string,
  expectedOutcome: string,
  hints: string[],
  difficulty: LearningDifficulty = "Developing",
  starterCode?: string,
  testCases?: ExerciseTestCase[],
): LearningExercise {
  return {
    id,
    title,
    prompt,
    solution,
    objectiveId,
    expectedOutcome,
    hints,
    hint: hints[0],
    difficulty,
    ...(starterCode ? { starterCode } : {}),
    ...(testCases ? { testCases } : {}),
  };
}

function checkpoint(prompt: string, answer: string): LearningCheckpoint {
  return { prompt, answer };
}

function exampleRun(expectedOutput: string, sampleInput?: string): LearningExampleRun {
  return { expectedOutput, ...(sampleInput !== undefined ? { sampleInput } : {}) };
}

function moduleData(
  id: string,
  order: number,
  title: string,
  summary: string,
  lessons: LearningLesson[],
): LearningModule {
  return { id, order, title, summary, lessons };
}

export const javascriptLessons: LearningLesson[] = [
  // Module 1: Scope, Closures, and Asynchronous JavaScript
  {
    id: "js-lexical-scope-closures",
    order: 1,
    title: "Lexical scope and closures",
    summary: "Understand function execution contexts, lexical scoping rules, and how closures encapsulate state.",
    type: "guided-coding",
    objectiveIds: ["js-scope-closures"],
    prerequisiteLessonIds: [],
    estimatedDurationMinutes: 25,
    content: `In JavaScript, variable lookup is determined by **lexical scoping**: a function's access to variables is defined by its physical location in the source code where it was declared, not where it is invoked.

A **closure** is the combination of a function bundled together with references to its surrounding state (the lexical environment). When an inner function is returned from an outer function, it retains access to the outer function's local variables even after the outer function has finished executing.

~~~javascript
function createIdGenerator(prefix) {
  let counter = 0;
  return function() {
    counter += 1;
    return \`\${prefix}-\${counter}\`;
  };
}

const gen = createIdGenerator("NODE");
console.log(gen()); // NODE-1
console.log(gen()); // NODE-2
~~~

Closures allow engineers to create private state and encapsulate variables without polluting the global namespace.`,
    theorySections: [
      {
        id: "js-lexical-env",
        title: "Lexical Environment Records",
        content: "Every running execution context has an associated Lexical Environment record that holds identifier bindings. When a function completes, its environment is preserved on the heap as long as an active inner closure references it.",
      },
      {
        id: "js-data-hiding",
        title: "Encapsulation via Closures",
        content: "Before private class fields (#field), closures were the primary mechanism in JavaScript to ensure fields could not be mutated from external scopes.",
      },
    ],
    codeExamples: [
      {
        title: "Encapsulated Accumulator",
        language: "javascript",
        code: `function makeAccumulator(base = 0) {\n  let total = base;\n  return {\n    add: (n) => { total += n; return total; },\n    get: () => total\n  };\n}\nconst acc = makeAccumulator(10);\nacc.add(5);\nconsole.log("Total:", acc.get());`,
        description: "Encapsulating internal numeric state behind getter and setter closures.",
      },
    ],
    resources: [
      {
        title: "MDN Closures Guide",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures",
        description: "Comprehensive guide to lexical environments and closures.",
        type: "documentation",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Total: 15\n"),
    exercise: exercise(
      "ex-js-counter-closure",
      "Create an encapsulated counter with closures",
      "Create a function createCounter(initialValue) that returns an object with three methods: increment(), decrement(), and getValue(). Both increment() and decrement() adjust the internal counter by 1, and getValue() returns the current count. Create a counter starting at 5, increment twice, decrement once, and print 'Count: ' + counter.getValue().",
      `function createCounter(initialValue = 0) {\n  let count = initialValue;\n  return {\n    increment: () => ++count,\n    decrement: () => --count,\n    getValue: () => count,\n  };\n}\n\nconst c = createCounter(5);\nc.increment();\nc.increment();\nc.decrement();\nconsole.log("Count: " + c.getValue());`,
      "js-scope-closures",
      "Create private variable closures with getter and mutator methods.",
      [
        "Initialize let count = initialValue inside createCounter.",
        "Return an object with increment, decrement, and getValue methods.",
        "Verify count is preserved across repeated method calls.",
      ],
      "Developing",
      `function createCounter(initialValue = 0) {\n  // Implement private counter closure\n}\n\nconst c = createCounter(5);\n// Increment twice, decrement once, and print Count\n`,
      [
        {
          id: "tc-js-clos-1",
          label: "Increments and decrements counter correctly",
          expectedStdout: "Count: 6",
          matchMode: "trimmed",
        },
        {
          id: "tc-js-clos-hidden",
          label: "Final count value check",
          expectedStdout: "Count: 6",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why can an inner function still access variables of an outer function that has already returned?",
      "The inner function maintains a hidden reference to the outer function's Lexical Environment record, preventing the garbage collector from reclaiming those bindings.",
    ),
  },

  {
    id: "js-event-loop-microtasks",
    order: 2,
    title: "The event loop and microtask scheduling",
    summary: "Master the browser event loop, call stack, macrotasks (setTimeout), and microtasks (Promise.then).",
    type: "practical-exercise",
    objectiveIds: ["js-event-loop"],
    prerequisiteLessonIds: ["js-lexical-scope-closures"],
    estimatedDurationMinutes: 30,
    content: `JavaScript is single-threaded: it has a single call stack and executes one operation at a time. Concurrency is handled by the **Event Loop**, which orchestrates synchronous execution and queues of asynchronous tasks.

### The Two Task Queues
1. **Microtask Queue**: Promises (\`Promise.then\`, \`catch\`, \`finally\`) and \`queueMicrotask\`. The runtime drains the **entire microtask queue** immediately after every synchronous stack frame clears before rendering or executing macrotasks.
2. **Macrotask Queue**: Timers (\`setTimeout\`, \`setInterval\`) and I/O callbacks. Only **one macrotask** is executed per event loop iteration.

~~~javascript
console.log("A"); // Synchronous
setTimeout(() => console.log("B"), 0); // Macrotask
Promise.resolve().then(() => console.log("C")); // Microtask
console.log("D"); // Synchronous
// Execution order: A -> D -> C -> B
~~~`,
    theorySections: [
      {
        id: "js-event-loop-phases",
        title: "Event Loop Priority",
        content: "Microtasks always have higher priority than macrotasks. If a microtask schedules another microtask, the engine continues processing microtasks until the queue is completely exhausted.",
      },
      {
        id: "js-starvation-risk",
        title: "Microtask Starvation",
        content: "Continuously queuing microtasks can starve the event loop, freezing UI rendering and preventing macrotasks or user input events from firing.",
      },
    ],
    codeExamples: [
      {
        title: "Microtask Queue Draining",
        language: "javascript",
        code: `const order = [];\norder.push("Sync 1");\nPromise.resolve().then(() => order.push("Micro 1"));\norder.push("Sync 2");\nPromise.resolve().then(() => {\n  console.log("Recorded:", order.join(" -> "));\n});`,
        description: "Tracing microtask queue execution order relative to synchronous code.",
      },
    ],
    resources: [
      {
        title: "In Depth: JavaScript Event Loop",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop",
        description: "Official guide to runtime event model and queues.",
        type: "reference",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Recorded: Sync 1 -> Sync 2 -> Micro 1\n"),
    exercise: exercise(
      "ex-js-task-scheduling",
      "Trace synchronous and microtask execution order",
      "Simulate an execution queue ordering using an array logs. Log synchronously 'SYNC-1', queue a microtask with Promise.resolve().then(() => logs.push('MICRO-1')), push 'SYNC-2' synchronously, and after resolution print the resulting sequence joined with ' -> '.",
      `async function testExecutionOrder() {\n  const logs = [];\n  logs.push("SYNC-1");\n  Promise.resolve().then(() => logs.push("MICRO-1"));\n  logs.push("SYNC-2");\n  await Promise.resolve();\n  console.log(logs.join(" -> "));\n}\ntestExecutionOrder();`,
      "js-event-loop",
      "Demonstrate deterministic interleaving of synchronous code and microtask callbacks.",
      [
        "Push 'SYNC-1' to logs first.",
        "Queue microtask with Promise.resolve().then().",
        "Push 'SYNC-2' before the microtask executes.",
        "Await Promise.resolve() to let microtasks drain before printing.",
      ],
      "Developing",
      `async function testExecutionOrder() {\n  const logs = [];\n  // Push SYNC-1, queue microtask MICRO-1, push SYNC-2, await and print\n}\ntestExecutionOrder();\n`,
      [
        {
          id: "tc-js-loop-1",
          label: "Prints SYNC-1 -> SYNC-2 -> MICRO-1 in exact sequence",
          expectedStdout: "SYNC-1 -> SYNC-2 -> MICRO-1",
          matchMode: "trimmed",
        },
        {
          id: "tc-js-loop-hidden",
          label: "Microtask drained after sync code",
          expectedStdout: "SYNC-2 -> MICRO-1",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Between a pending setTimeout(fn, 0) and a resolved Promise.then(fn), which executes first when the call stack clears?",
      "The Promise.then callback executes first because it is placed in the microtask queue, which is drained immediately before any macrotasks are processed.",
    ),
  },

  {
    id: "js-promises-async-await",
    order: 3,
    title: "Promises, async/await, and error handling",
    summary: "Write clean asynchronous code with Promises, async/await syntax, and robust error handling.",
    type: "guided-coding",
    objectiveIds: ["js-async-promises"],
    prerequisiteLessonIds: ["js-event-loop-microtasks"],
    estimatedDurationMinutes: 30,
    content: `Asynchronous operations like network requests, hardware sensor reads, and file I/O require predictable error handling and sequential orchestration.

A **Promise** represents an eventual completion (or failure) of an asynchronous operation and its resulting value:
- \`pending\`: Initial state.
- \`fulfilled\`: The operation succeeded.
- \`rejected\`: The operation failed.

The **async/await** syntax provides synchronous-looking syntax on top of Promises. An \`async\` function always returns a Promise. The \`await\` keyword pauses execution until the Promise resolves, unwrapping its value or throwing if rejected:

~~~javascript
async function loadTelemetry() {
  try {
    const data = await fetchPacket();
    return data;
  } catch (err) {
    console.error("Telemetry failed:", err.message);
  }
}
~~~`,
    theorySections: [
      {
        id: "js-async-desugaring",
        title: "Async/Await Desugaring",
        content: "Under the hood, async/await is syntactic sugar over Promises and generators. Each await splits the function into continuation blocks that register on the microtask queue.",
      },
      {
        id: "js-unhandled-rejections",
        title: "Unhandled Rejections",
        content: "Always wrap await statements in try/catch blocks or attach a .catch() handler to prevent unhandled rejection crashes in modern runtimes.",
      },
    ],
    codeExamples: [
      {
        title: "Sequential Asynchronous Fetch",
        language: "javascript",
        code: `async function computeSensorAverage() {\n  const p1 = Promise.resolve(20.4);\n  const p2 = Promise.resolve(24.6);\n  const [v1, v2] = await Promise.all([p1, p2]);\n  console.log("Average:", (v1 + v2) / 2);\n}\ncomputeSensorAverage();`,
        description: "Executing concurrent asynchronous tasks with Promise.all and awaiting results.",
      },
    ],
    resources: [
      {
        title: "MDN async/await Reference",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function",
        description: "Complete guide to async function syntax and mechanics.",
        type: "documentation",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Average: 22.5\n"),
    exercise: exercise(
      "ex-js-async-retry",
      "Implement an asynchronous retry routine",
      "Write an async function fetchWithRetry(simulateFails, maxRetries = 3) that attempts an operation. Each attempt increments an attemptCounter. If attemptCounter <= simulateFails, throw new Error('Network error'). Otherwise, return `SUCCESS: ${attemptCounter} attempts`. Catch errors in a loop up to maxRetries. Call fetchWithRetry(2, 3) and print the resolved result.",
      `async function fetchWithRetry(simulateFails, maxRetries = 3) {\n  let attempts = 0;\n  for (let i = 1; i <= maxRetries; i++) {\n    attempts++;\n    try {\n      if (attempts <= simulateFails) {\n        throw new Error("Network error");\n      }\n      return \`SUCCESS: \${attempts} attempts\`;\n    } catch (err) {\n      if (i === maxRetries) {\n        return \`FAILED: \${err.message}\`;\n      }\n    }\n  }\n}\n\nfetchWithRetry(2, 3).then((res) => console.log(res));`,
      "js-async-promises",
      "Construct robust async retry mechanisms using loops and try/catch.",
      [
        "Track attempt counts inside a for loop up to maxRetries.",
        "Catch the simulated error and continue the loop if under maxRetries.",
        "Return success string when attempts > simulateFails.",
      ],
      "Developing",
      `async function fetchWithRetry(simulateFails, maxRetries = 3) {\n  // Implement retry loop with try/catch\n}\n\nfetchWithRetry(2, 3).then((res) => console.log(res));\n`,
      [
        {
          id: "tc-js-async-1",
          label: "Recovers on 3rd attempt and prints SUCCESS",
          expectedStdout: "SUCCESS: 3 attempts",
          matchMode: "trimmed",
        },
        {
          id: "tc-js-async-hidden",
          label: "Success confirmation check",
          expectedStdout: "SUCCESS",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "What is the difference between Promise.all() and Promise.allSettled()?",
      "Promise.all() rejects immediately as soon as any promise rejects, whereas Promise.allSettled() waits for all promises to either fulfill or reject, returning an array of all outcomes.",
    ),
  },

  // Module 2: Fundamental Linear Data Structures
  {
    id: "js-arrays-buffers",
    order: 4,
    title: "ArrayBuffer, TypedArrays, and binary data",
    summary: "Manipulate raw bytes with ArrayBuffer, Uint8Array, and DataView for low-level protocol parsing.",
    type: "practical-exercise",
    objectiveIds: ["js-buffers-typedarrays"],
    prerequisiteLessonIds: ["js-promises-async-await"],
    estimatedDurationMinutes: 30,
    content: `When dealing with network packets, audio processing, or WebAssembly interop, standard JavaScript arrays of dynamic objects are too slow and memory-intensive. JavaScript provides **TypedArrays** and **ArrayBuffer** for raw binary data manipulation.

### Binary Memory Architecture
1. **ArrayBuffer**: A fixed-length, contiguous block of raw binary memory. It cannot be read or written directly.
2. **TypedArray Views**: Typed representations over an ArrayBuffer (\`Uint8Array\`, \`Int16Array\`, \`Float32Array\`).
3. **DataView**: A flexible view allowing arbitrary types to be read or written at any byte offset with explicit endianness control:

~~~javascript
const buffer = new ArrayBuffer(16); // 16 bytes
const view = new DataView(buffer);
view.setUint8(0, 0x42);
view.setFloat32(1, 3.14159, false); // Big-endian
~~~`,
    theorySections: [
      {
        id: "js-endianness",
        title: "Endianness and Network Byte Order",
        content: "DataView methods accept an optional littleEndian boolean parameter. Network protocols conventionally use big-endian (network byte order), while x86/ARM hardware is typically little-endian.",
      },
      {
        id: "js-buffer-perf",
        title: "Zero-Copy Performance",
        content: "TypedArrays avoid JavaScript object header overhead and boxing costs, enabling direct memory transfers between Web Workers and WebAssembly instances.",
      },
    ],
    codeExamples: [
      {
        title: "Unpacking Network Packet Header",
        language: "javascript",
        code: `const buf = new ArrayBuffer(4);\nconst dv = new DataView(buf);\ndv.setUint16(0, 0x1A2B, false);\ndv.setUint16(2, 8080, false);\nconsole.log("Magic:", "0x" + dv.getUint16(0).toString(16).toUpperCase());\nconsole.log("Port:", dv.getUint16(2));`,
        description: "Writing and reading typed fields with DataView byte offsets.",
      },
    ],
    resources: [
      {
        title: "MDN TypedArray Reference",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray",
        description: "Official guide to binary buffers and typed views.",
        type: "documentation",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Magic: 0x1A2B\nPort: 8080\n"),
    exercise: exercise(
      "ex-js-binary-telemetry",
      "Pack and unpack binary telemetry frame",
      "Allocate an ArrayBuffer of 8 bytes. Wrap it in a DataView. Write a uint16 sensor ID 4096 at byte offset 0, and a float32 temperature reading 23.5 at byte offset 2. Read back both fields and print `Sensor: ${sensorId}, Temp: ${temp.toFixed(1)} C`.",
      `const buffer = new ArrayBuffer(8);\nconst view = new DataView(buffer);\nview.setUint16(0, 4096, false);\nview.setFloat32(2, 23.5, false);\n\nconst sensorId = view.getUint16(0, false);\nconst temp = view.getFloat32(2, false);\nconsole.log(\`Sensor: \${sensorId}, Temp: \${temp.toFixed(1)} C\`);`,
      "js-buffers-typedarrays",
      "Write and read structured binary data with DataView and explicit byte offsets.",
      [
        "Create an ArrayBuffer(8).",
        "Use view.setUint16(0, 4096, false) and view.setFloat32(2, 23.5, false).",
        "Read back with matching getUint16 and getFloat32 calls.",
      ],
      "Developing",
      `// Allocate 8-byte ArrayBuffer, pack sensor ID 4096 and temp 23.5, read and print\n`,
      [
        {
          id: "tc-js-buf-1",
          label: "Packs and reads binary telemetry frame accurately",
          expectedStdout: "Sensor: 4096, Temp: 23.5 C",
          matchMode: "trimmed",
        },
        {
          id: "tc-js-buf-hidden",
          label: "Sensor ID check",
          expectedStdout: "Sensor: 4096",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why is DataView preferred over Float32Array when parsing binary network protocols?",
      "DataView allows reading multiple different data types at arbitrary non-aligned byte offsets with explicit endianness, whereas Float32Array views assume homogeneous elements and platform-native endianness.",
    ),
  },

  {
    id: "js-stacks-queues",
    order: 5,
    title: "Stacks, queues, and monotonic sequences",
    summary: "Implement LIFO stacks and FIFO queues to solve bracket matching, buffer pipelines, and sliding windows.",
    type: "guided-coding",
    objectiveIds: ["js-stacks-queues-obj"],
    prerequisiteLessonIds: ["js-arrays-buffers"],
    estimatedDurationMinutes: 30,
    content: `Stacks and queues are fundamental linear data structures with constrained access patterns:
- **Stack (LIFO - Last In, First Out)**: Elements are pushed and popped from the same end. Essential for call stacks, undo history, and syntax parsing.
- **Queue (FIFO - First In, First Out)**: Elements are enqueued at the back and dequeued from the front. Essential for task dispatchers, breadth-first search, and packet buffers.

~~~javascript
// Stack operations in JavaScript
const stack = [];
stack.push(10); // Push
const top = stack.pop(); // Pop -> 10
~~~`,
    theorySections: [
      {
        id: "js-stack-complexity",
        title: "Complexity and Array Amortization",
        content: "JavaScript Array push() and pop() run in amortized O(1) time. In contrast, shift() runs in O(N) because all remaining elements must be re-indexed in memory.",
      },
      {
        id: "js-bracket-invariant",
        title: "Matching Invariants",
        content: "Every closing bracket must match the most recently opened unclosed bracket, making stacks the optimal O(N) verification tool.",
      },
    ],
    codeExamples: [
      {
        title: "Evaluating Postfix Expression with Stack",
        language: "javascript",
        code: `function evalRPN(tokens) {\n  const stack = [];\n  for (const t of tokens) {\n    if (t === "+") stack.push(stack.pop() + stack.pop());\n    else if (t === "*") stack.push(stack.pop() * stack.pop());\n    else stack.push(Number(t));\n  }\n  return stack.pop();\n}\nconsole.log("RPN [3, 4, +, 2, *]:", evalRPN(["3", "4", "+", "2", "*"]));`,
        description: "Evaluating reverse Polish notation arithmetic using a stack.",
      },
    ],
    resources: [
      {
        title: "JavaScript Data Structures - Stacks and Queues",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures",
        description: "Overview of data structures in JavaScript.",
        type: "documentation",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("RPN [3, 4, +, 2, *]: 14\n"),
    exercise: exercise(
      "ex-js-valid-parens",
      "Validate balanced brackets with a stack",
      "Implement a function isValidBrackets(s) that uses a stack array to check if parentheses, brackets, and braces (), [], {} in string s are correctly nested and closed. Return true if balanced, false otherwise. Test with '{[()]}' and '{[(])}' and print the two results separated by a space.",
      `function isValidBrackets(s) {\n  const stack = [];\n  const map = { ")": "(", "]": "[", "}": "{" };\n  for (const ch of s) {\n    if (ch === "(" || ch === "[" || ch === "{") {\n      stack.push(ch);\n    } else if (ch in map) {\n      if (stack.pop() !== map[ch]) return false;\n    }\n  }\n  return stack.length === 0;\n}\n\nconsole.log(isValidBrackets("{[()]}") + " " + isValidBrackets("{[(])}"));`,
      "js-stacks-queues-obj",
      "Apply LIFO stack semantics to verify balanced grouping delimiters.",
      [
        "Push opening brackets '(', '[', '{' onto stack.",
        "When encountering a closing bracket, pop from stack and check matching opening bracket.",
        "Return true only if stack is empty after scanning string.",
      ],
      "Developing",
      `function isValidBrackets(s) {\n  // Implement bracket balance validator using stack\n}\n\nconsole.log(isValidBrackets("{[()]}") + " " + isValidBrackets("{[(])}"));\n`,
      [
        {
          id: "tc-js-stack-1",
          label: "Evaluates valid and invalid bracket strings correctly",
          expectedStdout: "true false",
          matchMode: "trimmed",
        },
        {
          id: "tc-js-stack-hidden",
          label: "Boolean sequence check",
          expectedStdout: "true false",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why is array.shift() slower than array.pop() for implementing queues in JavaScript?",
      "shift() removes the first element and requires moving all remaining N-1 elements forward by one index (O(N) time), whereas pop() simply removes the last element in O(1) time.",
    ),
  },

  // Module 3: Trees, Graphs, and Hierarchical Traversal
  {
    id: "js-bst-traversal",
    order: 6,
    title: "Binary search trees and in-order traversal",
    summary: "Construct binary search trees, enforce the BST ordering property, and traverse nodes in sorted order.",
    type: "guided-coding",
    objectiveIds: ["js-trees-bst"],
    prerequisiteLessonIds: ["js-stacks-queues"],
    estimatedDurationMinutes: 35,
    content: `Hierarchical datasets like filesystem directories, DOM elements, and indexed databases rely on tree structures.

A **Binary Search Tree (BST)** is a binary tree where each node satisfies the BST invariant:
- All values in the **left subtree** are strictly less than the node's value.
- All values in the **right subtree** are strictly greater than the node's value.

### Traversals
- **In-Order Traversal (Left, Root, Right)**: Traverses nodes in non-decreasing sorted order.
- **Pre-Order Traversal (Root, Left, Right)**: Useful for serialization and cloning.
- **Post-Order Traversal (Left, Right, Root)**: Useful for bottom-up cleanup and deletion.`,
    theorySections: [
      {
        id: "js-bst-invariants",
        title: "BST Lookup Complexity",
        content: "In a balanced BST, search, insertion, and deletion operate in O(log N) time. In degenerate unbalanced cases (a linked list), operations degrade to O(N).",
      },
      {
        id: "js-recursive-stack",
        title: "Call Stack Depth",
        content: "Recursive tree traversals consume stack frames proportional to tree height H. For deep trees, iterative traversals with an explicit stack array prevent call stack overflows.",
      },
    ],
    codeExamples: [
      {
        title: "BST Node and In-Order Traversal",
        language: "javascript",
        code: `class Node {\n  constructor(v) { this.v = v; this.left = null; this.right = null; }\n}\nfunction traverse(node, res = []) {\n  if (!node) return res;\n  traverse(node.left, res);\n  res.push(node.v);\n  traverse(node.right, res);\n  return res;\n}\nconst root = new Node(10);\nroot.left = new Node(5);\nroot.right = new Node(15);\nconsole.log("In-order:", traverse(root));`,
        description: "Recursive in-order BST traversal collecting node values.",
      },
    ],
    resources: [
      {
        title: "Binary Search Tree Visualization",
        url: "https://en.wikipedia.org/wiki/Binary_search_tree",
        description: "Theory and algorithmic invariants of BSTs.",
        type: "reference",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("In-order: [ 5, 10, 15 ]\n"),
    exercise: exercise(
      "ex-js-bst-inorder",
      "Construct a BST and perform in-order traversal",
      "Define a TreeNode class (value, left = null, right = null) and an insert(root, val) function that inserts a value into a Binary Search Tree. Then implement inOrder(node, acc = []) that returns an array of values in ascending sorted order. Insert values [50, 30, 70, 20, 40] into a tree and print the in-order array joined by ', '.",
      `class TreeNode {\n  constructor(val, left = null, right = null) {\n    this.val = val;\n    this.left = left;\n    this.right = right;\n  }\n}\n\nfunction insert(root, val) {\n  if (!root) return new TreeNode(val);\n  if (val < root.val) root.left = insert(root.left, val);\n  else root.right = insert(root.right, val);\n  return root;\n}\n\nfunction inOrder(root, acc = []) {\n  if (!root) return acc;\n  inOrder(root.left, acc);\n  acc.push(root.val);\n  inOrder(root.right, acc);\n  return acc;\n}\n\nlet root = null;\nfor (const v of [50, 30, 70, 20, 40]) {\n  root = insert(root, v);\n}\nconsole.log(inOrder(root).join(", "));`,
      "js-trees-bst",
      "Build a BST with recursive insertion and verify sorted in-order traversal.",
      [
        "In insert(root, val), recurse left if val < root.val, else recurse right.",
        "In inOrder(root, acc), traverse root.left, push root.val, then traverse root.right.",
        "Join result with ', ' and log to console.",
      ],
      "Developing",
      `class TreeNode {\n  // Implement TreeNode, insert, and inOrder\n}\n\nlet root = null;\nfor (const v of [50, 30, 70, 20, 40]) {\n  root = insert(root, v);\n}\n// Print in-order traversal\n`,
      [
        {
          id: "tc-js-bst-1",
          label: "Produces sorted in-order traversal [20, 30, 40, 50, 70]",
          expectedStdout: "20, 30, 40, 50, 70",
          matchMode: "trimmed",
        },
        {
          id: "tc-js-bst-hidden",
          label: "Sorted numbers check",
          expectedStdout: "20, 30, 40, 50, 70",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why does an in-order traversal of a binary search tree always produce keys in sorted order?",
      "By definition, all keys in the left subtree are smaller than the node, and all keys in the right subtree are larger; traversing left -> root -> right processes elements in strictly increasing order.",
    ),
  },

  {
    id: "js-graph-bfs-dfs",
    order: 7,
    title: "Graph traversal and Breadth-First Search (BFS)",
    summary: "Model graphs with adjacency lists and compute unweighted shortest paths using Breadth-First Search.",
    type: "practical-exercise",
    objectiveIds: ["js-graphs-search"],
    prerequisiteLessonIds: ["js-bst-traversal"],
    estimatedDurationMinutes: 35,
    content: `Graphs represent networks of interconnected nodes: communication meshes, dependency resolution graphs, and circuit topologies.

### Representing Graphs
The standard representation in JavaScript is an **adjacency list**, mapping node identifiers to arrays of neighbors:
~~~javascript
const graph = {
  A: ["B", "C"],
  B: ["D"],
  C: ["D"],
  D: []
};
~~~

### Breadth-First Search (BFS)
BFS explores vertices level by level using a **FIFO queue** and a **visited set** to avoid infinite cycles. In unweighted graphs, BFS is guaranteed to find the **shortest path** (minimum number of hops) from start to destination:
1. Enqueue \`[startNode, 0]\` and add \`startNode\` to visited.
2. Dequeue the current vertex. If it is the target, return the distance.
3. For each unvisited neighbor, mark as visited and enqueue with \`distance + 1\`.`,
    theorySections: [
      {
        id: "js-bfs-shortest-path",
        title: "Shortest Path Optimality",
        content: "Because BFS visits nodes in order of increasing distance from the source, the first time target is dequeued represents its minimum edge-distance.",
      },
      {
        id: "js-cycle-prevention",
        title: "Cycle Prevention with Sets",
        content: "Adding nodes to the visited Set immediately upon enqueueing prevents duplicate exploration and infinite loops in cyclic graphs.",
      },
    ],
    codeExamples: [
      {
        title: "BFS Graph Reachability",
        language: "javascript",
        code: `function canReach(adj, start, target) {\n  const q = [start];\n  const visited = new Set([start]);\n  while (q.length) {\n    const curr = q.shift();\n    if (curr === target) return true;\n    for (const n of adj[curr] || []) {\n      if (!visited.has(n)) { visited.add(n); q.push(n); }\n    }\n  }\n  return false;\n}\nconsole.log("Reach X->Z:", canReach({ X: ["Y"], Y: ["Z"] }, "X", "Z"));`,
        description: "Checking reachability between vertices with a BFS queue.",
      },
    ],
    resources: [
      {
        title: "Graph Algorithms Guide",
        url: "https://en.wikipedia.org/wiki/Breadth-first_search",
        description: "Theory, pseudocode, and complexity analysis for BFS.",
        type: "reference",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Reach X->Z: true\n"),
    exercise: exercise(
      "ex-js-graph-shortest-path",
      "Compute shortest path distance with BFS",
      "Implement shortestPathBFS(graph, start, target) using Breadth-First Search with a queue. The graph is an adjacency list object { A: ['B', 'C'], ... }. Return the shortest distance (number of edges) between start and target, or -1 if unreachable. For graph = { A: ['B', 'C'], B: ['D'], C: ['E'], D: ['F'], E: ['F'], F: [] }, find the distance from 'A' to 'F' and print `Distance: ${dist}`.",
      `function shortestPathBFS(graph, start, target) {\n  const queue = [[start, 0]];\n  const visited = new Set([start]);\n  while (queue.length > 0) {\n    const [node, dist] = queue.shift();\n    if (node === target) return dist;\n    for (const neighbor of graph[node] || []) {\n      if (!visited.has(neighbor)) {\n        visited.add(neighbor);\n        queue.push([neighbor, dist + 1]);\n      }\n    }\n  }\n  return -1;\n}\n\nconst graph = { A: ["B", "C"], B: ["D"], C: ["E"], D: ["F"], E: ["F"], F: [] };\nconst dist = shortestPathBFS(graph, "A", "F");\nconsole.log(\`Distance: \${dist}\`);`,
      "js-graphs-search",
      "Traverse adjacency lists with BFS to determine minimum path hops.",
      [
        "Initialize queue with [[start, 0]] and visited set with start.",
        "When node === target, return dist immediately.",
        "Loop through graph[node] and enqueue unvisited neighbors with dist + 1.",
      ],
      "Developing",
      `function shortestPathBFS(graph, start, target) {\n  // Implement BFS shortest path\n}\n\nconst graph = { A: ["B", "C"], B: ["D"], C: ["E"], D: ["F"], E: ["F"], F: [] };\n// Compute and print distance from A to F\n`,
      [
        {
          id: "tc-js-bfs-1",
          label: "Finds shortest path distance of 3 from A to F",
          expectedStdout: "Distance: 3",
          matchMode: "trimmed",
        },
        {
          id: "tc-js-bfs-hidden",
          label: "Distance value check",
          expectedStdout: "Distance: 3",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why is Breadth-First Search guaranteed to find the shortest path in an unweighted graph, while Depth-First Search is not?",
      "BFS systematically explores all vertices at distance k before exploring vertices at distance k + 1, ensuring that the first time a destination is reached, it is via the minimum number of edges.",
    ),
  },

  {
    id: "js-heaps-priority-queues",
    order: 8,
    title: "Binary heaps and priority queues",
    summary: "Implement a binary min-heap with bubble-up and sink-down for efficient O(log N) priority scheduling.",
    type: "guided-coding",
    objectiveIds: ["js-heaps-pq"],
    prerequisiteLessonIds: ["js-graph-bfs-dfs"],
    estimatedDurationMinutes: 35,
    content: `When scheduling real-time tasks or selecting the next highest priority packet, an unsorted array takes O(N) to find the minimum, while a sorted array takes O(N) to insert. A **binary heap** provides an optimal balance: $O(\\log N)$ insertion and $O(\\log N)$ extraction.

A **Min-Heap** is a complete binary tree stored compactly in a 1D array where every parent node is smaller than or equal to its children:
- Element at index $i$:
  - Left child at index $2i + 1$
  - Right child at index $2i + 2$
  - Parent at index $\\lfloor (i - 1) / 2 \\rfloor$
- **Root ($index 0$)** always stores the global minimum element.`,
    theorySections: [
      {
        id: "js-heap-array-repr",
        title: "Array Representation of Complete Trees",
        content: "Because binary heaps are complete trees (all levels filled except possibly the last), they can be stored in contiguous arrays without node pointer overhead.",
      },
      {
        id: "js-bubble-sink",
        title: "Bubble-Up and Sink-Down",
        content: "Insertion appends to the array and bubbles up. Removal replaces the root with the last element and sinks down, maintaining the heap invariant in O(log N) steps.",
      },
    ],
    codeExamples: [
      {
        title: "Min-Heap Insertion and Extraction",
        language: "javascript",
        code: `class SimpleMinHeap {\n  constructor() { this.h = []; }\n  push(v) { this.h.push(v); this.h.sort((a,b) => a - b); }\n  pop() { return this.h.shift(); }\n}\nconst h = new SimpleMinHeap();\nh.push(10); h.push(4); h.push(15);\nconsole.log("Popped min:", h.pop());`,
        description: "Conceptual min-priority queue behavior.",
      },
    ],
    resources: [
      {
        title: "Binary Heap Data Structure",
        url: "https://en.wikipedia.org/wiki/Binary_heap",
        description: "Detailed analysis of binary heaps and heap sort.",
        type: "reference",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Popped min: 4\n"),
    exercise: exercise(
      "ex-js-min-heap",
      "Implement an array-based binary min-heap",
      "Implement a simple MinHeap with push(val) and pop() methods that maintains the minimum element at index 0. Push [18, 5, 27, 2, 9], then pop three times and print the 3 popped minimum values separated by spaces.",
      `class MinHeap {\n  constructor() {\n    this.data = [];\n  }\n  push(val) {\n    this.data.push(val);\n    this._bubbleUp(this.data.length - 1);\n  }\n  pop() {\n    if (this.data.length === 0) return null;\n    const top = this.data[0];\n    const bottom = this.data.pop();\n    if (this.data.length > 0) {\n      this.data[0] = bottom;\n      this._sinkDown(0);\n    }\n    return top;\n  }\n  _bubbleUp(idx) {\n    while (idx > 0) {\n      const parentIdx = Math.floor((idx - 1) / 2);\n      if (this.data[idx] >= this.data[parentIdx]) break;\n      [this.data[idx], this.data[parentIdx]] = [this.data[parentIdx], this.data[idx]];\n      idx = parentIdx;\n    }\n  }\n  _sinkDown(idx) {\n    const length = this.data.length;\n    while (true) {\n      let smallest = idx;\n      const left = 2 * idx + 1;\n      const right = 2 * idx + 2;\n      if (left < length && this.data[left] < this.data[smallest]) smallest = left;\n      if (right < length && this.data[right] < this.data[smallest]) smallest = right;\n      if (smallest === idx) break;\n      [this.data[idx], this.data[smallest]] = [this.data[smallest], this.data[idx]];\n      idx = smallest;\n    }\n  }\n}\n\nconst heap = new MinHeap();\nfor (const v of [18, 5, 27, 2, 9]) heap.push(v);\nconst res = [heap.pop(), heap.pop(), heap.pop()];\nconsole.log(res.join(" "));`,
      "js-heaps-pq",
      "Maintain binary min-heap invariants using bubble-up and sink-down.",
      [
        "In push(val), append to data and bubble up comparing to Math.floor((idx - 1) / 2).",
        "In pop(), swap root with last item and sink down comparing with left and right children.",
        "Extract 3 items and print them joined with space.",
      ],
      "Developing",
      `class MinHeap {\n  // Implement binary min-heap with push, pop, _bubbleUp, and _sinkDown\n}\n\nconst heap = new MinHeap();\nfor (const v of [18, 5, 27, 2, 9]) heap.push(v);\n// Pop 3 times and print\n`,
      [
        {
          id: "tc-js-heap-1",
          label: "Pops elements in ascending priority order 2 5 9",
          expectedStdout: "2 5 9",
          matchMode: "trimmed",
        },
        {
          id: "tc-js-heap-hidden",
          label: "Heap extracted values check",
          expectedStdout: "2 5 9",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "What is the mathematical relationship between the index i of a node in an array-backed heap and its parent index?",
      "The parent index is given by Math.floor((i - 1) / 2).",
    ),
  },

  // Module 4: Dynamic Programming & Algorithmic Optimization
  {
    id: "js-memoization-tabulation",
    order: 9,
    title: "Dynamic programming: memoization and tabulation",
    summary: "Break complex recursive problems into overlapping subproblems using top-down memoization and bottom-up tabulation.",
    type: "practical-exercise",
    objectiveIds: ["js-dp-memo"],
    prerequisiteLessonIds: ["js-heaps-priority-queues"],
    estimatedDurationMinutes: 40,
    content: `When a recursive algorithm recalculates the exact same subproblems exponentially many times (such as naive Fibonacci or the 0/1 Knapsack problem), **Dynamic Programming (DP)** reduces the time complexity from exponential $O(2^N)$ to polynomial $O(N)$ or $O(N \\times W)$.

### The Two DP Approaches
1. **Top-Down with Memoization**: Maintain the natural recursive structure, but store computed results in a cache (Map or array). If the state was already solved, return the cached value immediately.
2. **Bottom-Up with Tabulation**: Solve smaller subproblems iteratively in an array or table, building upwards toward the desired target state. This eliminates call stack overhead.`,
    theorySections: [
      {
        id: "js-optimal-substructure",
        title: "Optimal Substructure and Overlapping Subproblems",
        content: "A problem is solvable by DP if an optimal solution can be constructed from optimal solutions of its subproblems, and those subproblems repeat throughout execution.",
      },
      {
        id: "js-tabulation-memory",
        title: "Space Optimization in Tabulation",
        content: "When state transitions depend only on the previous row or few entries (like Fibonacci), memory can be reduced from O(N) to O(1) by keeping only the necessary previous states.",
      },
    ],
    codeExamples: [
      {
        title: "Memoized Fibonacci Calculation",
        language: "javascript",
        code: `function fib(n, memo = new Map()) {\n  if (n <= 1) return n;\n  if (memo.has(n)) return memo.get(n);\n  const res = fib(n - 1, memo) + fib(n - 2, memo);\n  memo.set(n, res);\n  return res;\n}\nconsole.log("Fib(10):", fib(10));`,
        description: "Eliminating exponential recalculation with Map memoization.",
      },
    ],
    resources: [
      {
        title: "Dynamic Programming Guide",
        url: "https://en.wikipedia.org/wiki/Dynamic_programming",
        description: "Mathematical formulation of Bellman equations and DP strategies.",
        type: "reference",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Fib(10): 55\n"),
    exercise: exercise(
      "ex-js-coin-change-dp",
      "Solve the Coin Change problem via DP tabulation",
      "Implement minCoins(coins, amount) using dynamic programming tabulation. Return the minimum number of coins needed to make up amount, or -1 if impossible. For coins = [1, 5, 10, 25] and amount = 36, compute and print `Min coins: ${minCoins(coins, amount)}`.",
      `function minCoins(coins, amount) {\n  const dp = new Array(amount + 1).fill(Infinity);\n  dp[0] = 0;\n  for (let i = 1; i <= amount; i++) {\n    for (const coin of coins) {\n      if (i - coin >= 0) {\n        dp[i] = Math.min(dp[i], dp[i - coin] + 1);\n      }\n    }\n  }\n  return dp[amount] === Infinity ? -1 : dp[amount];\n}\n\nconst coins = [1, 5, 10, 25];\nconsole.log(\`Min coins: \${minCoins(coins, 36)}\`);`,
      "js-dp-memo",
      "Apply bottom-up DP tabulation to find minimal combinations.",
      [
        "Create an array dp of size amount + 1 filled with Infinity, setting dp[0] = 0.",
        "Loop i from 1 to amount, and check each coin.",
        "If i - coin >= 0, update dp[i] = Math.min(dp[i], dp[i - coin] + 1).",
      ],
      "Developing",
      `function minCoins(coins, amount) {\n  // Implement bottom-up DP tabulation\n}\n\nconst coins = [1, 5, 10, 25];\nconsole.log(\`Min coins: \${minCoins(coins, 36)}\`);\n`,
      [
        {
          id: "tc-js-dp-1",
          label: "Computes 4 coins for amount 36 (25 + 10 + 1)",
          expectedStdout: "Min coins: 4",
          matchMode: "trimmed",
        },
        {
          id: "tc-js-dp-hidden",
          label: "Result count check",
          expectedStdout: "Min coins: 4",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "What is the main advantage of bottom-up tabulation over top-down memoization?",
      "Tabulation avoids the call stack overhead and potential stack overflow issues of recursion, and often allows space complexity optimizations.",
    ),
  },

  {
    id: "js-event-engine-capstone",
    order: 10,
    title: "Capstone: Event-driven telemetry processing engine",
    summary: "Architect a complete event emitter with subscription management, multi-channel dispatching, and state aggregation.",
    type: "assessment",
    objectiveIds: ["js-capstone-systems"],
    prerequisiteLessonIds: ["js-memoization-tabulation"],
    estimatedDurationMinutes: 45,
    content: `In modern engineering systems, modules must remain decoupled while reacting to streaming sensor packets, user inputs, and asynchronous network events. The **Publish-Subscribe (Pub/Sub) / Event Emitter** pattern is the cornerstone of Node.js and browser architectures.

### Architecture of the Event Engine
1. **Channel Registry**: Map event names to sets or arrays of registered listener functions.
2. **Subscription Management**: \`on(event, listener)\` registers a callback, and \`off(event, listener)\` cleanly unregisters it to prevent memory leaks.
3. **Dispatching**: \`emit(event, ...args)\` sequentially invokes all subscribed listeners with the supplied arguments.
4. **State Aggregation**: Observers listen on telemetry topics to compute running statistics and thresholds without coupling to data producers.`,
    theorySections: [
      {
        id: "js-listener-leaks",
        title: "Preventing Memory Leaks in Event Systems",
        content: "Failing to remove listeners when components unmount causes dangling references, preventing closures from being garbage collected. Always provide symmetrical on/off methods.",
      },
      {
        id: "js-sync-dispatch",
        title: "Synchronous vs Asynchronous Dispatch",
        content: "Standard Node EventEmitter dispatches listeners synchronously in registration order. This guarantees sequential consistency before moving to subsequent statements.",
      },
    ],
    codeExamples: [
      {
        title: "Custom Event Emitter Pattern",
        language: "javascript",
        code: `class SimpleEmitter {\n  constructor() { this.subs = {}; }\n  on(event, fn) {\n    (this.subs[event] = this.subs[event] || []).push(fn);\n  }\n  emit(event, payload) {\n    (this.subs[event] || []).forEach(fn => fn(payload));\n  }\n}\nconst e = new SimpleEmitter();\ne.on("ping", (val) => console.log("Received:", val));\ne.emit("ping", "PONG");`,
        description: "Minimal Pub/Sub event emitter implementation.",
      },
    ],
    resources: [
      {
        title: "Node.js EventEmitter Documentation",
        url: "https://nodejs.org/api/events.html",
        description: "Reference architecture for production event-driven engines.",
        type: "documentation",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Received: PONG\n"),
    exercise: exercise(
      "ex-js-event-dispatcher",
      "Implement a multi-channel EventEmitter and state aggregator",
      "Build an EventEmitter class with on(event, listener), emit(event, ...args), and off(event, listener). Subscribe two handlers to 'telemetry': one that tallies total packets and one that sums total payload values. Dispatch 3 events and print the final stats: `Packets: ${count}, Sum: ${sum}`.",
      `class EventEmitter {\n  constructor() {\n    this.events = {};\n  }\n  on(event, listener) {\n    if (!this.events[event]) this.events[event] = [];\n    this.events[event].push(listener);\n  }\n  off(event, listener) {\n    if (!this.events[event]) return;\n    this.events[event] = this.events[event].filter((l) => l !== listener);\n  }\n  emit(event, ...args) {\n    if (!this.events[event]) return;\n    for (const listener of this.events[event]) {\n      listener(...args);\n    }\n  }\n}\n\nconst emitter = new EventEmitter();\nlet count = 0;\nlet sum = 0;\n\nemitter.on("telemetry", (payload) => {\n  count++;\n  sum += payload;\n});\n\nemitter.emit("telemetry", 10);\nemitter.emit("telemetry", 25);\nemitter.emit("telemetry", 15);\n\nconsole.log(\`Packets: \${count}, Sum: \${sum}\`);`,
      "js-capstone-systems",
      "Synthesize classes, closures, and event dispatching into an extensible system.",
      [
        "Create an events dictionary mapping event names to arrays of callbacks.",
        "Implement on, off, and emit with rest parameters (...args).",
        "Subscribe accumulator callbacks and emit 3 telemetry values.",
      ],
      "Developing",
      `class EventEmitter {\n  // Implement on, off, and emit\n}\n\nconst emitter = new EventEmitter();\nlet count = 0;\nlet sum = 0;\n// Subscribe handlers, emit telemetry events, and print stats\n`,
      [
        {
          id: "tc-js-cap-1",
          label: "Aggregates 3 telemetry packets to Packets: 3, Sum: 50",
          expectedStdout: "Packets: 3, Sum: 50",
          matchMode: "trimmed",
        },
        {
          id: "tc-js-cap-hidden",
          label: "Stats verification check",
          expectedStdout: "Packets: 3, Sum: 50",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why must event listeners be explicitly removed in long-lived applications?",
      "If listeners are not removed, references to the callback functions (and any outer scope closures they capture) remain pinned in memory, causing insidious memory leaks.",
    ),
  },

  {
    id: "js-microtasks-macrotasks",
    order: 11,
    title: "Event Loop: Microtasks and Macrotasks",
    summary: "Deep-dive into event loop tick priorities: Promise microtasks and queueMicrotask vs timer macrotasks.",
    type: "guided-coding",
    objectiveIds: ["js-microtask-queue"],
    prerequisiteLessonIds: ["js-event-engine-capstone"],
    estimatedDurationMinutes: 35,
    content: `The JavaScript runtime is single-threaded, concurrency is managed by an **event loop** that coordinates two priority queues:
1. **Microtask Queue**: Promises (\`.then()\`, \`.catch()\`, \`.finally()\`), \`queueMicrotask()\`, and MutationObserver callbacks.
2. **Macrotask (Task) Queue**: \`setTimeout()\`, \`setInterval()\`, I/O, UI rendering, and \`MessageChannel\` callbacks.

### Execution Priority
On each tick of the event loop:
1. Execute one macrotask from the task queue.
2. **Drain the entire microtask queue completely** before rendering or selecting the next macrotask.
3. Microtasks queued by currently executing microtasks are run in the same cycle!`,
    theorySections: [
      {
        id: "js-microtask-starvation",
        title: "Microtask Starvation Hazard",
        content: "If a microtask recursively enqueues another microtask, the microtask queue will never empty, starving macrotasks, user inputs, and screen repaints completely.",
      },
    ],
    codeExamples: [
      {
        title: "Tracing Microtask and Macrotask Order",
        language: "javascript",
        code: `console.log("1: Synchronous");
setTimeout(() => console.log("4: Macrotask timer"), 0);
Promise.resolve().then(() => console.log("2: Microtask promise"));
queueMicrotask(() => console.log("3: queueMicrotask"));`,
        description: "Predicting asynchronous execution sequences.",
      },
    ],
    resources: [
      {
        title: "JavaScript Event Loop Explained",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop",
        description: "MDN guide to event loop phases and queue dispatching.",
        type: "documentation",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("1: Synchronous\n2: Microtask promise\n3: queueMicrotask\n4: Macrotask timer\n"),
    exercise: exercise(
      "ex-js-task-ordering",
      "Trace execution order across microtasks and macrotasks",
      "Write a function scheduleJobs() that appends execution labels into an array 'order'. It must: 1) Push 'sync-start'. 2) Schedule a setTimeout with 0ms delay pushing 'macrotask'. 3) Schedule a Promise.resolve().then pushing 'microtask-1'. 4) Schedule queueMicrotask pushing 'microtask-2'. 5) Push 'sync-end'. Run scheduleJobs() and inside the setTimeout print the final sequence joined by '->'.",
      `function scheduleJobs() {\n  const order = [];\n  order.push("sync-start");\n  setTimeout(() => {\n    order.push("macrotask");\n    console.log(order.join("->"));\n  }, 0);\n  Promise.resolve().then(() => order.push("microtask-1"));\n  queueMicrotask(() => order.push("microtask-2"));\n  order.push("sync-end");\n}\nscheduleJobs();`,
      "js-microtask-queue",
      "Demonstrate microtask queue precedence over timer macrotasks.",
      [
        "Synchronous statements run first (sync-start, sync-end).",
        "Microtasks run next (microtask-1, microtask-2).",
        "The macrotask timer runs last.",
      ],
      "Developing",
      `function scheduleJobs() {\n  // Implement job scheduling and print order in setTimeout\n}\nscheduleJobs();\n`,
      [
        {
          id: "tc-jobs-1",
          label: "Prints correct execution priority sequence",
          expectedStdout: "sync-start->sync-end->microtask-1->microtask-2->macrotask",
          matchMode: "trimmed",
        },
        {
          id: "tc-jobs-hidden",
          label: "Sequence check",
          expectedStdout: "sync-start->sync-end->microtask-1->microtask-2->macrotask",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "When are microtask callbacks executed relative to macrotask timer callbacks?",
      "All pending microtasks are drained immediately after the current synchronous script finishes and before any pending macrotask timer callback runs.",
    ),
  },

  {
    id: "js-web-workers-messaging",
    order: 12,
    title: "Web Workers and Threaded Message Passing",
    summary: "Offload compute-intensive tasks to background threads using the Web Worker API and postMessage.",
    type: "practical-exercise",
    objectiveIds: ["js-web-workers"],
    prerequisiteLessonIds: ["js-microtasks-macrotasks"],
    estimatedDurationMinutes: 35,
    content: `Web Workers enable true multi-core parallel processing in JavaScript runtimes by spawning background OS threads that run isolated from the main UI thread.

### Thread Isolation and postMessage
Workers do not share heap memory directly with the main thread. Instead, data is transmitted across thread boundaries using message passing:
~~~javascript
// Main thread dispatch
worker.postMessage({ type: "COMPUTE", data: [1, 2, 3] });

// Worker thread listener
self.onmessage = (e) => {
  const result = e.data.data.reduce((a, b) => a + b, 0);
  self.postMessage({ type: "RESULT", result });
};
~~~
Messages are serialized using the **Structured Clone Algorithm**, copying primitive values, arrays, and objects safely.`,
    theorySections: [
      {
        id: "js-worker-transferables",
        title: "Zero-Copy Transferable Objects",
        content: "To avoid copying megabytes of binary data, ArrayBuffers can be transferred using postMessage(buf, [buf]). The sender immediately relinquishes memory ownership in O(1) time.",
      },
    ],
    codeExamples: [
      {
        title: "Simulating Worker Message Handler",
        language: "javascript",
        code: `class MockWorker {
  constructor(handler) { this.handler = handler; }
  postMessage(msg) {
    setTimeout(() => this.handler(msg), 0);
  }
}
const w = new MockWorker((msg) => console.log("Handled payload:", msg.id));
w.postMessage({ id: 101 });`,
        description: "Simulating asynchronous worker message dispatch.",
      },
    ],
    resources: [
      {
        title: "Web Workers API",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API",
        description: "Official documentation on dedicated workers and message passing.",
        type: "documentation",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Handled payload: 101\n"),
    exercise: exercise(
      "ex-js-worker-dispatcher",
      "Model a background task dispatcher",
      "Implement a TaskDispatcher class that accepts jobs via dispatch(taskName, payload) and returns a Promise resolving with the result. If taskName is 'sum', sum the array in payload; if 'square', return payload * payload. Test with await dispatch('sum', [5, 10, 15]) and await dispatch('square', 8). Print: `Sum: ${sumRes}, Square: ${sqRes}`.",
      `class TaskDispatcher {\n  async dispatch(taskName, payload) {\n    return new Promise((resolve) => {\n      setTimeout(() => {\n        if (taskName === "sum") resolve(payload.reduce((a, b) => a + b, 0));\n        else if (taskName === "square") resolve(payload * payload);\n      }, 0);\n    });\n  }\n}\n\nasync function run() {\n  const td = new TaskDispatcher();\n  const sumRes = await td.dispatch("sum", [5, 10, 15]);\n  const sqRes = await td.dispatch("square", 8);\n  console.log(\`Sum: \${sumRes}, Square: \${sqRes}\`);\n}\nrun();`,
      "js-web-workers",
      "Simulate asynchronous background task scheduling with Promises.",
      [
        "Return a Promise inside dispatch.",
        "Handle 'sum' by summing the array.",
        "Handle 'square' by squaring the numeric payload.",
      ],
      "Developing",
      `class TaskDispatcher {\n  // Implement async dispatch(taskName, payload)\n}\n\n// Run tasks and print Sum: 30, Square: 64\n`,
      [
        {
          id: "tc-worker-1",
          label: "Dispatches tasks and resolves computed results",
          expectedStdout: "Sum: 30, Square: 64",
          matchMode: "trimmed",
        },
        {
          id: "tc-worker-hidden",
          label: "Result verification",
          expectedStdout: "Sum: 30, Square: 64",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Can a dedicated Web Worker directly manipulate the browser DOM (document or window)?",
      "No. Web Workers execute in a separate global context (WorkerGlobalScope) without direct access to the DOM or window object.",
    ),
  },

  {
    id: "js-streams-pipeline",
    order: 13,
    title: "Streaming Data Pipelines and Transformations",
    summary: "Process streaming telemetry without loading entire datasets into memory using asynchronous iterators and generator transforms.",
    type: "guided-coding",
    objectiveIds: ["js-streams-transform"],
    prerequisiteLessonIds: ["js-web-workers-messaging"],
    estimatedDurationMinutes: 35,
    content: `When handling high-throughput sensor telemetry or multi-megabyte log downloads, storing the entire dataset in an in-memory array causes latency spikes and potential out-of-memory errors.

### Streaming with Async Generators
Async generators (\`async function*\`) produce items on-demand using \`yield\` and \`await\`:
~~~javascript
async function* sensorStream(limit) {
  for (let i = 1; i <= limit; i++) {
    yield { id: i, value: i * 2.5 };
  }
}

for await (const packet of sensorStream(3)) {
  console.log(packet.value);
}
~~~

### Composing Transform Pipelines
Streaming pipelines pipe data from a source through filter and transform stages into a consumer sink with minimal intermediate buffering.`,
    theorySections: [
      {
        id: "js-backpressure-flow",
        title: "Backpressure in Streaming Systems",
        content: "Backpressure prevents a fast data producer from overwhelming a slower data consumer by signaling the producer to pause until the consumer has processed current chunks.",
      },
    ],
    codeExamples: [
      {
        title: "Streaming Transform Pipeline",
        language: "javascript",
        code: `async function* filterAbove(stream, threshold) {
  for await (const chunk of stream) {
    if (chunk.val > threshold) yield chunk;
  }
}
async function* source() {
  yield { val: 10 }; yield { val: 25 }; yield { val: 15 };
}
(async () => {
  for await (const item of filterAbove(source(), 20)) {
    console.log("Passed:", item.val);
  }
})();`,
        description: "Filtering asynchronous stream chunks.",
      },
    ],
    resources: [
      {
        title: "Streams API Concepts",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Concepts",
        description: "ReadableStream, WritableStream, and TransformStream fundamentals.",
        type: "documentation",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Passed: 25\n"),
    exercise: exercise(
      "ex-js-stream-pipeline",
      "Build a streaming telemetry aggregator pipeline",
      "Write two async generators: 1) generateTelemetry(readings: number[]) yielding each reading. 2) calibrateStream(stream, offset: number) yielding reading + offset. Consume calibrateStream(generateTelemetry([10.5, 20.0, 15.5]), 1.5) with 'for await', sum all values, and print 'Total: ' followed by total.toFixed(1).",
      `async function* generateTelemetry(readings) {\n  for (const r of readings) yield r;\n}\n\nasync function* calibrateStream(stream, offset) {\n  for await (const val of stream) yield val + offset;\n}\n\nasync function run() {\n  let total = 0;\n  for await (const val of calibrateStream(generateTelemetry([10.5, 20.0, 15.5]), 1.5)) {\n    total += val;\n  }\n  console.log(\`Total: \${total.toFixed(1)}\`);\n}\nrun();`,
      "js-streams-transform",
      "Compose async generator pipelines for on-demand stream processing.",
      [
        "Implement generateTelemetry yielding each item.",
        "Implement calibrateStream yielding val + offset for each chunk.",
        "Sum the calibrated values to reach Total: 50.5.",
      ],
      "Developing",
      `async function* generateTelemetry(readings) {\n  // Implement generator\n}\nasync function* calibrateStream(stream, offset) {\n  // Implement calibration transform\n}\n// Run pipeline and print Total: 50.5\n`,
      [
        {
          id: "tc-stream-1",
          label: "Streams and transforms chunks correctly",
          expectedStdout: "Total: 50.5",
          matchMode: "trimmed",
        },
        {
          id: "tc-stream-hidden",
          label: "Verify total value",
          expectedStdout: "Total: 50.5",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why do asynchronous streaming pipelines consume significantly less RAM than batch arrays?",
      "Streaming processes elements one chunk at a time on-demand, maintaining O(1) auxiliary memory regardless of total stream duration.",
    ),
  },

  {
    id: "js-typedarrays-binary-protocol",
    order: 14,
    title: "High-Performance Binary Protocol Serialization",
    summary: "Pack sensor IDs, flags, and floating-point measurements into binary framing packets using Uint8Array and DataView.",
    type: "assessment",
    objectiveIds: ["js-binary-protocol"],
    prerequisiteLessonIds: ["js-streams-pipeline"],
    estimatedDurationMinutes: 40,
    content: `### Binary Protocol Framing
In embedded IoT networks and robotics, telemetry packets are encoded in dense binary formats rather than JSON to minimize bandwidth and CPU serialization overhead.

### Packet Framing Layout
A typical 8-byte telemetry packet layout:
- **Bytes 0–1 (Uint16)**: Magic header \`0xABCD\`
- **Byte 2 (Uint8)**: Node ID (0–255)
- **Byte 3 (Uint8)**: Status bitflags
- **Bytes 4–7 (Float32)**: Floating-point sensor reading (e.g. Temperature in Celsius)

Using \`DataView\`, you can write and read big-endian or little-endian binary representations with exact byte-level control.`,
    theorySections: [
      {
        id: "js-endianness-control",
        title: "Endianness in Network Protocols",
        content: "Network standard protocols (like TCP/IP) use Big-Endian (most significant byte first). DataView allows specifying the littleEndian boolean flag explicitly for portable cross-platform binary exchange.",
      },
    ],
    codeExamples: [
      {
        title: "Binary Telemetry Frame Packing",
        language: "javascript",
        code: `const buffer = new ArrayBuffer(8);
const view = new DataView(buffer);
view.setUint16(0, 0xABCD, false); // Big endian magic
view.setUint8(2, 42);             // Node 42
view.setUint8(3, 0x01);           // Flag: OK
view.setFloat32(4, 26.5, false);  // Temp 26.5 C
console.log("Magic:", view.getUint16(0, false).toString(16));`,
        description: "Serializing structured fields into a contiguous 8-byte buffer.",
      },
    ],
    resources: [
      {
        title: "TypedArray and DataView Guide",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView",
        description: "Low-level binary memory manipulation in JavaScript.",
        type: "documentation",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Magic: abcd\n"),
    exercise: exercise(
      "ex-js-pack-unpack-binary",
      "Pack and unpack a binary telemetry packet",
      "Implement two functions: 1) packTelemetry(nodeId: number, temp: number): returns an 8-byte ArrayBuffer with Uint16 magic 0xAA55 at offset 0, Uint8 nodeId at offset 2, Uint8 status 0x01 at offset 3, and Float32 temp at offset 4 (all big-endian). 2) unpackTelemetry(buffer): reads and returns { nodeId, temp: Math.round(temp * 10) / 10 }. In main, pack nodeId 7 and temp 32.4, unpack it, and print `Packet: Node \${unpacked.nodeId}, Temp \${unpacked.temp}C`.",
      `function packTelemetry(nodeId, temp) {\n  const buf = new ArrayBuffer(8);\n  const view = new DataView(buf);\n  view.setUint16(0, 0xAA55, false);\n  view.setUint8(2, nodeId);\n  view.setUint8(3, 0x01);\n  view.setFloat32(4, temp, false);\n  return buf;\n}\n\nfunction unpackTelemetry(buf) {\n  const view = new DataView(buf);\n  const nodeId = view.getUint8(2);\n  const temp = Math.round(view.getFloat32(4, false) * 10) / 10;\n  return { nodeId, temp };\n}\n\nconst packet = packTelemetry(7, 32.4);\nconst res = unpackTelemetry(packet);\nconsole.log(\`Packet: Node \${res.nodeId}, Temp \${res.temp}C\`);`,
      "js-binary-protocol",
      "Serialize and deserialize binary telemetry packets with DataView.",
      [
        "Use setUint16(0, 0xAA55, false) for the magic header.",
        "Read Float32 at offset 4 using getFloat32(4, false).",
        "Verify output matches 'Packet: Node 7, Temp 32.4C'.",
      ],
      "Applied",
      `function packTelemetry(nodeId, temp) {\n  // Implement binary packing\n}\nfunction unpackTelemetry(buf) {\n  // Implement binary unpacking\n}\n// Pack Node 7 and Temp 32.4, unpack, and print\n`,
      [
        {
          id: "tc-pack-1",
          label: "Packs and unpacks binary telemetry frame correctly",
          expectedStdout: "Packet: Node 7, Temp 32.4C",
          matchMode: "trimmed",
        },
        {
          id: "tc-pack-hidden",
          label: "Verify packet fields",
          expectedStdout: "Packet: Node 7, Temp 32.4C",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why is DataView preferred over typed array views (like Float32Array) when parsing network protocol headers?",
      "DataView allows reading multiple heterogeneous types (Uint16, Uint8, Float32) at arbitrary unaligned byte offsets and explicitly controlling endianness.",
    ),
  },
];

export const javascriptProgrammingPath: LearningCourse = {
  id: "js-systems-algorithms",
  subjectId: javascriptProgrammingSubject.id,
  title: "JavaScript & Algorithmic Systems",
  description: "Master event-driven asynchronous architectures, binary buffer memory operations, and fundamental data structures in modern JavaScript runtimes.",
  level: "Developing",
  version: "1.0.0",
  prerequisites: [
    "Basic knowledge of variables and conditional expressions.",
    "Familiarity with foundational coding concepts.",
  ],
  objectives: javascriptObjectives,
  learningOutcomes: [
    "Explain and predict JavaScript execution context, closures, and lexical scope.",
    "Manage concurrency using the asynchronous event loop, microtasks, and Promises.",
    "Read, write, and manipulate low-level binary data using ArrayBuffer and DataView.",
    "Implement classical linear data structures including stacks, queues, and priority heaps.",
    "Traverse tree and graph networks using DFS, BFS, and in-order traversals.",
    "Optimize recursive algorithms using dynamic programming memoization and bottom-up tabulation.",
    "Design extensible event-driven architectures with decoupled pub/sub emitters.",
    "Coordinate background multithreading with Web Workers and high-throughput streams.",
  ],
  estimatedDurationMinutes: 480,
  publicationStatus: "published",
  modules: [
    moduleData("js-async-fundamentals", 1, "Scope, closures, and asynchronous JavaScript", "Lexical scoping, closures, the event loop, microtask queues, Promises, and async/await.", javascriptLessons.slice(0, 3)),
    moduleData("js-linear-data-structures", 2, "Binary buffers and linear data structures", "ArrayBuffer, DataView, binary memory manipulation, stacks, and queues.", javascriptLessons.slice(3, 5)),
    moduleData("js-trees-and-graphs", 3, "Trees, graphs, and hierarchical traversal", "Binary search trees, in-order traversal, BFS shortest paths, and binary min-heaps.", javascriptLessons.slice(5, 8)),
    moduleData("js-dp-and-systems", 4, "Dynamic programming and event-driven systems", "Memoization, bottom-up DP tabulation, and event-driven telemetry engines.", javascriptLessons.slice(8, 10)),
    moduleData("js-advanced-systems-concurrency", 5, "Advanced Concurrency & Web Workers", "Microtask vs macrotask scheduling, Web Workers multithreaded messaging, Streams pipelines, and structured binary transfers.", javascriptLessons.slice(10)),
  ],
};
