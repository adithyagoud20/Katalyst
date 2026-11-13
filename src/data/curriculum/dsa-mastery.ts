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

export const dsaMasterySubject: LearningSubject = {
  id: "algorithms-dsa",
  title: "Data Structures & Algorithms",
  description: "Asymptotic complexity, two pointers, sliding windows, monotonic stacks, binary trees, graph traversals, and dynamic programming.",
};

export const dsaMasteryObjectives: LearningObjective[] = [
  { id: "dsa-big-o", title: "Analyze time and space complexity using asymptotic Big-O notation and compute amortized bounds." },
  { id: "dsa-pointers", title: "Apply two-pointer techniques across sorted arrays and linked structures in linear time." },
  { id: "dsa-window", title: "Implement fixed and variable-size sliding windows to solve sub-array and sub-string optimization problems." },
  { id: "dsa-stacks", title: "Utilize LIFO stacks and monotonic stack invariants to solve range query and nearest element problems." },
  { id: "dsa-hash-maps", title: "Leverage $O(1)$ amortized hash map lookups and frequency sets to eliminate quadratic scans." },
  { id: "dsa-recursion", title: "Formulate recursive divide-and-conquer and backtracking algorithms with explicit base cases." },
  { id: "dsa-binary-search-obj", title: "Implement $O(\\log N)$ binary search across discrete sorted spaces and continuous monotonic ranges." },
  { id: "dsa-trees", title: "Traverse and manipulate hierarchical binary search trees using depth-first and breadth-first search." },
  { id: "dsa-graphs", title: "Model network topologies with adjacency lists and find shortest paths using Graph BFS and DFS." },
  { id: "dsa-dp", title: "Solve optimization problems with overlapping subproblems using memoization and bottom-up dynamic programming." },
];

