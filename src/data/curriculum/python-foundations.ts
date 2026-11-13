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

export const pythonProgrammingSubject: LearningSubject = {
  id: "python-programming",
  title: "Python programming",
  description: "A versatile, high-level language emphasizing readability, rapid development, and rich standard libraries for engineering computation, automation, and data analysis.",
};

const pythonObjectives: LearningObjective[] = [
  { id: "py-overview", title: "Explain what Python is, the role of bytecode and the interpreter, and run a first script." },
  { id: "py-variables-types", title: "Store and inspect values using dynamic variables and fundamental primitive types." },
  { id: "py-io-casting", title: "Read console input, convert string types safely, and format output strings." },
  { id: "py-operators-expr", title: "Form arithmetic, comparison, and boolean expressions with correct operator precedence." },
  { id: "py-conditionals-logic", title: "Direct program execution using if, elif, and else branching logic." },
  { id: "py-while-iteration", title: "Construct indefinite while loops with proper convergence conditions and jump statements." },
  { id: "py-for-ranges", title: "Iterate across sequences and numeric intervals using for loops, range, and enumerate." },
  { id: "py-string-methods", title: "Index, slice, and transform text using built-in string manipulation methods." },
  { id: "py-lists-tuples", title: "Create, index, slice, and mutate lists while contrasting immutable tuples." },
  { id: "py-dicts-sets", title: "Map key-value pairs with dictionaries and maintain unique elements with sets." },
  { id: "py-functions-params", title: "Encapsulate reusable logic in functions with parameters, return statements, and docstrings." },
  { id: "py-scope-rules", title: "Apply LEGB variable scope rules, default arguments, and keyword parameters." },
  { id: "py-error-handling", title: "Handle runtime exceptions and guarantee cleanup using try, except, and finally blocks." },
  { id: "py-file-io-mgr", title: "Read and write external text and CSV files using with-statement context managers." },
  { id: "py-modular-design", title: "Structure modular engineering scripts that separate data parsing from computation." },
  { id: "py-capstone-project", title: "Synthesize data structures, filtering, and summary statistics in an engineering analyzer." },
  { id: "py-classes-encapsulation", title: "Model state and behavior with classes, constructors, self, and encapsulation." },
  { id: "py-inheritance-dataclasses", title: "Extend base classes with inheritance, super(), and structured dataclasses." },
  { id: "py-algorithms-generators", title: "Stream data efficiently with generators and yield, and implement O(log N) search algorithms." },
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

const pythonLessons: LearningLesson[] = [
  // Module 1: Python Fundamentals and Dynamic Typing
  {
    id: "py-source-to-interpreter",
    order: 1,
    title: "From script to interpreter",
    summary: "Understand how the Python interpreter runs code, write your first script, and print output.",
    type: "theory",
    objectiveIds: ["py-overview"],
    prerequisiteLessonIds: [],
    estimatedDurationMinutes: 20,
    content: `Python is an interpreted, high-level general-purpose programming language designed for readability and developer velocity. In engineering and scientific computing, it serves as a primary tool for numerical modeling, rapid prototyping, instrumentation control, and data pipeline automation.

Unlike ahead-of-time compiled languages such as C, which compile source code into architecture-specific machine binaries, Python executes through a two-step process: source code in \`.py\` files is first compiled into bytecode (\`.pyc\`), and the **Python Virtual Machine (PVM)** then executes that bytecode instruction by instruction.

The standard output function in Python is \`print()\`. It accepts multiple objects separated by commas, automatically converts them to text, and places a newline at the end of the output by default.

~~~python
print("Hello, Python!")
print("KATALYST", "Engineering", "Foundations", sep=" :: ")
~~~

You can customize how values are printed using keyword parameters like \`sep\` (the delimiter between items) and \`end\` (the character printed at the very end).`,
    theorySections: [
      {
        id: "py-interp-model",
        title: "The Interpreted Execution Pipeline",
        content: "When you run \`python script.py\`, the CPython runtime tokenizes and parses the text into an Abstract Syntax Tree (AST), compiles it into platform-independent bytecode, and immediately executes the instructions. This enables rapid interactive feedback without explicit linking or compilation steps.",
      },
      {
        id: "py-print-syntax",
        title: "The print() Built-in Function",
        content: "The signature \`print(*objects, sep=' ', end='\\n')\` allows printing any number of comma-separated expressions. Overriding \`sep\` modifies the space delimiter, while \`end=''\\n\` controls the trailing terminator.",
      },
    ],
    codeExamples: [
      {
        title: "First Python Program",
        language: "python",
        code: `print("Welcome to KATALYST Python Foundations!")\nprint("Target Platform:", "Python 3.12", sep=" -> ")\nprint("System ready.", end="\\n")`,
        description: "Calling print() with multiple arguments, a custom separator, and explicit ending.",
      },
    ],
    resources: [
      {
        title: "Python 3 Tutorial - An Informal Introduction",
        url: "https://docs.python.org/3/tutorial/introduction.html",
        description: "Official introductory tutorial covering interactive usage and basic expressions.",
        type: "documentation",
      },
    ],
    execution: { language: "python", target: "browser-wasm" },
    exampleRun: exampleRun("Welcome to KATALYST Python Foundations!\nTarget Platform: -> Python 3.12\nSystem ready.\n"),
    exercise: exercise(
      "ex-py-first-script",
      "Print a formatted engineering welcome message",
      "Write a Python statement using print() that outputs your engineering branch and system status separated by a vertical bar ' | '.",
      `print("Robotics Engineering", "Online", sep=" | ")`,
      "py-overview",
      "Call print() with multiple string arguments and a custom separator parameter.",
      [
        "Pass two string literals separated by a comma into print().",
        "Add the keyword argument sep=' | ' inside the print() call.",
        "Ensure the output displays both terms on a single line with the delimiter.",
      ],
      "Beginner",
      `# Print two strings separated by ' | '\nbranch = "Robotics Engineering"\nstatus = "Online"\n`,
      [
        {
          id: "test-welcome-sep",
          label: "Prints engineering branch and status with separator",
          expectedStdout: "Robotics Engineering | Online",
          matchMode: "trimmed",
        },
        {
          id: "test-welcome-exact",
          label: "Exact output with trailing newline",
          expectedStdout: "Robotics Engineering | Online\n",
          matchMode: "exact",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "How does Python's execution model differ fundamentally from compiled languages like C?",
      "C compilers translate source code ahead-of-time directly into native processor instructions. Python compiles source code in memory into portable bytecode, which is then interpreted instruction-by-instruction by the Python Virtual Machine (PVM).",
    ),
  },

  {
    id: "py-variables-and-types",
    order: 2,
    title: "Variables and primitive data types",
    summary: "Declare variables, inspect dynamic types (int, float, str, bool), and observe value assignment.",
    type: "guided-coding",
    objectiveIds: ["py-variables-types"],
    prerequisiteLessonIds: ["py-source-to-interpreter"],
    estimatedDurationMinutes: 25,
    content: `In Python, variables are not typed memory locations with fixed sizes. Instead, variables are **labels or references** bound to objects residing in memory. When you write \`voltage = 12.5\`, Python creates a floating-point object holding the value 12.5 and associates the name \`voltage\` with that object.

Python is dynamically typed: you never declare a variable's type explicitly. The type is an inherent property of the object itself, not the variable name. You can reassign a variable to point to an object of a completely different type at any time.

The primary primitive data types in Python are:
- \`int\`: Integers of arbitrary precision (e.g., \`42\`, \`-1000\`).
- \`float\`: Double-precision IEEE 754 floating-point numbers (e.g., \`3.14159\`, \`1e-3\`).
- \`str\`: Immutable sequences of Unicode characters (e.g., \`"Sensor-1"\`).
- \`bool\`: Logical boolean flags (\`True\` or \`False\`).

~~~python
voltage = 12.0
current = 1.5
label = "Motor Driver"
is_active = True

print(type(voltage), type(current), type(label), type(is_active))
~~~

You can inspect the runtime type of any value using the built-in \`type()\` function.`,
    theorySections: [
      {
        id: "py-dynamic-reference",
        title: "Dynamic Typing and Object References",
        content: "Assignment in Python (\`=\`) binds a name to an object reference. If you assign \`x = 10\` and later \`x = 'ready'\`, the integer object \`10\` is released (garbage collected if unreferenced), and \`x\` is bound to a new string object.",
      },
      {
        id: "py-numeric-precision",
        title: "Arbitrary-Precision Integers",
        content: "Unlike C's fixed 32-bit or 64-bit integer limits, Python 3 integers automatically expand to consume as many bytes as needed, preventing integer overflow in computational algorithms.",
      },
    ],
    codeExamples: [
      {
        title: "Primitive Data Types and Type Checking",
        language: "python",
        code: `sensor_id = 101\npressure_kpa = 101.325\nsensor_type = "Barometer"\ncalibrated = True\n\nprint("ID:", sensor_id, "Type:", type(sensor_id))\nprint("Pressure:", pressure_kpa, "Type:", type(pressure_kpa))\nprint("Calibrated:", calibrated, "Type:", type(calibrated))`,
        description: "Declaring variables of four core primitive types and verifying their runtime classes.",
      },
    ],
    resources: [
      {
        title: "Built-in Types - Python Documentation",
        url: "https://docs.python.org/3/library/stdtypes.html",
        description: "Official reference for numeric, sequence, and mapping types.",
        type: "reference",
      },
    ],
    execution: { language: "python", target: "browser-wasm" },
    exampleRun: exampleRun("ID: 101 Type: <class 'int'>\nPressure: 101.325 Type: <class 'float'>\nCalibrated: True Type: <class 'bool'>\n"),
    exercise: exercise(
      "ex-py-sensor-variables",
      "Define sensor calibration variables",
      "Create four variables: device_id as an integer (502), temperature as a float (26.4), unit as a string ('C'), and active as a boolean (True). Then print their values.",
      `device_id = 502\ntemperature = 26.4\nunit = "C"\nactive = True\nprint(device_id, temperature, unit, active)`,
      "py-variables-types",
      "Declare variables spanning int, float, str, and bool without type declarations.",
      [
        "Assign integer values without decimal points (502).",
        "Assign decimal values using standard dot notation (26.4).",
        "Pass all four variable names separated by commas into a single print() call.",
      ],
      "Beginner",
      `# Define device_id, temperature, unit, and active\n# Print their values on one line\n`,
      [
        {
          id: "test-sensor-vars",
          label: "Prints sensor variables in sequence",
          expectedStdout: "502 26.4 C True",
          matchMode: "trimmed",
        },
        {
          id: "test-sensor-vars-contains",
          label: "Contains device id and temperature",
          expectedStdout: "502 26.4",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "If a variable x is initialized with x = 5 and subsequently assigned x = 3.14, does Python raise a type error?",
      "No. Python is dynamically typed; variable names do not have fixed types. Reassigning x simply rebinds the label x from the integer object 5 to the float object 3.14.",
    ),
  },

  // Module 2: Input, Output, and Operators
  {
    id: "py-input-and-type-conversion",
    order: 3,
    title: "Console input and type conversion",
    summary: "Read user input with input(), parse integers and floats with int() and float(), and handle casting errors.",
    type: "guided-coding",
    objectiveIds: ["py-io-casting"],
    prerequisiteLessonIds: ["py-variables-and-types"],
    estimatedDurationMinutes: 25,
    content: `Engineering scripts frequently ingest user-provided calibration parameters or manual test inputs. In Python, the built-in \`input(prompt)\` function displays an optional prompt to standard output, pauses execution, reads a line of text entered by the user, and returns it as a string (\`str\`).

Because \`input()\` always returns a string, evaluating numerical formulas directly on input results in string concatenation or type errors rather than mathematical computation:

~~~python
val = "10"
print(val + val) # Produces "1010", NOT 20!
~~~

To perform calculations, you must explicitly convert the string into the required numeric type using **type constructors**:
- \`int(value)\`: Converts a string or float to an integer (truncating decimals).
- \`float(value)\`: Converts a string or integer into a floating-point number.
- \`str(value)\`: Converts any object into its string representation.

If a string cannot be parsed as a valid number (e.g., \`float("abc")\`), Python raises a \`ValueError\`. Always ensure inputs conform to expected numeric formats before calculation.`,
    theorySections: [
      {
        id: "py-input-flow",
        title: "Standard Input Lifecycle",
        content: "\`input()\` consumes text up to the user's newline character (\\n). It strips the trailing newline automatically and returns the payload as a string object.",
      },
      {
        id: "py-explicit-casting",
        title: "Type Casting Mechanics",
        content: "Constructors like \`float()\` and \`int()\` create brand new objects in memory representing the converted value. Floats with exponents like '1.5e3' parse directly to 1500.0.",
      },
    ],
    codeExamples: [
      {
        title: "Reading and Converting Numerical Input",
        language: "python",
        code: `raw_radius = "7.5"\nradius = float(raw_radius)\narea = 3.14159 * (radius ** 2)\nprint("Radius:", radius)\nprint("Calculated Area:", area)`,
        description: "Converting a string reading to a float and computing geometric area.",
      },
    ],
    resources: [
      {
        title: "Python Built-in Functions - input and type casting",
        url: "https://docs.python.org/3/library/functions.html#input",
        description: "Official reference for input() and built-in type constructors.",
        type: "documentation",
      },
    ],
    execution: { language: "python", target: "browser-wasm" },
    exampleRun: exampleRun("Radius: 7.5\nCalculated Area: 176.7144375\n"),
    exercise: exercise(
      "ex-py-fahrenheit-converter",
      "Convert Celsius string input to Fahrenheit",
      "Given a string variable temp_c_str = '30.0', convert it to a float, calculate Fahrenheit using the formula F = (C * 9/5) + 32, and print the resulting temperature.",
      `temp_c_str = "30.0"\ntemp_c = float(temp_c_str)\ntemp_f = (temp_c * 9 / 5) + 32\nprint("Fahrenheit:", temp_f)`,
      "py-io-casting",
      "Cast textual numbers to floats and perform temperature unit conversion.",
      [
        "Use float(temp_c_str) to obtain a numeric floating-point value.",
        "Apply the arithmetic formula (temp_c * 9 / 5) + 32.",
        "Print the calculated Fahrenheit value.",
      ],
      "Beginner",
      `temp_c_str = "30.0"\n# 1. Convert temp_c_str to float\n# 2. Compute temp_f\n# 3. Print the result\n`,
      [
        {
          id: "test-fahrenheit-calc",
          label: "Calculates Fahrenheit for 30.0 C",
          expectedStdout: "Fahrenheit: 86.0",
          matchMode: "trimmed",
        },
        {
          id: "test-fahrenheit-contains",
          label: "Contains calculated value 86.0",
          expectedStdout: "86.0",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "What is the result of int(7.85) in Python?",
      "It returns 7. The int() constructor truncates the fractional portion towards zero; it does not perform mathematical rounding.",
    ),
  },

  {
    id: "py-operators-and-expressions",
    order: 4,
    title: "Arithmetic, comparisons, and logic",
    summary: "Use arithmetic operators, floor division, modulo, exponentiation, comparisons, and boolean logic (and, or, not).",
    type: "guided-coding",
    objectiveIds: ["py-operators-expr"],
    prerequisiteLessonIds: ["py-input-and-type-conversion"],
    estimatedDurationMinutes: 30,
    content: `Engineering algorithms rely on clear arithmetic and logical expressions. Python provides a rich set of operators with well-defined mathematical rules.

### Arithmetic Operators
- Addition (\`+\`) and Subtraction (\`-\`).
- Multiplication (\`*\`) and Exponentiation (\`**\`, e.g., \`2 ** 8\` is \`256\`).
- True Division (\`/\`): **Always returns a float**, even if the operands divide evenly (e.g., \`10 / 2\` returns \`5.0\`).
- Floor Division (\`//\`): Divides and truncates to the next smallest integer (e.g., \`7 // 2\` returns \`3\`).
- Modulo (\`%\`): Returns the remainder of division (e.g., \`7 % 2\` returns \`1\`).

### Comparison Operators
Comparisons evaluate to boolean values (\`True\` or \`False\`):
\`==\` (equality), \`!=\` (inequality), \`<\`, \`<=\`, \`>\`, \`>=\`. Python supports **chained comparisons**: \`10 <= reading <= 50\` tests both conditions simultaneously.

### Logical Operators
- \`and\`: True if both operands evaluate to true.
- \`or\`: True if at least one operand evaluates to true.
- \`not\`: Inverts the boolean truth value.

Python evaluates \`and\` and \`or\` using **short-circuit evaluation**: if the first operand suffices to determine the overall result, the second operand is never evaluated.`,
    theorySections: [
      {
        id: "py-div-distinction",
        title: "True Division vs. Floor Division",
        content: "Python distinguishes true division (\`/\`) from floor division (\`//\`). True division always yields a float to prevent accidental integer truncation bugs common in C.",
      },
      {
        id: "py-chained-comp",
        title: "Chained Comparisons",
        content: "Writing \`low <= x <= high\` is equivalent to \`(low <= x) and (x <= high)\`, but evaluates \`x\` only once. It reads like natural mathematical notation.",
      },
    ],
    codeExamples: [
      {
        title: "Engineering Unit Division and Modulo",
        language: "python",
        code: `total_seconds = 3665\nhours = total_seconds // 3600\nremaining_seconds = total_seconds % 3600\nminutes = remaining_seconds // 60\nseconds = remaining_seconds % 60\n\nprint(hours, "h", minutes, "m", seconds, "s")`,
        description: "Decomposing total seconds into hours, minutes, and seconds using floor division and modulo.",
      },
    ],
    resources: [
      {
        title: "Python Expressions and Operator Precedence",
        url: "https://docs.python.org/3/reference/expressions.html#operator-precedence",
        description: "Official documentation detailing operator binding and precedence tables.",
        type: "reference",
      },
    ],
    execution: { language: "python", target: "browser-wasm" },
    exampleRun: exampleRun("1 h 1 m 5 s\n"),
    exercise: exercise(
      "ex-py-circuit-power",
      "Calculate electrical power and check thresholds",
      "Given voltage = 24.0 and resistance = 6.0, calculate current using Ohm's Law (I = V / R) and power (P = V * I). Then test whether power is between 50.0 and 150.0 watts using a chained comparison.",
      `voltage = 24.0\nresistance = 6.0\ncurrent = voltage / resistance\npower = voltage * current\nis_in_range = 50.0 <= power <= 150.0\nprint("Current:", current, "Power:", power, "In range:", is_in_range)`,
      "py-operators-expr",
      "Compute circuit power using division and multiplication, then test with chained comparisons.",
      [
        "Compute current = voltage / resistance.",
        "Compute power = voltage * current.",
        "Use the chained condition 50.0 <= power <= 150.0.",
      ],
      "Developing",
      `voltage = 24.0\nresistance = 6.0\n# 1. Compute current (I = V / R)\n# 2. Compute power (P = V * I)\n# 3. Check if power is between 50.0 and 150.0\n`,
      [
        {
          id: "tc-py-pwr-1",
          label: "Calculates current 4.0, power 96.0, and in_range True",
          expectedStdout: "Current: 4.0 Power: 96.0 In range: True",
          matchMode: "trimmed",
        },
        {
          id: "tc-py-pwr-hidden",
          label: "Calculated power value check",
          expectedStdout: "Power: 96.0",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why does 12 / 4 evaluate to 3.0 rather than integer 3 in Python?",
      "In Python 3, the single slash / always performs true floating-point division, returning a float regardless of whether the division divides evenly.",
    ),
  },

  {
    id: "py-formatted-strings",
    order: 5,
    title: "String formatting with f-strings",
    summary: "Format numerical output, specify precision, align text, and compose descriptive engineering reports.",
    type: "practical-exercise",
    objectiveIds: ["py-io-casting", "py-operators-expr"],
    prerequisiteLessonIds: ["py-operators-and-expressions"],
    estimatedDurationMinutes: 25,
    content: `Engineering reports, data logs, and status readouts require precise numeric formatting. In Python 3.6+, **formatted string literals (f-strings)** provide the most concise, readable, and efficient mechanism to interpolate variables and expressions into strings.

An f-string is created by prefixing a string literal with \`f\` or \`F\`. Inside an f-string, expressions enclosed in curly braces \`{expression}\` are evaluated at runtime and converted to text:

~~~python
voltage = 3.32891
print(f"Measured voltage: {voltage:.2f} V")
~~~

### Format Specifiers
Following a colon \`:\` inside the curly braces, you can provide format specifiers:
- Floating-point precision: \`{val:.2f}\` prints with two decimal places.
- Thousands separators: \`{1000000:,}\` formats as \`1,000,000\`.
- Scientific notation: \`{val:.3e}\` formats in exponential format (e.g., \`1.250e-04\`).
- Column width and alignment: \`{text:<15}\` (left-aligned), \`{text:>15}\` (right-aligned), and \`{val:08d}\` (zero-padded).`,
    theorySections: [
      {
        id: "py-fstring-perf",
        title: "Expression Evaluation in f-Strings",
        content: "Unlike legacy %-formatting or .format() methods, f-strings are evaluated at bytecode compilation time into efficient BUILD_STRING and FORMAT_VALUE opcodes, providing superior performance.",
      },
      {
        id: "py-precision-control",
        title: "Engineering Numerical Formatting",
        content: "Controlling precision with :.nf prevents unsightly floating-point representation artifacts (like 0.30000000000000004) from cluttering logs and displays.",
      },
    ],
    codeExamples: [
      {
        title: "Tabular Telemetry Report Formatting",
        language: "python",
        code: `sensor = "Pressure-B"\nreading = 101.4285\nping_ms = 18.2\n\nprint(f"| {sensor:<12} | {reading:>8.2f} kPa | {ping_ms:>6.1f} ms |")`,
        description: "Formatting fixed-width aligned tabular engineering data with f-strings.",
      },
    ],
    resources: [
      {
        title: "PEP 498 - Formatted String Literals",
        url: "https://peps.python.org/pep-0498/",
        description: "Original specification and rationale for Python f-string syntax.",
        type: "specification",
      },
    ],
    execution: { language: "python", target: "browser-wasm" },
    exampleRun: exampleRun("| Pressure-B   |   101.43 kPa |   18.2 ms |\n"),
    exercise: exercise(
      "ex-py-telemetry-fstring",
      "Generate a formatted telemetry status line",
      "Given device='Rover-4', battery_pct=87.654, and ping_ms=34.1, print a status line formatted like: [Rover-4] Battery: 87.7% | Latency: 34.10 ms.",
      `device = "Rover-4"\nbattery_pct = 87.654\nping_ms = 34.1\nprint(f"[{device}] Battery: {battery_pct:.1f}% | Latency: {ping_ms:.2f} ms")`,
      "py-io-casting",
      "Format decimal precision and assemble structured telemetry strings with f-strings.",
      [
        "Prefix the string with f: f'...' .",
        "Use {battery_pct:.1f}% to round the battery reading to 1 decimal place.",
        "Use {ping_ms:.2f} ms to format latency with 2 decimal places.",
      ],
      "Developing",
      `device = "Rover-4"\nbattery_pct = 87.654\nping_ms = 34.1\n# Print formatted telemetry string\n`,
      [
        {
          id: "tc-py-fstr-1",
          label: "Formats telemetry line with precision",
          expectedStdout: "[Rover-4] Battery: 87.7% | Latency: 34.10 ms",
          matchMode: "trimmed",
        },
        {
          id: "tc-py-fstr-hidden",
          label: "Battery percentage check",
          expectedStdout: "Battery: 87.7%",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "What does the format specifier {rpm:>8d} accomplish when rpm is 1200?",
      "It formats the integer 1200 right-aligned within a field of total width 8 characters, padding with leading spaces: '    1200'.",
    ),
  },

  // Module 3: Control Flow: Decisions and Loops
  {
    id: "py-conditionals",
    order: 6,
    title: "Branching with if, elif, and else",
    summary: "Make decisions based on condition evaluations, nested checks, and truthy/falsy values.",
    type: "guided-coding",
    objectiveIds: ["py-conditionals-logic"],
    prerequisiteLessonIds: ["py-operators-and-expressions"],
    estimatedDurationMinutes: 30,
    content: `Programs must adjust their behavior based on runtime inputs and sensor readings. In Python, conditional branching is controlled using the \`if\`, \`elif\` (short for *else if*), and \`else\` keywords.

### Indentation As Block Delimiter
Unlike languages that use curly braces \`{}\` or keywords like \`begin\` and \`end\`, Python uses **indentation** to delineate blocks of code. All statements within a given block must be indented by exactly the same number of spaces (the community standard is 4 spaces).

~~~python
temperature = 92.5

if temperature > 100.0:
    print("ALERT: Boiling threshold exceeded!")
elif temperature > 80.0:
    print("WARNING: High temperature operating state.")
else:
    print("NORMAL: Operating within nominal bounds.")
~~~

### Truthy and Falsy Values
In Python, any object can be tested for truth value. The following are considered **falsy**:
- The boolean \`False\` and \`None\`.
- Zero of any numeric type: \`0\`, \`0.0\`.
- Empty sequences and collections: \`""\`, \`[]\`, \`()\`, \`{}\`, \`set()\`.

All other objects evaluate to **truthy** by default.`,
    theorySections: [
      {
        id: "py-indentation-rule",
        title: "Block Structure and PEP 8",
        content: "Python's syntax treats indentation levels as tokens (INDENT and DEDENT). Mixing tabs and spaces raises an IndentationError. Standardize on 4 spaces per nesting level.",
      },
      {
        id: "py-short-circuit-branch",
        title: "Evaluation Order in if-elif Chains",
        content: "Python tests branches sequentially from top to bottom. The first condition evaluating to True executes its block, skipping all subsequent elif and else branches.",
      },
    ],
    codeExamples: [
      {
        title: "Multi-Threshold Sensor Classification",
        language: "python",
        code: `pressure_psi = 145.0\n\nif pressure_psi > 150.0:\n    state = "OVERPRESSURE_SHUTDOWN"\nelif pressure_psi >= 100.0:\n    state = "HIGH_PRESSURE_WARNING"\nelif pressure_psi >= 30.0:\n    state = "NOMINAL"\nelse:\n    state = "UNDERPRESSURE_FAULT"\n\nprint("System State:", state)`,
        description: "Cascading thresholds evaluating descending boundary conditions.",
      },
    ],
    resources: [
      {
        title: "Python Control Flow Documentation",
        url: "https://docs.python.org/3/tutorial/controlflow.html#if-statements",
        description: "Official guide to Python if-statements and conditional logic.",
        type: "documentation",
      },
    ],
    execution: { language: "python", target: "browser-wasm" },
    exampleRun: exampleRun("System State: HIGH_PRESSURE_WARNING\n"),
    exercise: exercise(
      "ex-py-sensor-quality",
      "Classify signal-to-noise ratio (SNR)",
      "Given snr_db = 18.5, assign a variable signal_quality to: 'Excellent' if snr_db >= 25, 'Good' if snr_db >= 15, 'Marginal' if snr_db >= 10, or 'Unusable' otherwise. Then print the quality.",
      `snr_db = 18.5\nif snr_db >= 25:\n    signal_quality = "Excellent"\nelif snr_db >= 15:\n    signal_quality = "Good"\nelif snr_db >= 10:\n    signal_quality = "Marginal"\nelse:\n    signal_quality = "Unusable"\nprint("Quality:", signal_quality)`,
      "py-conditionals-logic",
      "Construct multi-branch conditional evaluations to classify telemetry metrics.",
      [
        "Start with if snr_db >= 25: .",
        "Use elif branches for subsequent descending thresholds (>= 15, >= 10).",
        "Conclude with an else: branch assigning 'Unusable'.",
      ],
      "Beginner",
      `snr_db = 18.5\n# Classify signal_quality based on snr_db\n`,
      [
        {
          id: "tc-py-snr-1",
          label: "Classifies 18.5 dB as Good",
          expectedStdout: "Quality: Good",
          matchMode: "trimmed",
        },
        {
          id: "tc-py-snr-hidden",
          label: "Quality value check",
          expectedStdout: "Good",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "What will the expression bool([]) evaluate to in Python?",
      "It evaluates to False because empty collections (lists, tuples, dicts, sets, strings) are falsy in Python.",
    ),
  },

  {
    id: "py-while-loops",
    order: 7,
    title: "Indefinite repetition with while loops",
    summary: "Repeat execution while conditions hold, use sentinel loops, and control iteration with break and continue.",
    type: "guided-coding",
    objectiveIds: ["py-while-iteration"],
    prerequisiteLessonIds: ["py-conditionals"],
    estimatedDurationMinutes: 30,
    content: `When a computational task must repeat until a dynamic state or convergence condition is satisfied, Python uses the \`while\` loop. The body of a while loop executes repeatedly as long as its test expression remains truthy.

~~~python
count = 5
while count > 0:
    print(f"Countdown: {count}")
    count -= 1
print("Launch!")
~~~

### Loop Invariants and Termination
To prevent infinite loops, the body of the while loop must alter variables involved in the condition such that it eventually becomes \`False\`.

### Jump Statements: break and continue
- \`break\`: Immediately terminates the innermost loop, jumping to the first statement outside.
- \`continue\`: Skips the remainder of the current iteration, returning to re-evaluate the loop condition immediately.

Loops in Python also support an optional \`else\` block, which executes only if the loop terminates normally (without encountering a \`break\` statement).`,
    theorySections: [
      {
        id: "py-while-mechanics",
        title: "The While Loop Evaluation Cycle",
        content: "Before each iteration, Python tests the condition. If true, the indented block executes sequentially. If false on the initial check, the loop body is never entered.",
      },
      {
        id: "py-convergence-guards",
        title: "Convergence Guards & Safety Counters",
        content: "In engineering simulations (such as numerical root finding or iterative optimization), always maintain an iteration counter to guard against infinite loops if the algorithm fails to converge.",
      },
    ],
    codeExamples: [
      {
        title: "Simulating Liquid Tank Depletion",
        language: "python",
        code: `tank_volume = 100.0\ndrain_rate = 18.5\nseconds = 0\n\nwhile tank_volume > 0.0:\n    tank_volume -= drain_rate\n    seconds += 1\n    print(f"Second {seconds}: Remaining volume = {max(0.0, tank_volume):.1f} L")\n\nprint(f"Tank fully drained in {seconds} seconds.")`,
        description: "Iterating until volume reaches zero, tracking elapsed simulation time.",
      },
    ],
    resources: [
      {
        title: "Python while Loop Statement",
        url: "https://docs.python.org/3/reference/compound_stmts.html#the-while-statement",
        description: "Language reference specification for the while statement syntax.",
        type: "reference",
      },
    ],
    execution: { language: "python", target: "browser-wasm" },
    exampleRun: exampleRun("Second 1: Remaining volume = 81.5 L\nSecond 2: Remaining volume = 63.0 L\nSecond 3: Remaining volume = 44.5 L\nSecond 4: Remaining volume = 26.0 L\nSecond 5: Remaining volume = 7.5 L\nSecond 6: Remaining volume = 0.0 L\nTank fully drained in 6 seconds.\n"),
    exercise: exercise(
      "ex-py-decay-simulation",
      "Simulate radioactive isotope decay",
      "Given initial_mass = 80.0 grams and half_life_days = 5, use a while loop to find how many days it takes for the mass to drop strictly below 5.0 grams. Each period halves the mass and adds half_life_days to the elapsed time.",
      `initial_mass = 80.0\nhalf_life_days = 5\ncurrent_mass = initial_mass\ndays = 0\n\nwhile current_mass >= 5.0:\n    current_mass /= 2\n    days += half_life_days\n\nprint(f"Final mass: {current_mass} g after {days} days")`,
      "py-while-iteration",
      "Implement a while loop with a convergence threshold to model physical decay.",
      [
        "Initialize current_mass = initial_mass and days = 0.",
        "Loop with the condition while current_mass >= 5.0: .",
        "Inside the loop, divide current_mass by 2 and increment days by half_life_days.",
      ],
      "Developing",
      `initial_mass = 80.0\nhalf_life_days = 5\n# Calculate days elapsed until mass < 5.0\n`,
      [
        {
          id: "tc-py-decay-1",
          label: "Simulates decay to 2.5g in 25 days",
          expectedStdout: "Final mass: 2.5 g after 25 days",
          matchMode: "trimmed",
        },
        {
          id: "tc-py-decay-hidden",
          label: "Elapsed days count check",
          expectedStdout: "25 days",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "What role does the break statement play inside a while True: loop?",
      "A while True loop creates an intentional infinite loop; the break statement provides an explicit, conditional escape hatch to terminate the loop when an exit condition is met.",
    ),
  },

  {
    id: "py-for-loops-and-ranges",
    order: 8,
    title: "Definite iteration with for loops and range",
    summary: "Iterate through sequences and numeric ranges with range(start, stop, step), enumerate, and accumulator patterns.",
    type: "practical-exercise",
    objectiveIds: ["py-for-ranges"],
    prerequisiteLessonIds: ["py-while-loops"],
    estimatedDurationMinutes: 35,
    content: `When you know the number of iterations in advance or wish to traverse each element in an iterable collection, Python's \`for\` loop is the idiomatic choice. Unlike traditional C-style for loops that increment an index variable, Python's \`for\` loop iterates directly over items produced by an iterable object.

~~~python
for item in ["Sensor A", "Sensor B", "Sensor C"]:
    print("Polling:", item)
~~~

### The range() Function
To generate sequences of numbers without creating a list in memory, Python provides the \`range()\` type:
- \`range(stop)\`: Generates numbers from \`0\` up to \`stop - 1\`.
- \`range(start, stop)\`: Generates numbers from \`start\` up to \`stop - 1\`.
- \`range(start, stop, step)\`: Increments by \`step\` (which can be negative for counting down).

### The enumerate() Utility
When you need both the zero-based index and the value of each element in a sequence, use \`enumerate(sequence)\`:

~~~python
samples = [4.1, 4.3, 4.2]
for idx, val in enumerate(samples):
    print(f"Sample #{idx + 1}: {val} V")
~~~`,
    theorySections: [
      {
        id: "py-iterable-protocol",
        title: "The Iteration Protocol",
        content: "Under the hood, Python's for loop requests an iterator using \`iter(obj)\` and calls \`next()\` repeatedly until a \`StopIteration\` exception is raised, ensuring clean boundary handling.",
      },
      {
        id: "py-accumulator-pattern",
        title: "The Accumulator Pattern",
        content: "Common computational routines initialize a running total or count variable before a for loop, accumulate values during iteration, and finalize calculations (like calculating an average) post-loop.",
      },
    ],
    codeExamples: [
      {
        title: "Calculating Mean of Stepped Measurements",
        language: "python",
        code: `readings = [12.2, 12.5, 12.1, 12.8, 12.4]\ntotal = 0.0\nfor reading in readings:\n    total += reading\nmean = total / len(readings)\nprint(f"Count: {len(readings)}, Mean: {mean:.2f}")`,
        description: "Accumulating values across a list to compute sample arithmetic mean.",
      },
    ],
    resources: [
      {
        title: "Built-in Functions - range",
        url: "https://docs.python.org/3/library/stdtypes.html#range",
        description: "Documentation on the range sequence type and memory efficiency.",
        type: "documentation",
      },
    ],
    execution: { language: "python", target: "browser-wasm" },
    exampleRun: exampleRun("Count: 5, Mean: 12.40\n"),
    exercise: exercise(
      "ex-py-sum-of-squares",
      "Calculate sum of squares of odd numbers",
      "Use a for loop and range() to calculate the sum of squares of all odd integers between 1 and 19 inclusive (1, 3, 5, ..., 19). Print the final total.",
      `total = 0\nfor n in range(1, 20, 2):\n    total += n ** 2\nprint("Sum of squares:", total)`,
      "py-for-ranges",
      "Iterate over stepped numeric ranges and apply accumulator patterns.",
      [
        "Use range(1, 20, 2) to step through odd numbers from 1 up to 19.",
        "Initialize total = 0 prior to entering the loop.",
        "Inside the loop, square the number with n ** 2 and add it to total.",
      ],
      "Beginner",
      `total = 0\n# Use for loop with range(1, 20, 2) to accumulate squares\n`,
      [
        {
          id: "tc-py-sq-1",
          label: "Accumulates sum of odd squares to 1330",
          expectedStdout: "Sum of squares: 1330",
          matchMode: "trimmed",
        },
        {
          id: "tc-py-sq-hidden",
          label: "Exact total check",
          expectedStdout: "1330",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "How many total values does list(range(5, 15, 3)) contain, and what are they?",
      "It contains 4 values: [5, 8, 11, 14]. The sequence stops before reaching 15 because the stop boundary is exclusive.",
    ),
  },

  // Module 4: Strings, Sequences, and Data Structures
  {
    id: "py-string-operations",
    order: 9,
    title: "String indexing, slicing, and methods",
    summary: "Extract substrings with slicing [start:stop:step], search with in, and clean text with split, join, strip, and replace.",
    type: "guided-coding",
    objectiveIds: ["py-string-methods"],
    prerequisiteLessonIds: ["py-for-loops-and-ranges"],
    estimatedDurationMinutes: 30,
    content: `In Python, a string (\`str\`) is an **immutable sequence** of Unicode characters. Because strings are sequences, they support 0-based indexing, negative indexing, and slicing.

### Indexing and Slicing
- Positive indexing starts at \`0\`: \`s[0]\` is the first character.
- Negative indexing starts at \`-1\`: \`s[-1]\` is the last character.
- Slicing syntax: \`s[start:stop:step]\`. For example, \`s[0:4]\` extracts characters at indices 0, 1, 2, and 3. Omitting \`step\` defaults to 1. \`s[::-1]\` reverses the string.

### Core String Methods
Strings provide dozens of built-in methods that return new transformed strings:
- \`.strip()\`: Removes leading and trailing whitespace.
- \`.split(delimiter)\`: Splits a string by delimiter into a list of substrings.
- \`delimiter.join(list_of_strings)\`: Joins elements of a list into a single string.
- \`.replace(old, new)\`: Substitutes occurrences of a substring.
- \`.lower()\` and \`.upper()\`: Normalizes case.

The membership operator \`in\` tests whether a substring exists within a string: \`"TEMP" in "SENSOR_TEMP_01"\` evaluates to \`True\`.`,
    theorySections: [
      {
        id: "py-string-immutable",
        title: "Immutability Principle",
        content: "Strings cannot be modified in-place. Expressions like \`s[0] = 'H'\` raise a TypeError. Any transformation method returns a fresh string object, leaving the original unchanged.",
      },
      {
        id: "py-split-join",
        title: "The Split-Transform-Join Pattern",
        content: "A fundamental data cleaning idiom in Python involves splitting delimited log records into components, modifying or validating individual fields, and rejoining with .join().",
      },
    ],
    codeExamples: [
      {
        title: "Cleaning and Parsing Delimited Telemetry Records",
        language: "python",
        code: `raw_log = "  LOG:2026-11-11:FLOW_SENSOR:34.8:NOMINAL  \\n"\ncleaned = raw_log.strip()\nfields = cleaned.split(":")\nprint("Field count:", len(fields))\nprint("Sensor:", fields[2], "| Reading:", fields[3])\nrebuilt = " -> ".join(fields)\nprint("Reconstructed:", rebuilt)`,
        description: "Stripping whitespace, splitting by colon, and rebuilding formatted output.",
      },
    ],
    resources: [
      {
        title: "Python String Methods Reference",
        url: "https://docs.python.org/3/library/stdtypes.html#string-methods",
        description: "Complete catalog of string methods in the Python standard library.",
        type: "reference",
      },
    ],
    execution: { language: "python", target: "browser-wasm" },
    exampleRun: exampleRun("Field count: 5\nSensor: FLOW_SENSOR | Reading: 34.8\nReconstructed: LOG -> 2026-11-11 -> FLOW_SENSOR -> 34.8 -> NOMINAL\n"),
    exercise: exercise(
      "ex-py-sensor-log-parser",
      "Parse CSV telemetry log entry",
      "Given a CSV log entry line = '2026-11-11,SENSOR_TMP_01,45.2,OK', extract the sensor name (index 1) and temperature as a float (index 2), then print: Sensor SENSOR_TMP_01 reported 45.2 C.",
      `line = "2026-11-11,SENSOR_TMP_01,45.2,OK"\nparts = line.split(",")\nsensor = parts[1]\ntemp = float(parts[2])\nprint(f"Sensor {sensor} reported {temp:.1f} C")`,
      "py-string-methods",
      "Deconstruct comma-delimited strings using split() and extract typed values.",
      [
        "Call parts = line.split(',') to separate the line into a list of strings.",
        "Retrieve the sensor name from parts[1].",
        "Convert parts[2] to a float and format the output with an f-string.",
      ],
      "Developing",
      `line = "2026-11-11,SENSOR_TMP_01,45.2,OK"\n# Parse line and print formatted message\n`,
      [
        {
          id: "tc-py-logparse-1",
          label: "Parses CSV fields and prints sensor message",
          expectedStdout: "Sensor SENSOR_TMP_01 reported 45.2 C",
          matchMode: "trimmed",
        },
        {
          id: "tc-py-logparse-hidden",
          label: "Sensor ID check",
          expectedStdout: "SENSOR_TMP_01",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "What is the difference between s.strip() and s.replace(' ', '')?",
      "s.strip() removes whitespace only from the leading and trailing ends of the string. s.replace(' ', '') removes every space character throughout the entire string, including internal spaces.",
    ),
  },

  {
    id: "py-lists-and-tuples",
    order: 10,
    title: "Lists and immutable tuples",
    summary: "Store ordered items in lists, append, pop, sort, and slice data; use immutable tuples for fixed records.",
    type: "interactive-simulation",
    objectiveIds: ["py-lists-tuples"],
    prerequisiteLessonIds: ["py-string-operations"],
    estimatedDurationMinutes: 35,
    content: `Engineering systems require ordered collections to manage time-series samples, coordinate points, and packet buffers. Python provides two primary ordered sequence types: mutable **lists** and immutable **tuples**.

### Lists: Dynamic, Mutable Sequences
Lists are created with square brackets \`[]\`. They can grow and shrink dynamically and hold elements of arbitrary types:
- \`.append(x)\`: Adds an item to the end of the list in O(1) amortized time.
- \`.pop()\`: Removes and returns the last item (or an item at a specified index).
- \`.insert(i, x)\`: Inserts an item at index \`i\`.
- \`.sort()\`: Sorts the list in-place (use \`sorted(list)\` to return a new sorted list).
- Slicing: \`list[1:4]\` extracts a sublist copy.

### Tuples: Fixed, Immutable Records
Tuples are created with parentheses \`()\` or comma-separated values. Once defined, elements cannot be added, removed, or reassigned:
\`coordinates = (37.7749, -122.4194)\`

Tuples protect constant data from accidental modification, consume less memory than lists, and can be used as dictionary keys because they are hashable.`,
    theorySections: [
      {
        id: "py-list-memory",
        title: "Dynamic Array Resizing",
        content: "Under the hood, CPython implements lists as dynamic arrays of pointers. Appending over-allocates extra capacity to ensure amortized O(1) append operations.",
      },
      {
        id: "py-tuple-safety",
        title: "Data Integrity with Tuples",
        content: "Use tuples for heterogeneous fixed-length records (like (latitude, longitude, altitude)) and lists for homogeneous collections that grow over time (like time-series readings).",
      },
    ],
    codeExamples: [
      {
        title: "Working with Lists and Tuples",
        language: "python",
        code: `samples = [12.4, 15.1, 14.8]\nsamples.append(16.2)\nsamples.sort()\nprint("Sorted list:", samples)\n\norigin = (0.0, 0.0, 100.0)\nprint("Coordinate tuple:", origin)`,
        description: "Appending and sorting a list, and defining an immutable spatial coordinate tuple.",
      },
    ],
    interactiveDemo: {
      kind: "memory-diagram",
      title: "List vs. Tuple Reference Architecture",
      description: "Visualizes how a mutable Python list maintains dynamic pointer array slots pointing to heap objects, while a tuple fixes references upon construction.",
      config: {
        sequenceTypes: ["list", "tuple"],
        mutability: { list: "mutable", tuple: "immutable" },
        operations: ["append", "pop", "sort", "slice"],
      },
    },
    resources: [
      {
        title: "Python Data Structures Tutorial",
        url: "https://docs.python.org/3/tutorial/datastructures.html",
        description: "Official guide covering lists, list comprehensions, and tuples.",
        type: "documentation",
      },
    ],
    execution: { language: "python", target: "browser-wasm" },
    exampleRun: exampleRun("Sorted list: [12.4, 14.8, 15.1, 16.2]\nCoordinate tuple: (0.0, 0.0, 100.0)\n"),
    exercise: exercise(
      "ex-py-list-filtering",
      "Filter noise readings from a data list",
      "Given a list raw_samples = [10.2, -999.0, 12.5, 14.1, -999.0, 11.8], create a new list valid_samples containing only valid readings greater than 0.0, then print the count and average of valid samples.",
      `raw_samples = [10.2, -999.0, 12.5, 14.1, -999.0, 11.8]\nvalid_samples = [s for s in raw_samples if s > 0.0]\navg = sum(valid_samples) / len(valid_samples)\nprint(f"Valid count: {len(valid_samples)}, Average: {avg:.2f}")`,
      "py-lists-tuples",
      "Filter erroneous readings and calculate aggregate metrics over lists.",
      [
        "Use a list comprehension [s for s in raw_samples if s > 0.0] or a for loop with .append().",
        "Calculate the count using len(valid_samples).",
        "Calculate the average using sum(valid_samples) / len(valid_samples).",
      ],
      "Developing",
      `raw_samples = [10.2, -999.0, 12.5, 14.1, -999.0, 11.8]\nvalid_samples = []\n# Filter samples > 0.0 and print count and average\n`,
      [
        {
          id: "tc-py-filter-1",
          label: "Filters negative noise and prints count and average",
          expectedStdout: "Valid count: 4, Average: 12.15",
          matchMode: "trimmed",
        },
        {
          id: "tc-py-filter-hidden",
          label: "Filtered count check",
          expectedStdout: "Valid count: 4",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why does a tuple with a single element require a trailing comma, such as (42,)?",
      "Without the trailing comma, parentheses are interpreted as standard grouping operator in expressions, so (42) evaluates to integer 42, whereas (42,) constructs a 1-element tuple.",
    ),
  },

  {
    id: "py-dictionaries-and-sets",
    order: 11,
    title: "Dictionaries and unique sets",
    summary: "Map keys to values using dictionaries, look up data in O(1) time, and use sets for uniqueness and set operations.",
    type: "practical-exercise",
    objectiveIds: ["py-dicts-sets"],
    prerequisiteLessonIds: ["py-lists-and-tuples"],
    estimatedDurationMinutes: 35,
    content: `When engineering data is indexed by unique identifiers rather than numeric positional indices, hash tables provide constant-time average access. In Python, hash tables power two fundamental data structures: **dictionaries** and **sets**.

### Dictionaries (\`dict\`)
A dictionary is an unordered (insertion-ordered in Python 3.7+) collection of **key-value pairs**:
\`sensor = {"id": "TMP01", "reading": 23.4, "status": "OK"}\`

- Lookup: \`sensor["reading"]\` retrieves \`23.4\`. If the key is missing, a \`KeyError\` is raised.
- Safe lookup: \`sensor.get("reading", 0.0)\` returns the value or a fallback default if absent.
- Adding/Updating: \`sensor["voltage"] = 3.3\` sets the key.
- Iteration: Iterate through keys (\`.keys()\`), values (\`.values()\`), or pairs (\`.items()\`).

### Sets (\`set\`)
A set is an unordered collection of **unique, immutable elements**:
\`active_nodes = {"node-1", "node-2", "node-3"}\`

Sets automatically eliminate duplicate items and support mathematical set operations:
- Union (\`|\`): All elements in either set.
- Intersection (\`&\`): Elements common to both sets.
- Difference (\`-\`): Elements in the first set but not the second.`,
    theorySections: [
      {
        id: "py-hash-table-perf",
        title: "Hash Tables and O(1) Lookup",
        content: "Both dict and set use hash tables under the hood. Keys must be hashable objects (such as ints, floats, strings, or tuples). Average time complexity for insertion, lookup, and deletion is O(1).",
      },
      {
        id: "py-dict-iteration",
        title: "Iterating Key-Value Pairs with .items()",
        content: "The method \`for key, val in d.items():\` unpacks tuple pairs during iteration, providing direct access to both key and associated value without secondary lookups.",
      },
    ],
    codeExamples: [
      {
        title: "Sensor Network Filtering and Threshold Lookup",
        language: "python",
        code: `thresholds = {"temp": 50.0, "vibration": 2.5, "pressure": 120.0}\ncurrent_readings = {"temp": 52.1, "vibration": 1.8, "pressure": 115.0}\n\nfor sensor, val in current_readings.items():\n    limit = thresholds.get(sensor, 100.0)\n    if val > limit:\n        print(f"ALERT: {sensor} reading {val} exceeds threshold {limit}")`,
        description: "Checking multi-sensor readings against threshold dictionaries.",
      },
    ],
    resources: [
      {
        title: "Python Dictionaries Reference",
        url: "https://docs.python.org/3/tutorial/datastructures.html#dictionaries",
        description: "Official guide to dictionary creation, methods, and comprehensions.",
        type: "documentation",
      },
    ],
    execution: { language: "python", target: "browser-wasm" },
    exampleRun: exampleRun("ALERT: temp reading 52.1 exceeds threshold 50.0\n"),
    exercise: exercise(
      "ex-py-sensor-registry",
      "Build a sensor reading registry",
      "Given thresholds = {'temp': 35.0, 'pressure': 105.0, 'humidity': 80.0} and readings = {'temp': 38.2, 'pressure': 101.4, 'humidity': 82.5}, print which sensors exceed their threshold using an f-string alert.",
      `thresholds = {"temp": 35.0, "pressure": 105.0, "humidity": 80.0}\nreadings = {"temp": 38.2, "pressure": 101.4, "humidity": 82.5}\nfor sensor, val in readings.items():\n    if val > thresholds.get(sensor, float("inf")):\n        print(f"ALERT: {sensor} is {val} (threshold {thresholds[sensor]})")`,
      "py-dicts-sets",
      "Traverse dictionary items and compare paired metric thresholds.",
      [
        "Iterate over readings using for sensor, val in readings.items(): .",
        "Compare val against thresholds[sensor].",
        "Print an alert message when val > threshold.",
      ],
      "Applied",
      `thresholds = {"temp": 35.0, "pressure": 105.0, "humidity": 80.0}\nreadings = {"temp": 38.2, "pressure": 101.4, "humidity": 82.5}\n# Iterate and check which readings exceed thresholds\n`,
      [
        {
          id: "tc-py-registry-1",
          label: "Flags temp and humidity exceeding thresholds",
          expectedStdout: "ALERT: temp is 38.2 (threshold 35.0)\nALERT: humidity is 82.5 (threshold 80.0)",
          matchMode: "trimmed",
        },
        {
          id: "tc-py-registry-hidden",
          label: "Checks alert on temp",
          expectedStdout: "ALERT: temp",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why can lists not be used as dictionary keys or set elements?",
      "Dictionary keys and set elements must be hashable—their hash value must remain constant across their lifetime. Lists are mutable and therefore unhashable.",
    ),
  },

  // Module 5: Functions, Scope, and Robust Code
  {
    id: "py-function-definitions",
    order: 12,
    title: "Defining functions and return values",
    summary: "Define functions with def, pass parameters, return values, write docstrings, and understand pure functions.",
    type: "guided-coding",
    objectiveIds: ["py-functions-params"],
    prerequisiteLessonIds: ["py-dictionaries-and-sets"],
    estimatedDurationMinutes: 30,
    content: `Functions are the core building block of modular engineering software. They package reusable computations, enforce separation of concerns, and allow algorithms to be unit tested in isolation.

In Python, functions are defined using the \`def\` keyword:

~~~python
def calculate_power(voltage: float, current: float) -> float:
    """Calculate electrical power in watts using P = V * I."""
    return voltage * current
~~~

### Anatomy of a Function
1. **Name and Parameters**: The signature specifies formal parameter names inside parentheses.
2. **Docstring**: An optional triple-quoted string immediately following the header documenting the purpose, arguments, and return value.
3. **The return Statement**: Computes and yields a result back to the caller. If a function reaches the end of its body without executing an explicit \`return\`, it implicitly returns \`None\`.
4. **Returning Multiple Values**: Python can return multiple values separated by commas, automatically packing them into a tuple.

~~~python
def min_max(samples):
    return min(samples), max(samples)

low, high = min_max([4.1, 7.8, 2.3])
~~~`,
    theorySections: [
      {
        id: "py-call-stack",
        title: "Call Stack Execution",
        content: "When a function is called, Python pushes a new activation frame onto the call stack containing its local variables. The frame is popped and discarded when the function returns.",
      },
      {
        id: "py-type-hints",
        title: "Optional Type Annotations",
        content: "Python 3 supports optional type annotations (e.g., \`def fn(x: int) -> float:\`). While not enforced at runtime by CPython, they improve readability and allow static type analysis with tools like mypy.",
      },
    ],
    codeExamples: [
      {
        title: "Reynolds Number Fluid Mechanics Function",
        language: "python",
        code: `def calculate_reynolds_number(velocity: float, length: float, viscosity: float) -> float:\n    """Calculate dimensionless Reynolds number Re = (v * L) / nu."""\n    return (velocity * length) / viscosity\n\nre = calculate_reynolds_number(2.5, 0.1, 1.004e-6)\nflow_regime = "Laminar" if re < 2300 else "Turbulent"\nprint(f"Re = {re:.1f} ({flow_regime})")`,
        description: "Computing engineering fluid mechanics metrics inside a reusable function.",
      },
    ],
    resources: [
      {
        title: "Defining Functions - Python Tutorial",
        url: "https://docs.python.org/3/tutorial/controlflow.html#defining-functions",
        description: "Official guide to function definitions, arguments, and return values.",
        type: "documentation",
      },
    ],
    execution: { language: "python", target: "browser-wasm" },
    exampleRun: exampleRun("Re = 249004.0 (Turbulent)\n"),
    exercise: exercise(
      "ex-py-stats-calculator",
      "Write a statistical summary function",
      "Write a function calculate_range_and_average(numbers) that takes a list of floats and returns a tuple (min_val, max_val, average). If the list is empty, return (None, None, None).",
      `def calculate_range_and_average(numbers):\n    if not numbers:\n        return (None, None, None)\n    return min(numbers), max(numbers), sum(numbers) / len(numbers)\n\nlow, high, avg = calculate_range_and_average([14.2, 18.9, 12.1, 15.5])\nprint(f"Min: {low}, Max: {high}, Avg: {avg:.2f}")`,
      "py-functions-params",
      "Implement a modular function returning compound tuple statistics.",
      [
        "Check if not numbers: return (None, None, None) first.",
        "Calculate min(numbers), max(numbers), and sum(numbers) / len(numbers).",
        "Return all three results separated by commas.",
      ],
      "Developing",
      `def calculate_range_and_average(numbers):\n    # Return (min_val, max_val, average)\n    pass\n`,
      [
        {
          id: "tc-py-stats-1",
          label: "Calculates min, max, and avg for sample list",
          expectedStdout: "Min: 12.1, Max: 18.9, Avg: 15.18",
          matchMode: "trimmed",
        },
        {
          id: "tc-py-stats-hidden",
          label: "Checks min and max values",
          expectedStdout: "Min: 12.1, Max: 18.9",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "What is returned by a function that has no return statement?",
      "It returns the special singleton value None.",
    ),
  },

  {
    id: "py-scope-and-arguments",
    order: 13,
    title: "Scope, default parameters, and keyword arguments",
    summary: "Master LEGB scope rules, avoid mutable default argument pitfalls, and use keyword arguments.",
    type: "guided-coding",
    objectiveIds: ["py-scope-rules"],
    prerequisiteLessonIds: ["py-function-definitions"],
    estimatedDurationMinutes: 30,
    content: `Understanding how variable names are looked up and how arguments are passed into functions is essential for writing reliable engineering code.

### Variable Scope: The LEGB Rule
When you reference a variable name inside a function, Python searches for it in four sequential scopes:
1. **L (Local)**: Names defined within the function body or passed as parameters.
2. **E (Enclosing)**: Names in any outer enclosing functions (for nested closures).
3. **G (Global)**: Names defined at the top level of the current module.
4. **B (Built-in)**: Predefined names in Python's standard library (\`len\`, \`range\`, \`print\`).

Assigning to a variable inside a function creates a local variable by default, shadowing any global variable of the same name.

### Default and Keyword Arguments
Parameters can specify default values:
\`def calibrate(offset=0.0, gain=1.0): ...\`

Callers can provide arguments positionally or by name (**keyword arguments**):
\`calibrate(gain=1.05)\`

### The Mutable Default Argument Trap
**Critical Python nuance**: Default argument expressions are evaluated **once at function definition time**, not each time the function is called. Never use a mutable object (like a list or dict) as a default parameter value!

~~~python
# DANGEROUS: lst is shared across every call!
def append_reading(val, lst=[]):
    lst.append(val)
    return lst

# SAFE IDIOM:
def append_reading(val, lst=None):
    if lst is None:
        lst = []
    lst.append(val)
    return lst
~~~`,
    theorySections: [
      {
        id: "py-legb-lookup",
        title: "LEGB Name Resolution",
        content: "Names assigned inside a function belong to the local namespace unless declared with the global or nonlocal keyword. Referencing a name searches outward through Local, Enclosing, Global, and Built-in scopes.",
      },
      {
        id: "py-mutable-default-pitfall",
        title: "The Definition-Time Evaluation Trap",
        content: "Because def is an executable statement, default argument objects are allocated once when the module loads. Mutating a default argument mutates that shared object permanently.",
      },
    ],
    codeExamples: [
      {
        title: "Configurable Filter Function with Keyword Arguments",
        language: "python",
        code: `def apply_filter(signal: list[float], cutoff_hz: float = 50.0, passes: int = 1) -> list[float]:\n    result = [s * (1.0 / passes) for s in signal]\n    return result\n\nraw_data = [1.0, 2.0, 3.0]\nprint("Default:", apply_filter(raw_data))\nprint("Custom:", apply_filter(raw_data, passes=2, cutoff_hz=20.0))`,
        description: "Demonstrating default parameters and invocation with keyword arguments.",
      },
    ],
    resources: [
      {
        title: "Default Argument Values - Python Tutorial",
        url: "https://docs.python.org/3/tutorial/controlflow.html#default-argument-values",
        description: "Official documentation and examples of default and keyword arguments.",
        type: "documentation",
      },
    ],
    execution: { language: "python", target: "browser-wasm" },
    exampleRun: exampleRun("Default: [1.0, 2.0, 3.0]\nCustom: [0.5, 1.0, 1.5]\n"),
    exercise: exercise(
      "ex-py-safe-accumulator",
      "Implement a safe buffer accumulator",
      "Write a function log_reading(reading, log_list=None) that safely appends reading to log_list and returns it. If log_list is None, initialize it as a new empty list inside the function.",
      `def log_reading(reading, log_list=None):\n    if log_list is None:\n        log_list = []\n    log_list.append(reading)\n    return log_list\n\nl1 = log_reading(10)\nl2 = log_reading(20)\nprint("L1:", l1, "L2:", l2)`,
      "py-scope-rules",
      "Avoid mutable default argument traps using the safe sentinel default pattern.",
      [
        "Set the default parameter to log_list=None.",
        "Check if log_list is None: log_list = [] inside the function.",
        "Append the reading to log_list and return it.",
      ],
      "Developing",
      `def log_reading(reading, log_list=None):\n    # Safely handle default list and return updated log_list\n    pass\n`,
      [
        {
          id: "tc-py-accum-1",
          label: "Demonstrates independent lists across calls",
          expectedStdout: "L1: [10] L2: [20]",
          matchMode: "trimmed",
        },
        {
          id: "tc-py-accum-hidden",
          label: "Separate list verification",
          expectedStdout: "[10]",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why is def process(data, buffer=[]) considered dangerous in Python?",
      "Default arguments are evaluated only once at definition time. The list buffer would be shared across all function calls that omit the argument, leaking state between invocations.",
    ),
  },

  {
    id: "py-exception-handling",
    order: 14,
    title: "Handling errors with try, except, and finally",
    summary: "Prevent crashes with try-except blocks, catch specific exceptions (ValueError, ZeroDivisionError), and use finally.",
    type: "practical-exercise",
    objectiveIds: ["py-error-handling"],
    prerequisiteLessonIds: ["py-scope-and-arguments"],
    estimatedDurationMinutes: 30,
    content: `Real-world engineering systems must handle unexpected inputs, dropped network packets, and corrupted files without crashing. Python uses structured **exceptions** to signal and recover from runtime errors.

### The try-except Block
Code that might raise an error is placed in a \`try\` block. If an exception occurs, Python halts execution of the try block and transfers control to matching \`except\` clauses:

~~~python
try:
    reading = float("invalid_data")
except ValueError as err:
    print(f"Conversion failed: {err}")
~~~

### Catching Specific Exceptions
Always catch specific exception types rather than writing a bare \`except:\`. Catching specific exceptions prevents accidentally silencing system exit requests (\`KeyboardInterrupt\`) or masking syntax bugs. Common exceptions:
- \`ValueError\`: Incompatible value during type conversion.
- \`ZeroDivisionError\`: Division or modulo by zero.
- \`KeyError\`: Dictionary key not found.
- \`IndexError\`: Sequence index out of range.
- \`FileNotFoundError\`: Attempting to open a non-existent file path.

### The finally Clause
Code in a \`finally\` block executes **unconditionally**, regardless of whether an exception occurred, was caught, or was re-raised. It is commonly used for resource cleanup (like closing hardware ports or network sockets).`,
    theorySections: [
      {
        id: "py-exception-hierarchy",
        title: "The Exception Hierarchy",
        content: "All standard exceptions derive from BaseException. Standard user-level errors inherit from Exception. Catching Exception avoids capturing SystemExit and KeyboardInterrupt.",
      },
      {
        id: "py-try-else-finally",
        title: "The Complete try Statement",
        content: "A complete try block can have except clauses for recovery, an optional else clause (which runs only if no exception occurred), and a finally clause for guaranteed cleanup.",
      },
    ],
    codeExamples: [
      {
        title: "Safe Numerical Parsing and Zero Division Guard",
        language: "python",
        code: `def calculate_efficiency(output_w: str, input_w: str) -> float | None:\n    try:\n        p_out = float(output_w)\n        p_in = float(input_w)\n        return (p_out / p_in) * 100.0\n    except ValueError:\n        print("Error: Non-numeric power reading.")\n        return None\n    except ZeroDivisionError:\n        print("Error: Input power cannot be zero.")\n        return None\n    finally:\n        print("Telemetry calculation completed.")\n\nprint("Result:", calculate_efficiency("85.0", "100.0"))`,
        description: "Catching ValueError and ZeroDivisionError independently with guaranteed finally logging.",
      },
    ],
    resources: [
      {
        title: "Errors and Exceptions - Python Tutorial",
        url: "https://docs.python.org/3/tutorial/errors.html",
        description: "Official guide to Python syntax errors, exceptions, and clean handling.",
        type: "documentation",
      },
    ],
    execution: { language: "python", target: "browser-wasm" },
    exampleRun: exampleRun("Telemetry calculation completed.\nResult: 85.0\n"),
    exercise: exercise(
      "ex-py-robust-divider",
      "Build a safe division and parsing utility",
      "Write a function safe_divide(val1_str, val2_str) that converts both arguments to floats and divides val1 by val2. If ValueError occurs, return 'ERR_INVALID_NUM'; if ZeroDivisionError occurs, return 'ERR_DIV_ZERO'.",
      `def safe_divide(val1_str, val2_str):\n    try:\n        num1 = float(val1_str)\n        num2 = float(val2_str)\n        return num1 / num2\n    except ValueError:\n        return "ERR_INVALID_NUM"\n    except ZeroDivisionError:\n        return "ERR_DIV_ZERO"\n\nprint(safe_divide("10", "2"))\nprint(safe_divide("10", "0"))\nprint(safe_divide("10", "abc"))`,
      "py-error-handling",
      "Implement defensive exception handling for mathematical calculations.",
      [
        "Wrap the float() conversions and division inside a try: block.",
        "Catch ValueError and return 'ERR_INVALID_NUM'.",
        "Catch ZeroDivisionError and return 'ERR_DIV_ZERO'.",
      ],
      "Developing",
      `def safe_divide(val1_str, val2_str):\n    # Safely convert and divide, catching ValueError and ZeroDivisionError\n    pass\n`,
      [
        {
          id: "tc-py-div-1",
          label: "Handles valid division, zero division, and value error",
          expectedStdout: "5.0\nERR_DIV_ZERO\nERR_INVALID_NUM",
          matchMode: "trimmed",
        },
        {
          id: "tc-py-div-hidden",
          label: "Checks error code strings",
          expectedStdout: "ERR_DIV_ZERO",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why is a bare except: clause considered an anti-pattern in Python?",
      "A bare except catches all exceptions, including KeyboardInterrupt (preventing the user from stopping a program with Ctrl+C) and internal syntax/name errors, making debugging difficult.",
    ),
  },

  // Module 6: Files, Modules, and Engineering Projects
  {
    id: "py-file-io",
    order: 15,
    title: "Reading and writing files with context managers",
    summary: "Open, read lines, and write structured records using with open(...) as f context managers.",
    type: "guided-coding",
    objectiveIds: ["py-file-io-mgr"],
    prerequisiteLessonIds: ["py-exception-handling"],
    estimatedDurationMinutes: 35,
    content: `Engineering programs must persist experimental data, read hardware calibration tables, and export log reports to the filesystem. In Python, file operations are mediated through the built-in \`open()\` function.

### Context Managers and the with Statement
The idiomatic, safe method to open files in Python is using the \`with\` statement. It establishes a **context manager** that guarantees the file descriptor is closed properly as soon as execution leaves the block, even if an unhandled exception or early return occurs:

~~~python
with open("sensor_data.txt", "r", encoding="utf-8") as f:
    content = f.read()
~~~

### File Modes
- \`"r"\`: Read (default). Raises \`FileNotFoundError\` if missing.
- \`"w"\`: Write. Creates the file or **overwrites** existing contents.
- \`"a"\`: Append. Writes new data at the end without truncating.

### Streaming Lines Efficiently
To process large datasets without exhausting system memory, iterate directly over the file object:

~~~python
with open("large_log.csv", "r", encoding="utf-8") as f:
    for line in f:
        # Process each line individually
        cleaned = line.strip()
~~~`,
    theorySections: [
      {
        id: "py-context-manager-protocol",
        title: "The Context Manager Protocol",
        content: "The with statement invokes __enter__() upon entry and guarantees __exit__() is called upon exit. This prevents file descriptor leaks and operating system resource exhaustion.",
      },
      {
        id: "py-encoding-standard",
        title: "Explicit Character Encoding",
        content: "Always specify encoding='utf-8' when opening text files to ensure consistent cross-platform behavior between Windows, macOS, and Linux systems.",
      },
    ],
    codeExamples: [
      {
        title: "Writing and Reading Structured Log Records",
        language: "python",
        code: `records = ["timestamp,temperature\\n", "1001,23.5\\n", "1002,24.1\\n"]\nwith open("telemetry.csv", "w", encoding="utf-8") as file:\n    file.writelines(records)\n\nwith open("telemetry.csv", "r", encoding="utf-8") as file:\n    header = file.readline().strip()\n    first_data = file.readline().strip()\n\nprint("Header:", header)\nprint("First reading:", first_data)`,
        description: "Writing and reading structured CSV records using with-statement context managers.",
      },
    ],
    resources: [
      {
        title: "Reading and Writing Files - Python Tutorial",
        url: "https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files",
        description: "Official documentation covering file objects, methods, and JSON persistence.",
        type: "documentation",
      },
    ],
    execution: { language: "python", target: "browser-wasm" },
    exampleRun: exampleRun("Header: timestamp,temperature\nFirst reading: 1001,23.5\n"),
    exercise: exercise(
      "ex-py-log-aggregator",
      "Parse and aggregate structured file lines",
      "Write a function parse_log_lines(lines) that takes a list of CSV log lines like 'TIMESTAMP,METRIC,VALUE', extracts valid numeric values, and returns a dictionary mapping each metric name to a list of its float values.",
      `def parse_log_lines(lines):\n    metrics = {}\n    for line in lines:\n        parts = line.strip().split(",")\n        if len(parts) >= 3:\n            name = parts[1].strip()\n            try:\n                val = float(parts[2].strip())\n                metrics.setdefault(name, []).append(val)\n            except ValueError:\n                continue\n    return metrics\n\nsample_lines = ["12:00,voltage,3.3", "12:01,current,1.2", "12:02,voltage,3.4"]\nprint(parse_log_lines(sample_lines))`,
      "py-file-io-mgr",
      "Parse structured text records and aggregate values into categorized dictionary lists.",
      [
        "Initialize an empty dictionary metrics = {}.",
        "Strip and split each line by comma into parts.",
        "Safely convert parts[2] to a float and append it to metrics.setdefault(parts[1], []).",
      ],
      "Applied",
      `def parse_log_lines(lines):\n    # Parse lines into dict of {metric: [values]}\n    pass\n`,
      [
        {
          id: "tc-py-agg-1",
          label: "Groups parsed values by metric name",
          expectedStdout: "{'voltage': [3.3, 3.4], 'current': [1.2]}",
          matchMode: "trimmed",
        },
        {
          id: "tc-py-agg-hidden",
          label: "Checks voltage key in parsed dict",
          expectedStdout: "'voltage': [3.3, 3.4]",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why is with open(file, 'w') preferred over manual file = open(file, 'w') and file.close()?",
      "The with statement guarantees that the file descriptor is closed automatically upon leaving the block, even if an unexpected exception occurs or the thread returns early.",
    ),
  },

  {
    id: "py-engineering-capstone",
    order: 16,
    title: "Capstone: Sensor telemetry data analyzer",
    summary: "Build a complete engineering telemetry analyzer that parses data, calculates statistics, filters anomalies, and outputs a formatted report.",
    type: "assessment",
    objectiveIds: ["py-modular-design", "py-capstone-project"],
    prerequisiteLessonIds: ["py-file-io"],
    estimatedDurationMinutes: 45,
    content: `In this capstone engineering challenge, you will synthesize the core principles of Python: dynamic variables, collections (lists and dictionaries), control flow (branching and loops), modular functions, defensive error handling, and string formatting.

Engineering datasets captured from field instruments often contain corrupted frames, missing fields, or sensor dropout anomalies (such as negative absolute pressures or thermocouple open-circuit spikes). A production data pipeline must cleanly parse records, filter corrupted samples, compute summary statistics, and generate clear status reports.

### Architecture of the Telemetry Pipeline
1. **Ingestion & Validation**: Validate channel names and check that numerical values lie within credible physical thresholds.
2. **Aggregation**: Group valid readings by channel using dictionary collections.
3. **Statistical Computation**: For each channel, calculate sample count, minimum, maximum, and arithmetic mean.
4. **Report Generation**: Format results into an engineering summary table using f-strings with specified precision.`,
    theorySections: [
      {
        id: "py-pipeline-architecture",
        title: "Separation of Ingestion and Aggregation",
        content: "Decoupling data validation from statistical computation ensures clean modular design. Bad records are quarantined early, preventing skewed statistical metrics or downstream calculation crashes.",
      },
      {
        id: "py-defensive-data-pipeline",
        title: "Production Engineering Best Practices",
        content: "Combine type hints, clear docstrings, explicit exception guards, and modular helper functions to create maintainable, self-documenting computational scripts.",
      },
    ],
    codeExamples: [
      {
        title: "Telemetry Pipeline Scaffold",
        language: "python",
        code: `def analyze_telemetry(data_stream: list[tuple[str, float]]) -> dict:\n    """Filter out-of-range sensor readings and compute channel summaries."""\n    channels = {}\n    for channel, val in data_stream:\n        if 0.0 <= val <= 100.0:\n            channels.setdefault(channel, []).append(val)\n    \n    report = {}\n    for channel, readings in channels.items():\n        report[channel] = {\n            "count": len(readings),\n            "mean": round(sum(readings) / len(readings), 2),\n            "max": max(readings)\n        }\n    return report`,
        description: "Filtering anomalies and generating channel summary dictionaries.",
      },
    ],
    resources: [
      {
        title: "PEP 8 - Style Guide for Python Code",
        url: "https://peps.python.org/pep-0008/",
        description: "Official style conventions and best practices for writing clean, readable Python.",
        type: "specification",
      },
    ],
    execution: { language: "python", target: "browser-wasm" },
    exampleRun: exampleRun("Telemetry Analysis Complete.\nChannel: temp | Count: 2 | Mean: 25.30 C | Max: 26.10 C\nChannel: pressure | Count: 2 | Mean: 86.60 kPa | Max: 88.00 kPa\n"),
    exercise: exercise(
      "ex-py-telemetry-capstone",
      "Implement the multi-channel telemetry analyzer",
      "Implement analyze_telemetry(data_records) where data_records is a list of tuples (channel_name, float_value). Discard any value < 0.0 or > 100.0. Return a dictionary mapping each channel_name to {'count': int, 'mean': float, 'max': float}.",
      `def analyze_telemetry(data_records):\n    valid = {}\n    for ch, val in data_records:\n        if 0.0 <= val <= 100.0:\n            valid.setdefault(ch, []).append(val)\n    summary = {}\n    for ch, vals in valid.items():\n        summary[ch] = {\n            "count": len(vals),\n            "mean": round(sum(vals) / len(vals), 2),\n            "max": max(vals),\n        }\n    return summary\n\nsamples = [("temp", 24.5), ("temp", 26.1), ("temp", 150.0), ("pressure", 85.2), ("pressure", -10.0), ("pressure", 88.0)]\nreport = analyze_telemetry(samples)\nprint(report)`,
      "py-capstone-project",
      "Synthesize data structures, filtering logic, and statistical computation into a modular solution.",
      [
        "Create a valid dictionary to group readings: valid.setdefault(ch, []).append(val).",
        "Verify 0.0 <= val <= 100.0 before accepting any reading.",
        "For each channel with valid readings, compute count, mean (using sum / count), and max.",
      ],
      "Applied",
      `def analyze_telemetry(data_records):\n    # 1. Group valid values in range [0.0, 100.0] by channel\n    # 2. Compute count, mean, max for each channel\n    # 3. Return summary dict\n    pass\n`,
      [
        {
          id: "tc-py-capstone-1",
          label: "Filters outliers and computes count, mean, max per channel",
          expectedStdout: "{'temp': {'count': 2, 'mean': 25.3, 'max': 26.1}, 'pressure': {'count': 2, 'mean': 86.6, 'max': 88.0}}",
          matchMode: "trimmed",
        },
        {
          id: "tc-py-capstone-hidden",
          label: "Checks temp channel summary",
          expectedStdout: "'temp': {'count': 2, 'mean': 25.3, 'max': 26.1}",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why is input anomaly filtering performed before statistical calculation in data pipelines?",
      "Filtering anomalies before computation prevents corrupt values (like sensor dropouts or wiring spikes) from distorting statistical averages and ensures only credible engineering data reaches downstream systems.",
    ),
  },

  // Module 7: Object-Oriented Systems and Algorithmic Efficiency
  {
    id: "py-classes-and-encapsulation",
    order: 17,
    title: "Object-oriented modeling with classes and encapsulation",
    summary: "Model engineering state and behaviors with classes, constructors (__init__), self, instance methods, and encapsulation conventions.",
    type: "guided-coding",
    objectiveIds: ["py-classes-encapsulation"],
    prerequisiteLessonIds: ["py-engineering-capstone"],
    estimatedDurationMinutes: 35,
    content: `When building larger engineering systems, grouping related state and behaviors into coherent objects makes code significantly easier to maintain and test. In Python, object-oriented programming centers on **classes**.

A class serves as a blueprint for creating instances. The initializer method \`__init__\` is invoked whenever a new instance is instantiated. The first parameter of every instance method is \`self\`, which references the specific instance executing the method:

~~~python
class PowerSupply:
    def __init__(self, voltage: float, max_current: float):
        self.voltage = voltage
        self.max_current = max_current
        self._is_enabled = False

    def enable(self):
        self._is_enabled = True

    def is_active(self) -> bool:
        return self._is_enabled
~~~

### Encapsulation and Private Attributes
Unlike languages like C++ or Java with strict \`private\` keywords, Python uses convention to denote encapsulation:
- Attributes prefixed with a single underscore (e.g., \`_charge\`) indicate internal implementation details that external code should not manipulate directly.
- Attributes prefixed with double underscores (e.g., \`__secret\`) trigger name mangling to prevent accidental collisions in subclasses.`,
    theorySections: [
      {
        id: "py-self-binding",
        title: "The self Parameter and Method Binding",
        content: "When calling obj.method(arg), Python translates this under the hood to Class.method(obj, arg). The self parameter explicitly represents the target instance.",
      },
      {
        id: "py-encapsulation-idioms",
        title: "Pythonic Encapsulation",
        content: "We are all consenting adults here is Python's guiding philosophy: use single underscore conventions and properties rather than rigid access modifiers.",
      },
    ],
    codeExamples: [
      {
        title: "Modeling an Actuator Device",
        language: "python",
        code: `class Actuator:\n    def __init__(self, name: str, max_angle: float = 180.0):\n        self.name = name\n        self.max_angle = max_angle\n        self._angle = 0.0\n\n    def rotate(self, delta: float):\n        new_angle = self._angle + delta\n        self._angle = max(0.0, min(self.max_angle, new_angle))\n\n    def get_position(self) -> float:\n        return self._angle\n\nservo = Actuator("Rudder", 90.0)\nservo.rotate(45.0)\nservo.rotate(60.0)\nprint(f"{servo.name} at {servo.get_position()} deg")`,
        description: "Defining stateful class attributes and boundary-clamped mutator methods.",
      },
    ],
    resources: [
      {
        title: "Classes - Python Tutorial",
        url: "https://docs.python.org/3/tutorial/classes.html",
        description: "Official guide to Python classes, scopes, and namespace mechanisms.",
        type: "documentation",
      },
    ],
    execution: { language: "python", target: "browser-wasm" },
    exampleRun: exampleRun("Rudder at 90.0 deg\n"),
    exercise: exercise(
      "ex-py-sensor-class",
      "Build an encapsulated Battery model class",
      "Define a class Battery with an __init__(self, capacity_ah, initial_charge=0.0) that sets self.capacity_ah = capacity_ah and self._charge = initial_charge. Add a method charge(amount_ah) that increases _charge up to capacity_ah (cannot exceed capacity), and a method state_of_charge() that returns the percentage (self._charge / self.capacity_ah) * 100.0. Test by creating b = Battery(100.0, 20.0), calling b.charge(50.0), and printing f'SOC: {b.state_of_charge():.1f}%'.",
      `class Battery:\n    def __init__(self, capacity_ah, initial_charge=0.0):\n        self.capacity_ah = capacity_ah\n        self._charge = initial_charge\n\n    def charge(self, amount_ah):\n        self._charge = min(self.capacity_ah, self._charge + amount_ah)\n\n    def state_of_charge(self):\n        return (self._charge / self.capacity_ah) * 100.0\n\nb = Battery(100.0, 20.0)\nb.charge(50.0)\nprint(f"SOC: {b.state_of_charge():.1f}%")`,
      "py-classes-encapsulation",
      "Implement a stateful class with encapsulation conventions and boundary clamping.",
      [
        "Initialize self.capacity_ah and self._charge in __init__.",
        "In charge(amount_ah), clamp _charge to min(self.capacity_ah, self._charge + amount_ah).",
        "Compute percentage in state_of_charge() as (_charge / capacity_ah) * 100.0.",
      ],
      "Developing",
      `class Battery:\n    # Implement __init__, charge, and state_of_charge\n    pass\n\nb = Battery(100.0, 20.0)\n# Charge by 50.0 and print SOC\n`,
      [
        {
          id: "tc-py-class-1",
          label: "Charges battery from 20% to 70% and prints SOC",
          expectedStdout: "SOC: 70.0%",
          matchMode: "trimmed",
        },
        {
          id: "tc-py-class-hidden",
          label: "SOC percentage check",
          expectedStdout: "70.0%",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why must instance methods in Python define self as their first parameter?",
      "Python passes the target object reference explicitly into the method as its first argument; naming it self is the universal convention that binds the instance to the function call.",
    ),
  },

  {
    id: "py-inheritance-dataclasses",
    order: 18,
    title: "Inheritance, super(), and dataclasses",
    summary: "Extend base classes using inheritance and super(), and simplify structured data containers using @dataclass.",
    type: "practical-exercise",
    objectiveIds: ["py-inheritance-dataclasses"],
    prerequisiteLessonIds: ["py-classes-and-encapsulation"],
    estimatedDurationMinutes: 35,
    content: `Inheritance allows new classes to adopt and specialize fields and behaviors from parent classes, reducing boilerplate across telemetry hierarchies.

### Subclassing and super()
To inherit from a class, place the parent class name in parentheses after the subclass name:
~~~python
class CalibratedSensor(Sensor):
    def __init__(self, name: str, offset: float):
        super().__init__(name)
        self.offset = offset
~~~
The \`super()\` built-in function returns a proxy object delegating method calls to a parent or sibling class.

### Modern Data Containers with @dataclass
Python 3.7+ includes the \`dataclasses\` module. Applying the \`@dataclass\` decorator to a class automatically synthesizes \`__init__\`, \`__repr__\`, and equality comparison methods from type-annotated field definitions:

~~~python
from dataclasses import dataclass

@dataclass
class Packet:
    packet_id: int
    payload: str
    crc_valid: bool = True
~~~`,
    theorySections: [
      {
        id: "py-method-resolution",
        title: "Method Resolution Order (MRO)",
        content: "Python determines method dispatch paths in class hierarchies using C3 Linearization. You can inspect an object's dispatch sequence with ClassName.mro().",
      },
      {
        id: "py-dataclass-efficiency",
        title: "Advantages of Dataclasses",
        content: "Dataclasses eliminate repetitive boilerplate assignments while preserving standard class semantics and full compatibility with type checkers.",
      },
    ],
    codeExamples: [
      {
        title: "Telemetry Record Hierarchy with Dataclasses",
        language: "python",
        code: `from dataclasses import dataclass\n\n@dataclass\nclass Measurement:\n    channel: str\n    value: float\n\nclass Instrument:\n    def __init__(self, station_id: str):\n        self.station_id = station_id\n\n    def format_log(self, m: Measurement) -> str:\n        return f"[{self.station_id}] {m.channel}: {m.value:.2f}"\n\ninst = Instrument("Station-Beta")\nm = Measurement("Pressure", 101.325)\nprint(inst.format_log(m))`,
        description: "Composing structured dataclass records with class-based telemetry loggers.",
      },
    ],
    resources: [
      {
        title: "dataclasses - Data Classes Documentation",
        url: "https://docs.python.org/3/library/dataclasses.html",
        description: "Official documentation covering field options, default factories, and frozen dataclasses.",
        type: "documentation",
      },
    ],
    execution: { language: "python", target: "browser-wasm" },
    exampleRun: exampleRun("[Station-Beta] Pressure: 101.32\n"),
    exercise: exercise(
      "ex-py-device-hierarchy",
      "Implement a calibrated sensor subclass and dataclass",
      "Import dataclass from dataclasses. Define a @dataclass named Reading with fields timestamp: int and value: float. Define a class Device with __init__(self, device_id: str). Subclass CalibratedDevice(Device) whose __init__(self, device_id: str, offset: float) invokes super().__init__(device_id) and saves self.offset = offset. Add a method calibrate(self, reading: Reading) -> float that returns reading.value + self.offset. Create dev = CalibratedDevice('DEV-01', 1.5) and r = Reading(1000, 24.0), and print f'{dev.device_id}: {dev.calibrate(r):.1f}'.",
      `from dataclasses import dataclass\n\n@dataclass\nclass Reading:\n    timestamp: int\n    value: float\n\nclass Device:\n    def __init__(self, device_id: str):\n        self.device_id = device_id\n\nclass CalibratedDevice(Device):\n    def __init__(self, device_id: str, offset: float):\n        super().__init__(device_id)\n        self.offset = offset\n\n    def calibrate(self, reading: Reading) -> float:\n        return reading.value + self.offset\n\ndev = CalibratedDevice("DEV-01", 1.5)\nr = Reading(1000, 24.0)\nprint(f"{dev.device_id}: {dev.calibrate(r):.1f}")`,
      "py-inheritance-dataclasses",
      "Build class hierarchies with super() and compact dataclass data models.",
      [
        "Decorate Reading with @dataclass and define timestamp and value.",
        "Invoke super().__init__(device_id) in CalibratedDevice.",
        "Calculate reading.value + self.offset inside calibrate.",
      ],
      "Developing",
      `from dataclasses import dataclass\n\n# Define Reading dataclass, Device, and CalibratedDevice\n`,
      [
        {
          id: "tc-py-dataclass-1",
          label: "Calibrates reading through subclass and prints result",
          expectedStdout: "DEV-01: 25.5",
          matchMode: "trimmed",
        },
        {
          id: "tc-py-dataclass-hidden",
          label: "Calibrated value check",
          expectedStdout: "25.5",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "What methods are automatically generated when applying the @dataclass decorator?",
      "By default, @dataclass generates __init__(), __repr__(), and __eq__() methods based on the class's typed field declarations.",
    ),
  },

  {
    id: "py-algorithms-and-generators",
    order: 19,
    title: "Generators, stream processing, and algorithmic efficiency",
    summary: "Stream massive sequences with generator functions and yield, evaluate Big-O algorithmic complexity, and implement binary search.",
    type: "guided-coding",
    objectiveIds: ["py-algorithms-generators"],
    prerequisiteLessonIds: ["py-inheritance-dataclasses"],
    estimatedDurationMinutes: 40,
    content: `When analyzing gigabytes of sensor readings or high-frequency telemetry, storing all records simultaneously in lists consumes excessive memory. Python's **generators** solve this by producing elements lazily on demand.

### The yield Keyword
A function containing \`yield\` is a generator function. When called, it does not execute the body immediately; instead, it returns a generator object conforming to the iterator protocol. Each call to \`next()\` runs code until encountering \`yield\`, suspends execution state, and emits the value:

~~~python
def count_down(n):
    while n > 0:
        yield n
        n -= 1
~~~

### Algorithmic Efficiency and Big-O
Evaluating performance requires measuring asymptotic execution time:
- **Linear Search**: $O(N)$ — traverses every item sequentially.
- **Binary Search**: $O(\\log N)$ — repeatedly bisects sorted arrays, searching 1,000,000 items in at most 20 comparisons.`,
    theorySections: [
      {
        id: "py-generator-memory",
        title: "Lazy Evaluation and O(1) Memory Footprint",
        content: "Generators maintain only local variable frame state between iterations, providing O(1) auxiliary space regardless of sequence length.",
      },
      {
        id: "py-binary-search-theory",
        title: "Binary Search Invariant",
        content: "Binary search requires a sorted array and maintains low and high pointers, examining mid = (low + high) // 2 on each iteration.",
      },
    ],
    codeExamples: [
      {
        title: "Streaming File Generator and Binary Search",
        language: "python",
        code: `def power_of_two_stream(max_exp: int):\n    for e in range(max_exp + 1):\n        yield 2 ** e\n\npowers = list(power_of_two_stream(8))\nprint("Powers:", powers)`,
        description: "Lazily generating exponential values with a yield loop.",
      },
    ],
    resources: [
      {
        title: "Generators - Python Wiki",
        url: "https://wiki.python.org/moin/Generators",
        description: "Guide to generator expressions, memory efficiency, and coroutines.",
        type: "documentation",
      },
    ],
    execution: { language: "python", target: "browser-wasm" },
    exampleRun: exampleRun("Powers: [1, 2, 4, 8, 16, 32, 64, 128, 256]\n"),
    exercise: exercise(
      "ex-py-binary-search-generator",
      "Implement a generator filter and binary search",
      "Write two functions: 1) A generator even_stream(limit) yielding even integers from 0 up to limit inclusive. 2) A binary search function binary_search(sorted_arr, target) that returns the integer index of target in sorted_arr in O(log N) time, or -1 if not found. Run binary search on evens = list(even_stream(20)) searching for 14, and print f'Index of 14: {binary_search(evens, 14)}'.",
      `def even_stream(limit):\n    for i in range(0, limit + 1, 2):\n        yield i\n\ndef binary_search(sorted_arr, target):\n    low = 0\n    high = len(sorted_arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if sorted_arr[mid] == target:\n            return mid\n        elif sorted_arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1\n\nevens = list(even_stream(20))\nidx = binary_search(evens, 14)\nprint(f"Index of 14: {idx}")`,
      "py-algorithms-generators",
      "Implement lazy generator pipelines and O(log N) binary search routines.",
      [
        "Use yield i in even_stream with step 2 in range(0, limit + 1, 2).",
        "Maintain low = 0 and high = len(sorted_arr) - 1 inside binary_search.",
        "Bisect with mid = (low + high) // 2 and adjust boundaries accordingly.",
      ],
      "Developing",
      `def even_stream(limit):\n    # Yield even numbers up to limit\n    pass\n\ndef binary_search(sorted_arr, target):\n    # Return index of target in sorted_arr or -1\n    pass\n\nevens = list(even_stream(20))\n# Search for 14 and print result\n`,
      [
        {
          id: "tc-py-algo-1",
          label: "Finds index of 14 in even sequence using binary search",
          expectedStdout: "Index of 14: 7",
          matchMode: "trimmed",
        },
        {
          id: "tc-py-algo-hidden",
          label: "Binary search index check",
          expectedStdout: "Index of 14: 7",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "How does a generator function differ in memory consumption from a function returning a complete list?",
      "A generator computes and yields items lazily one at a time, requiring O(1) memory, whereas a list pre-allocates memory for every item simultaneously (O(N) memory).",
    ),
  },
];

export const pythonProgrammingPath: LearningCourse = {
  id: "python-programming-foundations",
  subjectId: pythonProgrammingSubject.id,
  title: "Python Programming Foundations",
  description: "Build a solid, practical foundation in Python: learn core syntax, data types, control flow, functions, dynamic data structures, file handling, and modular engineering problem-solving.",
  level: "Beginner",
  version: "1.0.0",
  prerequisites: [
    "No prior programming experience is required.",
    "Familiarity with basic computer usage and text editing.",
  ],
  objectives: pythonObjectives,
  learningOutcomes: [
    "Write, read, and explain clean, idiomatic Python 3 programs.",
    "Work effectively with dynamic variables, arithmetic, logical expressions, and formatted I/O.",
    "Control execution flow using conditionals (if/elif/else) and iteration (for and while loops).",
    "Manipulate and choose appropriate data structures: lists, tuples, dictionaries, and sets.",
    "Design reusable functions with positional, default, and keyword arguments and clear variable scopes.",
    "Solve engineering and data-handling problems by combining data structures, modular logic, and file operations.",
  ],
  estimatedDurationMinutes: 540,
  publicationStatus: "published",
  modules: [
    moduleData("py-fundamentals", 1, "Python fundamentals and dynamic typing", "Meet Python, understand interpreted execution, and work with dynamic variables and numeric types.", pythonLessons.slice(0, 2)),
    moduleData("py-io-and-operators", 2, "Input, output, and operators", "Read interactive input, convert types, format output with f-strings, and perform computations.", pythonLessons.slice(2, 5)),
    moduleData("py-control-flow", 3, "Control flow: decisions and loops", "Direct program flow with if-elif-else statements, while loops, and for loops with range().", pythonLessons.slice(5, 8)),
    moduleData("py-data-structures", 4, "Strings, collections, and data structures", "Store, index, slice, and transform collections with lists, tuples, dictionaries, and sets.", pythonLessons.slice(8, 11)),
    moduleData("py-functions-and-robustness", 5, "Functions, scope, and error handling", "Encapsulate logic into reusable functions, manage variable scope, and handle runtime exceptions gracefully.", pythonLessons.slice(11, 14)),
    moduleData("py-files-and-projects", 6, "Files, modules, and practical engineering", "Read and write external files, structure modular scripts, and build a complete engineering data processor.", pythonLessons.slice(14, 16)),
    moduleData("py-oop-and-algorithms", 7, "Object-oriented systems and algorithmic efficiency", "Design robust domain models using classes, inheritance, dataclasses, and streaming generators.", pythonLessons.slice(16)),
  ],
};
