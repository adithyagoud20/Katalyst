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
} from "../learning-curriculum";

export const digitalCircuitsSubject: LearningSubject = {
  id: "digital-circuits",
  title: "Digital Circuits & Logic",
  description: "From physical Ohm's Law and RC timing circuits to Boolean algebra, combinational logic gates, and sequential memory latches.",
};

export const digitalCircuitsObjectives: LearningObjective[] = [
  { id: "circuits-ohms-law", title: "Calculate voltage drops, currents, and power dissipation across series and parallel resistor networks." },
  { id: "circuits-rc-transient", title: "Analyze capacitor charging, discharging, and RC time constants (tau = R * C)." },
  { id: "circuits-basic-gates", title: "Verify truth tables and operations of basic logic gates: AND, OR, and NOT." },
  { id: "circuits-universal-gates", title: "Synthesize arbitrary Boolean functions using universal NAND and NOR gates and De Morgan's laws." },
  { id: "circuits-xor-parity-obj", title: "Construct Exclusive-OR (XOR) circuits and multi-bit parity generators for error detection." },
  { id: "circuits-adders", title: "Design combinational binary arithmetic adders using Half Adders and Full Adders." },
  { id: "circuits-mux-demux", title: "Route multi-channel data streams using binary Multiplexers (Mux) and Demultiplexers (Demux)." },
  { id: "circuits-latches-sequential", title: "Trace edge-triggered memory storage and feedback loops in SR Latches and D Flip-Flops." },
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

export const digitalCircuitsLessons: LearningLesson[] = [
  // Module 1: Electricity Fundamentals & Passive Circuits
  {
    id: "circuits-ohms-law-resistors",
    order: 1,
    title: "Ohm's Law, Voltage, and Resistor Networks",
    summary: "Master voltage, current, and resistance; calculate series/parallel equivalent resistance and dissipated electrical power.",
    type: "interactive-simulation",
    objectiveIds: ["circuits-ohms-law"],
    prerequisiteLessonIds: [],
    estimatedDurationMinutes: 25,
    content: `All computing devices are physical electronic circuits governed by electromagnetism. The fundamental relationship governing passive conductors is **Ohm's Law**:

$$V = I \\times R$$

Where:
- $V$ is electrical potential difference (Voltage) in Volts (V).
- $I$ is flow of charge (Current) in Amperes (A).
- $R$ is opposition to current flow (Resistance) in Ohms ($\\Omega$).

### Resistors in Series and Parallel
- **Series**: Resistors connected end-to-end share identical current. Total resistance is additive: $R_{\\text{total}} = R_1 + R_2 + \\dots + R_n$.
- **Parallel**: Resistors connected across the same two nodes share identical voltage. Reciprocal addition: $\\frac{1}{R_{\\text{total}}} = \\frac{1}{R_1} + \\frac{1}{R_2}$.

### Electrical Power Dissipation
The rate of energy dissipated as heat through a resistive component is given by Joule's Law: $P = V \\times I = I^2 R = \\frac{V^2}{R}$ in Watts (W).`,
    theorySections: [
      {
        id: "circuits-voltage-divider",
        title: "The Voltage Divider Principle",
        content: "In a two-resistor series chain across supply V_in, the mid-point voltage is V_out = V_in * (R2 / (R1 + R2)). This forms the basis of analog sensor reading in microcontroller ADC pins.",
      },
      {
        id: "circuits-kirchhoff-laws",
        title: "Kirchhoff's Laws",
        content: "KCL (Current Law): The sum of currents entering any node equals zero. KVL (Voltage Law): The sum of potential differences around any closed circuit loop equals zero.",
      },
    ],
    codeExamples: [
      {
        title: "Series Resistor Voltage Divider Simulation",
        language: "javascript",
        code: `const vin = 12.0;\nconst r1 = 1000;\nconst r2 = 2000;\nconst vout = vin * (r2 / (r1 + r2));\nconsole.log(\`Vout: \${vout.toFixed(2)} V\`);`,
        description: "Calculating node voltage at the junction of a two-resistor divider.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "DC Voltage Divider & Ohm's Law",
      description: "Vary input voltage and resistance values to observe current and node voltages in real time.",
      config: { mode: "analog", voltage: 12, resistance: 100 },
    },
    resources: [
      {
        title: "All About Circuits - Ohm's Law",
        url: "https://www.allaboutcircuits.com/textbook/direct-current/chpt-2/voltage-current-resistance-relate/",
        description: "Fundamental textbook chapter on DC circuit analysis.",
        type: "documentation",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Vout: 8.00 V\n"),
    exercise: exercise(
      "ex-circ-ohms-series",
      "Calculate total current and power in series circuit",
      "Given a 12V DC power source connected to two series resistors R1 = 40 ohms and R2 = 60 ohms, compute the total circuit current in Amperes and total electrical power in Watts. Print: Current: {current} A, Power: {power} W with current formatted to 3 decimals and power to 2 decimals.",
      `const voltage = 12.0;\nconst r1 = 40.0;\nconst r2 = 60.0;\nconst rTotal = r1 + r2;\nconst current = voltage / rTotal;\nconst power = voltage * current;\nconsole.log(\`Current: \${current.toFixed(3)} A, Power: \${power.toFixed(2)} W\`);`,
      "circuits-ohms-law",
      "Apply Ohm's law and Joule's power formula across series resistors.",
      [
        "Compute rTotal = r1 + r2.",
        "Compute current = voltage / rTotal.",
        "Compute power = voltage * current.",
      ],
      "Beginner",
      `const voltage = 12.0;\nconst r1 = 40.0;\nconst r2 = 60.0;\n// Calculate current and power, then print\n`,
      [
        {
          id: "tc-circ-ohm-1",
          label: "Calculates Current: 0.120 A, Power: 1.44 W",
          expectedStdout: "Current: 0.120 A, Power: 1.44 W",
          matchMode: "trimmed",
        },
        {
          id: "tc-circ-ohm-hidden",
          label: "Current readout check",
          expectedStdout: "0.120 A",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "If you double the voltage across a fixed resistor, by what factor does the dissipated power increase?",
      "Power increases by a factor of 4, because electrical power is proportional to voltage squared: P = V^2 / R.",
    ),
  },

  {
    id: "circuits-capacitors-rc-transient",
    order: 2,
    title: "Capacitors, RC Time Constants, and Transient Charging",
    summary: "Observe charge storage in capacitors, calculate the RC time constant tau = R * C, and plot exponential transient curves.",
    type: "interactive-simulation",
    objectiveIds: ["circuits-rc-transient"],
    prerequisiteLessonIds: ["circuits-ohms-law-resistors"],
    estimatedDurationMinutes: 30,
    content: `While resistors dissipate energy as heat, **capacitors** store electrical energy in an electrostatic field between conductive plates separated by a dielectric.

Capacitance ($C$) measures the charge $Q$ stored per unit voltage: $Q = C \\times V$, measured in Farads (F).

### RC Transient Response
When a DC step voltage $V_0$ is applied to a series resistor-capacitor ($RC$) circuit, the capacitor does not charge instantaneously. Instead, the voltage $V_C(t)$ rises exponentially:

$$V_C(t) = V_0 \\left(1 - e^{-t / \\tau}\\right)$$

Where $\\tau = R \\times C$ is the **characteristic time constant**:
- At $t = 1\\tau$, the capacitor reaches $\\approx 63.2\\%$ of $V_0$.
- At $t = 5\\tau$, the capacitor is considered fully charged ($> 99.3\\%$ of $V_0$).`,
    theorySections: [
      {
        id: "circuits-rc-filtering",
        title: "RC Low-Pass Filters",
        content: "Because capacitors resist sudden changes in voltage, an RC circuit acts as a low-pass filter, smoothing power supply ripples and suppressing high-frequency digital switching noise.",
      },
      {
        id: "circuits-transient-decay",
        title: "Discharge Phase",
        content: "When disconnected from supply and discharged through resistor R, capacitor voltage decays as V_C(t) = V_0 * e^(-t / tau).",
      },
    ],
    codeExamples: [
      {
        title: "RC Time Constant Calculation",
        language: "javascript",
        code: `const r = 10000; // 10k ohms\nconst c = 0.000047; // 47 microfarads\nconst tau = r * c;\nconsole.log(\`RC Time Constant: \${tau.toFixed(3)} s\`);`,
        description: "Calculating the tau time constant for an RC timing circuit.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "RC Transient Charging Curve",
      description: "Observe exponential voltage rise and decay curves across capacitor charging cycles.",
      config: { mode: "analog", voltage: 5, resistance: 1000, capacitance: 100 },
    },
    resources: [
      {
        title: "RC Transient Response - MIT OpenCourseWare",
        url: "https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/",
        description: "Differential equations and physical derivation of RC circuits.",
        type: "reference",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("RC Time Constant: 0.470 s\n"),
    exercise: exercise(
      "ex-circ-rc-timing",
      "Calculate RC time constant and 1-tau voltage",
      "For a circuit with supply V0 = 5.0 V, resistance R = 10,000 ohms, and capacitance C = 0.0001 Farads (100 uF), compute the time constant tau (tau = R * C) and the capacitor voltage after exactly 1 tau using V(tau) = V0 * (1 - e^(-1)). Print: Tau: {tau} s, V(tau): {vTau} V with tau formatted to 1 decimal and vTau to 2 decimals.",
      `const v0 = 5.0;\nconst r = 10000;\nconst c = 0.0001;\nconst tau = r * c;\nconst vTau = v0 * (1 - Math.exp(-1));\nconsole.log(\`Tau: \${tau.toFixed(1)} s, V(tau): \${vTau.toFixed(2)} V\`);`,
      "circuits-rc-transient",
      "Compute exponential transient voltage using Math.exp(-1).",
      [
        "Compute tau = r * c.",
        "Compute vTau = v0 * (1 - Math.exp(-1)).",
        "Use toFixed(1) for tau and toFixed(2) for vTau.",
      ],
      "Beginner",
      `const v0 = 5.0;\nconst r = 10000;\nconst c = 0.0001;\n// Calculate tau and voltage at 1 tau\n`,
      [
        {
          id: "tc-circ-rc-1",
          label: "Calculates Tau: 1.0 s, V(tau): 3.16 V",
          expectedStdout: "Tau: 1.0 s, V(tau): 3.16 V",
          matchMode: "trimmed",
        },
        {
          id: "tc-circ-rc-hidden",
          label: "Time constant check",
          expectedStdout: "Tau: 1.0 s",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Approximately what percentage of maximum voltage does a capacitor attain after elapsed time t = 1 tau?",
      "Approximately 63.2% of the applied voltage.",
    ),
  },

  // Module 2: Digital Logic Gates & Boolean Algebra
  {
    id: "circuits-logic-gates-basic",
    order: 3,
    title: "Basic Logic Gates: AND, OR, NOT",
    summary: "Construct digital logic systems from fundamental AND, OR, and NOT gates; evaluate composite truth tables.",
    type: "interactive-simulation",
    objectiveIds: ["circuits-basic-gates"],
    prerequisiteLessonIds: ["circuits-capacitors-rc-transient"],
    estimatedDurationMinutes: 25,
    content: `Digital circuits abstract continuous physical voltages into discrete binary logic levels:
- **Logic 0 (LOW)**: Ground potential ($0\\text{V}$).
- **Logic 1 (HIGH)**: Supply potential (typically $3.3\\text{V}$ or $5\\text{V}$).

### The Three Fundamental Gates
1. **NOT Gate (Inverter)**: Output is inverted logic: $\\text{OUT} = \\overline{A}$.
2. **AND Gate**: Output is 1 if and only if **both** inputs are 1: $\\text{OUT} = A \\cdot B$.
3. **OR Gate**: Output is 1 if **at least one** input is 1: $\\text{OUT} = A + B$.

Composite logic circuits connect outputs of gates into inputs of subsequent gates to realize complex decision equations.`,
    theorySections: [
      {
        id: "circuits-cmos-inverter",
        title: "CMOS Transistor Implementation",
        content: "In modern CMOS logic, a NOT gate consists of one pMOS pull-up transistor and one nMOS pull-down transistor connected to a common gate input.",
      },
      {
        id: "circuits-truth-tables",
        title: "Truth Table Exhaustive Proofs",
        content: "Because binary variables take only two values (0 or 1), any circuit with N inputs can be exhaustively verified through a truth table of 2^N rows.",
      },
    ],
    codeExamples: [
      {
        title: "Evaluating Logic Expressions",
        language: "javascript",
        code: `function evaluateCircuit(a, b) {\n  return (a && b) || !a ? 1 : 0;\n}\nconsole.log("A=1, B=0 ->", evaluateCircuit(1, 0));`,
        description: "Simulating composite gate equations in code.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Interactive AND, OR, NOT Gates",
      description: "Toggle binary input switches 0/1 and verify live output LED states against truth tables.",
      config: { mode: "digital", gate: "AND" },
    },
    resources: [
      {
        title: "Digital Logic Fundamentals",
        url: "https://en.wikipedia.org/wiki/Logic_gate",
        description: "Symbol catalog, truth tables, and semiconductor logic families.",
        type: "reference",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("A=1, B=0 -> 0\n"),
    exercise: exercise(
      "ex-circ-basic-truth-table",
      "Generate truth table for composite logic",
      "Evaluate the Boolean expression OUT = (A AND B) OR (NOT A) for all four input combinations [0,0], [0,1], [1,0], and [1,1]. Print each row in the format: A B -> OUT (e.g. '0 0 -> 1').",
      `const inputs = [[0, 0], [0, 1], [1, 0], [1, 1]];\nfor (const [a, b] of inputs) {\n  const out = (a && b) || (!a ? 1 : 0);\n  console.log(\`\${a} \${b} -> \${out ? 1 : 0}\`);\n}`,
      "circuits-basic-gates",
      "Iterate all 4 binary permutations and evaluate composite Boolean logic.",
      [
        "Loop through [[0,0], [0,1], [1,0], [1,1]].",
        "Compute out = (a && b) || !a.",
        "Print `${a} ${b} -> ${out ? 1 : 0}`.",
      ],
      "Beginner",
      `const inputs = [[0, 0], [0, 1], [1, 0], [1, 1]];\n// Evaluate (A AND B) OR (NOT A) for each input pair\n`,
      [
        {
          id: "tc-circ-basic-1",
          label: "Prints truth table for composite expression",
          expectedStdout: "0 0 -> 1\n0 1 -> 1\n1 0 -> 0\n1 1 -> 1",
          matchMode: "trimmed",
        },
        {
          id: "tc-circ-basic-hidden",
          label: "Row 4 check",
          expectedStdout: "1 1 -> 1",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "What is the output of an OR gate when one input is 1 and the other is unknown?",
      "The output is guaranteed to be 1, because true OR anything is always true.",
    ),
  },

  {
    id: "circuits-universal-nand-nor",
    order: 4,
    title: "Universal Gates: NAND, NOR, and De Morgan's Laws",
    summary: "Synthesize complete logic systems exclusively from NAND or NOR gates using De Morgan's duality theorems.",
    type: "interactive-simulation",
    objectiveIds: ["circuits-universal-gates"],
    prerequisiteLessonIds: ["circuits-logic-gates-basic"],
    estimatedDurationMinutes: 30,
    content: `A logic gate family is called **universal** if any possible Boolean function can be constructed using copies of that gate alone, without requiring any other gate type. Both **NAND** and **NOR** are universal gates.

### De Morgan's Laws
De Morgan's theorems provide mathematical duality rules for transforming compound logic:
1. $\\overline{A \\cdot B} = \\overline{A} + \\overline{B}$ (NAND equals OR with inverted inputs)
2. $\\overline{A + B} = \\overline{A} \\cdot \\overline{B}$ (NOR equals AND with inverted inputs)

### Synthesizing with NAND Gates Alone
- **Inverter (NOT $A$)**: Tie both inputs together: $A \\text{ NAND } A = \\overline{A \\cdot A} = \\overline{A}$.
- **AND ($A \\cdot B$)**: Invert the output of a NAND gate: $\\text{NOT}(A \\text{ NAND } B)$.
- **OR ($A + B$)**: Invert inputs and pass to NAND: $\\overline{A} \\text{ NAND } \\overline{B} = \\overline{\\overline{A} \\cdot \\overline{B}} = A + B$.`,
    theorySections: [
      {
        id: "circuits-nand-efficiency",
        title: "Silicon Area Economy",
        content: "In CMOS silicon, a NAND gate requires only 4 transistors, whereas an AND gate requires 6 (a 4-transistor NAND followed by a 2-transistor inverter). Fabricating chips with pure NAND logic maximizes density.",
      },
      {
        id: "circuits-functional-completeness",
        title: "Functional Completeness",
        content: "Any truth table can be expressed in Sum-of-Products (SOP) form, which maps directly to two-level NAND-NAND logic architectures.",
      },
    ],
    codeExamples: [
      {
        title: "NAND Logic Synthesis in JavaScript",
        language: "javascript",
        code: `const nand = (a, b) => !(a && b) ? 1 : 0;\nconst not = (a) => nand(a, a);\nconst and = (a, b) => not(nand(a, b));\nconsole.log("NAND-synthesized AND(1, 1):", and(1, 1));`,
        description: "Implementing NOT and AND using only the NAND primitive.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "NAND Logic Synthesis",
      description: "Build inverter and AND equivalents exclusively using two-input NAND gates.",
      config: { mode: "digital", gate: "NAND" },
    },
    resources: [
      {
        title: "De Morgan's Laws and NAND Logic",
        url: "https://en.wikipedia.org/wiki/NAND_logic",
        description: "Synthesis diagrams for realizing all elementary gates with NAND.",
        type: "reference",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("NAND-synthesized AND(1, 1): 1\n"),
    exercise: exercise(
      "ex-circ-nand-synthesis",
      "Construct NOT and AND using pure NAND gates",
      "Define nand(a, b) as (!(a && b) ? 1 : 0). Implement nandNot(a) using only nand, and nandAnd(a, b) using only nand and nandNot. Test on (1, 1) and (1, 0) and print: AND(1,1): {res1}, AND(1,0): {res2}.",
      `const nand = (a, b) => (!(a && b) ? 1 : 0);\nconst nandNot = (a) => nand(a, a);\nconst nandAnd = (a, b) => nandNot(nand(a, b));\nconsole.log(\`AND(1,1): \${nandAnd(1, 1)}, AND(1,0): \${nandAnd(1, 0)}\`);`,
      "circuits-universal-gates",
      "Prove universal gate synthesis by assembling NOT and AND out of NAND.",
      [
        "Define nandNot(a) as nand(a, a).",
        "Define nandAnd(a, b) as nandNot(nand(a, b)).",
        "Print formatted test results.",
      ],
      "Developing",
      `const nand = (a, b) => (!(a && b) ? 1 : 0);\n// Implement nandNot and nandAnd\n`,
      [
        {
          id: "tc-circ-nand-1",
          label: "Synthesizes AND gate and prints AND(1,1): 1, AND(1,0): 0",
          expectedStdout: "AND(1,1): 1, AND(1,0): 0",
          matchMode: "trimmed",
        },
        {
          id: "tc-circ-nand-hidden",
          label: "AND(1,1) output check",
          expectedStdout: "AND(1,1): 1",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why is NAND called a 'universal' gate?",
      "Because any fundamental Boolean operation (NOT, AND, OR, XOR, etc.) and thus any digital computer circuit can be constructed using only NAND gates.",
    ),
  },

  {
    id: "circuits-xor-parity",
    order: 5,
    title: "Exclusive OR (XOR) and Parity Generators",
    summary: "Understand modulo-2 addition with XOR gates, compute bit differences, and generate parity error-detection codes.",
    type: "interactive-simulation",
    objectiveIds: ["circuits-xor-parity-obj"],
    prerequisiteLessonIds: ["circuits-universal-nand-nor"],
    estimatedDurationMinutes: 30,
    content: `The **Exclusive-OR (XOR)** gate outputs 1 if and only if its inputs are **different**:
- $0 \\oplus 0 = 0$
- $0 \\oplus 1 = 1$
- $1 \\oplus 0 = 1$
- $1 \\oplus 1 = 0$

Mathematically, XOR is binary addition without carry (addition modulo 2).

### Parity Generation and Error Detection
In serial communication lines, single-bit noise corruptions are detected by appending a **parity bit**:
- **Even Parity**: The parity bit is chosen so that the total count of 1s in the transmitted codeword is even.
- Cascading XOR gates generates parity across an arbitrary number of bits: $\\text{Parity} = b_0 \\oplus b_1 \\oplus \\dots \\oplus b_n$.`,
    theorySections: [
      {
        id: "circuits-xor-properties",
        title: "Algebraic Properties of XOR",
        content: "XOR is commutative, associative, and acts as its own inverse: (A ^ B) ^ B = A. This property forms the foundation of cryptographic one-time pads and RAID 5 parity striping.",
      },
      {
        id: "circuits-controlled-inverter",
        title: "XOR as Controlled Inverter",
        content: "If one input of an XOR gate is held at 0, the other input passes through unchanged. If held at 1, the other input is inverted. This simplifies two's complement subtractor units.",
      },
    ],
    codeExamples: [
      {
        title: "3-Bit Parity Generator",
        language: "javascript",
        code: `function computeParity(bits) {\n  return bits.reduce((acc, bit) => acc ^ bit, 0);\n}\nconsole.log("Parity of [1, 0, 1, 1]:", computeParity([1, 0, 1, 1]));`,
        description: "Generating even parity across an array of digital bits.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "XOR Gate and Even Parity Checker",
      description: "Observe output toggling only when inputs differ; verify even/odd parity bit generation.",
      config: { mode: "digital", gate: "XOR" },
    },
    resources: [
      {
        title: "Parity Bit Error Detection",
        url: "https://en.wikipedia.org/wiki/Parity_bit",
        description: "Telecommunication and memory parity protection techniques.",
        type: "reference",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Parity of [1, 0, 1, 1]: 1\n"),
    exercise: exercise(
      "ex-circ-parity-gen",
      "Implement a 3-input parity generator",
      "Implement evenParity(a, b, c) using bitwise XOR (^). Test with inputs (1, 0, 1) and (1, 1, 1), and print: Parity(1,0,1): {res1}, Parity(1,1,1): {res2}.",
      `function evenParity(a, b, c) {\n  return a ^ b ^ c;\n}\nconsole.log(\`Parity(1,0,1): \${evenParity(1, 0, 1)}, Parity(1,1,1): \${evenParity(1, 1, 1)}\`);`,
      "circuits-xor-parity-obj",
      "Chain XOR operations to compute bit parity.",
      [
        "Use JavaScript bitwise XOR operator ^.",
        "Compute a ^ b ^ c.",
        "Print formatted results.",
      ],
      "Beginner",
      `function evenParity(a, b, c) {\n  // Implement 3-input XOR parity\n}\n\n// Print Parity(1,0,1) and Parity(1,1,1)\n`,
      [
        {
          id: "tc-circ-xor-1",
          label: "Computes Parity(1,0,1): 0, Parity(1,1,1): 1",
          expectedStdout: "Parity(1,0,1): 0, Parity(1,1,1): 1",
          matchMode: "trimmed",
        },
        {
          id: "tc-circ-xor-hidden",
          label: "Parity output check",
          expectedStdout: "Parity(1,0,1): 0",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "What is the result of evaluating A XOR A for any binary value A?",
      "It always equals 0, because both inputs are identical.",
    ),
  },

  // Module 3: Combinational & Sequential Logic
  {
    id: "circuits-half-full-adders",
    order: 6,
    title: "Binary Adders: Half Adders and Full Adders",
    summary: "Build binary arithmetic circuits by combining XOR and AND gates into Half Adders and cascading into Full Adders.",
    type: "interactive-simulation",
    objectiveIds: ["circuits-adders"],
    prerequisiteLessonIds: ["circuits-xor-parity"],
    estimatedDurationMinutes: 35,
    content: `All arithmetic operations in an Arithmetic Logic Unit (ALU) reduce to binary addition.

### Half Adder
A Half Adder adds two 1-bit inputs $A$ and $B$, generating a Sum bit $S$ and a Carry bit $C$:
- $\\text{Sum} = A \\oplus B$
- $\\text{Carry} = A \\cdot B$

The Half Adder cannot account for a carry generated by a previous lower-order bit.

### Full Adder
A Full Adder adds three 1-bit inputs: $A$, $B$, and an incoming carry $C_{\\text{in}}$:
- $\\text{Sum} = A \\oplus B \\oplus C_{\\text{in}}$
- $C_{\\text{out}} = (A \\cdot B) + (B \\cdot C_{\\text{in}}) + (A \\cdot C_{\\text{in}})$

By chaining the $C_{\\text{out}}$ of one Full Adder into the $C_{\\text{in}}$ of the next, an N-bit **Ripple-Carry Adder** can add arbitrary integers.`,
    theorySections: [
      {
        id: "circuits-ripple-carry-delay",
        title: "Propagation Delay and Ripple Carry",
        content: "In a ripple-carry adder, higher-order bits cannot settle until carry bits propagate through all preceding stages. Modern high-speed processors use Carry-Lookahead Adders (CLA) to compute carries in parallel.",
      },
      {
        id: "circuits-adder-subtractor",
        title: "Two's Complement Subtraction",
        content: "By feeding B through controlled XOR inverters and setting initial C_in = 1, a full adder chain computes A - B using standard two's complement arithmetic.",
      },
    ],
    codeExamples: [
      {
        title: "Full Adder Circuit Simulation",
        language: "javascript",
        code: `function fullAdder(a, b, cin) {\n  const sum = a ^ b ^ cin;\n  const cout = (a & b) | (b & cin) | (a & cin);\n  return { sum, cout };\n}\nconsole.log("1 + 1 + 0:", fullAdder(1, 1, 0));`,
        description: "Simulating sum and carry generation in a 1-bit full adder cell.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "1-Bit Full Adder Schematic",
      description: "Trace carry propagation and sum bit calculation using XOR, AND, and OR gates.",
      config: { mode: "digital", circuit: "full-adder" },
    },
    resources: [
      {
        title: "Adder Architecture and Logic Design",
        url: "https://en.wikipedia.org/wiki/Adder_(electronics)",
        description: "Full adder diagrams and ripple-carry chains.",
        type: "reference",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("1 + 1 + 0: { sum: 0, cout: 1 }\n"),
    exercise: exercise(
      "ex-circ-full-adder",
      "Implement a 1-bit Full Adder",
      "Implement fullAdder(a, b, cin) returning an object { sum, cout }. Evaluate with a = 1, b = 1, cin = 1, and print: Sum: {sum}, Cout: {cout}.",
      `function fullAdder(a, b, cin) {\n  const sum = a ^ b ^ cin;\n  const cout = (a & b) | (b & cin) | (a & cin);\n  return { sum, cout };\n}\nconst res = fullAdder(1, 1, 1);\nconsole.log(\`Sum: \${res.sum}, Cout: \${res.cout}\`);`,
      "circuits-adders",
      "Compute binary addition sum and carry bits with XOR and majority logic.",
      [
        "Compute sum = a ^ b ^ cin.",
        "Compute cout = (a & b) | (b & cin) | (a & cin).",
        "Print formatted result.",
      ],
      "Developing",
      `function fullAdder(a, b, cin) {\n  // Implement full adder\n}\n\n// Call with (1, 1, 1) and print Sum and Cout\n`,
      [
        {
          id: "tc-circ-adder-1",
          label: "Adds 1 + 1 + 1 with carry and prints Sum: 1, Cout: 1",
          expectedStdout: "Sum: 1, Cout: 1",
          matchMode: "trimmed",
        },
        {
          id: "tc-circ-adder-hidden",
          label: "Adder readout check",
          expectedStdout: "Sum: 1, Cout: 1",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why can a Half Adder not be used directly to chain multi-bit arithmetic operations?",
      "A Half Adder lacks an incoming carry input (Cin); it can only generate a carry, not receive one from a lower bit.",
    ),
  },

  {
    id: "circuits-multiplexers-demux",
    order: 7,
    title: "Data Selectors: Multiplexers (Mux) and Demux",
    summary: "Route multi-channel data streams using binary Multiplexers (Mux) and Demultiplexers (Demux).",
    type: "interactive-simulation",
    objectiveIds: ["circuits-mux-demux"],
    prerequisiteLessonIds: ["circuits-half-full-adders"],
    estimatedDurationMinutes: 30,
    content: `In microprocessors, bus lines are shared between multiple data registers. A **Multiplexer (MUX)** acts as a digitally controlled multi-position switch that selects one of $2^N$ input lines and directs it to a single output line based on $N$ select lines.

A **4-to-1 Multiplexer** uses 2 select bits ($S_1, S_0$) to route one of four data inputs ($D_0, D_1, D_2, D_3$):
- $S_1 S_0 = 00 \\implies \\text{OUT} = D_0$
- $S_1 S_0 = 01 \\implies \\text{OUT} = D_1$
- $S_1 S_0 = 10 \\implies \\text{OUT} = D_2$
- $S_1 S_0 = 11 \\implies \\text{OUT} = D_3$

The inverse circuit is a **Demultiplexer (DEMUX)**, which takes a single input line and routes it to one of $2^N$ output channels.`,
    theorySections: [
      {
        id: "circuits-mux-logic-implementation",
        title: "Mux as Universal Function Generator",
        content: "Any Boolean function of N variables can be implemented directly using a 2^N-to-1 MUX by connecting the truth table output column directly to the data inputs.",
      },
      {
        id: "circuits-bus-arbitration",
        title: "Bus Sharing",
        content: "Multiplexers allow CPU cores to share memory address lines, cache buses, and peripheral I/O ports without bus contention or short circuits.",
      },
    ],
    codeExamples: [
      {
        title: "4-to-1 Multiplexer Simulation",
        language: "javascript",
        code: `function mux4to1(d0, d1, d2, d3, s0, s1) {\n  const sel = (s1 << 1) | s0;\n  return [d0, d1, d2, d3][sel];\n}\nconsole.log("Selected D2:", mux4to1("A", "B", "C", "D", 0, 1));`,
        description: "Routing channel data according to select address bits.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "4-to-1 Multiplexer",
      description: "Direct data routing across 4 input lines using 2 binary select lines.",
      config: { mode: "digital", circuit: "mux-4to1" },
    },
    resources: [
      {
        title: "Multiplexers and Demultiplexers",
        url: "https://en.wikipedia.org/wiki/Multiplexer",
        description: "Digital switching circuits and channel selectors.",
        type: "reference",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Selected D2: C\n"),
    exercise: exercise(
      "ex-circ-mux-selection",
      "Route data through a 4-to-1 Multiplexer",
      "Implement mux4to1(d0, d1, d2, d3, s0, s1). When called with data lines (10, 20, 30, 40) and select lines s0 = 1, s1 = 1 (binary address 3), print: Selected: {value}.",
      `function mux4to1(d0, d1, d2, d3, s0, s1) {\n  const sel = (s1 << 1) | s0;\n  const channels = [d0, d1, d2, d3];\n  return channels[sel];\n}\nconsole.log(\`Selected: \${mux4to1(10, 20, 30, 40, 1, 1)}\`);`,
      "circuits-mux-demux",
      "Decode select lines to route channel data.",
      [
        "Decode address as (s1 << 1) | s0.",
        "Return data element at decoded index.",
        "Call with arguments 10, 20, 30, 40, 1, 1.",
      ],
      "Developing",
      `function mux4to1(d0, d1, d2, d3, s0, s1) {\n  // Implement 4-to-1 MUX\n}\n\n// Call with 10, 20, 30, 40 and select lines 1, 1\n`,
      [
        {
          id: "tc-circ-mux-1",
          label: "Selects channel D3 and prints Selected: 40",
          expectedStdout: "Selected: 40",
          matchMode: "trimmed",
        },
        {
          id: "tc-circ-mux-hidden",
          label: "Selected value check",
          expectedStdout: "Selected: 40",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "How many select lines are required to construct an 8-to-1 multiplexer?",
      "3 select lines are required, because 2^3 = 8.",
    ),
  },

  {
    id: "circuits-latches-flip-flops",
    order: 8,
    title: "Sequential Logic: SR Latches and D Flip-Flops",
    summary: "Introduce memory with cross-coupled feedback loops, level-sensitive SR latches, and clock-edge triggered D Flip-Flops.",
    type: "interactive-simulation",
    objectiveIds: ["circuits-latches-sequential"],
    prerequisiteLessonIds: ["circuits-multiplexers-demux"],
    estimatedDurationMinutes: 35,
    content: `All circuits studied up to this point have been **combinational**: outputs depend strictly on current inputs. To build computers that execute stored programs, circuits must have memory. Circuits whose outputs depend on past history are called **sequential logic**.

### Cross-Coupled Feedback & The SR Latch
Connecting the output of two NOR (or NAND) gates back into each other's inputs creates a bistable feedback loop:
- **Set ($S=1, R=0$)**: Forces stored output $Q = 1$.
- **Reset ($S=0, R=1$)**: Forces stored output $Q = 0$.
- **Hold ($S=0, R=0$)**: Maintains the previous state indefinitely.
- **Forbidden ($S=1, R=1$)**: Contradictory state where both $Q$ and $\\overline{Q}$ go LOW.

### The D Flip-Flop
To eliminate invalid states and synchronize updates with a system clock, digital computers use **edge-triggered D Flip-Flops**. On the rising edge of the clock signal ($0 \\to 1$), the state of data input $D$ is captured and held on output $Q$ until the next clock cycle.`,
    theorySections: [
      {
        id: "circuits-setup-hold-time",
        title: "Setup and Hold Timing Constraints",
        content: "To guarantee reliable clock latching without metastability, data input D must remain stable for a minimum setup time (t_setup) prior to the clock edge and hold time (t_hold) after it.",
      },
      {
        id: "circuits-register-files",
        title: "CPU Register Construction",
        content: "An 8-bit, 32-bit, or 64-bit CPU register is simply an array of D Flip-Flops sharing a common clock line and enable signal.",
      },
    ],
    codeExamples: [
      {
        title: "Edge-Triggered D Flip-Flop Model",
        language: "javascript",
        code: `class DFlipFlop {\n  constructor() { this.q = 0; this.prevClk = 0; }\n  update(d, clk) {\n    if (this.prevClk === 0 && clk === 1) this.q = d;\n    this.prevClk = clk;\n    return this.q;\n  }\n}\nconst ff = new DFlipFlop();\nff.update(1, 1);\nconsole.log("Q after rising edge:", ff.q);`,
        description: "Capturing input state on rising clock transition.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "D Flip-Flop Register Cell",
      description: "Observe edge-triggered state retention and clock-synchronized memory updates.",
      config: { mode: "digital", circuit: "d-flip-flop" },
    },
    resources: [
      {
        title: "Flip-Flops and Latches - Digital Design",
        url: "https://en.wikipedia.org/wiki/Flip-flop_(electronics)",
        description: "Sequential circuits, state diagrams, and clock edge detection.",
        type: "reference",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Q after rising edge: 1\n"),
    exercise: exercise(
      "ex-circ-dff-simulation",
      "Model an edge-triggered D Flip-Flop",
      "Implement a DFlipFlop class that stores state q (initially 0). On each call to tick(d, clk), if clk transitioned from 0 to 1 (rising edge), update q = d. Return q. Initialize dff = new DFlipFlop(), call tick(1, 0), tick(1, 1), and tick(0, 0), then print: Stored state Q: {dff.q}.",
      `class DFlipFlop {\n  constructor() {\n    this.q = 0;\n    this.lastClk = 0;\n  }\n  tick(d, clk) {\n    if (this.lastClk === 0 && clk === 1) {\n      this.q = d;\n    }\n    this.lastClk = clk;\n    return this.q;\n  }\n}\n\nconst dff = new DFlipFlop();\ndff.tick(1, 0);\ndff.tick(1, 1);\ndff.tick(0, 0);\nconsole.log(\`Stored state Q: \${dff.q}\`);`,
      "circuits-latches-sequential",
      "Detect rising clock edges to capture and hold sequential state.",
      [
        "Detect rising edge when this.lastClk === 0 && clk === 1.",
        "Store current clk in this.lastClk.",
        "Update this.q only on rising edge.",
      ],
      "Developing",
      `class DFlipFlop {\n  // Implement edge-triggered D Flip-Flop\n}\n\nconst dff = new DFlipFlop();\n// Call tick(1, 0), tick(1, 1), tick(0, 0) and print Stored state Q\n`,
      [
        {
          id: "tc-circ-dff-1",
          label: "Latches value on rising clock edge to Stored state Q: 1",
          expectedStdout: "Stored state Q: 1",
          matchMode: "trimmed",
        },
        {
          id: "tc-circ-dff-hidden",
          label: "State value check",
          expectedStdout: "Stored state Q: 1",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why are digital registers triggered on the clock edge rather than clock level?",
      "Edge-triggering ensures that state is captured at an exact instantaneous transition, preventing data from racing through multiple sequential stages during the duration of a high pulse.",
    ),
  },
];

export const digitalCircuitsPath: LearningCourse = {
  id: "digital-logic-circuits",
  subjectId: digitalCircuitsSubject.id,
  title: "Digital Logic & Circuit Foundations",
  description: "Explore the physical foundations of computing: Ohm's law, RC transient curves, Boolean logic gates, adders, multiplexers, and flip-flops with interactive simulators.",
  level: "Beginner",
  version: "1.0.0",
  prerequisites: [
    "High school algebra and basic arithmetic.",
    "No prior electronics or hardware experience required.",
  ],
  objectives: digitalCircuitsObjectives,
  learningOutcomes: [
    "Analyze DC resistive networks using Ohm's Law and calculate electrical power dissipation.",
    "Predict transient charging curves and time constants in RC circuits.",
    "Formulate and minimize Boolean logic expressions using truth tables and De Morgan's laws.",
    "Synthesize arbitrary logic circuits using universal NAND and NOR gates.",
    "Construct combinational arithmetic units including Half Adders, Full Adders, and Multiplexers.",
    "Explain edge-triggered state retention, clock distribution, and memory storage in D Flip-Flops.",
  ],
  estimatedDurationMinutes: 300,
  publicationStatus: "published",
  modules: [
    moduleData("circuits-electricity-passives", 1, "Electricity fundamentals and passive circuits", "Ohm's Law, resistor divider networks, capacitors, and RC transient curves.", digitalCircuitsLessons.slice(0, 2)),
    moduleData("circuits-boolean-gates", 2, "Digital logic gates and Boolean algebra", "AND, OR, NOT, universal NAND/NOR synthesis, XOR gates, and parity generators.", digitalCircuitsLessons.slice(2, 5)),
    moduleData("circuits-combinational-sequential", 3, "Combinational and sequential logic systems", "Half adders, full adders, multiplexer data routing, and edge-triggered D Flip-Flops.", digitalCircuitsLessons.slice(5)),
  ],
};
