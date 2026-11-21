import type {
  ExerciseTestCase,
  LearningCheckpoint,
  LearningCourse,
  LearningLesson,
  LearningModule,
  LearningObjective,
  LearningSubject,
} from "@/lib/learning-curriculum";

export const cppProgrammingSubject: LearningSubject = {
  id: "cpp-systems",
  title: "C++ Systems & Object-Oriented Programming",
  description: "Modern C++17 systems programming, RAII resource management, templates, and STL algorithms.",
};

const objectives: LearningObjective[] = [
  { id: "cpp-ref-const", title: "Use lvalue references, const references, and function overloading safely without unnecessary copies." },
  { id: "cpp-raii-classes", title: "Implement RAII classes with deterministic constructor acquisition and destructor resource release." },
  { id: "cpp-op-overload", title: "Overload arithmetic and stream operators while enforcing const correctness and value semantics." },
  { id: "cpp-stl-vectors", title: "Utilize std::vector and std::array with capacity management, iterators, and cache-friendly layout." },
  { id: "cpp-stl-maps", title: "Employ std::map and std::unordered_map for logarithmic and amortized O(1) key-value indexing." },
  { id: "cpp-stl-algos", title: "Compose STL algorithms (std::transform, std::copy_if, std::accumulate) with modern C++ lambdas." },
  { id: "cpp-smart-ptrs", title: "Enforce single and shared ownership semantics using std::unique_ptr and std::shared_ptr." },
  { id: "cpp-templates", title: "Write reusable generic functions and container class templates with compile-time type safety." },
  { id: "cpp-move-semantics", title: "Apply rvalue references and std::move for zero-copy ownership transfer." },
  { id: "cpp-lambdas-capture", title: "Capture state with lambdas and pass callbacks via std::function." },
  { id: "cpp-concurrency-threads", title: "Coordinate multithreaded tasks using std::thread and std::lock_guard." },
  { id: "cpp-capstone-quiz", title: "Synthesize modern C++ idioms, RAII, STL, and memory management." },
];

function testCase(
  id: string,
  label: string,
  expectedStdout: string,
  stdin = "",
  hidden = false,
  matchMode: "exact" | "trimmed" | "contains" = "trimmed",
): ExerciseTestCase {
  return { id, label, expectedStdout, stdin, hidden, matchMode };
}