function exercise(
  id: string,
  title: string,
  prompt: string,
  solution: string,
  objectiveId: string,
  expectedOutcome: string,
  hints: string[],
  difficulty: LearningDifficulty = "Beginner",
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

export const dsaMasteryLessons: LearningLesson[] = [
  // Module 1: Algorithmic Complexity & Pointer Techniques
  {
    id: "dsa-big-o-analysis",
    order: 1,
    title: "Asymptotic Analysis and Big-O Complexity",
    summary: "Master core concepts and hands-on engineering techniques for asymptotic analysis and big-o complexity.",
    type: "guided-coding",
    objectiveIds: ["dsa-big-o"],
    prerequisiteLessonIds: [],
    estimatedDurationMinutes: 25,
    content: `Algorithmic analysis measures how time and memory requirements grow as input size $N$ approaches infinity. Rather than clocking physical milliseconds (which vary with CPU hardware), we count **fundamental operations**.

### Hierarchy of Big-O Orders
1. **$O(1)$ Constant**: Hash map lookup, array index read, arithmetic.
2. **$O(\\log N)$ Logarithmic**: Binary search, balanced BST lookup.
3. **$O(N)$ Linear**: Array scan, single loop.
4. **$O(N \\log N)$ Linearithmic**: MergeSort, QuickSort (average), HeapSort.
5. **$O(N^2)$ Quadratic**: Nested loops over $N$, BubbleSort.
6. **$O(2^N)$ Exponential**: Naive recursive Fibonacci, subset generation.
7. **$O(N!)$ Factorial**: Traveling Salesperson brute force, permutations.

### Amortized Analysis
An operation may occasionally take $O(N)$ time (e.g. dynamic array resizing when capacity is exhausted), but if this only occurs once every $N$ operations, the average cost spread across all operations is $O(1)$ amortized.`,
    theorySections: [
      {
        title: "Dominant Terms and Constant Elimination",
        id: "dsa-mastery-sec-1",
        content: `In an algorithm requiring $f(N) = 5N^2 + 1000N + 50000$ operations: as $N$ grows to $10^6$, $N^2 = 10^{12}$, utterly dominating the lower-order terms. Asymptotic analysis isolates the dominant scaling behavior, characterizing this algorithm strictly as $O(N^2)$.`,
      },
      {
        title: "Auxiliary Space vs Input Space",
        id: "dsa-mastery-sec-2",
        content: `Space complexity measures auxiliary memory allocated by the algorithm during execution (call stacks, hash sets, extra buffers), excluding the read-only space occupied by the input itself. In-place algorithms achieve $O(1)$ auxiliary space.`,
      },
    ],
    codeExamples: [
      {
        title: "Analyzing Loop Complexities",
        description: "Contrasts linear and quadratic loop patterns.",
        code: `// O(N) Linear: Single loop
for (let i = 0; i < n; i++) {
  doWork(i);
}

// O(N^2) Quadratic: Nested loops
for (let i = 0; i < n; i++) {
  for (let j = 0; j < n; j++) {
    compare(i, j);
  }
}`,
        language: "javascript",
      },
    ],
    exercise: exercise(
      "ex-dsa-big-o-analysis",
      "Implement a Linear Duplicate Finder",
      "Write a function `containsDuplicates(nums)` that checks if any value appears at least twice in an array. It must run in $O(N)$ time and $O(N)$ space using a Set. Return true if duplicates exist, false otherwise.",
      `function containsDuplicates(nums) {
  const seen = new Set();
  for (const n of nums) {
    if (seen.has(n)) return true;
    seen.add(n);
  }
  return false;
}
console.log(containsDuplicates([1, 2, 3, 1]));
console.log(containsDuplicates([1, 2, 3, 4]));`,
      "dsa-big-o",
      "O(N) duplicate detection using Set.",
      [
        "Create a const seen = new Set();",
        "Iterate over nums. If seen.has(n), return true. Otherwise seen.add(n);",
        "Return false if the loop finishes without matches.",
      ],
      "Beginner",
      `function containsDuplicates(nums) {
  // Use a Set to achieve O(N) time complexity:
  const seen = new Set();
  for (const n of nums) {
    if (seen.has(n)) return true;
    seen.add(n);
  }
  return false;
}

console.log(containsDuplicates([1, 2, 3, 1]));
console.log(containsDuplicates([1, 2, 3, 4]));`,
      [
        {
          id: "tc-dsa-bigo-1",
          label: "Detects duplicates in O(N)",
          stdin: "",
          expectedStdout: "true\nfalse",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why is a nested loop over an array of size N typically O(N^2)?",
      "Because the inner loop runs N times for each of the N iterations of the outer loop, resulting in N * N = N^2 operations.",
    ),
    exampleRun: exampleRun("true\nfalse"),
  },
  {
    id: "dsa-two-pointers",
    order: 2,
    title: "The Two Pointers Technique",
    summary: "Master core concepts and hands-on engineering techniques for the two pointers technique.",
    type: "guided-coding",
    objectiveIds: ["dsa-pointers"],
    prerequisiteLessonIds: ["dsa-big-o-analysis"],
    estimatedDurationMinutes: 30,
    content: `The **Two Pointers** pattern replaces nested $O(N^2)$ iterations with a single $O(N)$ scan by maintaining two indices that move through a sequence according to specific rules.

### Convergent Pointers (Opposite Ends)
Used when data is sorted:
\`\`\`javascript
function twoSumSorted(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === target) return [left, right];
    if (sum < target) {
      left++; // Need a larger sum -> move left forward
    } else {
      right--; // Need a smaller sum -> move right inward
    }
  }
  return null;
}
\`\`\`

### Fast and Slow Pointers (Floyd's Cycle Finding)
Two pointers move at different speeds (e.g. slow moves 1 step, fast moves 2 steps). If a cycle exists (such as in a linked list), the fast pointer is guaranteed to lap and intersect the slow pointer in $O(N)$ time and $O(1)$ space.`,
    theorySections: [
      {
        title: "Monotonicity Invariant in Two Pointers",
        id: "dsa-mastery-sec-3",
        content: `In a sorted array, moving the left pointer rightward is guaranteed to increase or maintain the sum, while moving the right pointer leftward is guaranteed to decrease or maintain the sum. This mathematical monotonicity eliminates entire $O(N)$ search quadrants without checking them.`,
      },
      {
        title: "In-Place Array Partitioning",
        id: "dsa-mastery-sec-4",
        content: `Fast/slow pointers allow modifying arrays in-place with O(1) auxiliary memory. A 'write' pointer only advances when the 'read' pointer encounters a valid non-duplicate element, compacting elements at the front of the array.`,
      },
    ],
    codeExamples: [
      {
        title: "Palindrome Verification with Two Pointers",
        description: "Checks if a string reads the same forwards and backwards in O(N) time and O(1) space.",
        code: `function isPalindrome(str) {
  let left = 0;
  let right = str.length - 1;
  while (left < right) {
    if (str[left] !== str[right]) return false;
    left++;
    right--;
  }
  return true;
}`,
        language: "javascript",
      },
    ],
    exercise: exercise(
      "ex-dsa-two-pointers",
      "Two Sum in a Sorted Array",
      "Implement `twoSumSorted(numbers, target)` which accepts an array of sorted integers and an integer target. Return the 0-indexed indices `[left, right]` whose elements sum to target. Assume exactly one solution exists.",
      `function twoSumSorted(numbers, target) {
  let left = 0;
  let right = numbers.length - 1;
  while (left < right) {
    const sum = numbers[left] + numbers[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return [];
}

console.log(JSON.stringify(twoSumSorted([2, 7, 11, 15], 9)));
console.log(JSON.stringify(twoSumSorted([2, 3, 4], 6)));`,
      "dsa-pointers",
      "Two sum solved in O(N) time using two pointers.",
      [
        "Initialize left = 0 and right = numbers.length - 1.",
        "Compute sum = numbers[left] + numbers[right].",
        "If sum < target, advance left++. If sum > target, decrement right--.",
      ],
      "Beginner",
      `function twoSumSorted(numbers, target) {
  let left = 0;
  let right = numbers.length - 1;
  while (left < right) {
    const sum = numbers[left] + numbers[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return [];
}

console.log(JSON.stringify(twoSumSorted([2, 7, 11, 15], 9)));
console.log(JSON.stringify(twoSumSorted([2, 3, 4], 6)));`,
      [
        {
          id: "tc-dsa-ptr-1",
          label: "Finds indices summing to target",
          stdin: "",
          expectedStdout: "[0,1]\n[0,2]",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "What prerequisite must an array satisfy for convergent two-pointer two-sum to work?",
      "The array must be sorted in ascending order.",
    ),
    exampleRun: exampleRun("[0,1]\n[0,2]"),
  },
  {
    id: "dsa-sliding-window",
    order: 3,
    title: "The Sliding Window Technique",
    summary: "Master core concepts and hands-on engineering techniques for the sliding window technique.",
    type: "guided-coding",
    objectiveIds: ["dsa-window"],
    prerequisiteLessonIds: ["dsa-two-pointers"],
    estimatedDurationMinutes: 30,
    content: `The **Sliding Window** technique maintains a contiguous subarray or substring between two indices \`[start, end]\`. Instead of recomputing results for overlapping intervals from scratch ($O(N \\times K)$), it updates the running state incrementally:
\`current_window_state = previous_state - outgoing_element + incoming_element\`

### Fixed-Size Window Pattern
\`\`\`javascript
function maxSubarraySum(arr, k) {
  if (arr.length < k) return null;
  let windowSum = 0;
  for (let i = 0; i < k; i++) windowSum += arr[i];

  let maxSum = windowSum;
  for (let i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i - k]; // Add incoming, subtract outgoing
    maxSum = Math.max(maxSum, windowSum);
  }
  return maxSum;
}
\`\`\`

### Variable-Size Window Pattern
Expand the window by advancing \`end\` until a condition is violated, then contract by advancing \`start\` until validity is restored (e.g. Longest Substring Without Repeating Characters).`,
    theorySections: [
      {
        title: "Amortized Analysis of Sliding Window",
        id: "dsa-mastery-sec-5",
        content: `A variable sliding window often contains a while loop inside a for loop. Beginners often assume this is O(N^2). However, every element is added to the window at most once by the end pointer, and removed at most once by the start pointer. Total pointer movements are bounded by 2N, proving strictly O(N) complexity.`,
      },
      {
        title: "Auxiliary Hash Maps in Window Tracking",
        id: "dsa-mastery-sec-6",
        content: `When tracking variable windows (e.g. at most K distinct characters), maintaining a frequency map allows checking validity in O(1) time without rescanning the window contents.`,
      },
    ],
    codeExamples: [
      {
        title: "Longest Substring Without Repeating Characters",
        description: "Variable-size sliding window with index map.",
        code: `function lengthOfLongestSubstring(s) {
  const map = new Map();
  let maxLen = 0;
  let start = 0;
  for (let end = 0; end < s.length; end++) {
    const char = s[end];
    if (map.has(char) && map.get(char) >= start) {
      start = map.get(char) + 1;
    }
    map.set(char, end);
    maxLen = Math.max(maxLen, end - start + 1);
  }
  return maxLen;
}`,
        language: "javascript",
      },
    ],
    exercise: exercise(
      "ex-dsa-sliding-window",
      "Maximum Sum Subarray of Size K",
      "Implement `maxSubarraySum(nums, k)` that finds the maximum sum of any contiguous subarray of size `k`. If `nums.length < k`, return 0.",
      `function maxSubarraySum(nums, k) {
  if (nums.length < k) return 0;
  let windowSum = 0;
  for (let i = 0; i < k; i++) windowSum += nums[i];

  let maxSum = windowSum;
  for (let i = k; i < nums.length; i++) {
    windowSum += nums[i] - nums[i - k];
    maxSum = Math.max(maxSum, windowSum);
  }
  return maxSum;
}

console.log(maxSubarraySum([2, 1, 5, 1, 3, 2], 3));
console.log(maxSubarraySum([2, 3, 4, 1, 5], 2));`,
      "dsa-window",
      "Sliding window computes maximum sum in O(N).",
      [
        "Compute initial sum of first k elements.",
        "Loop from index k to nums.length.",
        "Update windowSum = windowSum + nums[i] - nums[i - k];",
        "Track Math.max(maxSum, windowSum);",
      ],
      "Beginner",
      `function maxSubarraySum(nums, k) {
  if (nums.length < k) return 0;
  let windowSum = 0;
  for (let i = 0; i < k; i++) windowSum += nums[i];

  let maxSum = windowSum;
  for (let i = k; i < nums.length; i++) {
    windowSum += nums[i] - nums[i - k];
    maxSum = Math.max(maxSum, windowSum);
  }
  return maxSum;
}

console.log(maxSubarraySum([2, 1, 5, 1, 3, 2], 3));
console.log(maxSubarraySum([2, 3, 4, 1, 5], 2));`,
      [
        {
          id: "tc-dsa-window-1",
          label: "Computes maximum subarray sum correctly",
          stdin: "",
          expectedStdout: "9\n7",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "How does a sliding window update its sum in O(1) time when moving forward?",
      "By adding the incoming element at the leading edge and subtracting the outgoing element from the trailing edge.",
    ),
    exampleRun: exampleRun("9\n7"),
  },

  // Module 2: Linear Data Structures & Hash Maps
  {
    id: "dsa-stacks-queues",
    order: 4,
    title: "Stacks, Queues, and Monotonic Stack Invariants",
    summary: "Master core concepts and hands-on engineering techniques for stacks, queues, and monotonic stack invariants.",
    type: "guided-coding",
    objectiveIds: ["dsa-stacks"],
    prerequisiteLessonIds: ["dsa-sliding-window"],
    estimatedDurationMinutes: 30,
    content: `Linear abstract data types enforce restricted access patterns:
- **Stack (LIFO - Last In, First Out)**: Push and Pop at the top. Used in call stacks, parentheses matching, syntax parsing, and undo history.
- **Queue (FIFO - First In, First Out)**: Enqueue at back, Dequeue from front. Used in BFS, event loops, and task buffering.

### The Monotonic Stack Invariant
A **Monotonic Stack** maintains elements in strictly increasing or decreasing order. When a new element violates the order, elements are popped from the stack until the invariant is restored.

This structure finds the **Next Greater Element** for all array positions in $O(N)$ total time, transforming what is naively an $O(N^2)$ problem into linear efficiency:
\`\`\`javascript
function nextGreaterElements(arr) {
  const result = new Array(arr.length).fill(-1);
  const stack = []; // Stores indices

  for (let i = 0; i < arr.length; i++) {
    while (stack.length > 0 && arr[i] > arr[stack[stack.length - 1]]) {
      const poppedIdx = stack.pop();
      result[poppedIdx] = arr[i];
    }
    stack.push(i);
  }
  return result;
}
\`\`\``,
    theorySections: [
      {
        title: "Monotonic Invariant Proof",
        id: "dsa-mastery-sec-7",
        content: `Each index is pushed onto the stack exactly once. Each index is popped from the stack at most once. Therefore, regardless of how many iterations the inner while loop performs on a particular element, the cumulative number of pop operations across the entire array cannot exceed N.`,
      },
      {
        title: "Stack-Based Parentheses Matching",
        id: "dsa-mastery-sec-8",
        content: `For every opening bracket '(', '[', '{', push its corresponding closing bracket onto the stack. For every closing bracket, pop from the stack and verify equality. If the stack is empty at the end, the string is balanced.`,
      },
    ],
    codeExamples: [
      {
        title: "Valid Parentheses Checker",
        description: "Validates string of brackets using a LIFO stack.",
        code: `function isValidParentheses(s) {
  const stack = [];
  const map = { ')': '(', ']': '[', '}': '{' };
  for (const char of s) {
    if (char === '(' || char === '[' || char === '{') {
      stack.push(char);
    } else if (stack.pop() !== map[char]) {
      return false;
    }
  }
  return stack.length === 0;
}`,
        language: "javascript",
      },
    ],
    exercise: exercise(
      "ex-dsa-stacks-queues",
      "Next Greater Element",
      "Implement `nextGreaterElements(arr)` which returns an array where each position contains the next strictly greater element to its right, or `-1` if no such element exists.",
      `function nextGreaterElements(arr) {
  const result = new Array(arr.length).fill(-1);
  const stack = [];

  for (let i = 0; i < arr.length; i++) {
    while (stack.length > 0 && arr[i] > arr[stack[stack.length - 1]]) {
      const idx = stack.pop();
      result[idx] = arr[i];
    }
    stack.push(i);
  }
  return result;
}

console.log(JSON.stringify(nextGreaterElements([4, 5, 2, 25])));
console.log(JSON.stringify(nextGreaterElements([13, 7, 6, 12])));`,
      "dsa-stacks",
      "Monotonic stack calculates next greater elements in O(N).",
      [
        "Initialize result array with -1.",
        "Iterate i from 0 to arr.length - 1.",
        "While stack has items and arr[i] > arr[stack.top], pop and set result[popped] = arr[i].",
        "Push current index i onto stack.",
      ],
      "Developing",
      `function nextGreaterElements(arr) {
  const result = new Array(arr.length).fill(-1);
  const stack = [];

  for (let i = 0; i < arr.length; i++) {
    while (stack.length > 0 && arr[i] > arr[stack[stack.length - 1]]) {
      const idx = stack.pop();
      result[idx] = arr[i];
    }
    stack.push(i);
  }
  return result;
}

console.log(JSON.stringify(nextGreaterElements([4, 5, 2, 25])));
console.log(JSON.stringify(nextGreaterElements([13, 7, 6, 12])));`,
      [
        {
          id: "tc-dsa-stack-1",
          label: "Calculates next greater elements",
          stdin: "",
          expectedStdout: "[5,25,25,-1]\n[-1,12,12,-1]",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "What is the total time complexity of computing Next Greater Element using a monotonic stack?",
      "O(N), because every element is pushed and popped at most once.",
    ),
    exampleRun: exampleRun("[5,25,25,-1]\n[-1,12,12,-1]"),
  },
  {
    id: "dsa-hash-maps-sets",
    order: 5,
    title: "Hash Tables, Hash Functions, and Collision Resolution",
    summary: "Master core concepts and hands-on engineering techniques for hash tables, hash functions, and collision resolution.",
    type: "guided-coding",
    objectiveIds: ["dsa-hash-maps"],
    prerequisiteLessonIds: ["dsa-stacks-queues"],
    estimatedDurationMinutes: 25,
    content: `A **Hash Table** maps arbitrary keys to values using a **Hash Function**:
\`index = hash(key) % capacity\`

### Collision Resolution Strategies
1. **Separate Chaining**: Each bucket points to a linked list or small binary tree of entries sharing the same hash index.
2. **Open Addressing**: When a collision occurs, probe alternative buckets (linear probing: \`i + 1\`, quadratic probing: \`i^2\`, or double hashing).

### The Classic Two Sum ($O(N)$ vs $O(N^2)$)
A brute-force nested loop takes $O(N^2)$ time. Storing visited values in a Hash Map achieves $O(N)$ linear time:
\`\`\`javascript
function twoSum(nums, target) {
  const complementMap = new Map(); // value -> index
  for (let i = 0; i < nums.length; i++) {
    const comp = target - nums[i];
    if (complementMap.has(comp)) {
      return [complementMap.get(comp), i];
    }
    complementMap.set(nums[i], i);
  }
  return null;
}
\`\`\``,
    theorySections: [
      {
        title: "Load Factor and Rehashing",
        id: "dsa-mastery-sec-9",
        content: `The load factor is defined as alpha = N / Capacity. When alpha exceeds a threshold (typically 0.75), collisions proliferate and operations degrade toward O(N). The hash table allocates a new array of double capacity (2 * Capacity) and re-hashes all existing keys.`,
      },
      {
        title: "Frequency Maps for Anagram and Substring Problems",
        id: "dsa-mastery-sec-10",
        content: `Mapping items to their occurrence count (Map<item, count>) enables answering anagram equality, majority element detection, and frequency thresholding in O(N) time with O(K) space where K is the alphabet size.`,
      },
    ],
    codeExamples: [
      {
        title: "Valid Anagram Verification",
        description: "Checks if two strings have identical character frequencies.",
        code: `function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const count = {};
  for (const c of s) count[c] = (count[c] || 0) + 1;
  for (const c of t) {
    if (!count[c]) return false;
    count[c]--;
  }
  return true;
}`,
        language: "javascript",
      },
    ],
    exercise: exercise(
      "ex-dsa-hash-maps-sets",
      "Two Sum with Hash Map",
      "Implement `twoSum(nums, target)` which returns the indices `[prevIndex, currentIndex]` of two numbers in an unsorted array that sum to `target`. Use a Map to achieve $O(N)$ time complexity.",
      `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const comp = target - nums[i];
    if (map.has(comp)) {
      return [map.get(comp), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

console.log(JSON.stringify(twoSum([2, 7, 11, 15], 9)));
console.log(JSON.stringify(twoSum([3, 2, 4], 6)));`,
      "dsa-hash-maps",
      "O(N) two sum using hash map complement lookups.",
      [
        "Create const map = new Map();",
        "For each element nums[i], compute complement = target - nums[i].",
        "If map.has(complement), return [map.get(complement), i].",
        "Otherwise map.set(nums[i], i);",
      ],
      "Beginner",
      `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const comp = target - nums[i];
    if (map.has(comp)) {
      return [map.get(comp), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

console.log(JSON.stringify(twoSum([2, 7, 11, 15], 9)));
console.log(JSON.stringify(twoSum([3, 2, 4], 6)));`,
      [
        {
          id: "tc-dsa-hash-1",
          label: "Finds two sum indices in unsorted array",
          stdin: "",
          expectedStdout: "[0,1]\n[1,2]",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "What is the average time complexity of key insertion and lookup in a hash map?",
      "O(1) amortized constant time.",
    ),
    exampleRun: exampleRun("[0,1]\n[1,2]"),
  },

  // Module 3: Recursion, Searching & Divide-and-Conquer
  {
    id: "dsa-recursion-backtracking",
    order: 6,
    title: "Recursion, Call Stacks, and Backtracking",
    summary: "Master core concepts and hands-on engineering techniques for recursion, call stacks, and backtracking.",
    type: "guided-coding",
    objectiveIds: ["dsa-recursion"],
    prerequisiteLessonIds: ["dsa-hash-maps-sets"],
    estimatedDurationMinutes: 30,
    content: `A function is **recursive** if it solves a problem by calling itself with smaller sub-problems.

Every recursive algorithm requires two components:
1. **Base Case**: The termination condition where the answer is computed directly without further recursive calls.
2. **Recursive Step**: Advances toward the base case by reducing problem size.

### The Call Stack
Each recursive invocation pushes a stack frame containing local variables and return address onto the call stack. Exceeding stack limits triggers a **Stack Overflow**.

### Backtracking Pattern
Backtracking explores a decision tree, taking a candidate choice, exploring downstream ramifications recursively, and **reverting (undoing)** the choice if it leads to a dead end:
\`\`\`javascript
function subsets(nums) {
  const result = [];
  function backtrack(startIndex, currentSubset) {
    result.push([...currentSubset]); // Capture snapshot
    for (let i = startIndex; i < nums.length; i++) {
      currentSubset.push(nums[i]);       // Make choice
      backtrack(i + 1, currentSubset);   // Explore
      currentSubset.pop();               // Undo choice (backtrack)
    }
  }
  backtrack(0, []);
  return result;
}
\`\`\``,
    theorySections: [
      {
        title: "Tail Call Optimization (TCO)",
        id: "dsa-mastery-sec-11",
        content: `If the very last action of a recursive function is returning the call to itself (with no pending operations on return), an engine supporting TCO can reuse the current stack frame rather than pushing a new one, executing recursion in O(1) auxiliary stack space.`,
      },
      {
        title: "Search Tree Pruning",
        id: "dsa-mastery-sec-12",
        content: `In problems like N-Queens or Sudoku, verifying validity before recursing into invalid states (pruning) dramatically reduces combinatorial exploration from exponential O(B^D) down to practical execution times.`,
      },
    ],
    codeExamples: [
      {
        title: "Generating Binary Strings of Length N",
        description: "Backtracking generator for all N-bit binary strings.",
        code: `function binaryStrings(n) {
  const result = [];
  function generate(current) {
    if (current.length === n) {
      result.push(current);
      return;
    }
    generate(current + '0');
    generate(current + '1');
  }
  generate('');
  return result;
}`,
        language: "javascript",
      },
    ],
    exercise: exercise(
      "ex-dsa-recursion-backtracking",
      "Compute Factorial and Fibonacci Recursively",
      "Implement a recursive function `factorial(n)` where `factorial(0) = 1` and `factorial(n) = n * factorial(n - 1)`. Print factorial(5) and factorial(0).",
      `function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

console.log(factorial(5));
console.log(factorial(0));`,
      "dsa-recursion",
      "Recursive factorial with base case.",
      [
        "Base case: if (n <= 1) return 1;",
        "Recursive step: return n * factorial(n - 1);",
      ],
      "Beginner",
      `function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

console.log(factorial(5));
console.log(factorial(0));`,
      [
        {
          id: "tc-dsa-rec-1",
          label: "Calculates factorials recursively",
          stdin: "",
          expectedStdout: "120\n1",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "What critical condition must every recursive function possess to avoid infinite recursion and stack overflow?",
      "A base case that terminates the recursive calls.",
    ),
    exampleRun: exampleRun("120\n1"),
  },
  {
    id: "dsa-binary-search",
    order: 7,
    title: "Binary Search and Monotonic Search Spaces",
    summary: "Master core concepts and hands-on engineering techniques for binary search and monotonic search spaces.",
    type: "guided-coding",
    objectiveIds: ["dsa-binary-search-obj"],
    prerequisiteLessonIds: ["dsa-recursion-backtracking"],
    estimatedDurationMinutes: 25,
    content: `Linear search evaluates elements one by one in $O(N)$ time. **Binary Search** divides a sorted search space in half at every step, achieving lightning-fast $O(\\log N)$ time complexity.

### Classic Binary Search
\`\`\`javascript
function binarySearch(arr, target) {
  let low = 0;
  let high = arr.length - 1;

  while (low <= high) {
    // Avoid integer overflow: low + Math.floor((high - low) / 2)
    const mid = low + Math.floor((high - low) / 2);

    if (arr[mid] === target) return mid;
    if (arr[mid] < target) {
      low = mid + 1; // Discard left half
    } else {
      high = mid - 1; // Discard right half
    }
  }
  return -1; // Not found
}
\`\`\`

### Searching on Answer Space
Binary search is not limited to arrays! Any monotonic function $f(x)$ where answers transition monotonically from \`false\` to \`true\` can be binary searched (e.g. finding the minimum shipping capacity to deliver packages within $D$ days).`,
    theorySections: [
      {
        title: "Integer Overflow in Midpoint Calculation",
        id: "dsa-mastery-sec-13",
        content: `In C, C++, and Java, if low and high are large 32-bit signed integers (e.g. low = 2 * 10^9, high = 2 * 10^9), low + high overflows into a negative number. Writing mid = low + (high - low) / 2 guarantees that no intermediate calculation exceeds the range of high.`,
      },
      {
        title: "Lower Bound and Upper Bound Variants",
        id: "dsa-mastery-sec-14",
        content: `When searching for duplicate entries, continuing the search even after finding a match (high = mid - 1 for lower bound; low = mid + 1 for upper bound) identifies exact boundary ranges in O(log N) time.`,
      },
    ],
    codeExamples: [
      {
        title: "Binary Search Square Root (Integer)",
        description: "Computes integer square root in O(log N) using search on answer.",
        code: `function mySqrt(x) {
  if (x < 2) return x;
  let low = 1, high = Math.floor(x / 2), ans = 1;
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (mid * mid <= x) {
      ans = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return ans;
}`,
        language: "javascript",
      },
    ],
    exercise: exercise(
      "ex-dsa-binary-search",
      "Implement Iterative Binary Search",
      "Implement `binarySearch(nums, target)` that returns the 0-based index of `target` in sorted array `nums`, or `-1` if not found.",
      `function binarySearch(nums, target) {
  let low = 0;
  let high = nums.length - 1;
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}

console.log(binarySearch([-1, 0, 3, 5, 9, 12], 9));
console.log(binarySearch([-1, 0, 3, 5, 9, 12], 2));`,
      "dsa-binary-search-obj",
      "Binary search located element in O(log N).",
      [
        "Initialize low = 0 and high = nums.length - 1.",
        "Compute mid = low + Math.floor((high - low) / 2);",
        "If nums[mid] === target, return mid.",
        "Adjust low or high accordingly.",
      ],
      "Beginner",
      `function binarySearch(nums, target) {
  let low = 0;
  let high = nums.length - 1;
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}

console.log(binarySearch([-1, 0, 3, 5, 9, 12], 9));
console.log(binarySearch([-1, 0, 3, 5, 9, 12], 2));`,
      [
        {
          id: "tc-dsa-bin-1",
          label: "Returns index of target or -1",
          stdin: "",
          expectedStdout: "4\n-1",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "How many comparisons does binary search require in an array of 1,000,000 elements in the worst case?",
      "Approximately 20 comparisons, since 2^20 = 1,048,576.",
    ),
    exampleRun: exampleRun("4\n-1"),
  },

  // Module 4: Trees, Graphs & Dynamic Programming
  {
    id: "dsa-binary-trees-bst",
    order: 8,
    title: "Binary Trees, BST Invariants, and Tree Traversals",
    summary: "Master core concepts and hands-on engineering techniques for binary trees, bst invariants, and tree traversals.",
    type: "guided-coding",
    objectiveIds: ["dsa-trees"],
    prerequisiteLessonIds: ["dsa-binary-search"],
    estimatedDurationMinutes: 30,
    content: `A **Binary Tree** is a non-linear data structure where each node has at most two children (\`left\` and \`right\`).

### Binary Search Tree (BST) Invariant
For every node $X$:
- All values in the **left subtree** are strictly less than $X.val$.
- All values in the **right subtree** are strictly greater than $X.val$.

### Depth-First Search (DFS) Traversals
1. **In-Order (Left, Root, Right)**: Visits BST nodes in strictly sorted ascending order!
2. **Pre-Order (Root, Left, Right)**: Used for serializing/cloning trees.
3. **Post-Order (Left, Right, Root)**: Used for bottom-up computation (e.g. tree height, directory size calculation, freeing nodes in C).

### Breadth-First Search (BFS) / Level-Order
Uses a queue to visit nodes layer by layer horizontally.`,
    theorySections: [
      {
        title: "BST Balance and Tree Degeneration",
        id: "dsa-mastery-sec-15",
        content: `If items are inserted in sorted order (1, 2, 3, 4, 5), a naive BST degenerates into a linear linked list with O(N) lookup. Self-balancing trees (AVL trees, Red-Black trees) perform rotations to maintain height at O(log N).`,
      },
      {
        title: "Maximum Depth of a Binary Tree",
        id: "dsa-mastery-sec-16",
        content: `The height of a tree at node X is 1 + max(height(left), height(right)). The base case is a null node returning 0. This elegant post-order recursion computes depth in O(N) time.`,
      },
    ],
    codeExamples: [
      {
        title: "In-Order BST Traversal",
        description: "Produces sorted array from binary search tree.",
        code: `function inOrderTraversal(root) {
  const result = [];
  function traverse(node) {
    if (!node) return;
    traverse(node.left);
    result.push(node.val);
    traverse(node.right);
  }
  traverse(root);
  return result;
}`,
        language: "javascript",
      },
    ],
    exercise: exercise(
      "ex-dsa-binary-trees-bst",
      "Compute Maximum Depth of a Binary Tree",
      "Write a function `maxDepth(root)` that computes the maximum depth (height) of a binary tree, where each node has `{ val, left, right }`. Return 0 for null root.",
      `function maxDepth(root) {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}

const tree = {
  val: 3,
  left: { val: 9, left: null, right: null },
  right: {
    val: 20,
    left: { val: 15, left: null, right: null },
    right: { val: 7, left: null, right: null },
  },
};

console.log(maxDepth(tree));
console.log(maxDepth(null));`,
      "dsa-trees",
      "Tree height computed via post-order recursion.",
      [
        "Base case: if (!root) return 0;",
        "Recursive case: return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));",
      ],
      "Beginner",
      `function maxDepth(root) {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}

const tree = {
  val: 3,
  left: { val: 9, left: null, right: null },
  right: {
    val: 20,
    left: { val: 15, left: null, right: null },
    right: { val: 7, left: null, right: null },
  },
};

console.log(maxDepth(tree));
console.log(maxDepth(null));`,
      [
        {
          id: "tc-dsa-tree-1",
          label: "Calculates max depth accurately",
          stdin: "",
          expectedStdout: "3\n0",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "Which binary tree traversal order guarantees visiting nodes in ascending sorted order in a BST?",
      "In-Order traversal (Left, Root, Right).",
    ),
    exampleRun: exampleRun("3\n0"),
  },
  {
    id: "dsa-graphs-bfs-dfs",
    order: 9,
    title: "Graph Representations, BFS Shortest Path, and DFS",
    summary: "Master core concepts and hands-on engineering techniques for graph representations, bfs shortest path, and dfs.",
    type: "guided-coding",
    objectiveIds: ["dsa-graphs"],
    prerequisiteLessonIds: ["dsa-binary-trees-bst"],
    estimatedDurationMinutes: 30,
    content: `A **Graph** $G = (V, E)$ consists of vertices (nodes) connected by edges (links). Graphs can be directed or undirected, weighted or unweighted, cyclic or acyclic.

### Adjacency List Representation
\`\`\`javascript
const graph = {
  A: ['B', 'C'],
  B: ['A', 'D', 'E'],
  C: ['A', 'F'],
  D: ['B'],
  E: ['B', 'F'],
  F: ['C', 'E'],
};
\`\`\`

### Breadth-First Search (BFS) for Shortest Path
In an unweighted graph, BFS is guaranteed to discover the shortest path (minimum edge count) between two nodes:
\`\`\`javascript
function shortestPathBFS(graph, start, target) {
  const queue = [[start, 0]]; // [node, distance]
  const visited = new Set([start]);

  while (queue.length > 0) {
    const [current, dist] = queue.shift();
    if (current === target) return dist;

    for (const neighbor of graph[current] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, dist + 1]);
      }
    }
  }
  return -1; // Unreachable
}
\`\`\``,
    theorySections: [
      {
        title: "Visited Set: Preventing Infinite Cycles",
        id: "dsa-mastery-sec-17",
        content: `Trees are directed acyclic graphs with a single root; a node cannot have multiple parents. General graphs can contain cycles (A -> B -> C -> A). Without a visited set to track explored nodes, graph traversals enter infinite loops.`,
      },
      {
        title: "Topological Sorting (Kahn's Algorithm / DFS)",
        id: "dsa-mastery-sec-18",
        content: `Build systems (like Make or npm) and compilers use topological sort to resolve task dependency chains. If a graph has a cycle (circular dependency A -> B -> A), topological sort detects the deadlock.`,
      },
    ],
    codeExamples: [
      {
        title: "DFS Connected Components",
        description: "Counts isolated sub-networks using depth-first search.",
        code: `function countComponents(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }
  const visited = new Set();
  let count = 0;
  function dfs(node) {
    visited.add(node);
    for (const neighbor of adj[node]) {
      if (!visited.has(neighbor)) dfs(neighbor);
    }
  }
  for (let i = 0; i < n; i++) {
    if (!visited.has(i)) {
      count++;
      dfs(i);
    }
  }
  return count;
}`,
        language: "javascript",
      },
    ],
    exercise: exercise(
      "ex-dsa-graphs-bfs-dfs",
      "Find Shortest Unweighted Path with BFS",
      "Implement `shortestPathBFS(graph, start, target)` using a queue and a visited set to find the minimum distance in edge hops from `start` to `target`. Return `-1` if target is unreachable.",
      `function shortestPathBFS(graph, start, target) {
  const queue = [[start, 0]];
  const visited = new Set([start]);

  while (queue.length > 0) {
    const [curr, dist] = queue.shift();
    if (curr === target) return dist;

    for (const neighbor of graph[curr] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, dist + 1]);
      }
    }
  }
  return -1;
}

const network = {
  A: ['B', 'C'],
  B: ['A', 'D'],
  C: ['A', 'D', 'E'],
  D: ['B', 'C', 'F'],
  E: ['C'],
  F: ['D'],
};

console.log(shortestPathBFS(network, 'A', 'F'));
console.log(shortestPathBFS(network, 'A', 'A'));`,
      "dsa-graphs",
      "BFS computes shortest path in unweighted graph.",
      [
        "Initialize queue with [[start, 0]] and visited set with start.",
        "While queue is not empty, shift [curr, dist].",
        "If curr === target, return dist.",
        "For each neighbor not in visited, add to visited and push [neighbor, dist + 1].",
      ],
      "Developing",
      `function shortestPathBFS(graph, start, target) {
  const queue = [[start, 0]];
  const visited = new Set([start]);

  while (queue.length > 0) {
    const [curr, dist] = queue.shift();
    if (curr === target) return dist;

    for (const neighbor of graph[curr] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, dist + 1]);
      }
    }
  }
  return -1;
}

const network = {
  A: ['B', 'C'],
  B: ['A', 'D'],
  C: ['A', 'D', 'E'],
  D: ['B', 'C', 'F'],
  E: ['C'],
  F: ['D'],
};

console.log(shortestPathBFS(network, 'A', 'F'));
console.log(shortestPathBFS(network, 'A', 'A'));`,
      [
        {
          id: "tc-dsa-graph-1",
          label: "Calculates shortest unweighted graph distance",
          stdin: "",
          expectedStdout: "3\n0",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why does BFS guarantee finding the shortest path in an unweighted graph while DFS does not?",
      "BFS expands uniformly in concentric circles (all distance-1 nodes, then distance-2, etc.), ensuring the first time target is reached is the shortest path.",
    ),
    exampleRun: exampleRun("3\n0"),
  },
  {
    id: "dsa-dynamic-programming-1d",
    order: 10,
    title: "1D Dynamic Programming and Memoization",
    summary: "Master core concepts and hands-on engineering techniques for 1d dynamic programming and memoization.",
    type: "guided-coding",
    objectiveIds: ["dsa-dp"],
    prerequisiteLessonIds: ["dsa-graphs-bfs-dfs"],
    estimatedDurationMinutes: 30,
    content: `Dynamic Programming (DP) solves complex optimization problems by breaking them down into simpler subproblems and caching their solutions.

A problem can be solved with DP if it exhibits:
1. **Optimal Substructure**: The optimal solution to the problem contains within it optimal solutions to subproblems.
2. **Overlapping Subproblems**: The same subproblems are solved repeatedly by a naive recursive approach.

### Top-Down Memoization vs Bottom-Up Tabulation
- **Top-Down (Memoization)**: Write natural recursion and cache results in an array or map (\`memo[n]\`).
- **Bottom-Up (Tabulation)**: Fill an iterative table starting from base cases (\`dp[0]\`, \`dp[1]\`, ...).

### The Classic Climbing Stairs Problem
To reach step $N$, you can take 1 step from $(N - 1)$ or 2 steps from $(N - 2)$:
\`dp[i] = dp[i - 1] + dp[i - 2]\`
\`\`\`javascript
function climbStairs(n) {
  if (n <= 2) return n;
  let prev2 = 1;
  let prev1 = 2;
  for (let i = 3; i <= n; i++) {
    const current = prev1 + prev2;
    prev2 = prev1;
    prev1 = current;
  }
  return prev1;
}
\`\`\``,
    theorySections: [
      {
        title: "Space Optimization: The Two-Variable Technique",
        id: "dsa-mastery-sec-19",
        content: `When dp[i] only depends on a constant number of preceding states (e.g. dp[i - 1] and dp[i - 2]), maintaining an entire array of size N wastes memory. Replacing the array with two scalar variables reduces auxiliary space from O(N) down to O(1).`,
      },
      {
        title: "The Coin Change Problem",
        id: "dsa-mastery-sec-20",
        content: `For target amount A and coins C: dp[a] = min(dp[a], 1 + dp[a - c]). Initializing the DP array with Infinity and setting dp[0] = 0 allows finding the minimum coins needed in O(A * |C|) time.`,
      },
    ],
    codeExamples: [
      {
        title: "Coin Change (Fewest Coins)",
        description: "Bottom-up 1D dynamic programming.",
        code: `function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (a >= c) {
        dp[a] = Math.min(dp[a], 1 + dp[a - c]);
      }
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
        language: "javascript",
      },
    ],
    exercise: exercise(
      "ex-dsa-dynamic-programming-1d",
      "Climbing Stairs with Dynamic Programming",
      "Implement `climbStairs(n)` which returns the number of distinct ways to climb to the top of an `n`-step staircase where you can climb 1 or 2 steps at a time. Achieve $O(N)$ time and $O(1)$ space.",
      `function climbStairs(n) {
  if (n <= 2) return n;
  let a = 1;
  let b = 2;
  for (let i = 3; i <= n; i++) {
    const c = a + b;
    a = b;
    b = c;
  }
  return b;
}

console.log(climbStairs(2));
console.log(climbStairs(3));
console.log(climbStairs(5));`,
      "dsa-dp",
      "Climbing stairs solved with O(1) space dynamic programming.",
      [
        "Base cases: if (n <= 2) return n;",
        "Track a = 1, b = 2.",
        "Loop from 3 to n, updating c = a + b, a = b, b = c.",
        "Return b.",
      ],
      "Beginner",
      `function climbStairs(n) {
  if (n <= 2) return n;
  let a = 1;
  let b = 2;
  for (let i = 3; i <= n; i++) {
    const c = a + b;
    a = b;
    b = c;
  }
  return b;
}

console.log(climbStairs(2));
console.log(climbStairs(3));
console.log(climbStairs(5));`,
      [
        {
          id: "tc-dsa-dp-1",
          label: "Calculates staircase combinations",
          stdin: "",
          expectedStdout: "2\n3\n8",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "What two properties must a problem have to be eligible for Dynamic Programming?",
      "Optimal substructure and overlapping subproblems.",
    ),
    exampleRun: exampleRun("2\n3\n8"),
  },
];

// Module Groupings
export const dsaMasteryModules: LearningModule[] = [
  moduleData(
    "dsa-module-complexity-pointers",
    1,
    "Complexity Analysis & Pointer Techniques",
    "Master Big-O asymptotic analysis, amortized complexity, convergent two pointers, and sliding windows.",
    dsaMasteryLessons.slice(0, 3),
  ),
  moduleData(
    "dsa-module-stacks-maps",
    2,
    "Stacks, Queues & Hash Maps",
    "Apply LIFO stacks, monotonic stack invariants for Next Greater Element, and O(1) hash tables.",
    dsaMasteryLessons.slice(3, 5),
  ),
  moduleData(
    "dsa-module-recursion-search",
    3,
    "Recursion, Search & Divide-and-Conquer",
    "Trace recursive call stacks, implement search space backtracking, and execute logarithmic binary search.",
    dsaMasteryLessons.slice(5, 7),
  ),
  moduleData(
    "dsa-module-trees-graphs-dp",
    4,
    "Trees, Graphs & Dynamic Programming",
    "Traverse binary search trees, find shortest paths with graph BFS, and optimize overlapping subproblems with DP.",
    dsaMasteryLessons.slice(7, 10),
  ),
];

export const dsaMasteryPath: LearningCourse = {
  id: "dsa-mastery",
  subjectId: dsaMasterySubject.id,
  title: "Data Structures & Algorithms Mastery",
  description: "Big-O, two pointers, sliding windows, monotonic stacks, binary trees, graph BFS, and dynamic programming.",
  level: "Developing",
  version: "1.0.0",
  prerequisites: [
      "Basic programming experience in any language (JavaScript, Python, or C)."
  ],
  objectives: dsaMasteryObjectives,
  learningOutcomes: [
      "Analyze time and space complexity using asymptotic Big-O notation.",
      "Apply two-pointer and sliding window techniques in linear O(N) time.",
      "Utilize monotonic stack invariants to solve Next Greater Element problems.",
      "Leverage O(1) hash maps to eliminate quadratic nested iterations.",
      "Traverse binary search trees and implement BFS shortest path in graphs.",
      "Solve optimization problems with overlapping subproblems using dynamic programming."
  ],
  estimatedDurationMinutes: 480,
  publicationStatus: "published",
  modules: dsaMasteryModules,
};
