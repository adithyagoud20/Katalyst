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
  { id: "circuits-kmap-3var", title: "Simplify 3-variable Boolean equations into minimal Sum-of-Products (SOP) forms using Karnaugh maps." },
  { id: "circuits-kmap-4var", title: "Minimize 4-variable logic networks and leverage don't-care conditions with K-maps." },
  { id: "circuits-jk-flip-flop", title: "Construct JK Flip-Flops and evaluate toggle mode and race-around conditions." },
  { id: "circuits-ripple-counter", title: "Design multi-bit asynchronous binary ripple counters using cascaded toggle stages." },
  { id: "circuits-decade-counter", title: "Implement synchronous decade and modulo-N counters with reset feedback logic." },
  { id: "circuits-fsm-sequence", title: "Synthesize finite state machine state transition diagrams and sequence detector logic." },
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

  {
    id: "circuits-kmap-3var",
    order: 9,
    title: "Karnaugh Maps: 3-Variable Boolean Minimization",
    summary: "Minimize 3-variable logic equations into optimal Sum-of-Products forms using adjacent Gray code grouping.",
    type: "interactive-simulation",
    interactiveDemo: {
      kind: "circuit",
      title: "3-Variable K-Map Visualizer",
      description: "Interactive 2x4 Gray code grid with adjacent cell loop grouping.",
    },
    objectiveIds: ["circuits-kmap-3var"],
    prerequisiteLessonIds: ["circuits-latches-flip-flops"],
    estimatedDurationMinutes: 30,
    content: `A **Karnaugh Map (K-Map)** provides a systematic graphical method to simplify Boolean algebra equations without algebraic trial-and-error.

### Gray Code Ordering
In a 3-variable K-map (variables $A, B, C$), rows represent $A \\in \\{0, 1\\}$ and columns represent $BC \\in \\{00, 01, 11, 10\\}$. Notice that columns follow **Gray code**, changing only one bit between adjacent cells. This adjacency means adjacent cells differ by exactly one literal ($X + X' = 1$), allowing terms to cancel.

### Grouping Rules
1. Groups of $1\\text{s}$ must be powers of 2 (sizes 1, 2, 4, 8).
2. Groups must be rectangular and can wrap around from column $10$ to column $00$.
3. Make groups as large as possible to eliminate the maximum number of variables.`,
    theorySections: [
      {
        id: "circ-kmap-prime-implicants",
        title: "Prime Implicants",
        content: "A prime implicant is a rectangle of minterms that cannot be combined into a larger group. Essential prime implicants contain at least one minterm covered by no other group.",
      },
    ],
    codeExamples: [
      {
        title: "Evaluating a 3-Variable SOP Expression",
        language: "javascript",
        code: `function evalSop(a, b, c) {
  // Minimal equation: F = A*B + B*C'
  return Boolean((a && b) || (b && !c));
}

console.log("F(1, 1, 0):", evalSop(1, 1, 0) ? 1 : 0);`,
        description: "Evaluating simplified Boolean logic in JavaScript.",
      },
    ],
    resources: [
      {
        title: "Karnaugh Map Minimization",
        url: "https://en.wikipedia.org/wiki/Karnaugh_map",
        description: "Boolean algebraic simplification using Karnaugh maps.",
        type: "reference",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("F(1, 1, 0): 1\n"),
    exercise: exercise(
      "ex-circ-kmap3-eval",
      "Implement a minimized 3-variable logic function",
      "Given minterms m(3, 5, 7) for inputs A, B, C (where m = A*4 + B*2 + C), simplification yields F = A*C + B*C. Write a function solveKMap(a, b, c) that returns 1 when F is true and 0 otherwise. Evaluate and print solveKMap(1, 0, 1) and solveKMap(0, 1, 0) in format 'F(1,0,1)=X, F(0,1,0)=Y'.",
      `function solveKMap(a, b, c) {\n  const f = (a && c) || (b && c);\n  return f ? 1 : 0;\n}\n\nconsole.log(\`F(1,0,1)=\${solveKMap(1, 0, 1)}, F(0,1,0)=\${solveKMap(0, 1, 0)}\`);`,
      "circuits-kmap-3var",
      "Evaluate simplified Boolean functions derived from 3-variable Karnaugh map loops.",
      [
        "Compute f = (a && c) || (b && c).",
        "Return 1 if true, 0 if false.",
        "Print formatted result matching 'F(1,0,1)=1, F(0,1,0)=0'.",
      ],
      "Developing",
      `function solveKMap(a, b, c) {\n  // Implement simplified SOP\n}\n\n// Print evaluation\n`,
      [
        {
          id: "tc-kmap3-1",
          label: "Evaluates correct minimized SOP outputs",
          expectedStdout: "F(1,0,1)=1, F(0,1,0)=0",
          matchMode: "trimmed",
        },
        {
          id: "tc-kmap3-hidden",
          label: "Check minterm 7",
          expectedStdout: "F(1,0,1)=1",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why must K-map column headers use Gray code (00, 01, 11, 10) instead of binary (00, 01, 10, 11)?",
      "Gray code ensures that adjacent physical cells differ by exactly one single binary variable, allowing terms like A*B*C + A*B*C' to simplify to A*B.",
    ),
  },

  {
    id: "circuits-kmap-4var",
    order: 10,
    title: "4-Variable K-Maps and Don't-Care Conditions",
    summary: "Group 16-cell Karnaugh maps across torus edges and leverage don't-care (X) minterms to minimize gate counts.",
    type: "interactive-simulation",
    interactiveDemo: {
      kind: "circuit",
      title: "4-Variable K-Map & Torus Solver",
      description: "16-cell K-map visualizer showing corner and edge wrap-around groupings.",
    },
    objectiveIds: ["circuits-kmap-4var"],
    prerequisiteLessonIds: ["circuits-kmap-3var"],
    estimatedDurationMinutes: 35,
    content: `A 4-variable K-Map represents 16 minterms in a $4 \\times 4$ grid ($AB$ rows, $CD$ columns).

### Torus Adjacency
The edges of a 4-variable K-map wrap around in both dimensions:
- The top row ($AB = 00$) is adjacent to the bottom row ($AB = 10$).
- The leftmost column ($CD = 00$) is adjacent to the rightmost column ($CD = 10$).
- All four outer corners form a valid group of 4 minterms: $B' D'$.

### Don't-Care Conditions ($X$)
In circuits like BCD-to-7-segment decoders, input codes above 9 ($1010_2$ to $1111_2$) never occur physically. These states are called **don't-cares** ($X$ or $d$). We treat $X$ as $1$ if it helps enlarge an existing group of $1\\text{s}$, or as $0$ if it would require creating a new group.`,
    theorySections: [
      {
        id: "circ-dont-care-optimization",
        title: "Minimization with Don't Cares",
        content: "Don't-care terms provide flexibility: including them in implicants reduces gate count, but they do not need to be covered if they don't enlarge an implicant.",
      },
    ],
    codeExamples: [
      {
        title: "Corner Wrap Implicant",
        language: "javascript",
        code: `// Four corners group: m(0, 2, 8, 10) -> B' * D'
function fourCorners(a, b, c, d) {
  return !b && !d ? 1 : 0;
}
console.log("Corner (0,0,0,0):", fourCorners(0, 0, 0, 0));`,
        description: "Verifying 4-corner wrap reduction to B' * D'.",
      },
    ],
    resources: [
      {
        title: "Don't-Care Conditions in Logic Minimization",
        url: "https://en.wikipedia.org/wiki/Don%27t-care_term",
        description: "Optimizing combinational logic with unspecified states.",
        type: "reference",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Corner (0,0,0,0): 1\n"),
    exercise: exercise(
      "ex-circ-kmap4-eval",
      "Model a BCD valid digit detector with don't cares",
      "A BCD valid detector outputs 1 for inputs 0..9 and 0 for invalid inputs 10..15. Using inputs a, b, c, d representing 4-bit numbers (weight 8, 4, 2, 1), write isValidBcd(a, b, c, d) returning 1 if value <= 9, else 0. Evaluate with (1, 0, 0, 1) [9] and (1, 1, 0, 0) [12] and print 'BCD(9)=X, BCD(12)=Y'.",
      `function isValidBcd(a, b, c, d) {\n  const val = a * 8 + b * 4 + c * 2 + d;\n  return val <= 9 ? 1 : 0;\n}\n\nconsole.log(\`BCD(9)=\${isValidBcd(1, 0, 0, 1)}, BCD(12)=\${isValidBcd(1, 1, 0, 0)}\`);`,
      "circuits-kmap-4var",
      "Determine valid BCD ranges using 4-variable logic evaluation.",
      [
        "Compute integer value val = a * 8 + b * 4 + c * 2 + d.",
        "Return 1 if val <= 9, else 0.",
        "Print formatted string 'BCD(9)=1, BCD(12)=0'.",
      ],
      "Developing",
      `function isValidBcd(a, b, c, d) {\n  // Implement BCD range check\n}\n\n// Print output\n`,
      [
        {
          id: "tc-kmap4-1",
          label: "Validates BCD digit range outputs",
          expectedStdout: "BCD(9)=1, BCD(12)=0",
          matchMode: "trimmed",
        },
        {
          id: "tc-kmap4-hidden",
          label: "Check boundary value 10",
          expectedStdout: "BCD(9)=1",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Can a don't-care (X) condition be left uncircled in a K-map?",
      "Yes. A don't-care is only circled if doing so enlarges a group of 1s (reducing literal count); it is never required to be covered on its own.",
    ),
  },

  {
    id: "circuits-jk-flip-flop",
    order: 11,
    title: "JK Flip-Flops and Toggle Mode",
    summary: "Eliminate forbidden latch states with JK flip-flops and understand clock toggle mode (T = 1).",
    type: "interactive-simulation",
    interactiveDemo: {
      kind: "circuit",
      title: "JK Flip-Flop Simulator",
      description: "Interactive JK flip-flop with J, K, and clock pulse controls.",
    },
    objectiveIds: ["circuits-jk-flip-flop"],
    prerequisiteLessonIds: ["circuits-kmap-4var"],
    estimatedDurationMinutes: 30,
    content: `In an SR latch, setting $S = 1$ and $R = 1$ simultaneously leads to an invalid, unpredictable state. The **JK Flip-Flop** eliminates this hazard through internal feedback.

### JK Characteristic Table
When a rising clock edge arrives:
- $J = 0, K = 0$: **Hold** ($Q_{next} = Q$)
- $J = 0, K = 1$: **Reset** ($Q_{next} = 0$)
- $J = 1, K = 0$: **Set** ($Q_{next} = 1$)
- $J = 1, K = 1$: **Toggle** ($Q_{next} = Q'$)

The toggle mode ($J=K=1$) is the fundamental building block for frequency dividers and binary ripple counters.`,
    theorySections: [
      {
        id: "circ-jk-race-around",
        title: "Race-Around Condition and Master-Slave Architecture",
        content: "In level-triggered JK latches, when J=K=1 and the clock remains high, the output toggles uncontrollably. Master-slave JK flip-flops resolve this by sampling inputs on one edge and asserting outputs on the opposite edge.",
      },
    ],
    codeExamples: [
      {
        title: "Simulating a JK Flip-Flop",
        language: "javascript",
        code: `class JKFlipFlop {
  constructor() { this.q = 0; }
  clockEdge(j, k) {
    if (j === 0 && k === 1) this.q = 0;
    else if (j === 1 && k === 0) this.q = 1;
    else if (j === 1 && k === 1) this.q = this.q === 1 ? 0 : 1;
    return this.q;
  }
}
const jk = new JKFlipFlop();
console.log("Toggle 1:", jk.clockEdge(1, 1));
console.log("Toggle 2:", jk.clockEdge(1, 1));`,
        description: "Simulating edge-triggered JK state transitions.",
      },
    ],
    resources: [
      {
        title: "JK Flip-Flop Operation",
        url: "https://en.wikipedia.org/wiki/Flip-flop_(electronics)#JK_flip-flop",
        description: "Theory of JK and T flip-flop architectures.",
        type: "reference",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Toggle 1: 1\nToggle 2: 0\n"),
    exercise: exercise(
      "ex-circ-jk-sim",
      "Model a toggling JK flip-flop state machine",
      "Implement a class JKFlipFlop with initial state this.q = 0. Add method tick(j, k) that executes on a clock pulse: if j=0,k=1 q=0; if j=1,k=0 q=1; if j=1,k=1 q=1-q; if j=0,k=0 q stays unchanged. Initialize jk = new JKFlipFlop(), call tick(1, 0) [set], tick(1, 1) [toggle], and tick(1, 1) [toggle]. Print 'Q states: ' followed by the 3 output values joined by comma.",
      `class JKFlipFlop {\n  constructor() {\n    this.q = 0;\n  }\n  tick(j, k) {\n    if (j === 0 && k === 1) this.q = 0;\n    else if (j === 1 && k === 0) this.q = 1;\n    else if (j === 1 && k === 1) this.q = this.q === 1 ? 0 : 1;\n    return this.q;\n  }\n}\n\nconst jk = new JKFlipFlop();\nconst s1 = jk.tick(1, 0);\nconst s2 = jk.tick(1, 1);\nconst s3 = jk.tick(1, 1);\nconsole.log(\`Q states: \${s1},\${s2},\${s3}\`);`,
      "circuits-jk-flip-flop",
      "Trace state transitions of a JK flip-flop through set and successive toggle pulses.",
      [
        "Implement tick(j, k) with the 4 truth table conditions.",
        "Store outputs of tick(1,0), tick(1,1), and tick(1,1).",
        "Print formatted result 'Q states: 1,0,1'.",
      ],
      "Developing",
      `class JKFlipFlop {\n  // Implement constructor and tick(j, k)\n}\n\n// Run transitions and print Q states\n`,
      [
        {
          id: "tc-jk-1",
          label: "Correctly transitions through set, toggle, and toggle",
          expectedStdout: "Q states: 1,0,1",
          matchMode: "trimmed",
        },
        {
          id: "tc-jk-hidden",
          label: "State verify",
          expectedStdout: "Q states: 1,0,1",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "What occurs in a JK flip-flop when both J and K inputs are held at logic HIGH during a clock pulse?",
      "The output toggles (inverts) its current state, complementing Q from 0 to 1 or 1 to 0.",
    ),
  },

  {
    id: "circuits-ripple-counter",
    order: 12,
    title: "Asynchronous Ripple Counters (MOD-16)",
    summary: "Cascade toggle flip-flops where each stage's output clocks the subsequent stage to build binary counters.",
    type: "interactive-simulation",
    interactiveDemo: {
      kind: "circuit",
      title: "4-Bit Ripple Counter Visualizer",
      description: "Interactive 4-bit binary counter stepping through 0000 to 1111 with LED outputs.",
    },
    objectiveIds: ["circuits-ripple-counter"],
    prerequisiteLessonIds: ["circuits-jk-flip-flop"],
    estimatedDurationMinutes: 35,
    content: `An **asynchronous ripple counter** (or ripple binary counter) connects multiple toggle (T or JK with $J=K=1$) flip-flops in series.

### Ripple Architecture
- Stage 0 ($Q_0$) is clocked directly by the master input clock pulse.
- Stage 1 ($Q_1$) is clocked by the output ($Q_0$) of Stage 0.
- Stage 2 ($Q_2$) is clocked by $Q_1$.
- Stage 3 ($Q_3$) is clocked by $Q_2$.

Because each stage toggles on every negative edge of the preceding stage, each stage divides the input frequency by 2:
$$f_{Q0} = \\frac{f_{clk}}{2}, \\quad f_{Q1} = \\frac{f_{clk}}{4}, \\quad f_{Q2} = \\frac{f_{clk}}{8}, \\quad f_{Q3} = \\frac{f_{clk}}{16}$$
Four stages count from $0000_2$ to $1111_2$ ($0$ to $15$), forming a **Modulo-16 (MOD-16)** counter.`,
    theorySections: [
      {
        id: "circ-ripple-propagation-delay",
        title: "Propagation Delay and Glitches",
        content: "Because clock transitions must ripple sequentially through each flip-flop stage, total delay accumulates as N * t_pd. At high clock rates, intermediate transient states (glitches) appear briefly on output lines.",
      },
    ],
    codeExamples: [
      {
        title: "Simulating 4-Bit Binary Counter",
        language: "javascript",
        code: `class RippleCounter4Bit {
  constructor() { this.count = 0; }
  pulse() {
    this.count = (this.count + 1) % 16;
    return this.count;
  }
}
const counter = new RippleCounter4Bit();
for (let i = 0; i < 4; i++) counter.pulse();
console.log("Count after 4 pulses:", counter.count);`,
        description: "Tracing a 4-bit MOD-16 counter progression.",
      },
    ],
    resources: [
      {
        title: "Asynchronous (Ripple) Counter",
        url: "https://en.wikipedia.org/wiki/Counter_(digital)#Asynchronous_(ripple)_counter",
        description: "Binary counter architectures and frequency division.",
        type: "reference",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Count after 4 pulses: 4\n"),
    exercise: exercise(
      "ex-circ-ripple-sim",
      "Simulate a 4-bit binary ripple counter",
      "Create a class RippleCounter with property count = 0. Each call to pulse() increments count by 1 modulo 16 and returns its 4-bit binary representation padded with zeros (e.g. '0101'). Instantiate counter, pulse it 10 times, and print 'Binary at 10: ' followed by the 10th pulse output.",
      `class RippleCounter {\n  constructor() {\n    this.count = 0;\n  }\n  pulse() {\n    this.count = (this.count + 1) % 16;\n    return this.count.toString(2).padStart(4, "0");\n  }\n}\n\nconst rc = new RippleCounter();\nlet out = "";\nfor (let i = 0; i < 10; i++) {\n  out = rc.pulse();\n}\nconsole.log(\`Binary at 10: \${out}\`);`,
      "circuits-ripple-counter",
      "Model a 4-bit ripple counter and output zero-padded binary values.",
      [
        "Compute (this.count + 1) % 16 in pulse().",
        "Convert to 4-bit binary with .toString(2).padStart(4, '0').",
        "Pulse 10 times and print 'Binary at 10: 1010'.",
      ],
      "Developing",
      `class RippleCounter {\n  // Implement constructor and pulse()\n}\n\n// Pulse 10 times and print output\n`,
      [
        {
          id: "tc-ripple-1",
          label: "Outputs correct 4-bit binary value after 10 pulses",
          expectedStdout: "Binary at 10: 1010",
          matchMode: "trimmed",
        },
        {
          id: "tc-ripple-hidden",
          label: "Binary 10 check",
          expectedStdout: "Binary at 10: 1010",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why is a 4-stage toggle counter termed an 'asynchronous' ripple counter?",
      "The stages do not share a common clock; each stage is clocked by the preceding stage's output, causing the clock pulse to ripple asynchronously across the chain.",
    ),
  },

  {
    id: "circuits-decade-counter",
    order: 13,
    title: "Synchronous Decade and Modulo-N Counters",
    summary: "Design Modulo-10 (BCD) counters with feedback reset gates (7490 architecture) to drive decimal displays.",
    type: "interactive-simulation",
    interactiveDemo: {
      kind: "circuit",
      title: "BCD Decade Counter (MOD-10)",
      description: "Counter cycling 0000 to 1001 with NAND reset gate triggering at count 1010.",
    },
    objectiveIds: ["circuits-decade-counter"],
    prerequisiteLessonIds: ["circuits-ripple-counter"],
    estimatedDurationMinutes: 35,
    content: `A **decade counter** (or Modulo-10 / BCD counter) counts through decimal states $0$ to $9$ ($0000_2$ to $1001_2$) before resetting to zero on the tenth pulse.

### Modulo-N Truncation via Reset Gates
To turn a natural 4-bit MOD-16 counter into a MOD-10 counter (like the industry-standard 7490 IC):
1. Detect count $10_{10} = 1010_2$ ($Q_3 = 1$ and $Q_1 = 1$).
2. Feed $Q_3$ and $Q_1$ into an active-LOW NAND gate:
$$\\text{Reset} = \\overline{Q_3 \\cdot Q_1}$$
3. Connect the NAND output to the asynchronous Clear/Reset pins of all four flip-flops.
4. As soon as the counter hits $1010_2$, the reset line fires immediately, returning the counter to $0000_2$ within nanoseconds.`,
    theorySections: [
      {
        id: "circ-decade-carry-pulse",
        title: "Cascading for Multi-Digit Decimal Displays",
        content: "When a decade counter transitions from 9 to 0, it emits a falling carry edge that can clock the next higher decimal decade stage (units -> tens -> hundreds).",
      },
    ],
    codeExamples: [
      {
        title: "Simulating Decade Counter with Reset Gate",
        language: "javascript",
        code: `class DecadeCounter {
  constructor() { this.q = 0; }
  tick() {
    this.q++;
    // Asynchronous reset on 10 (1010_2)
    if (this.q >= 10) this.q = 0;
    return this.q;
  }
}
const dc = new DecadeCounter();
for (let i = 0; i < 12; i++) dc.tick();
console.log("Count after 12 ticks:", dc.q);`,
        description: "Decimal decade rollover at count 10.",
      },
    ],
    resources: [
      {
        title: "7490 Decade Counter Architecture",
        url: "https://en.wikipedia.org/wiki/List_of_7400-series_integrated_circuits#7490",
        description: "BCD decade counter datasheet and timing diagrams.",
        type: "reference",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Count after 12 ticks: 2\n"),
    exercise: exercise(
      "ex-circ-decade-sim",
      "Implement a BCD decade counter with carry out",
      "Create a class BcdCounter with properties count = 0 and carry = 0. On each step(), increment count. If count reaches 10, set count = 0 and carry = 1, otherwise set carry = 0. Step the counter 25 times and print 'Count: {count}, Carry: {carry}'.",
      `class BcdCounter {\n  constructor() {\n    this.count = 0;\n    this.carry = 0;\n  }\n  step() {\n    this.count++;\n    if (this.count >= 10) {\n      this.count = 0;\n      this.carry = 1;\n    } else {\n      this.carry = 0;\n    }\n    return this.count;\n  }\n}\n\nconst bcd = new BcdCounter();\nfor (let i = 0; i < 25; i++) {\n  bcd.step();\n}\nconsole.log(\`Count: \${bcd.count}, Carry: \${bcd.carry}\`);`,
      "circuits-decade-counter",
      "Model a modulo-10 BCD counter with rollover and carry pulse emission.",
      [
        "Increment count on each step().",
        "When count === 10, set count = 0 and carry = 1.",
        "Verify 25 steps results in Count: 5, Carry: 0.",
      ],
      "Developing",
      `class BcdCounter {\n  // Implement constructor and step()\n}\n\n// Step 25 times and print Count and Carry\n`,
      [
        {
          id: "tc-decade-1",
          label: "Verifies state after 25 clock cycles",
          expectedStdout: "Count: 5, Carry: 0",
          matchMode: "trimmed",
        },
        {
          id: "tc-decade-hidden",
          label: "Carry check at 20",
          expectedStdout: "Count: 5",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Which two flip-flop output bits must be decoded by a NAND gate to reset a 4-bit binary counter into a decade (MOD-10) counter?",
      "Q3 (weight 8) and Q1 (weight 2), because 8 + 2 = 10 (binary 1010).",
    ),
  },

  {
    id: "circuits-fsm-sequence-detector",
    order: 14,
    title: "Finite State Machine Design & Sequence Detection",
    summary: "Synthesize Moore and Mealy finite state machines to detect overlapping binary bit sequences (1011).",
    type: "interactive-simulation",
    interactiveDemo: {
      kind: "circuit",
      title: "Sequence Detector FSM Visualizer",
      description: "Interactive state diagram tracking bit transitions between S0, S1, S2, and S3.",
    },
    objectiveIds: ["circuits-fsm-sequence"],
    prerequisiteLessonIds: ["circuits-decade-counter"],
    estimatedDurationMinutes: 40,
    content: `A **Finite State Machine (FSM)** consists of a set of states, an input alphabet, a transition function, and an output function. FSMs model sequential controllers, communication protocol parsers, and digital locks.

### Moore vs. Mealy FSM
- **Moore Machine**: Outputs depend strictly on the current state. Outputs change only on clock edges.
- **Mealy Machine**: Outputs depend on both the current state and current inputs, reacting immediately to input changes.

### Sequence Detector: 1011 (Overlapping)
To detect the sequence \`1 0 1 1\` in a continuous bitstream:
- **State S0**: Initial state (no bits matched).
- **State S1**: Matched \`1\`.
- **State S2**: Matched \`10\`.
- **State S3**: Matched \`101\`.
- If in S3 and input is \`1\`, sequence \`1011\` is detected! Output asserts 1, and the machine transitions to S1 (because the trailing \`1\` begins the next potential match).`,
    theorySections: [
      {
        id: "circ-fsm-state-encoding",
        title: "State Encoding Options",
        content: "Common state assignment methods include Binary Encoding (log2(N) flip-flops) and One-Hot Encoding (N flip-flops, one per state, simplifying combinational next-state decoders in FPGAs).",
      },
    ],
    codeExamples: [
      {
        title: "Implementing 1011 Sequence Detector",
        language: "javascript",
        code: `class SequenceDetector1011 {
  constructor() { this.state = "S0"; }
  consume(bit) {
    let detected = 0;
    switch (this.state) {
      case "S0": this.state = bit === 1 ? "S1" : "S0"; break;
      case "S1": this.state = bit === 0 ? "S2" : "S1"; break;
      case "S2": this.state = bit === 1 ? "S3" : "S0"; break;
      case "S3":
        if (bit === 1) { detected = 1; this.state = "S1"; }
        else { this.state = "S2"; }
        break;
    }
    return detected;
  }
}
const fsm = new SequenceDetector1011();
const bits = [1, 0, 1, 1, 0, 1, 1];
const results = bits.map(b => fsm.consume(b));
console.log("Detections:", results.join(""));`,
        description: "Tracking state transitions and detecting overlapping sequences.",
      },
    ],
    resources: [
      {
        title: "Finite-State Machine Design",
        url: "https://en.wikipedia.org/wiki/Finite-state_machine",
        description: "Formal specification and hardware synthesis of FSMs.",
        type: "reference",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Detections: 0001001\n"),
    exercise: exercise(
      "ex-circ-fsm-sim",
      "Build a sequence detector FSM for pattern 1011",
      "Implement a class SequenceDetector with consume(bit) returning 1 when the 4-bit sequence 1,0,1,1 has been completed, else 0. Feed bit stream [1, 0, 1, 1, 0, 1, 1] through the detector. Sum the total number of detections and print 'Total detections: ' followed by the sum.",
      `class SequenceDetector {\n  constructor() {\n    this.state = "S0";\n  }\n  consume(bit) {\n    let detected = 0;\n    switch (this.state) {\n      case "S0": this.state = bit === 1 ? "S1" : "S0"; break;\n      case "S1": this.state = bit === 0 ? "S2" : "S1"; break;\n      case "S2": this.state = bit === 1 ? "S3" : "S0"; break;\n      case "S3":\n        if (bit === 1) {\n          detected = 1;\n          this.state = "S1";\n        } else {\n          this.state = "S2";\n        }\n        break;\n    }\n    return detected;\n  }\n}\n\nconst fsm = new SequenceDetector();\nconst stream = [1, 0, 1, 1, 0, 1, 1];\nlet count = 0;\nfor (const b of stream) {\n  if (fsm.consume(b) === 1) count++;\n}\nconsole.log(\`Total detections: \${count}\`);`,
      "circuits-fsm-sequence",
      "Implement an overlapping sequence detector finite state machine.",
      [
        "Model states S0, S1, S2, and S3.",
        "In state S3, if bit === 1 emit 1 and transition to S1.",
        "Count detections across [1, 0, 1, 1, 0, 1, 1] to obtain 2.",
      ],
      "Applied",
      `class SequenceDetector {\n  // Implement FSM states\n}\n\n// Feed stream and count detections\n`,
      [
        {
          id: "tc-fsm-1",
          label: "Finds two overlapping detections of 1011",
          expectedStdout: "Total detections: 2",
          matchMode: "trimmed",
        },
        {
          id: "tc-fsm-hidden",
          label: "Verify detection count",
          expectedStdout: "Total detections: 2",
          matchMode: "contains",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "In an overlapping sequence detector for pattern 1011, why does the FSM transition to state S1 (rather than S0) after a match?",
      "The trailing '1' of the completed '1011' sequence can simultaneously serve as the first '1' of the next incoming sequence.",
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
    "Minimize multi-variable logic using Karnaugh maps and leverage don't-care conditions.",
    "Design sequential counters and finite state machines for sequence detection.",
  ],
  estimatedDurationMinutes: 480,
  publicationStatus: "published",
  modules: [
    moduleData("circuits-electricity-passives", 1, "Electricity fundamentals and passive circuits", "Ohm's Law, resistor divider networks, capacitors, and RC transient curves.", digitalCircuitsLessons.slice(0, 2)),
    moduleData("circuits-boolean-gates", 2, "Digital logic gates and Boolean algebra", "AND, OR, NOT, universal NAND/NOR synthesis, XOR gates, and parity generators.", digitalCircuitsLessons.slice(2, 5)),
    moduleData("circuits-combinational-sequential", 3, "Combinational and sequential logic systems", "Half adders, full adders, multiplexer data routing, and edge-triggered D Flip-Flops.", digitalCircuitsLessons.slice(5, 8)),
    moduleData("circuits-kmap-minimization", 4, "Boolean minimization with Karnaugh maps", "3-variable and 4-variable K-maps, prime implicants, torus wrapping, and don't-care conditions.", digitalCircuitsLessons.slice(8, 10)),
    moduleData("circuits-counters-fsm", 5, "Counters, registers, and finite state machines", "JK flip-flops, asynchronous ripple counters, BCD decade counters, and sequence-detecting FSMs.", digitalCircuitsLessons.slice(10)),
  ],
};