function checkpoint(prompt: string, answer: string): LearningCheckpoint {
  return { prompt, answer };
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

export const cppProgrammingLessons: LearningLesson[] = [
  // Module 1: C++ Foundations, References & RAII
  {
    id: "cpp-references-overloading",
    order: 1,
    title: "References, Const Correctness & Function Overloading",
    summary: "Replace pointer syntax with memory-safe references, prevent mutation using const correctness, and resolve overloaded functions.",
    type: "guided-coding",
    objectiveIds: ["cpp-ref-const"],
    prerequisiteLessonIds: [],
    estimatedDurationMinutes: 25,
    execution: {
      language: "cpp",
    },
    content: `# References, Const Correctness & Function Overloading

In C, passing data by reference requires raw pointer variables, explicit address-of operators (\`&\`), and dereference syntax (\`*\`). While powerful, pointers introduce nullability, pointer arithmetic hazards, and uninitialized access.

C++ introduces **lvalue references** (\`Type&\`), which act as permanent aliases to existing memory locations. Once bound during initialization, a reference cannot be rebound to a different object, nor can it be null.

\`\`\`cpp
int x = 42;
int& ref = x;   // ref is an alias for x
ref = 100;      // modifies x directly
\`\`\`

## Const References for Zero-Cost Parameter Passing

When passing large objects, structs, or strings, passing by value incurs deep copy overhead. Passing by non-const reference exposes data to unintended mutation. Passing by **const reference** (\`const Type&\`) guarantees zero copying while enforcing read-only access at compile time:

\`\`\`cpp
void printMessage(const std::string& message) {
    // message is passed without copying; mutation generates a compiler error
    std::cout << message << "\\n";
}
\`\`\`

## Function Overloading

C++ allows multiple functions in the same scope to share the same name, provided their parameter types, counts, or const qualifiers differ. The compiler generates distinct symbols at compile time via **name mangling**.`,
    theorySections: [
      {
        id: "sec-pointers-vs-references-memory-model",
        title: "Pointers vs References Memory Model",
        content: `Under the hood, C++ compilers typically implement references as \`const\` pointers that are automatically dereferenced by the compiler. However, the C++ standard does not mandate that references occupy memory if their usage can be optimized into direct register addressing.

Key differences from pointers:
1. **No Null References**: A reference must always refer to a valid object.
2. **Cannot Be Re-assigned**: Assigning to a reference modifies the referenced object, not the reference itself.
3. **No Address-of Dereference Confusion**: The \`&\` symbol in a declaration specifies a reference type; in an expression, it extracts the address of the referent.`,
      },
      {
        id: "sec-const-correctness-as-an-api-contract",
        title: "Const Correctness as an API Contract",
        content: `Const correctness ensures that functions declare whether they mutate caller data. When a parameter is marked \`const Type&\`, temporary rvalues can also bind directly to it, extending the temporary's lifetime to the scope of the function call.`,
      },
    ],
    codeExamples: [
      {
        title: "Pass by Reference and Overloaded Math",
        language: "cpp",
        description: "Demonstrates pass-by-reference swap and function overloading.",
        code: `#include <iostream>

void swapNumbers(int& a, int& b) {
    int temp = a;
    a = b;
    b = temp;
}

double compute(double val) {
    return val * val;
}

double compute(double base, double exp) {
    double res = 1.0;
    for (int i = 0; i < (int)exp; ++i) res *= base;
    return res;
}

int main() {
    int x = 10, y = 20;
    swapNumbers(x, y);
    std::cout << "x=" << x << " y=" << y << "\\n";
    std::cout << "Square: " << compute(4.0) << "\\n";
    std::cout << "Power: " << compute(2.0, 3.0) << "\\n";
    return 0;
}`,
      },
    ],
    exercise: {
      id: "ex-cpp-references",
      title: "Implement Swap and Formatted Scalar Multiply",
      difficulty: "Developing",
      objectiveId: "cpp-ref-const",
      prompt: "Implement an overloaded function `scale(int& val, int factor)` that scales an integer in-place by reference, and `scale(const std::string& str, int count)` that returns a repeated string.",
      expectedOutcome: "Outputs scaled integer and repeated string matching test assertions.",
      starterCode: `#include <iostream>
#include <string>

// TODO: Implement void scale(int& val, int factor)
// TODO: Implement std::string scale(const std::string& str, int count)

int main() {
    int value = 15;
    // Scale value by 3
    // Print: "Scaled: " << value
    // Print repeated: scale("KAT", 3)
    return 0;
}
`,
      solution: `#include <iostream>
#include <string>

void scale(int& val, int factor) {
    val *= factor;
}

std::string scale(const std::string& str, int count) {
    std::string res;
    for (int i = 0; i < count; ++i) {
        res += str;
    }
    return res;
}

int main() {
    int value = 15;
    scale(value, 3);
    std::cout << "Scaled: " << value << "\\n";
    std::cout << "Repeated: " << scale("KAT", 3) << "\\n";
    return 0;
}
`,
      hints: [
        "Pass the integer by reference using `int& val` so modifications affect the caller's variable.",
        "Pass the string by const reference `const std::string& str` to avoid unnecessary copies.",
      ],
      testCases: [
        testCase("tc-scale-1", "Verify integer scaling and string repetition", "Scaled: 45\nRepeated: KATKATKAT"),
      ],
    },
    checkpoint: checkpoint(
      "Why is `const std::string&` preferred over `std::string` as a function parameter type?",
      "It avoids heap-allocating and copying the entire string buffer while preventing unintended mutations."
    ),
  },

  {
    id: "cpp-classes-raii",
    order: 2,
    title: "Classes, Encapsulation, Constructors & RAII",
    summary: "Structure clean object-oriented classes with private members, initializer lists, and deterministic RAII cleanup.",
    type: "guided-coding",
    objectiveIds: ["cpp-raii-classes"],
    prerequisiteLessonIds: ["cpp-references-overloading"],
    estimatedDurationMinutes: 30,
    execution: {
      language: "cpp",
    },
    content: `# Classes, Encapsulation, Constructors & RAII

**Resource Acquisition Is Initialization (RAII)** is the core architectural principle of modern C++. It dictates that resource lifetime—heap memory, file handles, sockets, mutex locks—is tied strictly to object lifetime.

When an object is created on the stack:
1. Its **constructor** acquires the resource and establishes class invariants.
2. The resource remains safely encapsulated in private fields.
3. When the object leaves its lexical scope, its **destructor** automatically executes, releasing the resource without requiring manual cleanup calls.

\`\`\`cpp
class MemoryBuffer {
private:
    size_t size_;
    int* data_;

public:
    // Member initializer list
    explicit MemoryBuffer(size_t size) : size_(size), data_(new int[size]{}) {
        std::cout << "Acquired buffer of size " << size_ << "\\n";
    }

    ~MemoryBuffer() {
        delete[] data_;
        std::cout << "Released buffer\\n";
    }
};
\`\`\``,
    theorySections: [
      {
        id: "sec-member-initializer-lists",
        title: "Member Initializer Lists",
        content: `Initializing member variables in the constructor header (\`: member_(val)\`) constructs them in-place. Assigning inside the constructor body (\`{ member_ = val; }\`) first default-constructs the member and then performs an assignment, duplicating work and failing on const or reference members.`,
      },
      {
        id: "sec-the-guarantee-of-scope-bound-cleanup",
        title: "The Guarantee of Scope-Bound Cleanup",
        content: `Stack unwinding guarantees that destructors run for all fully-constructed local objects whenever a scope exits, whether by normal return or early exit.`,
      },
    ],
    codeExamples: [
      {
        title: "RAII Scoped Resource",
        language: "cpp",
        description: "Shows constructor acquisition and automatic destructor cleanup.",
        code: `#include <iostream>

class ScopedTimer {
    std::string name_;
public:
    explicit ScopedTimer(std::string name) : name_(std::move(name)) {
        std::cout << "[START] " << name_ << "\\n";
    }
    ~ScopedTimer() {
        std::cout << "[STOP] " << name_ << "\\n";
    }
};

void runTask() {
    ScopedTimer t("DataPipeline");
    std::cout << "Executing pipeline tasks...\\n";
}

int main() {
    runTask();
    std::cout << "Exited runTask\\n";
    return 0;
}`,
      },
    ],
    exercise: {
      id: "ex-cpp-raii",
      title: "Build a Managed Ring Buffer with RAII",
      difficulty: "Developing",
      objectiveId: "cpp-raii-classes",
      prompt: "Create a class `ManagedArray` with private dynamic int array, constructor taking `size_t capacity`, a `set(size_t index, int val)` method, a `get(size_t index) const` method, and a destructor that prints `Array destroyed`.",
      expectedOutcome: "Outputs elements and confirms automatic destruction.",
      starterCode: `#include <iostream>

class ManagedArray {
private:
    size_t capacity_;
    int* buffer_;
public:
    // TODO: Constructor initializing capacity_ and buffer_
    // TODO: Destructor freeing buffer_ and printing "Array destroyed\\n"
    // TODO: set(size_t idx, int val) and get(size_t idx) const
};

int main() {
    {
        ManagedArray arr(3);
        arr.set(0, 100);
        arr.set(1, 200);
        arr.set(2, 300);
        std::cout << "arr[1]=" << arr.get(1) << "\\n";
    }
    std::cout << "Scope finished\\n";
    return 0;
}
`,
      solution: `#include <iostream>

class ManagedArray {
private:
    size_t capacity_;
    int* buffer_;
public:
    explicit ManagedArray(size_t capacity)
        : capacity_(capacity), buffer_(new int[capacity]{}) {}

    ~ManagedArray() {
        delete[] buffer_;
        std::cout << "Array destroyed\\n";
    }

    void set(size_t idx, int val) {
        if (idx < capacity_) buffer_[idx] = val;
    }

    int get(size_t idx) const {
        return (idx < capacity_) ? buffer_[idx] : -1;
    }
};

int main() {
    {
        ManagedArray arr(3);
        arr.set(0, 100);
        arr.set(1, 200);
        arr.set(2, 300);
        std::cout << "arr[1]=" << arr.get(1) << "\\n";
    }
    std::cout << "Scope finished\\n";
    return 0;
}
`,
      hints: [
        "Allocate dynamic storage with `new int[capacity]{}` to initialize elements to zero.",
        "Free the allocated array in the destructor using `delete[] buffer_;`.",
      ],
      testCases: [
        testCase("tc-raii-1", "Verify elements and deterministic destructor", "arr[1]=200\nArray destroyed\nScope finished"),
      ],
    },
    checkpoint: checkpoint(
      "When is an object's destructor executed in C++?",
      "Automatically when the object's enclosing lexical scope terminates or when deleted from the heap."
    ),
  },

  {
    id: "cpp-operator-overloading",
    order: 3,
    title: "Operator Overloading & Custom Copy/Move Semantics",
    summary: "Overload arithmetic and stream operators while enforcing value semantics, rule of five, and const correctness.",
    type: "guided-coding",
    objectiveIds: ["cpp-op-overload"],
    prerequisiteLessonIds: ["cpp-classes-raii"],
    estimatedDurationMinutes: 25,
    execution: {
      language: "cpp",
    },
    content: `# Operator Overloading & Value Semantics

In C++, user-defined types can behave identically to fundamental types by **overloading operators**. This allows clean, readable syntax such as \`v1 + v2\` or \`std::cout << vec\` instead of verbose method calls like \`v1.add(v2)\`.

\`\`\`cpp
struct Point2D {
    double x;
    double y;

    // Overload + operator
    Point2D operator+(const Point2D& other) const {
        return Point2D{x + other.x, y + other.y};
    }
};
\`\`\`

## Stream Insertion Operator (\`<<\`)

Because the left operand of \`std::cout << obj\` is an \`std::ostream&\`, the stream operator must be overloaded as a non-member function:

\`\`\`cpp
std::ostream& operator<<(std::ostream& os, const Point2D& p) {
    os << "(" << p.x << ", " << p.y << ")";
    return os; // returns stream to support chaining
}
\`\`\``,
    theorySections: [
      {
        id: "sec-member-vs-non-member-operators",
        title: "Member vs Non-Member Operators",
        content: `Operators that modify the left operand (like \`+=\`, \`-=\`, \`[]\`) are best implemented as member functions. Symmetrical binary operators (like \`+\`, \`==\`) are often implemented as non-member functions to allow implicit conversions on both left and right operands.`,
      },
      {
        id: "sec-chaining-operators-by-returning-references",
        title: "Chaining Operators by Returning References",
        content: `Stream insertion operators must return \`os\` by reference (\`std::ostream&\`) so statements like \`std::cout << a << b << "\\n";\` evaluate left-to-right without copies.`,
      },
    ],
    codeExamples: [
      {
        title: "2D Vector Overloading",
        language: "cpp",
        description: "Shows addition, scalar multiplication, and stream output for 2D vectors.",
        code: `#include <iostream>

struct Vec2 {
    double x, y;
    Vec2 operator+(const Vec2& rhs) const {
        return {x + rhs.x, y + rhs.y};
    }
    Vec2 operator*(double scalar) const {
        return {x * scalar, y * scalar};
    }
};

std::ostream& operator<<(std::ostream& os, const Vec2& v) {
    return os << "[" << v.x << ", " << v.y << "]";
}

int main() {
    Vec2 a{1.5, 2.0};
    Vec2 b{3.5, 4.0};
    Vec2 c = (a + b) * 2.0;
    std::cout << "Result: " << c << "\\n";
    return 0;
}`,
      },
    ],
    exercise: {
      id: "ex-cpp-operators",
      title: "Implement Complex Number Addition and Multiplication",
      difficulty: "Developing",
      objectiveId: "cpp-op-overload",
      prompt: "Implement a `Complex` struct with `real` and `imag` doubles, overloading `operator+`, `operator*`, and `operator<<` printing `a + bi`.",
      expectedOutcome: "Outputs formatted complex arithmetic results.",
      starterCode: `#include <iostream>

struct Complex {
    double real;
    double imag;

    // TODO: operator+
    // TODO: operator* (a+bi)*(c+di) = (ac - bd) + (ad + bc)i
};

// TODO: operator<< printing "real + imag i"

int main() {
    Complex c1{3.0, 2.0};
    Complex c2{1.0, 4.0};
    Complex sum = c1 + c2;
    Complex prod = c1 * c2;
    std::cout << "Sum: " << sum << "\\n";
    std::cout << "Prod: " << prod << "\\n";
    return 0;
}
`,
      solution: `#include <iostream>

struct Complex {
    double real;
    double imag;

    Complex operator+(const Complex& rhs) const {
        return {real + rhs.real, imag + rhs.imag};
    }

    Complex operator*(const Complex& rhs) const {
        return {
            real * rhs.real - imag * rhs.imag,
            real * rhs.imag + imag * rhs.real
        };
    }
};

std::ostream& operator<<(std::ostream& os, const Complex& c) {
    return os << c.real << " + " << c.imag << "i";
}

int main() {
    Complex c1{3.0, 2.0};
    Complex c2{1.0, 4.0};
    Complex sum = c1 + c2;
    Complex prod = c1 * c2;
    std::cout << "Sum: " << sum << "\\n";
    std::cout << "Prod: " << prod << "\\n";
    return 0;
}
`,
      hints: [
        "In complex multiplication: `(a + bi) * (c + di) = (ac - bd) + (ad + bc)i`.",
        "Ensure `operator<<` returns the `os` reference for stream chaining.",
      ],
      testCases: [
        testCase("tc-op-1", "Verify complex addition and multiplication", "Sum: 4 + 6i\nProd: -5 + 14i"),
      ],
    },
    checkpoint: checkpoint(
      "Why must `operator<<` return `std::ostream&`?",
      "To enable chained stream insertions like `std::cout << a << b;` without creating stream copies."
    ),
  },

  // Module 2: The Standard Template Library (STL) & Iterators
  {
    id: "cpp-stl-vector-sequence",
    order: 4,
    title: "Sequence Containers: Vector, Deque, and Array",
    summary: "Utilize std::vector and std::array with capacity management, iterators, and cache-friendly layout.",
    type: "guided-coding",
    objectiveIds: ["cpp-stl-vectors"],
    prerequisiteLessonIds: ["cpp-operator-overloading"],
    estimatedDurationMinutes: 25,
    execution: {
      language: "cpp",
    },
    content: `# Sequence Containers in Modern C++

The C++ Standard Template Library provides contiguous and segmented sequence containers:

1. **\`std::vector<T>\`**: Dynamically resizing contiguous array. It provides amortized $O(1)$ append operations, $O(1)$ random access, and optimal CPU cache locality.
2. **\`std::array<T, N>\`**: Fixed-size compile-time array allocated on the stack. Replaces dangerous C-style raw arrays with type-safe methods.
3. **\`std::deque<T>\`**: Double-ended queue with $O(1)$ insertions at both head and tail without shifting middle elements.

\`\`\`cpp
#include <vector>
#include <iostream>

std::vector<int> numbers;
numbers.reserve(100); // Pre-allocates buffer to prevent reallocation churn
numbers.push_back(10);
numbers.emplace_back(20); // Constructs in-place
\`\`\`

## Safety with \`.at()\` vs \`[]\`

The bracket operator \`numbers[i]\` performs unchecked access for raw speed. The \`numbers.at(i)\` method performs runtime bounds verification and throws an \`std::out_of_range\` exception if invalid.`,
    theorySections: [
      {
        id: "sec-dynamic-resizing-and-amortized-o-1",
        title: "Dynamic Resizing and Amortized O(1)",
        content: `When a vector reaches its capacity, it allocates a new buffer (typically 1.5x or 2x the old capacity), copies or moves all existing elements, and destroys the old storage. Pre-allocating via \`reserve(n)\` avoids intermediate allocations.`,
      },
      {
        id: "sec-cache-locality-of-contiguous-memory",
        title: "Cache Locality of Contiguous Memory",
        content: `Because \`std::vector\` stores elements sequentially in contiguous RAM, CPU cache line pre-fetchers load sequential elements ahead of time, eliminating RAM latency stalls.`,
      },
    ],
    codeExamples: [
      {
        title: "Vector Capacity and Iteration",
        language: "cpp",
        description: "Demonstrates size, capacity, reserve, and range-based for loops.",
        code: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> data = {1, 2, 3, 4, 5};
    data.push_back(6);
    std::cout << "Size: " << data.size() << " Capacity: " << data.capacity() << "\\n";

    int sum = 0;
    for (int x : data) {
        sum += x;
    }
    std::cout << "Sum: " << sum << "\\n";
    return 0;
}`,
      },
    ],
    exercise: {
      id: "ex-cpp-vector",
      title: "Buffer Capacity Optimization & In-Place Processing",
      difficulty: "Developing",
      objectiveId: "cpp-stl-vectors",
      prompt: "Read integer count `N` from stdin, reserve space in `std::vector<int>`, populate with `N` integers read from stdin, double each odd number, and print the resulting elements separated by spaces.",
      expectedOutcome: "Outputs processed elements after vector transformations.",
      starterCode: `#include <iostream>
#include <vector>

int main() {
    int n;
    if (!(std::cin >> n) || n <= 0) return 0;

    std::vector<int> vec;
    // TODO: reserve capacity for n elements
    // TODO: read n elements into vec
    // TODO: double every odd number
    // TODO: print elements separated by space

    return 0;
}
`,
      solution: `#include <iostream>
#include <vector>

int main() {
    int n;
    if (!(std::cin >> n) || n <= 0) return 0;

    std::vector<int> vec;
    vec.reserve(n);

    for (int i = 0; i < n; ++i) {
        int val;
        std::cin >> val;
        vec.push_back(val);
    }

    for (size_t i = 0; i < vec.size(); ++i) {
        if (vec[i] % 2 != 0) {
            vec[i] *= 2;
        }
        std::cout << vec[i] << (i + 1 == vec.size() ? "" : " ");
    }
    std::cout << "\\n";
    return 0;
}
`,
      hints: [
        "Call `vec.reserve(n)` before reading inputs to prevent dynamic reallocations.",
        "Check odd parity using `vec[i] % 2 != 0`.",
      ],
      testCases: [
        testCase("tc-vec-1", "Double odd values", "4 2 6 4 10", "5\n2 1 3 4 5"),
        testCase("tc-vec-2", "All even numbers unchanged", "2 4 6 8", "4\n2 4 6 8"),
      ],
    },
    checkpoint: checkpoint(
      "What is the time complexity of appending an element to a `std::vector` when capacity is exceeded?",
      "O(N) to reallocate and move existing elements, but amortized O(1) across a sequence of appends."
    ),
  },

  {
    id: "cpp-stl-associative-maps",
    order: 5,
    title: "Associative Containers: Maps and Hash Tables",
    summary: "Employ std::map and std::unordered_map for logarithmic and amortized O(1) key-value indexing.",
    type: "guided-coding",
    objectiveIds: ["cpp-stl-maps"],
    prerequisiteLessonIds: ["cpp-stl-vector-sequence"],
    estimatedDurationMinutes: 25,
    execution: {
      language: "cpp",
    },
    content: `# Associative Containers: Maps & Hash Tables

When indexing data by keys (such as student names, device UUIDs, or word frequencies), C++ offers two primary container architectures:

1. **\`std::map<Key, Value>\`**:
   - Implemented as a self-balancing Red-Black binary search tree.
   - Keys are kept strictly sorted ($O(\\log N)$ lookup, insertion, and deletion).
   - In-order traversal yields sorted output automatically.

2. **\`std::unordered_map<Key, Value>\`**:
   - Implemented as an array of hash buckets.
   - Keys require an \`std::hash\` function ($O(1)$ average lookup).
   - Elements are stored in undefined hash order.

\`\`\`cpp
#include <map>
#include <unordered_map>
#include <iostream>

std::map<std::string, int> scores;
scores["Alice"] = 95;
scores["Bob"] = 88;

for (const auto& [name, score] : scores) { // C++17 structured binding
    std::cout << name << ": " << score << "\\n";
}
\`\`\``,
    theorySections: [
      {
        id: "sec-structured-bindings-in-c-17",
        title: "Structured Bindings in C++17",
        content: `C++17 introduced structured bindings: \`for (const auto& [key, value] : map)\`. This eliminates verbose iterator syntax (\`it->first\` and \`it->second\`) while maintaining const reference safety.`,
      },
      {
        id: "sec-subscript-operator-vs-find-and-at",
        title: "Subscript Operator vs .find() and .at()",
        content: `Accessing \`map[key]\` automatically default-constructs a new entry if the key does not exist. To perform read-only inspection without unintended insertions, use \`map.find(key)\` or \`map.count(key)\`.`,
      },
    ],
    codeExamples: [
      {
        title: "Word Frequency Counter",
        language: "cpp",
        description: "Uses std::map to count occurrences and print them sorted alphabetically.",
        code: `#include <iostream>
#include <map>
#include <string>

int main() {
    std::map<std::string, int> freq;
    std::string words[] = {"apple", "banana", "apple", "cherry", "banana", "apple"};

    for (const auto& w : words) {
        freq[w]++;
    }

    for (const auto& [word, count] : freq) {
        std::cout << word << ": " << count << "\\n";
    }
    return 0;
}`,
      },
    ],
    exercise: {
      id: "ex-cpp-maps",
      title: "Telemetry Sensor Register Aggregator",
      difficulty: "Developing",
      objectiveId: "cpp-stl-maps",
      prompt: "Read `N` lines containing sensor name and measurement integer. Store total readings and count in `std::map<std::string, int>`, and output each sensor with its accumulated reading sorted by name.",
      expectedOutcome: "Outputs alphabetical sensor totals.",
      starterCode: `#include <iostream>
#include <map>
#include <string>

int main() {
    int n;
    if (!(std::cin >> n)) return 0;

    std::map<std::string, int> telemetry;
    // TODO: Read n pairs of (name, value) and accumulate into telemetry
    // TODO: Print each sensor as "sensor_name: total_value"

    return 0;
}
`,
      solution: `#include <iostream>
#include <map>
#include <string>

int main() {
    int n;
    if (!(std::cin >> n)) return 0;

    std::map<std::string, int> telemetry;
    for (int i = 0; i < n; ++i) {
        std::string sensor;
        int reading;
        std::cin >> sensor >> reading;
        telemetry[sensor] += reading;
    }

    for (const auto& [sensor, total] : telemetry) {
        std::cout << sensor << ": " << total << "\\n";
    }
    return 0;
}
`,
      hints: [
        "`std::map` will automatically keep sensor keys alphabetically ordered.",
        "Using `telemetry[sensor] += reading` initializes missing keys to 0 before adding.",
      ],
      testCases: [
        testCase("tc-map-1", "Aggregate multiple sensor readings", "temp: 45\nvoltage: 12", "4\ntemp 20\nvoltage 5\ntemp 25\nvoltage 7"),
      ],
    },
    checkpoint: checkpoint(
      "Why does `std::map` guarantee sorted keys while `std::unordered_map` does not?",
      "`std::map` is backed by a balanced binary search tree, whereas `std::unordered_map` uses an array of hash buckets."
    ),
  },

  {
    id: "cpp-stl-algorithms-iterators",
    order: 6,
    title: "STL Iterators, Lambdas, and Functional Algorithms",
    summary: "Compose STL algorithms like std::transform and std::copy_if with modern C++ lambdas.",
    type: "guided-coding",
    objectiveIds: ["cpp-stl-algos"],
    prerequisiteLessonIds: ["cpp-stl-associative-maps"],
    estimatedDurationMinutes: 30,
    execution: {
      language: "cpp",
    },
    content: `# STL Iterators & Functional Algorithms

Modern C++ discourages hand-rolled index-based \`for\` loops in favor of standard algorithms from the \`<algorithm>\` and \`<numeric>\` headers. Algorithms operate on **iterators**, which generalize pointers across containers.

\`\`\`cpp
#include <algorithm>
#include <numeric>
#include <vector>
#include <iostream>

std::vector<int> nums = {5, 2, 8, 1, 9};

// Sort in ascending order
std::sort(nums.begin(), nums.end());

// Sum all values
int total = std::accumulate(nums.begin(), nums.end(), 0);
\`\`\`

## Lambda Expressions

A lambda expression defines an anonymous, inline callable function object:

\`\`\`cpp
// [capture](parameters) -> return_type { body }
auto isEven = [](int n) { return n % 2 == 0; };
int evens = std::count_if(nums.begin(), nums.end(), isEven);
\`\`\``,
    theorySections: [
      {
        id: "sec-iterator-abstraction-and-half-open-ranges",
        title: "Iterator Abstraction and Half-Open Ranges",
        content: `All STL algorithms operate on half-open intervals: \`[first, last)\`. \`last\` points one past the final valid element, enabling consistent termination conditions (\`it != end\`) and representing empty ranges when \`begin == end\`.`,
      },
      {
        id: "sec-lambda-capture-modes",
        title: "Lambda Capture Modes",
        content: `Lambdas can capture variables from their enclosing scope: \`[threshold]\` captures a copy of \`threshold\`, while \`[&logger]\` captures \`logger\` by reference.`,
      },
    ],
    codeExamples: [
      {
        title: "Transform and Filter Pipeline",
        language: "cpp",
        description: "Uses std::transform and std::copy_if with lambdas.",
        code: `#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> src = {1, 2, 3, 4, 5, 6};
    std::vector<int> evens;

    // Filter even numbers
    std::copy_if(src.begin(), src.end(), std::back_inserter(evens), [](int n) {
        return n % 2 == 0;
    });

    // Square all filtered numbers
    std::transform(evens.begin(), evens.end(), evens.begin(), [](int n) {
        return n * n;
    });

    for (int v : evens) std::cout << v << " ";
    std::cout << "\\n";
    return 0;
}`,
      },
    ],
    exercise: {
      id: "ex-cpp-algorithms",
      title: "Filter and Sum Above Threshold",
      difficulty: "Developing",
      objectiveId: "cpp-stl-algos",
      prompt: "Read integer threshold `T` and count `N`, followed by `N` integers. Use `std::copy_if` to collect values greater than `T`, compute their sum with `std::accumulate`, and print `Count: C Sum: S`.",
      expectedOutcome: "Outputs count and sum of filtered values.",
      starterCode: `#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>

int main() {
    int threshold, n;
    if (!(std::cin >> threshold >> n)) return 0;

    std::vector<int> values(n);
    for (int i = 0; i < n; ++i) std::cin >> values[i];

    // TODO: Filter elements > threshold into a new vector using std::copy_if and back_inserter
    // TODO: Compute sum using std::accumulate
    // TODO: Print "Count: " << count << " Sum: " << sum

    return 0;
}
`,
      solution: `#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>

int main() {
    int threshold, n;
    if (!(std::cin >> threshold >> n)) return 0;

    std::vector<int> values(n);
    for (int i = 0; i < n; ++i) std::cin >> values[i];

    std::vector<int> filtered;
    std::copy_if(values.begin(), values.end(), std::back_inserter(filtered), [threshold](int x) {
        return x > threshold;
    });

    int total = std::accumulate(filtered.begin(), filtered.end(), 0);
    std::cout << "Count: " << filtered.size() << " Sum: " << total << "\\n";
    return 0;
}
`,
      hints: [
        "Capture threshold in lambda: `[threshold](int x) { return x > threshold; }`.",
        "Use `std::back_inserter(filtered)` as the destination iterator.",
      ],
      testCases: [
        testCase("tc-algo-1", "Filter and sum integers", "Count: 3 Sum: 110", "15 5\n10 20 30 15 60"),
      ],
    },
    checkpoint: checkpoint(
      "What does `std::back_inserter(container)` do when passed as an output iterator?",
      "It creates an iterator that automatically invokes `container.push_back()` for each assigned element."
    ),
  },

  // Module 3: Memory Safety, Smart Pointers & Generic Programming
  {
    id: "cpp-smart-pointers",
    order: 7,
    title: "Smart Pointers: Ownership with unique_ptr and shared_ptr",
    summary: "Enforce single and shared ownership semantics using std::unique_ptr and std::shared_ptr.",
    type: "guided-coding",
    objectiveIds: ["cpp-smart-ptrs"],
    prerequisiteLessonIds: ["cpp-stl-algorithms-iterators"],
    estimatedDurationMinutes: 30,
    execution: {
      language: "cpp",
    },
    content: `# Smart Pointers: Unique and Shared Ownership

Raw pointers (\`T*\`) provide no indication of resource ownership: who allocates, who frees, and whether an object has already been deleted. Modern C++ eliminates manual \`new\` and \`delete\` in favor of **smart pointers** from \`<memory>\`.

## 1. \`std::unique_ptr<T>\` (Exclusive Ownership)

A \`std::unique_ptr\` maintains exclusive ownership of a dynamic object. It cannot be copied, only **moved** (\`std::move\`). When the pointer leaves scope, it automatically deletes its managed resource with zero runtime overhead compared to a raw pointer.

\`\`\`cpp
#include <memory>

auto ptr = std::make_unique<int>(42);
// auto copy = ptr; // COMPILE ERROR: unique_ptr is non-copyable
auto moved = std::move(ptr); // Ownership transferred; ptr is now nullptr
\`\`\`

## 2. \`std::shared_ptr<T>\` (Shared Ownership)

A \`std::shared_ptr\` maintains an atomic reference count. When copies are made, the count increments; when instances are destroyed, the count decrements. When the counter reaches zero, the managed object is destroyed.`,
    theorySections: [
      {
        id: "sec-why-std-make-unique-and-std-make-shared-are-mandatory",
        title: "Why std::make_unique and std::make_shared Are Mandatory",
        content: `Using \`std::make_unique<T>()\` avoids bare \`new\` calls and guarantees exception safety. \`std::make_shared<T>()\` performs a single contiguous heap allocation for both the control block (ref count) and the managed object.`,
      },
      {
        id: "sec-preventing-circular-references-with-std-weak-ptr",
        title: "Preventing Circular References with std::weak_ptr",
        content: `When two objects hold \`std::shared_ptr\` to each other, their reference counts can never reach zero. A \`std::weak_ptr\` provides a non-owning observer that does not increment the count and can be checked for validity via \`.lock()\`.`,
      },
    ],
    codeExamples: [
      {
        title: "Unique Ownership Tree Node",
        language: "cpp",
        description: "Demonstrates std::unique_ptr building a binary node tree.",
        code: `#include <iostream>
#include <memory>

struct Node {
    int val;
    std::unique_ptr<Node> left;
    std::unique_ptr<Node> right;
    explicit Node(int v) : val(v) {}
};

int main() {
    auto root = std::make_unique<Node>(10);
    root->left = std::make_unique<Node>(5);
    root->right = std::make_unique<Node>(15);

    std::cout << "Root: " << root->val
              << " Left: " << root->left->val
              << " Right: " << root->right->val << "\\n";
    // Automatic cleanup of entire tree on exit
    return 0;
}`,
      },
    ],
    exercise: {
      id: "ex-cpp-smart-ptrs",
      title: "Task Queue with Unique Ownership",
      difficulty: "Developing",
      objectiveId: "cpp-smart-ptrs",
      prompt: "Implement a struct `Task` with `id` and `payload` string. Write a function `std::unique_ptr<Task> createTask(int id, const std::string& p)` and process tasks stored in a `std::vector<std::unique_ptr<Task>>`, printing their IDs and payloads.",
      expectedOutcome: "Outputs processed unique task payloads.",
      starterCode: `#include <iostream>
#include <memory>
#include <vector>
#include <string>

struct Task {
    int id;
    std::string payload;
};

// TODO: Implement std::unique_ptr<Task> createTask(int id, const std::string& p)

int main() {
    std::vector<std::unique_ptr<Task>> queue;
    // TODO: Create 2 tasks with IDs 1 and 2, push to queue using std::move
    // TODO: Iterate and print: "Task [id]: payload"
    return 0;
}
`,
      solution: `#include <iostream>
#include <memory>
#include <vector>
#include <string>

struct Task {
    int id;
    std::string payload;
};

std::unique_ptr<Task> createTask(int id, const std::string& p) {
    return std::make_unique<Task>(Task{id, p});
}

int main() {
    std::vector<std::unique_ptr<Task>> queue;
    queue.push_back(createTask(1, "TelemetrySync"));
    queue.push_back(createTask(2, "MotorShutdown"));

    for (const auto& task : queue) {
        std::cout << "Task [" << task->id << "]: " << task->payload << "\\n";
    }
    return 0;
}
`,
      hints: [
        "Use `std::make_unique<Task>(Task{id, p})` inside `createTask`.",
        "Iterate the vector by const reference `for (const auto& task : queue)` to avoid copying non-copyable unique_ptrs.",
      ],
      testCases: [
        testCase("tc-smart-1", "Execute unique tasks", "Task [1]: TelemetrySync\nTask [2]: MotorShutdown"),
      ],
    },
    checkpoint: checkpoint(
      "Can a `std::unique_ptr` be copied by assignment (`ptr2 = ptr1`)?",
      "No. `std::unique_ptr` deletes its copy constructor and copy assignment operator; ownership can only be transferred with `std::move`."
    ),
  },

  {
    id: "cpp-templates-polymorphism",
    order: 8,
    title: "Templates, Generic Programming & Polymorphism",
    summary: "Write reusable generic functions and container class templates with compile-time type safety.",
    type: "guided-coding",
    objectiveIds: ["cpp-templates"],
    prerequisiteLessonIds: ["cpp-smart-pointers"],
    estimatedDurationMinutes: 30,
    execution: {
      language: "cpp",
    },
    content: `# Templates & Generic Programming

C++ templates enable **compile-time generic programming**. Rather than writing separate classes or functions for every data type, templates allow the compiler to instantiate specialized machine code for each type used.

\`\`\`cpp
// Generic function template
template <typename T>
T clamp(T val, T low, T high) {
    if (val < low) return low;
    if (val > high) return high;
    return val;
}
\`\`\`

## Class Templates

Class templates generate strongly-typed data structures:

\`\`\`cpp
template <typename T, size_t Capacity>
class FixedStack {
private:
    T data_[Capacity];
    size_t top_ = 0;
public:
    void push(const T& val) {
        if (top_ < Capacity) data_[top_++] = val;
    }
    T pop() {
        return data_[--top_];
    }
};
\`\`\``,
    theorySections: [
      {
        id: "sec-template-instantiation-header-definitions",
        title: "Template Instantiation & Header Definitions",
        content: `Because templates generate code when invoked by caller compilation units, the compiler requires the full function body to generate binary symbols for specialized types.`,
      },
      {
        id: "sec-compile-time-vs-runtime-polymorphism",
        title: "Compile-Time vs Runtime Polymorphism",
        content: `Templates provide static polymorphism without vtable overhead or indirection, enabling direct function inlining and aggressive loop unrolling.`,
      },
    ],
    codeExamples: [
      {
        title: "Generic Pair Class Template",
        language: "cpp",
        description: "Demonstrates class template with multiple type parameters.",
        code: `#include <iostream>
#include <string>

template <typename T1, typename T2>
struct KeyValuePair {
    T1 key;
    T2 value;
    void print() const {
        std::cout << key << " => " << value << "\\n";
    }
};

int main() {
    KeyValuePair<std::string, int> age{"Alice", 30};
    KeyValuePair<int, double> sensor{101, 3.1415};
    age.print();
    sensor.print();
    return 0;
}`,
      },
    ],
    exercise: {
      id: "ex-cpp-templates",
      title: "Build a Generic Stack Template",
      difficulty: "Developing",
      objectiveId: "cpp-templates",
      prompt: "Implement a generic `SimpleStack<T>` class template with dynamic vector storage, `push(const T& val)`, `pop()`, and `peek() const`. Test with both integers and strings.",
      expectedOutcome: "Outputs top elements after stack operations.",
      starterCode: `#include <iostream>
#include <vector>
#include <string>

// TODO: Implement template <typename T> class SimpleStack

int main() {
    // Test with int
    // SimpleStack<int> s1; s1.push(10); s1.push(20);
    // std::cout << "Int Top: " << s1.peek() << "\\n";

    // Test with std::string
    // SimpleStack<std::string> s2; s2.push("Alpha"); s2.push("Beta");
    // std::cout << "Str Top: " << s2.peek() << "\\n";
    return 0;
}
`,
      solution: `#include <iostream>
#include <vector>
#include <string>

template <typename T>
class SimpleStack {
private:
    std::vector<T> items_;
public:
    void push(const T& val) {
        items_.push_back(val);
    }
    void pop() {
        if (!items_.empty()) items_.pop_back();
    }
    const T& peek() const {
        return items_.back();
    }
    bool empty() const {
        return items_.empty();
    }
};

int main() {
    SimpleStack<int> s1;
    s1.push(10);
    s1.push(20);
    std::cout << "Int Top: " << s1.peek() << "\\n";

    SimpleStack<std::string> s2;
    s2.push("Alpha");
    s2.push("Beta");
    std::cout << "Str Top: " << s2.peek() << "\\n";
    return 0;
}
`,
      hints: [
        "Define `template <typename T>` immediately above `class SimpleStack`.",
        "Store elements in a private `std::vector<T> items_;`.",
      ],
      testCases: [
        testCase("tc-tpl-1", "Verify generic stack with int and string", "Int Top: 20\nStr Top: Beta"),
      ],
    },
    checkpoint: checkpoint(
      "What is the performance difference between static template polymorphism and dynamic virtual function polymorphism?",
      "Static templates are resolved at compile time with zero vtable pointer indirection and full compiler inlining."
    ),
  },

  {
    id: "cpp-move-semantics-rvalue",
    order: 9,
    title: "Move Semantics and Rvalue References",
    summary: "Eliminate expensive buffer copies using rvalue references (T&&) and std::move transfer semantics.",
    type: "guided-coding",
    objectiveIds: ["cpp-move-semantics"],
    prerequisiteLessonIds: ["cpp-templates-polymorphism"],
    estimatedDurationMinutes: 30,
    content: `Prior to C++11, copying objects holding dynamic heap buffers required allocating a duplicate buffer and copying each element. **Move semantics** solves this by transferring ownership of internal resources from temporary objects (rvalues) without copying.

### Rvalue References (T&&)
An rvalue reference \`T&&\` binds specifically to temporary objects that are about to be destroyed.

### std::move
\`std::move\` does not move anything itself; it unconditionally casts its argument to an rvalue reference, enabling the move constructor or move assignment operator to be selected.

~~~cpp
#include <iostream>
#include <vector>
#include <utility>

struct Buffer {
    std::vector<int> data;
    Buffer(size_t size) : data(size, 1) {}
    Buffer(Buffer&& other) noexcept : data(std::move(other.data)) {
        std::cout << "Moved!\\n";
    }
};
~~~`,
    theorySections: [
      {
        id: "cpp-move-vs-copy",
        title: "Copy vs. Move Cost",
        content: "A copy of a 1 MB std::vector requires a 1 MB allocation and 1 MB memcpy. A move simply swaps three internal 64-bit pointers (begin, end, capacity) in O(1) time.",
      },
    ],
    codeExamples: [
      {
        title: "Resource Transfer Demonstration",
        language: "cpp",
        code: `#include <iostream>
#include <string>
#include <utility>

void inspect(const std::string& lval) {
    std::cout << "lvalue: " << lval << "\\n";
}

void inspect(std::string&& rval) {
    std::cout << "rvalue moved: " << rval << "\\n";
}

int main() {
    std::string text = "Katalyst Engine";
    inspect(text);
    inspect(std::move(text));
    return 0;
}`,
        description: "Overload resolution between lvalue and rvalue references.",
      },
    ],
    execution: { language: "cpp", target: "browser-wasm" },
    exampleRun: {
      sampleInput: "",
      expectedOutput: "lvalue: Katalyst Engine\nrvalue moved: Katalyst Engine\n",
    },
    exercise: {
      id: "ex-cpp-move-transfer",
      title: "Implement Move Semantics on a Buffer Holder",
      prompt: "Implement a MoveBuffer struct with a std::vector<int> data member. Provide a constructor MoveBuffer(size_t n) filling data with value 42, and a move constructor MoveBuffer(MoveBuffer&& o) noexcept that moves o.data into data and prints 'MOVED'. In main(), construct b1 with size 5, then construct b2 using std::move(b1), and print b2.data.size().",
      objectiveId: "cpp-move-semantics",
      difficulty: "Developing",
      expectedOutcome: "Transfer vector ownership with std::move and output 'MOVED' followed by size 5.",
      starterCode: `#include <iostream>
#include <vector>
#include <utility>

struct MoveBuffer {
    std::vector<int> data;
    // Add constructor and move constructor
};

int main() {
    // Construct b1 and move to b2
    return 0;
}
`,
      solution: `#include <iostream>
#include <vector>
#include <utility>

struct MoveBuffer {
    std::vector<int> data;
    MoveBuffer(size_t n) : data(n, 42) {}
    MoveBuffer(MoveBuffer&& o) noexcept : data(std::move(o.data)) {
        std::cout << "MOVED\\n";
    }
};

int main() {
    MoveBuffer b1(5);
    MoveBuffer b2(std::move(b1));
    std::cout << "Size: " << b2.data.size() << "\\n";
    return 0;
}
`,
      hints: [
        "In the move constructor, initialize `data(std::move(o.data))` in the member initializer list.",
        "Print `MOVED\\n` inside the move constructor body.",
      ],
      testCases: [
        testCase("tc-move-1", "Verify move constructor execution and size", "MOVED\nSize: 5"),
      ],
    },
    checkpoint: checkpoint(
      "What state is a moved-from standard library object left in?",
      "It is left in a valid but unspecified state, meaning it can be safely destroyed or reassigned, but its value cannot be relied upon."
    ),
  },

  {
    id: "cpp-lambdas-capture",
    order: 10,
    title: "Lambda Expressions and Functional Callbacks",
    summary: "Write concise inline lambdas with explicit capture clauses and pass them via std::function.",
    type: "practical-exercise",
    objectiveIds: ["cpp-lambdas-capture"],
    prerequisiteLessonIds: ["cpp-move-semantics-rvalue"],
    estimatedDurationMinutes: 30,
    content: `Lambdas in C++ provide lightweight anonymous function objects (closures) that can capture variables from their enclosing scope.

### Lambda Syntax
\`\`\`cpp
[capture_clause](parameters) -> return_type {
    body;
}
\`\`\`

### Capture Modes
- \`[]\`: Capture nothing.
- \`[=]\`: Capture all outer variables by copy (read-only by default).
- \`[&]\`: Capture all outer variables by reference.
- \`[x, &y]\`: Capture \`x\` by copy and \`y\` by reference.

~~~cpp
#include <iostream>
#include <functional>

void process_data(int val, const std::function<void(int)>& callback) {
    callback(val * 2);
}
~~~`,
    theorySections: [
      {
        id: "cpp-closure-compiler-generation",
        title: "Compiler Closure Types",
        content: "Every lambda expression generates a unique, anonymous struct type with overloaded operator() and member variables corresponding to captured values.",
      },
    ],
    codeExamples: [
      {
        title: "Filter and Transform with Capture Clause",
        language: "cpp",
        code: `#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> readings = {12, 45, 68, 23, 89};
    int threshold = 30;
    int count = 0;
    std::for_each(readings.begin(), readings.end(), [threshold, &count](int val) {
        if (val > threshold) count++;
    });
    std::cout << "Above " << threshold << ": " << count << "\\n";
    return 0;
}`,
        description: "Capturing a threshold by value and a counter by reference.",
      },
    ],
    execution: { language: "cpp", target: "browser-wasm" },
    exampleRun: {
      sampleInput: "",
      expectedOutput: "Above 30: 3\n",
    },
    exercise: {
      id: "ex-cpp-lambda-callback",
      title: "Pass a stateful lambda callback to a processor",
      prompt: "Write a function `void apply_filter(const std::vector<int>& vals, const std::function<void(int)>& fn)` that loops through vals and invokes fn for each value. In main(), create vals = {10, 25, 30, 45}, maintain total = 0, call apply_filter with a lambda capturing total by reference to sum elements greater than 20, and print 'Sum: ' followed by total.",
      objectiveId: "cpp-lambdas-capture",
      difficulty: "Developing",
      expectedOutcome: "Accumulate filtered values with a capture-by-reference lambda to produce 'Sum: 100'.",
      starterCode: `#include <iostream>
#include <vector>
#include <functional>

void apply_filter(const std::vector<int>& vals, const std::function<void(int)>& fn) {
    // Iterate and invoke fn
}

int main() {
    // Define vector, run filter, and print Sum
    return 0;
}
`,
      solution: `#include <iostream>
#include <vector>
#include <functional>

void apply_filter(const std::vector<int>& vals, const std::function<void(int)>& fn) {
    for (int v : vals) {
        fn(v);
    }
}

int main() {
    std::vector<int> vals = {10, 25, 30, 45};
    int total = 0;
    apply_filter(vals, [&total](int v) {
        if (v > 20) total += v;
    });
    std::cout << "Sum: " << total << "\\n";
    return 0;
}
`,
      hints: [
        "Include `<functional>` to use `std::function<void(int)>`.",
        "Capture total with `[&total]` in the lambda parameter list.",
      ],
      testCases: [
        testCase("tc-lambda-1", "Verify filtered sum via capture by reference", "Sum: 100"),
      ],
    },
    checkpoint: checkpoint(
      "When should you prefer std::function over a template argument for callbacks?",
      "std::function is preferred when callbacks need to be stored in containers or headers without exposing template definitions, at the cost of a small type-erasure indirection."
    ),
  },

  {
    id: "cpp-concurrency-threads",
    order: 11,
    title: "Concurrency with std::thread and std::mutex",
    summary: "Coordinate concurrent execution safely using std::thread, std::mutex, and RAII locks.",
    type: "guided-coding",
    objectiveIds: ["cpp-concurrency-threads"],
    prerequisiteLessonIds: ["cpp-lambdas-capture"],
    estimatedDurationMinutes: 35,
    content: `Modern microcontrollers (like dual-core ESP32) and multi-core systems run multiple tasks in parallel. C++11 introduced a native threading model in the standard library.

### Spawning Threads
\`\`\`cpp
#include <thread>

void worker(int id) {
    // Task code
}

std::thread t(worker, 1);
t.join(); // Wait for thread completion
\`\`\`

### Race Conditions and std::mutex
When multiple threads read and write shared data simultaneously without synchronization, a **data race** occurs. Protecting the shared resource with \`std::mutex\` and \`std::lock_guard\` guarantees mutual exclusion.

~~~cpp
#include <mutex>

std::mutex mtx;
int counter = 0;

void increment() {
    std::lock_guard<std::mutex> lock(mtx);
    counter++;
}
~~~`,
    theorySections: [
      {
        id: "cpp-raii-locking",
        title: "RAII Locking with std::lock_guard",
        content: "std::lock_guard locks the mutex upon construction and unlocks it automatically when going out of scope, preventing deadlocks even if an exception is thrown.",
      },
    ],
    codeExamples: [
      {
        title: "Thread Join and Mutex Demonstration",
        language: "cpp",
        code: `#include <iostream>
#include <thread>
#include <mutex>
#include <vector>

std::mutex log_mtx;

void log_task(int id) {
    std::lock_guard<std::mutex> lock(log_mtx);
    std::cout << "Task " << id << " completed\\n";
}

int main() {
    std::thread t1(log_task, 1);
    std::thread t2(log_task, 2);
    t1.join();
    t2.join();
    return 0;
}`,
        description: "Launching parallel tasks and synchronizing console I/O.",
      },
    ],
    execution: { language: "cpp", target: "browser-wasm" },
    exampleRun: {
      sampleInput: "",
      expectedOutput: "Task 1 completed\nTask 2 completed\n",
    },
    exercise: {
      id: "ex-cpp-thread-counter",
      title: "Safely increment a shared counter across threads",
      prompt: "Implement a thread-safe increment program. Declare a global `int counter = 0;` and `std::mutex mtx;`. Write a function `void add_ticks(int n)` that loops n times, locking mtx with `std::lock_guard<std::mutex>` on each step to increment counter. In main(), spawn two threads each adding 500 ticks, join both threads, and print 'Counter: ' followed by counter.",
      objectiveId: "cpp-concurrency-threads",
      difficulty: "Developing",
      expectedOutcome: "Synchronized concurrent execution resulting in 'Counter: 1000'.",
      starterCode: `#include <iostream>
#include <thread>
#include <mutex>

int counter = 0;
std::mutex mtx;

void add_ticks(int n) {
    // Loop and safely increment counter
}

int main() {
    // Launch 2 threads, join, and print Counter
    return 0;
}
`,
      solution: `#include <iostream>
#include <thread>
#include <mutex>

int counter = 0;
std::mutex mtx;

void add_ticks(int n) {
    for (int i = 0; i < n; i++) {
        std::lock_guard<std::mutex> lock(mtx);
        counter++;
    }
}

int main() {
    std::thread t1(add_ticks, 500);
    std::thread t2(add_ticks, 500);
    t1.join();
    t2.join();
    std::cout << "Counter: " << counter << "\\n";
    return 0;
}
`,
      hints: [
        "Include `<thread>` and `<mutex>`.",
        "Always call `.join()` on launched threads before main exits.",
      ],
      testCases: [
        testCase("tc-thread-1", "Verify concurrent thread synchronization", "Counter: 1000"),
      ],
    },
    checkpoint: checkpoint(
      "Why must std::thread objects be joined or detached before destruction?",
      "If a joinable std::thread object is destroyed without being joined or detached, its destructor calls std::terminate, immediately crashing the program."
    ),
  },

  {
    id: "cpp-capstone-modern-quiz",
    order: 12,
    title: "Modern C++ Systems Assessment",
    summary: "Synthesize RAII, move semantics, smart pointers, templates, and concurrency in a comprehensive systems assessment.",
    type: "assessment",
    objectiveIds: ["cpp-capstone-quiz"],
    prerequisiteLessonIds: ["cpp-concurrency-threads"],
    estimatedDurationMinutes: 40,
    content: `### Modern C++ Systems Assessment
This capstone assessment validates your understanding of modern ISO C++17 design principles:
1. **RAII & Resource Safety**: Managing memory, handles, and locks with zero leaks.
2. **Move Semantics & Zero-Copy**: Eliminating unnecessary buffer copies.
3. **Generic Programming**: Type-safe templates and STL algorithms.
4. **Concurrency**: Synchronizing access to shared memory.

Review the prompt below to implement the telemetry circular queue buffer.`,
    theorySections: [
      {
        id: "cpp-capstone-rubric",
        title: "Idiomatic Modern C++",
        content: "Modern C++ avoids raw pointers for ownership, prefers smart pointers and value semantics, uses noexcept on move operations, and writes clear, declarative algorithms.",
      },
    ],
    codeExamples: [
      {
        title: "Thread-Safe Ring Buffer Sample",
        language: "cpp",
        code: `#include <iostream>
#include <vector>
#include <memory>

template <typename T>
class MiniContainer {
    std::vector<T> items;
public:
    void add(T item) { items.push_back(std::move(item)); }
    size_t size() const { return items.size(); }
};

int main() {
    MiniContainer<int> c;
    c.add(10);
    c.add(20);
    std::cout << "Count: " << c.size() << "\\n";
    return 0;
}`,
        description: "Template container using move semantics for item ingestion.",
      },
    ],
    execution: { language: "cpp", target: "browser-wasm" },
    exampleRun: {
      sampleInput: "",
      expectedOutput: "Count: 2\n",
    },
    exercise: {
      id: "ex-cpp-capstone-telemetry",
      title: "Build a generic telemetry pipeline class",
      prompt: "Implement a template class `TelemetryBuffer<T>` with a private `std::vector<T> items;`. Add methods: `void push(T val)` which moves val into items, `size_t count() const` returning items.size(), and `T back() const` returning items.back(). In main(), instantiate TelemetryBuffer<int>, push values 10, 20, 30, and print 'Count: ' followed by count() and ' Last: ' followed by back().",
      objectiveId: "cpp-capstone-quiz",
      difficulty: "Applied",
      expectedOutcome: "Generic buffer output 'Count: 3 Last: 30'.",
      starterCode: `#include <iostream>
#include <vector>
#include <utility>

template <typename T>
class TelemetryBuffer {
    // Implement push, count, back
};

int main() {
    // Test with int buffer
    return 0;
}
`,
      solution: `#include <iostream>
#include <vector>
#include <utility>

template <typename T>
class TelemetryBuffer {
    std::vector<T> items;
public:
    void push(T val) {
        items.push_back(std::move(val));
    }
    size_t count() const {
        return items.size();
    }
    T back() const {
        return items.back();
    }
};

int main() {
    TelemetryBuffer<int> buf;
    buf.push(10);
    buf.push(20);
    buf.push(30);
    std::cout << "Count: " << buf.count() << " Last: " << buf.back() << "\\n";
    return 0;
}
`,
      hints: [
        "Declare `template <typename T>` above the class definition.",
        "Use `std::move(val)` in push to leverage move semantics.",
      ],
      testCases: [
        testCase("tc-cpp-cap-1", "Verify template telemetry buffer operation", "Count: 3 Last: 30"),
      ],
    },
    checkpoint: checkpoint(
      "Why is ISO C++ preferred for low-latency robotics and high-frequency systems over garbage-collected languages?",
      "C++ provides deterministic resource destruction via RAII, predictable cache-friendly memory layout, zero-cost abstractions, and no unpredictable garbage collection pauses."
    ),
  },
];

export const cppProgrammingCourse: LearningCourse = {
  id: "cpp-programming",
  subjectId: cppProgrammingSubject.id,
  title: "C++17 Systems & Object-Oriented Programming",
  description: "Master modern ISO C++17: references, RAII, move semantics, operator overloading, smart pointers, templates, and high-performance STL containers.",
  level: "Developing",
  version: "1.0.0",
  prerequisites: ["c-programming-foundations"],
  objectives,
  learningOutcomes: [
    "Write idiomatic, memory-safe modern C++17 without naked pointers or manual delete calls.",
    "Structure production classes adhering to RAII for deterministic resource management.",
    "Utilize standard template library containers, iterators, and lambdas for high-performance data processing.",
    "Implement generic data structures and algorithms using function and class templates.",
  ],
  estimatedDurationMinutes: 320,
  publicationStatus: "published",
  modules: [
    moduleData(
      "cpp-m1-foundations-raii",
      1,
      "C++ Foundations, References & RAII",
      "Transition from C to modern C++ with references, const correctness, encapsulation, and RAII.",
      cppProgrammingLessons.slice(0, 3),
    ),
    moduleData(
      "cpp-m2-stl-containers-algos",
      2,
      "The Standard Template Library & Iterators",
      "Contiguous sequence containers, sorted maps, iterators, and declarative lambda algorithms.",
      cppProgrammingLessons.slice(3, 6),
    ),
    moduleData(
      "cpp-m3-memory-templates",
      3,
      "Memory Safety, Smart Pointers & Generic Programming",
      "Exclusive unique_ptr, shared ownership, and compile-time generic templates.",
      cppProgrammingLessons.slice(6, 8),
    ),
    moduleData(
      "cpp-m4-move-concurrency",
      4,
      "Move Semantics, Concurrency & Modern C++ Idioms",
      "Zero-copy move semantics, lambda capture closures, std::thread, and multithreaded synchronization.",
      cppProgrammingLessons.slice(8),
    ),
  ],
};
