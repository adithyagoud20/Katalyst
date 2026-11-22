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

export const circuitsEeeCoreSubject: LearningSubject = {
  id: "circuits-eee-core-subject",
  title: "Analog Circuits, Network Theory & Core EEE",
  description: "Master Kirchhoff's laws, Thevenin/Norton theorems, AC phasors, RLC resonance, diodes, BJT amplifiers, operational amplifiers, and active filters.",
};

export const circuitsEeeCoreObjectives: LearningObjective[] = [
  { id: "circ-kvl-kcl-obj", title: "Formulate multi-mesh loop equations and nodal admittance matrices to solve DC electrical networks." },
  { id: "circ-thev-nort-obj", title: "Synthesize Thevenin and Norton dual equivalent networks and verify Maximum Power Transfer theorem." },
  { id: "circ-rlc-obj", title: "Derive natural frequency, damping factor, and underdamped transient ringing in second-order series RLC circuits." },
  { id: "circ-phasor-pf-obj", title: "Calculate complex impedance, apparent power, and reactive power factor correction in sinusoidal AC systems." },
  { id: "circ-diode-rect-obj", title: "Analyze PN junction diode conduction, full-wave bridge rectification, and filter capacitor ripple factors." },
  { id: "circ-bjt-bias-obj", title: "Design voltage-divider stabilized Q-points and compute AC small-signal gain for Common-Emitter BJT amplifiers." },
  { id: "circ-opamp-obj", title: "Apply ideal op-amp golden rules and virtual ground principles to inverting and non-inverting topologies." },
  { id: "circ-active-filter-obj", title: "Synthesize second-order Sallen-Key low-pass and high-pass active Butterworth filters." },
  { id: "circ-555-timer-obj", title: "Calculate frequency, charge/discharge timing, and duty cycle for NE555 timer astable multivibrators." },
  { id: "circ-transformer-3ph-obj", title: "Calculate voltage/current transformations, turns ratios, and 3-phase Star/Delta line-to-phase relationships." },
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

export const circuitsEeeCoreLessons: LearningLesson[] = [
  // Module 1: Network Theorems & DC Analysis
  {
    id: "circuits-kvl-kcl-mesh",
    order: 1,
    title: "Kirchhoff's Laws & Multi-Mesh DC Analysis",
    summary: "Formulate mesh current equations and nodal voltage matrices to solve arbitrary multi-loop DC circuits.",
    type: "interactive-simulation",
    objectiveIds: ["circ-kvl-kcl-obj"],
    prerequisiteLessonIds: [],
    estimatedDurationMinutes: 35,
    content: `All electrical networks obey two fundamental conservation laws formulated by Gustav Kirchhoff:

1. **Kirchhoff's Current Law (KCL)**: The algebraic sum of all currents entering any circuit node must equal zero (conservation of electrical charge):
$$\\sum_{k=1}^{n} I_k = 0$$

2. **Kirchhoff's Voltage Law (KVL)**: The algebraic sum of all branch voltages around any closed loop must equal zero (conservation of electrical energy):
$$\\sum_{k=1}^{m} V_k = 0$$

### Two-Mesh Matrix Formulation
For a dual-loop resistive network with two DC independent sources $V_1$ and $V_2$ and resistors $R_1, R_2$ (shared center branch), and $R_3$:

Loop 1: $(R_1 + R_2) I_1 - R_2 I_2 = V_1$  
Loop 2: $-R_2 I_1 + (R_2 + R_3) I_2 = -V_2$

In matrix form $[R][I] = [V]$:
$$\\begin{bmatrix} R_1 + R_2 & -R_2 \\\\ -R_2 & R_2 + R_3 \\end{bmatrix} \\begin{bmatrix} I_1 \\\\ I_2 \\end{bmatrix} = \\begin{bmatrix} V_1 \\\\ -V_2 \\end{bmatrix}$$

Solving by Cramer's rule yields determinant $\\Delta = (R_1 + R_2)(R_2 + R_3) - R_2^2$.`,
    theorySections: [
      {
        id: "mesh-vs-nodal",
        title: "Mesh Analysis vs. Nodal Analysis",
        content: "Mesh analysis utilizes KVL around independent loops and is optimal when circuit branches are largely series-connected with known voltage sources. Nodal analysis utilizes KCL at independent junctions and is optimal when parallel branches with current sources predominate.",
      },
      {
        id: "supermesh-concept",
        title: "The Supermesh Principle",
        content: "When an ideal current source is shared between two adjacent meshes, create a supermesh by conceptually removing the current source branch, writing a single combined KVL loop equation, and relating the two mesh currents via an auxiliary KCL constraint equation.",
      },
    ],
    codeExamples: [
      {
        title: "C Matrix Determinant Solver for 2-Mesh DC Network",
        language: "c",
        code: `#include <stdio.h>

int main(void) {
    double v1 = 12.0, v2 = 6.0;
    double r1 = 100.0, r2 = 220.0, r3 = 150.0;
    
    double det = (r1 + r2) * (r2 + r3) - (r2 * r2);
    double det1 = v1 * (r2 + r3) - (-v2 * -r2);
    double det2 = (r1 + r2) * -v2 - (-r2 * v1);
    
    double i1 = det1 / det;
    double i2 = det2 / det;
    double i3 = i1 - i2; // Branch current down R2
    
    printf("I1: %.2f mA, I2: %.2f mA, I3: %.2f mA\\n", i1 * 1000.0, i2 * 1000.0, i3 * 1000.0);
    return 0;
}`,
        description: "Solves dual mesh loop equations using Cramer's determinant rule in C11.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "2-Mesh DC Circuit Analyzer",
      description: "Interactive dual-mesh circuit solver with live branch currents and node potentials.",
      config: { mode: "analog" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("I1: 34.34 mA, I2: -3.82 mA, I3: 38.16 mA\n"),
    exercise: exercise(
      "ex-circ-mesh-solver",
      "Solve Two-Mesh DC Loop Currents",
      "Write a JavaScript program that calculates the two loop currents I1 and I2 and branch current I3 = I1 - I2 for V1 = 12V, V2 = 6V, R1 = 100 ohms, R2 = 220 ohms, and R3 = 150 ohms. Print the result formatted as: 'I1: {i1} mA, I2: {i2} mA, I3: {i3} mA' with 2 decimal places.",
      `const v1 = 12.0, v2 = 6.0;\nconst r1 = 100.0, r2 = 220.0, r3 = 150.0;\nconst det = (r1 + r2) * (r2 + r3) - (r2 * r2);\nconst det1 = v1 * (r2 + r3) - (-v2 * -r2);\nconst det2 = (r1 + r2) * (-v2) - (-r2 * v1);\nconst i1 = (det1 / det) * 1000.0;\nconst i2 = (det2 / det) * 1000.0;\nconst i3 = i1 - i2;\nconsole.log(\`I1: \${i1.toFixed(2)} mA, I2: \${i2.toFixed(2)} mA, I3: \${i3.toFixed(2)} mA\`);`,
      "circ-kvl-kcl-obj",
      "Implement Cramer's rule to compute mesh currents in milliamperes.",
      [
        "Formulate the system: (R1+R2)*I1 - R2*I2 = V1, and -R2*I1 + (R2+R3)*I2 = -V2.",
        "Calculate det = (R1+R2)*(R2+R3) - R2^2.",
        "Multiply current by 1000 to convert from Amperes to milliamperes.",
      ],
      "Developing",
      `// Two-mesh loop solver\nconst v1 = 12.0, v2 = 6.0;\nconst r1 = 100.0, r2 = 220.0, r3 = 150.0;\n\n// TODO: Calculate I1, I2, I3 and print to console\n`,
      [
        {
          id: "tc-mesh-default",
          label: "Solves default 2-mesh network with V1=12V, V2=6V",
          expectedStdout: "I1: 34.34 mA, I2: -3.82 mA, I3: 38.16 mA\n",
        },
        {
          id: "tc-mesh-check-positive",
          label: "Verifies branch current conservation I3 = I1 - I2",
          expectedStdout: "I1: 34.34 mA, I2: -3.82 mA, I3: 38.16 mA\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why does the shared resistor R2 appear with negative signs in off-diagonal matrix entries?",
      "Because when current I1 circulates clockwise through R2, adjacent mesh current I2 circulates counter-clockwise through R2 in the opposite direction.",
    ),
  },

  {
    id: "circuits-thevenin-norton",
    order: 2,
    title: "Thevenin & Norton Equivalent Networks",
    summary: "Simplify complex linear two-terminal networks into ideal equivalent sources and maximize load power transfer.",
    type: "interactive-simulation",
    objectiveIds: ["circ-thev-nort-obj"],
    prerequisiteLessonIds: ["circuits-kvl-kcl-mesh"],
    estimatedDurationMinutes: 35,
    content: `Any linear, two-terminal circuit consisting of independent sources and passive resistors can be replaced at its external load terminals by an electrically identical equivalent:

### Thevenin's Theorem
An ideal voltage source $V_{th}$ in series with equivalent resistance $R_{th}$:
- **$V_{th}$ (Open-Circuit Voltage)**: Potential measured across terminals with load disconnected: $V_{th} = V_{oc}$.
- **$R_{th}$ (Equivalent Resistance)**: Resistance measured across terminals with all independent voltage sources short-circuited and current sources open-circuited.

### Norton's Theorem
An ideal current source $I_N$ in parallel with resistance $R_N$:
$$I_N = \\frac{V_{th}}{R_{th}}, \\quad R_N = R_{th}$$

### Maximum Power Transfer Theorem
A load resistor $R_L$ connected to a linear network receives **maximum power** when the load resistance equals the Thevenin source resistance:
$$R_L = R_{th}$$

Under matched conditions, maximum transferred load power is:
$$P_{max} = \\frac{V_{th}^2}{4 R_{th}}$$

At peak power transfer, system electrical efficiency is exactly $50\\%$ (equal power is dissipated internally inside source resistance $R_{th}$).`,
    theorySections: [
      {
        id: "source-transformation",
        title: "Source Transformations",
        content: "A real voltage source (ideal V_s with series R_s) can be directly transformed into an equivalent real current source (ideal I_s = V_s / R_s with parallel R_s) without altering branch currents or voltages elsewhere in the external network.",
      },
      {
        id: "dependent-sources-thevenin",
        title: "Determining R_th in the Presence of Dependent Sources",
        content: "When dependent sources are present, R_th cannot be determined by deactivating sources. Instead, apply a fictitious test source (V_test = 1 V) at the load terminals and compute the resulting test current I_test to find R_th = V_test / I_test.",
      },
    ],
    codeExamples: [
      {
        title: "C Analytical Thevenin and Max Power Calculator",
        language: "c",
        code: `#include <stdio.h>

int main(void) {
    double vs = 24.0;
    double r1 = 120.0, r2 = 80.0;
    
    // Voltage divider across open circuit terminals
    double v_th = vs * (r2 / (r1 + r2));
    // Deactivating vs (short circuit): R1 parallel R2
    double r_th = (r1 * r2) / (r1 + r2);
    double i_norton = v_th / r_th;
    double p_max = (v_th * v_th) / (4.0 * r_th);
    
    printf("Vth: %.2f V, Rth: %.2f Ohm, In: %.2f mA, Pmax: %.2f mW\\n",
           v_th, r_th, i_norton * 1000.0, p_max * 1000.0);
    return 0;
}`,
        description: "Calculates Thevenin and Norton parameters for a loaded voltage divider network in C.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Thevenin Equivalent & Max Power Transfer",
      description: "Interactive load sweep showing the classic parabolic power transfer curve peaking at RL = Rth.",
      config: { mode: "analog" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Vth: 9.60 V, Rth: 48.00 Ohm, In: 200.00 mA, Pmax: 480.00 mW\n"),
    exercise: exercise(
      "ex-circ-thevenin-pmax",
      "Compute Thevenin Equivalent & Maximum Power",
      "For a 24V source driving R1 = 120 ohms and R2 = 80 ohms, compute Vth (Volts), Rth (Ohms), In (mA), and Pmax (mW). Print: 'Vth: {v_th} V, Rth: {r_th} Ohm, In: {in_ma} mA, Pmax: {p_max} mW' formatted to 2 decimals.",
      `const vs = 24.0;\nconst r1 = 120.0, r2 = 80.0;\nconst v_th = vs * (r2 / (r1 + r2));\nconst r_th = (r1 * r2) / (r1 + r2);\nconst in_ma = (v_th / r_th) * 1000.0;\nconst p_max = ((v_th * v_th) / (4.0 * r_th)) * 1000.0;\nconsole.log(\`Vth: \${v_th.toFixed(2)} V, Rth: \${r_th.toFixed(2)} Ohm, In: \${in_ma.toFixed(2)} mA, Pmax: \${p_max.toFixed(2)} mW\`);`,
      "circ-thev-nort-obj",
      "Calculate open-circuit voltage, short-circuit current, and matched load power.",
      [
        "Vth = Vs * (R2 / (R1 + R2)) using voltage division.",
        "Rth = (R1 * R2) / (R1 + R2) by shorting the independent source.",
        "Pmax = (Vth^2) / (4 * Rth). Multiply by 1000 for milliwatts.",
      ],
      "Developing",
      `// Thevenin equivalent solver\nconst vs = 24.0;\nconst r1 = 120.0, r2 = 80.0;\n\n// TODO: Calculate Vth, Rth, In, and Pmax and log result\n`,
      [
        {
          id: "tc-thev-pmax",
          label: "Verifies Thevenin parameters for 24V divider",
          expectedStdout: "Vth: 9.60 V, Rth: 48.00 Ohm, In: 200.00 mA, Pmax: 480.00 mW\n",
        },
        {
          id: "tc-thev-hidden",
          label: "Verifies Norton current matches Vth / Rth",
          expectedStdout: "Vth: 9.60 V, Rth: 48.00 Ohm, In: 200.00 mA, Pmax: 480.00 mW\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why is maximum power transfer rarely utilized in municipal AC electrical power grids?",
      "Because 50% power transfer efficiency means 50% of generated energy would be wasted as heat inside generators and transmission lines, causing destructive overheating.",
    ),
  },

  // Module 2: AC Sinusoidal Steady State & Resonant Systems
  {
    id: "circuits-rlc-transients",
    order: 3,
    title: "RLC Transient Dynamics & Second-Order Resonance",
    summary: "Derive natural frequency, damping ratio, quality factor, and oscillatory transient response in series RLC networks.",
    type: "interactive-simulation",
    objectiveIds: ["circ-rlc-obj"],
    prerequisiteLessonIds: ["circuits-thevenin-norton"],
    estimatedDurationMinutes: 40,
    content: `When energy storage elements of both inductive ($L$) and capacitive ($C$) types are combined with resistance ($R$), the circuit is governed by a **second-order differential equation**:

$$L \\frac{d^2 i(t)}{dt^2} + R \\frac{di(t)}{dt} + \\frac{1}{C} i(t) = 0$$

Dividing by $L$ gives the standard form:
$$\\frac{d^2 i(t)}{dt^2} + 2\\alpha \\frac{di(t)}{dt} + \\omega_0^2 i(t) = 0$$

### Key System Parameters
- **Undamped Natural Angular Frequency**: $\\omega_0 = \\frac{1}{\\sqrt{LC}}$ (rad/s), and $f_0 = \\frac{\\omega_0}{2\\pi}$ (Hz).
- **Neper Damping Factor**: $\\alpha = \\frac{R}{2L}$ (series RLC).
- **Damping Ratio**: $\\zeta = \\frac{\\alpha}{\\omega_0} = \\frac{R}{2} \\sqrt{\\frac{C}{L}}$.
- **Quality Factor ($Q$)**: $Q = \\frac{1}{2\\zeta} = \\frac{\\omega_0 L}{R} = \\frac{1}{R} \\sqrt{\\frac{L}{C}}$.

### Damping Regimes
1. **Overdamped ($\\zeta > 1$ or $\\alpha > \\omega_0$)**: Roots are real and unequal. Output returns monotonically to zero without oscillation.
2. **Critically Damped ($\\zeta = 1$ or $\\alpha = \\omega_0$)**: Roots are real and equal ($R_{crit} = 2\\sqrt{L/C}$). Fastest possible recovery without overshoot.
3. **Underdamped ($\\zeta < 1$ or $\\alpha < \\omega_0$)**: Roots are complex conjugates ($s_{1,2} = -\\alpha \\pm j\\omega_d$). Oscillatory ringing at damped frequency $\\omega_d = \\sqrt{\\omega_0^2 - \\alpha^2}$.`,
    theorySections: [
      {
        id: "rlc-energy-exchange",
        title: "Electromagnetic Energy Exchange",
        content: "In an underdamped RLC circuit, energy continuously oscillates between the capacitor's electric field (E = 0.5 * C * V^2) and the inductor's magnetic field (E = 0.5 * L * I^2). The resistor R dissipates a fraction of this energy during each cycle, creating an exponentially decaying envelope e^(-alpha * t).",
      },
      {
        id: "series-vs-parallel-rlc",
        title: "Series vs. Parallel RLC Differences",
        content: "In series RLC, resonance produces minimum impedance (Z = R) and maximum current. In parallel RLC, resonance produces maximum impedance (antiresonance) and minimum total line current.",
      },
    ],
    codeExamples: [
      {
        title: "C Second-Order RLC Parameter Classifier",
        language: "c",
        code: `#include <stdio.h>
#include <math.h>

int main(void) {
    double r = 50.0;             // Ohms
    double l = 10.0e-3;          // 10 mH
    double c = 10.0e-6;          // 10 uF
    
    double omega0 = 1.0 / sqrt(l * c);
    double f0 = omega0 / (2.0 * 3.141592653589793);
    double alpha = r / (2.0 * l);
    double zeta = alpha / omega0;
    double q = 1.0 / (2.0 * zeta);
    
    printf("f0: %.1f Hz, alpha: %.1f Np/s, zeta: %.3f, Q: %.2f\\n",
           f0, alpha, zeta, q);
    return 0;
}`,
        description: "Computes resonant frequency and damping ratio for series RLC.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Series RLC Resonant Ringing",
      description: "Interactive transient response curve displaying underdamped decay envelope and Q factor.",
      config: { mode: "analog" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("f0: 503.3 Hz, alpha: 2500.0 Np/s, zeta: 0.791, Q: 0.63\n"),
    exercise: exercise(
      "ex-circ-rlc-parameters",
      "Calculate RLC Natural Frequency and Damping Factor",
      "Given R = 50 ohms, L = 10 mH (0.01 H), and C = 10 uF (0.00001 F), compute natural frequency f0 (Hz), Neper damping alpha (Np/s), damping ratio zeta, and quality factor Q. Print: 'f0: {f0} Hz, alpha: {alpha} Np/s, zeta: {zeta}, Q: {q}' with f0, alpha to 1 decimal, zeta to 3 decimals, and Q to 2 decimals.",
      `const r = 50.0;\nconst l = 0.01;\nconst c = 0.00001;\nconst omega0 = 1.0 / Math.sqrt(l * c);\nconst f0 = omega0 / (2.0 * Math.PI);\nconst alpha = r / (2.0 * l);\nconst zeta = alpha / omega0;\nconst q = 1.0 / (2.0 * zeta);\nconsole.log(\`f0: \${f0.toFixed(1)} Hz, alpha: \${alpha.toFixed(1)} Np/s, zeta: \${zeta.toFixed(3)}, Q: \${q.toFixed(2)}\`);`,
      "circ-rlc-obj",
      "Determine second-order damping parameters from component values.",
      [
        "omega0 = 1 / sqrt(L * C) in rad/s, f0 = omega0 / (2 * pi) in Hz.",
        "alpha = R / (2 * L) for series RLC.",
        "zeta = alpha / omega0, and Q = 1 / (2 * zeta).",
      ],
      "Developing",
      `// Series RLC resonance calculator\nconst r = 50.0;\nconst l = 0.01; // 10 mH\nconst c = 0.00001; // 10 uF\n\n// TODO: Calculate f0, alpha, zeta, and Q and print formatted output\n`,
      [
        {
          id: "tc-rlc-calc",
          label: "Verifies RLC parameters for R=50, L=10mH, C=10uF",
          expectedStdout: "f0: 503.3 Hz, alpha: 2500.0 Np/s, zeta: 0.791, Q: 0.63\n",
        },
        {
          id: "tc-rlc-underdamped",
          label: "Confirms underdamped condition where zeta < 1",
          expectedStdout: "f0: 503.3 Hz, alpha: 2500.0 Np/s, zeta: 0.791, Q: 0.63\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "What critical value of series resistance R_crit results in critical damping (zeta = 1)?",
      "R_crit = 2 * sqrt(L / C). Any resistance below this value yields oscillatory ringing; above this value yields sluggish overdamped decay.",
    ),
  },

  {
    id: "circuits-ac-phasors-power-factor",
    order: 4,
    title: "AC Phasors, Impedance, and Power Factor Correction",
    summary: "Represent sinusoidal AC voltages and currents as rotating complex phasors; calculate real, reactive, and apparent power.",
    type: "interactive-simulation",
    objectiveIds: ["circ-phasor-pf-obj"],
    prerequisiteLessonIds: ["circuits-rlc-transients"],
    estimatedDurationMinutes: 40,
    content: `In alternating current (AC) sinusoidal steady-state analysis, steady-state voltages and currents oscillating at angular frequency $\\omega = 2\\pi f$ are represented as **complex phasors** using Euler's identity:

$$v(t) = V_m \\cos(\\omega t + \\theta) \\iff \\mathbf{V} = V_{\\text{rms}} e^{j\\theta} = V_{\\text{rms}} \\angle \\theta$$

Where $V_{\\text{rms}} = \\frac{V_m}{\\sqrt{2}}$.

### Complex Impedance ($\\mathbf{Z}$)
- **Resistor**: $\\mathbf{Z}_R = R \\angle 0^\\circ = R$ (Current and voltage are in phase).
- **Inductor**: $\\mathbf{Z}_L = j\\omega L = \\omega L \\angle +90^\\circ$ (Voltage leads current by $90^\\circ$).
- **Capacitor**: $\\mathbf{Z}_C = \\frac{1}{j\\omega C} = -j\\frac{1}{\\omega C} = \\frac{1}{\\omega C} \\angle -90^\\circ$ (Voltage lags current by $90^\\circ$).

### The AC Power Triangle
When complex voltage $\\mathbf{V}$ and conjugate current $\\mathbf{I}^*$ are multiplied, they form **Complex Power ($\\mathbf{S}$)**:
$$\\mathbf{S} = \\mathbf{V} \\mathbf{I}^* = P + jQ$$

- **Real Power ($P$)**: Rate of actual useful work consumed: $P = V_{\\text{rms}} I_{\\text{rms}} \\cos \\theta$ in **Watts (W)**.
- **Reactive Power ($Q$)**: Energy oscillating between source and reactive fields: $Q = V_{\\text{rms}} I_{\\text{rms}} \\sin \\theta$ in **Volt-Amperes Reactive (VAR)**.
- **Apparent Power ($S$)**: Vector magnitude: $S = |\\mathbf{S}| = \\sqrt{P^2 + Q^2} = V_{\\text{rms}} I_{\\text{rms}}$ in **Volt-Amperes (VA)**.
- **Power Factor (PF)**: $\\text{PF} = \\cos \\theta = \\frac{P}{S}$.

### Power Factor Correction
Industrial inductive loads (electric motors, transformers) operate with a lagging power factor ($\\text{PF} < 1$). Connecting parallel capacitor banks supplies leading reactive power ($-Q_C$), cancelling the inductive demand ($Q_L - Q_C \\approx 0$), minimizing transmission line currents, and avoiding utility penalty fees.`,
    theorySections: [
      {
        id: "why-rms-matters",
        title: "Why Root-Mean-Square (RMS) Is Used",
        content: "The RMS value of an AC sinusoidal wave represents the equivalent DC value that would dissipate the exact same thermal power across a purely resistive load. Standard 230V or 120V mains ratings are always specified in RMS volts.",
      },
      {
        id: "capacitor-bank-sizing",
        title: "Calculating Correction Capacitor Size",
        content: "To improve power factor from cos(theta1) to cos(theta2), the required capacitor reactive power is Q_c = P * (tan(theta1) - tan(theta2)). The required capacitance is C = Q_c / (omega * V_rms^2).",
      },
    ],
    codeExamples: [
      {
        title: "C AC Complex Power and Power Factor Calculator",
        language: "c",
        code: `#include <stdio.h>
#include <math.h>

int main(void) {
    double v_rms = 230.0;
    double r = 40.0;             // Real resistance
    double xl = 30.0;            // Inductive reactance (omega * L)
    
    double z_mag = sqrt(r * r + xl * xl);
    double i_rms = v_rms / z_mag;
    double p = i_rms * i_rms * r;
    double q = i_rms * i_rms * xl;
    double s = v_rms * i_rms;
    double pf = p / s;
    
    printf("Irms: %.2f A, P: %.1f W, Q: %.1f VAR, S: %.1f VA, PF: %.2f (lagging)\\n",
           i_rms, p, q, s, pf);
    return 0;
}`,
        description: "Computes complex impedance, real, reactive, and apparent power in C.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "AC Phasors & Power Triangle",
      description: "Visualize phasor angles and calculate reactive power factor correction.",
      config: { mode: "analog" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Irms: 4.60 A, P: 846.4 W, Q: 634.8 VAR, S: 1058.0 VA, PF: 0.80 (lagging)\n"),
    exercise: exercise(
      "ex-circ-ac-power",
      "Calculate AC Current and Power Triangle Components",
      "A 230V RMS AC supply feeds a series load with R = 40 ohms and XL = 30 ohms. Compute Irms (A), real power P (W), reactive power Q (VAR), apparent power S (VA), and power factor PF. Print: 'Irms: {irms} A, P: {p} W, Q: {q} VAR, S: {s} VA, PF: {pf} (lagging)' with Irms and PF to 2 decimals, and P, Q, S to 1 decimal.",
      `const v_rms = 230.0;\nconst r = 40.0, xl = 30.0;\nconst z_mag = Math.sqrt(r * r + xl * xl);\nconst irms = v_rms / z_mag;\nconst p = irms * irms * r;\nconst q = irms * irms * xl;\nconst s = v_rms * irms;\nconst pf = p / s;\nconsole.log(\`Irms: \${irms.toFixed(2)} A, P: \${p.toFixed(1)} W, Q: \${q.toFixed(1)} VAR, S: \${s.toFixed(1)} VA, PF: \${pf.toFixed(2)} (lagging)\`);`,
      "circ-phasor-pf-obj",
      "Compute impedance magnitude and resolve the AC power triangle.",
      [
        "Z = sqrt(R^2 + XL^2). Irms = Vrms / Z.",
        "P = Irms^2 * R, Q = Irms^2 * XL, S = Vrms * Irms.",
        "PF = P / S.",
      ],
      "Developing",
      `// AC phasor and power factor solver\nconst v_rms = 230.0;\nconst r = 40.0, xl = 30.0;\n\n// TODO: Compute Irms, P, Q, S, and PF and log the result\n`,
      [
        {
          id: "tc-ac-power",
          label: "Verifies AC power components for 230V series RL load",
          expectedStdout: "Irms: 4.60 A, P: 846.4 W, Q: 634.8 VAR, S: 1058.0 VA, PF: 0.80 (lagging)\n",
        },
        {
          id: "tc-ac-pf-ratio",
          label: "Checks power factor equality P / S == 0.80",
          expectedStdout: "Irms: 4.60 A, P: 846.4 W, Q: 634.8 VAR, S: 1058.0 VA, PF: 0.80 (lagging)\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why does an inductive load have a 'lagging' power factor?",
      "Because the voltage across an inductor leads the current, meaning current reaches its sinusoidal crest after the voltage—hence current 'lags' voltage.",
    ),
  },

  // Module 3: Semiconductor Diodes & Transistor Biasing
  {
    id: "circuits-diode-rectifiers-filters",
    order: 5,
    title: "PN Junction Diodes, Bridge Rectification, and Smoothing Filters",
    summary: "Analyze forward bias turn-on voltage, half-wave and full-wave bridge rectifiers, and capacitor filter ripple factors.",
    type: "interactive-simulation",
    objectiveIds: ["circ-diode-rect-obj"],
    prerequisiteLessonIds: ["circuits-ac-phasors-power-factor"],
    estimatedDurationMinutes: 35,
    content: `Semiconductor diodes conduct current in one direction only. The relationship between forward voltage $V_D$ and diode current $I_D$ is described by the **Shockley Diode Equation**:

$$I_D = I_S \\left( e^{\\frac{V_D}{n V_T}} - 1 \\right)$$

Where $I_S$ is reverse saturation current, $n$ is ideality factor ($1 \\le n \\le 2$), and $V_T = \\frac{kT}{q} \\approx 26\\text{ mV}$ at room temperature ($300\\text{ K}$).

### Standard Silicon Threshold
In practical engineering analysis, a conducting silicon diode is modeled as a constant forward drop $V_F \\approx 0.7\\text{ V}$ (Germanium $\\approx 0.3\\text{ V}$, Schottky $\\approx 0.2\\text{–}0.3\\text{ V}$, LEDs $\\approx 1.8\\text{–}3.2\\text{ V}$).

### Full-Wave Bridge Rectification
A 4-diode Graetz bridge conducts during both positive and negative AC half-cycles. Two diodes conduct simultaneously in series during each half cycle:
$$V_{\\text{peak,out}} = V_{\\text{peak,in}} - 2 V_F$$

For AC input $V_{\\text{rms}}$:
$$V_{\\text{peak,out}} = \\sqrt{2} V_{\\text{rms}} - 1.4\\text{ V}$$

### Capacitor Smoothing & Ripple Voltage
Placing a reservoir capacitor $C$ in parallel with load $R_L$ smooths the pulsating rectified DC waveform. Peak-to-peak ripple voltage $V_r$ is:
$$V_{r(\\text{p-p})} = \\frac{I_{\\text{load}}}{2 f C} = \\frac{V_{\\text{peak,out}}}{2 f R_L C}$$

Where $f$ is input AC mains frequency ($50\\text{ Hz}$ or $60\\text{ Hz}$; doubled to $100\\text{ Hz}$ or $120\\text{ Hz}$ after full-wave rectification).

The **Ripple Factor ($r$)** measures residual AC content:
$$r = \\frac{V_{\\text{rms,ripple}}}{V_{\\text{dc}}} \\approx \\frac{1}{4\\sqrt{3} f R_L C}$$`,
    theorySections: [
      {
        id: "piv-rating",
        title: "Peak Inverse Voltage (PIV)",
        content: "The PIV is the maximum reverse bias voltage applied across a non-conducting diode during the alternate half-cycle. In a full-wave bridge rectifier, PIV = V_peak,in - V_F. In a center-tapped 2-diode transformer rectifier, PIV = 2 * V_peak.",
      },
      {
        id: "diode-clamping-clipping",
        title: "Clipping and Clamping Networks",
        content: "Clippers limit or slice away portions of a waveform above or below set DC thresholds to protect downstream microcontrollers. Clampers add a DC bias level to shift an AC waveform entirely above or below zero without altering its shape.",
      },
    ],
    codeExamples: [
      {
        title: "C Full-Wave Bridge Rectifier & Filter Ripple Simulator",
        language: "c",
        code: `#include <stdio.h>
#include <math.h>

int main(void) {
    double v_rms = 12.0;         // 12V AC secondary
    double f = 50.0;             // 50 Hz mains
    double rl = 100.0;           // 100 Ohm load
    double c = 1000.0e-6;        // 1000 uF filter
    double vf = 0.7;             // Silicon diode drop
    
    double v_peak_in = v_rms * sqrt(2.0);
    double v_peak_out = v_peak_in - (2.0 * vf);
    double i_load = v_peak_out / rl;
    double v_ripple_pp = i_load / (2.0 * f * c);
    double v_dc = v_peak_out - (v_ripple_pp / 2.0);
    
    printf("Vpeak: %.2f V, Vdc: %.2f V, Vripple: %.2f Vpp, Iload: %.1f mA\\n",
           v_peak_out, v_dc, v_ripple_pp, i_load * 1000.0);
    return 0;
}`,
        description: "Computes rectified peak voltage, ripple voltage, and DC output in C.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Bridge Rectifier & RC Filter",
      description: "Inspect half-wave vs full-wave rectified waveforms and capacitor smoothing ripple.",
      config: { mode: "analog" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Vpeak: 15.57 V, Vdc: 14.79 V, Vripple: 1.56 Vpp, Iload: 155.7 mA\n"),
    exercise: exercise(
      "ex-circ-rectifier-filter",
      "Calculate Rectified Output Voltage and Ripple",
      "Given 12V RMS 50Hz AC input to a full-wave bridge (two 0.7V diode drops), with RL = 100 ohms and C = 1000 uF (0.001 F), compute Vpeak_out, Vdc, Vripple_pp, and Iload in mA. Print: 'Vpeak: {v_peak} V, Vdc: {v_dc} V, Vripple: {v_rip} Vpp, Iload: {iload} mA' with voltages to 2 decimals and Iload to 1 decimal.",
      `const v_rms = 12.0, f = 50.0, rl = 100.0, c = 0.001, vf = 0.7;\nconst v_peak_in = v_rms * Math.SQRT2;\nconst v_peak = v_peak_in - (2.0 * vf);\nconst iload_a = v_peak / rl;\nconst v_rip = iload_a / (2.0 * f * c);\nconst v_dc = v_peak - (v_rip / 2.0);\nconst iload_ma = iload_a * 1000.0;\nconsole.log(\`Vpeak: \${v_peak.toFixed(2)} V, Vdc: \${v_dc.toFixed(2)} V, Vripple: \${v_rip.toFixed(2)} Vpp, Iload: \${iload_ma.toFixed(1)} mA\`);`,
      "circ-diode-rect-obj",
      "Calculate full-wave rectified DC voltage and peak-to-peak ripple.",
      [
        "Vpeak_in = Vrms * sqrt(2). Vpeak_out = Vpeak_in - 1.4.",
        "Iload = Vpeak_out / RL. Vripple = Iload / (2 * f * C).",
        "Vdc = Vpeak_out - (Vripple / 2).",
      ],
      "Developing",
      `// Bridge rectifier & filter solver\nconst v_rms = 12.0, f = 50.0, rl = 100.0, c = 0.001, vf = 0.7;\n\n// TODO: Calculate Vpeak, Vdc, Vripple, Iload and print output\n`,
      [
        {
          id: "tc-rectifier-filter",
          label: "Verifies bridge rectifier output with 1000uF capacitor",
          expectedStdout: "Vpeak: 15.57 V, Vdc: 14.79 V, Vripple: 1.56 Vpp, Iload: 155.7 mA\n",
        },
        {
          id: "tc-rectifier-vdc",
          label: "Ensures DC voltage is lower than peak by half ripple",
          expectedStdout: "Vpeak: 15.57 V, Vdc: 14.79 V, Vripple: 1.56 Vpp, Iload: 155.7 mA\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why is the ripple frequency across a full-wave rectifier output 100 Hz in a 50 Hz grid?",
      "Because the bridge inverts the negative half-cycles into positive pulses, producing two output DC charging peaks for every single input AC cycle.",
    ),
  },

  {
    id: "circuits-bjt-biasing-amplifiers",
    order: 6,
    title: "BJT Transistor Biasing & Small-Signal Voltage Amplification",
    summary: "Establish stable Q-point DC biasing in Common-Emitter configurations and determine AC small-signal voltage gain.",
    type: "interactive-simulation",
    objectiveIds: ["circ-bjt-bias-obj"],
    prerequisiteLessonIds: ["circuits-diode-rectifiers-filters"],
    estimatedDurationMinutes: 40,
    content: `A Bipolar Junction Transistor (BJT) is a current-controlled three-terminal semiconductor device. In active forward mode:

$$I_C = \\beta I_B, \\quad I_E = I_C + I_B = (\\beta + 1) I_B$$

Where $\\beta$ (or $h_{FE}$) is the DC current gain ($100\\text{–}300$ for standard NPN transistors like the 2N3904 or BC547).

### Voltage Divider Bias (Beta-Independent Q-Point)
To keep the DC operating point (Q-point) stable against thermal variations and manufacturing variations in $\\beta$, a voltage divider network ($R_1, R_2$) drives the base:

$$V_B = V_{CC} \\left( \\frac{R_2}{R_1 + R_2} \\right)$$
$$V_E = V_B - V_{BE} = V_B - 0.7\\text{ V}$$
$$I_C \\approx I_E = \\frac{V_E}{R_E}$$
$$V_C = V_{CC} - I_C R_C$$
$$V_{CE} = V_C - V_E$$

For linear, undistorted AC amplification, the Q-point is centered such that $V_{CE} \\approx \\frac{V_{CC}}{2}$.

### AC Small-Signal Parameters
The dynamic intrinsic emitter resistance $r_e'$ is governed by thermal voltage $V_T \\approx 26\\text{ mV}$:
$$r_e' = \\frac{26\\text{ mV}}{I_C}$$

For a **Common-Emitter Amplifier** with an emitter bypass capacitor ($C_E$ shorting $R_E$ to ground for AC signals):
- **Voltage Gain ($A_v$)**:
$$A_v = -\\frac{R_C \\parallel R_{\\text{load}}}{r_e'}$$
(The negative sign indicates an exact $180^\\circ$ phase inversion between input and output).`,
    theorySections: [
      {
        id: "bjt-operating-regions",
        title: "BJT Operating Regions",
        content: "1. Cutoff (V_BE < 0.7V): Both junctions reverse-biased; I_C = 0 (Open switch). 2. Saturation (V_CE <= 0.2V): Both junctions forward-biased; maximum I_C limited by R_C (Closed switch). 3. Active Mode (V_BE = 0.7V, V_CE > 0.2V): Base-emitter forward, base-collector reverse; linear amplifier region.",
      },
      {
        id: "thermal-runaway-protection",
        title: "Thermal Runaway and Emitter Degeneration",
        content: "As transistor temperature rises, V_BE drops by ~2 mV/°C, increasing I_C. Without emitter resistor R_E, this positive feedback loop causes destructive thermal runaway. R_E introduces negative DC feedback: higher I_E raises V_E, reducing V_BE = V_B - V_E and stabilizing the Q-point.",
      },
    ],
    codeExamples: [
      {
        title: "C Common-Emitter BJT Q-Point & Small-Signal Gain Calculator",
        language: "c",
        code: `#include <stdio.h>

int main(void) {
    double vcc = 12.0;
    double r1 = 33000.0, r2 = 10000.0;
    double rc = 2200.0, re = 1000.0;
    double vbe = 0.7;
    
    // DC Analysis (Stiff divider assumption)
    double vb = vcc * (r2 / (r1 + r2));
    double ve = vb - vbe;
    double ic = ve / re;
    double vc = vcc - (ic * rc);
    double vce = vc - ve;
    
    // AC Analysis
    double re_prime = 0.026 / ic;
    double av = -(rc / re_prime); // Fully bypassed emitter
    
    printf("Q-Point: Ic = %.2f mA, Vce = %.2f V | re' = %.2f Ohm, Av = %.1f\\n",
           ic * 1000.0, vce, re_prime, av);
    return 0;
}`,
        description: "Calculates BJT Q-point bias voltages and AC voltage gain.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Common-Emitter BJT Amplifier",
      description: "Inspect Q-point operating load lines and 180° inverted sinusoidal voltage amplification.",
      config: { mode: "analog" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Q-Point: Ic = 2.09 mA, Vce = 5.31 V | re' = 12.44 Ohm, Av = -176.9\n"),
    exercise: exercise(
      "ex-circ-bjt-qpoint",
      "Compute BJT Common-Emitter Q-Point and Voltage Gain",
      "Given Vcc = 12V, R1 = 33k (33000), R2 = 10k (10000), Rc = 2.2k (2200), Re = 1k (1000), and Vbe = 0.7V, calculate Ic (mA), Vce (V), re' (Ohms), and Av. Print: 'Q-Point: Ic = {ic} mA, Vce = {vce} V | re\\' = {re_prime} Ohm, Av = {av}' with Ic, Vce, re' to 2 decimals, and Av to 1 decimal.",
      `const vcc = 12.0, r1 = 33000.0, r2 = 10000.0, rc = 2200.0, re = 1000.0, vbe = 0.7;\nconst vb = vcc * (r2 / (r1 + r2));\nconst ve = vb - vbe;\nconst ic = ve / re;\nconst vc = vcc - (ic * rc);\nconst vce = vc - ve;\nconst re_prime = 0.026 / ic;\nconst av = -(rc / re_prime);\nconsole.log(\`Q-Point: Ic = \${(ic * 1000).toFixed(2)} mA, Vce = \${vce.toFixed(2)} V | re' = \${re_prime.toFixed(2)} Ohm, Av = \${av.toFixed(1)}\`);`,
      "circ-bjt-bias-obj",
      "Calculate DC bias voltages and small-signal common-emitter voltage gain.",
      [
        "Vb = Vcc * (R2 / (R1 + R2)). Ve = Vb - 0.7.",
        "Ic = Ve / Re. Vc = Vcc - Ic * Rc. Vce = Vc - Ve.",
        "re' = 0.026 / Ic. Av = -Rc / re'.",
      ],
      "Developing",
      `// BJT Common-Emitter Q-point and gain calculator\nconst vcc = 12.0, r1 = 33000.0, r2 = 10000.0, rc = 2200.0, re = 1000.0, vbe = 0.7;\n\n// TODO: Calculate Ic, Vce, re', and Av and print formatted output\n`,
      [
        {
          id: "tc-bjt-qpoint",
          label: "Verifies Q-point and small signal gain for 12V BJT amplifier",
          expectedStdout: "Q-Point: Ic = 2.09 mA, Vce = 5.31 V | re' = 12.44 Ohm, Av = -176.9\n",
        },
        {
          id: "tc-bjt-vce-linear",
          label: "Confirms Vce sits in active region between 0.2V and Vcc",
          expectedStdout: "Q-Point: Ic = 2.09 mA, Vce = 5.31 V | re' = 12.44 Ohm, Av = -176.9\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why does a bypass capacitor across the emitter resistor Re increase AC voltage gain?",
      "Because the capacitor acts as a near-zero AC short to ground, eliminating Re from the AC equivalent circuit so that Av depends only on the tiny intrinsic resistance re' rather than Re.",
    ),
  },

  // Module 4: Linear Integrated Circuits & Operational Amplifiers
  {
    id: "circuits-opamp-fundamentals",
    order: 7,
    title: "Operational Amplifiers, Virtual Ground, and Negative Feedback",
    summary: "Model ideal op-amp behavior using the golden rules: inverting, non-inverting, summing, and differential amplifier topologies.",
    type: "interactive-simulation",
    objectiveIds: ["circ-opamp-obj"],
    prerequisiteLessonIds: ["circuits-bjt-biasing-amplifiers"],
    estimatedDurationMinutes: 40,
    content: `An Operational Amplifier (Op-Amp) is an integrated high-gain differential DC amplifier (open-loop gain $A_{OL} > 10^5$). When negative feedback is applied, op-amp behavior is governed by the two **Golden Rules**:

1. **Virtual Short (Zero Differential Voltage)**: Negative feedback drives the inverting input voltage to equal the non-inverting input voltage:
$$V_+ - V_- = 0 \\iff V_- = V_+$$

2. **Infinite Input Impedance (Zero Input Current)**: No current flows into either input terminal:
$$I_+ = I_- = 0$$

### Core Op-Amp Topologies

#### 1. Inverting Amplifier
The non-inverting input is grounded ($V_+ = 0\\text{ V}$). By the virtual short rule, $V_- = 0\\text{ V}$ (**Virtual Ground**).
Using KCL at node $V_-$:
$$\\frac{V_{in} - 0}{R_{in}} + \\frac{V_{out} - 0}{R_f} = 0 \\implies V_{out} = -\\left( \\frac{R_f}{R_{in}} \\right) V_{in}$$
$$A_v = -\\frac{R_f}{R_{in}}$$

#### 2. Non-Inverting Amplifier
Input $V_{in}$ connects directly to $V_+$. Thus $V_- = V_{in}$. Resistors $R_1$ and $R_f$ form a voltage divider from $V_{out}$:
$$V_- = V_{out} \\left( \\frac{R_1}{R_1 + R_f} \\right) = V_{in} \\implies V_{out} = \\left( 1 + \\frac{R_f}{R_1} \\right) V_{in}$$
$$A_v = 1 + \\frac{R_f}{R_1}$$

#### 3. Voltage Follower (Buffer)
Setting $R_f = 0$ and $R_1 = \\infty$ gives $A_v = 1$ with extremely high input impedance and low output impedance, isolating sensitive stages without loading them.`,
    theorySections: [
      {
        id: "gain-bandwidth-product",
        title: "Gain-Bandwidth Product (GBWP)",
        content: "Real op-amps have an internally compensated open-loop roll-off of -20 dB/decade. The product of closed-loop gain and upper cut-off bandwidth is constant: GBWP = A_v * f_c. For an LM741 with 1 MHz GBWP, a closed-loop gain of 100 limits bandwidth to 10 kHz.",
      },
      {
        id: "slew-rate-saturation",
        title: "Slew Rate and Rail Saturation",
        content: "1. Rail Saturation: Output cannot exceed power supply rails (typically V_sat ≈ Vcc - 1.5V for standard op-amps, or rail-to-rail for CMOS). 2. Slew Rate: Maximum rate of change of output voltage (SR = dV/dt in V/µs); limits large-signal high-frequency fidelity without distortion.",
      },
    ],
    codeExamples: [
      {
        title: "C Op-Amp Closed-Loop Gain and Saturation Simulator",
        language: "c",
        code: `#include <stdio.h>

int main(void) {
    double vin = 1.2;            // 1.2 V input
    double rin = 10000.0;        // 10 kOhm
    double rf = 47000.0;         // 47 kOhm
    double vcc_pos = 12.0;       // +12 V rail
    double vcc_neg = -12.0;      // -12 V rail
    
    // Inverting configuration
    double av_inv = -(rf / rin);
    double vout_inv = av_inv * vin;
    if (vout_inv > vcc_pos) vout_inv = vcc_pos;
    if (vout_inv < vcc_neg) vout_inv = vcc_neg;
    
    // Non-inverting configuration
    double av_noninv = 1.0 + (rf / rin);
    double vout_noninv = av_noninv * vin;
    if (vout_noninv > vcc_pos) vout_noninv = vcc_pos;
    if (vout_noninv < vcc_neg) vout_noninv = vcc_neg;
    
    printf("Inverting: Av = %.2f, Vout = %.2f V | Non-Inv: Av = %.2f, Vout = %.2f V\\n",
           av_inv, vout_inv, av_noninv, vout_noninv);
    return 0;
}`,
        description: "Computes closed-loop gain for inverting and non-inverting op-amp circuits.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Op-Amp Virtual Ground & Feedback",
      description: "Interactive inverting and non-inverting amplifier stages with live output clipping at rail limits.",
      config: { mode: "analog" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Inverting: Av = -4.70, Vout = -5.64 V | Non-Inv: Av = 5.70, Vout = 6.84 V\n"),
    exercise: exercise(
      "ex-circ-opamp-gains",
      "Calculate Inverting and Non-Inverting Op-Amp Outputs",
      "For Vin = 1.2V, Rin = 10k (10000), and Rf = 47k (47000), compute Av and Vout for both Inverting and Non-Inverting configurations. Print: 'Inverting: Av = {av_inv}, Vout = {vout_inv} V | Non-Inv: Av = {av_noninv}, Vout = {vout_noninv} V' with values formatted to 2 decimals.",
      `const vin = 1.2, rin = 10000.0, rf = 47000.0;\nconst av_inv = -(rf / rin);\nconst vout_inv = av_inv * vin;\nconst av_noninv = 1.0 + (rf / rin);\nconst vout_noninv = av_noninv * vin;\nconsole.log(\`Inverting: Av = \${av_inv.toFixed(2)}, Vout = \${vout_inv.toFixed(2)} V | Non-Inv: Av = \${av_noninv.toFixed(2)}, Vout = \${vout_noninv.toFixed(2)} V\`);`,
      "circ-opamp-obj",
      "Compute inverting and non-inverting closed-loop gains and output voltages.",
      [
        "Inverting: Av = -Rf / Rin, Vout = Av * Vin.",
        "Non-Inverting: Av = 1 + (Rf / Rin), Vout = Av * Vin.",
      ],
      "Developing",
      `// Op-Amp closed-loop gain solver\nconst vin = 1.2, rin = 10000.0, rf = 47000.0;\n\n// TODO: Compute inverting and non-inverting gains and output voltages\n`,
      [
        {
          id: "tc-opamp-default",
          label: "Verifies inverting and non-inverting gains for 47k/10k pair",
          expectedStdout: "Inverting: Av = -4.70, Vout = -5.64 V | Non-Inv: Av = 5.70, Vout = 6.84 V\n",
        },
        {
          id: "tc-opamp-gain-relationship",
          label: "Verifies non-inverting gain magnitude exceeds inverting gain by exactly 1",
          expectedStdout: "Inverting: Av = -4.70, Vout = -5.64 V | Non-Inv: Av = 5.70, Vout = 6.84 V\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why does no current enter the inverting input of an ideal op-amp despite a physical connection?",
      "Because the input stage of an operational amplifier utilizes differential BJTs or MOSFETs designed with near-infinite input impedance (typically > 10^12 ohms in FET-input op-amps).",
    ),
  },

  {
    id: "circuits-opamp-active-filters",
    order: 8,
    title: "Active Filters: Sallen-Key Low-Pass, High-Pass, and Band-Pass",
    summary: "Design second-order active RC filters with precise cut-off frequencies, Butterworth flat passbands, and high input impedance.",
    type: "interactive-simulation",
    objectiveIds: ["circ-active-filter-obj"],
    prerequisiteLessonIds: ["circuits-opamp-fundamentals"],
    estimatedDurationMinutes: 40,
    content: `Passive RC filters suffer from severe impedance loading when cascaded: each subsequent stage draws current from the preceding stage, altering the cut-off frequency. **Active Filters** utilize op-amps to buffer stages, allowing sharp roll-off rates ($-40\\text{ dB/decade}$ for second-order filters) without bulky inductors.

### Second-Order Sallen-Key Low-Pass Filter
The Sallen-Key topology is the most widely deployed second-order active filter structure. For equal-component design ($R_1 = R_2 = R$, and $C_1 = C_2 = C$):

$$\\text{Cut-off Frequency } f_c = \\frac{1}{2\\pi R C}$$

The filter transfer function is:
$$H(s) = \\frac{K \\omega_0^2}{s^2 + \\frac{\\omega_0}{Q} s + \\omega_0^2}$$

Where:
- $\\omega_0 = 2\\pi f_c = \\frac{1}{RC}$
- DC Passband Gain $K = 1 + \\frac{R_b}{R_a}$
- Quality Factor $Q = \\frac{1}{3 - K}$

### Butterworth Response (Maximally Flat Passband)
For an ideal Butterworth flat passband with zero ripple ($Q = \\frac{1}{\\sqrt{2}} \\approx 0.707$):
$$3 - K = \\sqrt{2} \\implies K = 3 - \\sqrt{2} \\approx 1.586$$
$$\\frac{R_b}{R_a} = 0.586$$

Setting $\\frac{R_b}{R_a} = 0.586$ yields an optimal Butterworth filter with a sharp $-40\\text{ dB/decade}$ (or $-12\\text{ dB/octave}$) high-frequency roll-off.`,
    theorySections: [
      {
        id: "filter-types-comparison",
        title: "Butterworth vs. Chebyshev vs. Bessel Filters",
        content: "1. Butterworth: Maximally flat amplitude response in the passband with moderate roll-off. 2. Chebyshev: Steepest roll-off transition band, at the cost of equiripple passband oscillation. 3. Bessel: Linear phase response and constant group delay, preserving pulse square waves without overshoot or ringing.",
      },
      {
        id: "highpass-transformation",
        title: "Low-Pass to High-Pass Transformation",
        content: "To convert a Sallen-Key low-pass filter into a high-pass filter, swap the positions of all resistors R and capacitors C. The cut-off frequency remains fc = 1 / (2 * pi * R * C), while low frequencies are attenuated at +40 dB/decade below fc.",
      },
    ],
    codeExamples: [
      {
        title: "C Sallen-Key Active Butterworth Filter Designer",
        language: "c",
        code: `#include <stdio.h>
#include <math.h>

int main(void) {
    double r = 10000.0;          // 10 kOhm
    double c = 15.0e-9;          // 15 nF
    double ra = 10000.0;         // 10 kOhm reference
    
    // Equal component cut-off
    double fc = 1.0 / (2.0 * 3.141592653589793 * r * c);
    // Butterworth criterion: K = 1.586 -> Rb/Ra = 0.586
    double rb = 0.586 * ra;
    double k = 1.0 + (rb / ra);
    double q = 1.0 / (3.0 - k);
    
    printf("Cut-off fc: %.1f Hz, Rb: %.0f Ohm, Gain K: %.3f, Q: %.3f\\n",
           fc, rb, k, q);
    return 0;
}`,
        description: "Designs a second-order Sallen-Key active Butterworth low-pass filter.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Sallen-Key Active Filter Simulator",
      description: "Inspect frequency response Bode plots showing -40 dB/decade roll-off.",
      config: { mode: "analog" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Cut-off fc: 1061.0 Hz, Rb: 5860 Ohm, Gain K: 1.586, Q: 0.707\n"),
    exercise: exercise(
      "ex-circ-sallen-key",
      "Design Sallen-Key Butterworth Active Low-Pass Filter",
      "For R = 10k (10000), C = 15 nF (0.000000015 F), and Ra = 10k, compute cut-off frequency fc in Hz, required feedback resistor Rb (Ohms) for Butterworth response (Rb = 0.586 * Ra), passband gain K, and Q factor. Print: 'Cut-off fc: {fc} Hz, Rb: {rb} Ohm, Gain K: {k}, Q: {q}' with fc to 1 decimal, Rb to 0 decimals, and K, Q to 3 decimals.",
      `const r = 10000.0, c = 15e-9, ra = 10000.0;\nconst fc = 1.0 / (2.0 * Math.PI * r * c);\nconst rb = 0.586 * ra;\nconst k = 1.0 + (rb / ra);\nconst q = 1.0 / (3.0 - k);\nconsole.log(\`Cut-off fc: \${fc.toFixed(1)} Hz, Rb: \${rb.toFixed(0)} Ohm, Gain K: \${k.toFixed(3)}, Q: \${q.toFixed(3)}\`);`,
      "circ-active-filter-obj",
      "Calculate active filter cut-off frequency and Butterworth damping resistors.",
      [
        "fc = 1 / (2 * pi * R * C).",
        "Rb = 0.586 * Ra. K = 1 + (Rb / Ra).",
        "Q = 1 / (3 - K) ≈ 0.707 for Butterworth response.",
      ],
      "Developing",
      `// Sallen-Key active filter designer\nconst r = 10000.0, c = 15e-9, ra = 10000.0;\n\n// TODO: Compute fc, Rb, K, Q and log output\n`,
      [
        {
          id: "tc-sallen-key",
          label: "Verifies Sallen-Key cut-off frequency ~ 1061 Hz",
          expectedStdout: "Cut-off fc: 1061.0 Hz, Rb: 5860 Ohm, Gain K: 1.586, Q: 0.707\n",
        },
        {
          id: "tc-butterworth-q",
          label: "Confirms Q equals 0.707 for Butterworth tuning",
          expectedStdout: "Cut-off fc: 1061.0 Hz, Rb: 5860 Ohm, Gain K: 1.586, Q: 0.707\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "What happens to the Sallen-Key filter if gain K is increased to 3 or higher?",
      "The denominator (3 - K) reaches zero or negative, causing Q to reach infinity. The filter transitions into an unstable autonomous sine-wave oscillator.",
    ),
  },

  // Module 5: Timing Generators & Industrial Power Systems
  {
    id: "circuits-555-timer-multivibrators",
    order: 9,
    title: "NE555 Precision Timer: Astable Pulse Generators & Monostable Triggers",
    summary: "Harness internal comparators, flip-flop latches, and discharge transistors to generate stable clock pulses and one-shot delays.",
    type: "interactive-simulation",
    objectiveIds: ["circ-555-timer-obj"],
    prerequisiteLessonIds: ["circuits-opamp-active-filters"],
    estimatedDurationMinutes: 35,
    content: `The NE555 precision timer is one of the most widely used integrated circuits in electronics. Its internal architecture consists of:
1. A 3-resistor internal divider ($5\\text{ k}\\Omega$ each) setting reference thresholds at $\\frac{1}{3} V_{CC}$ and $\\frac{2}{3} V_{CC}$.
2. Two precision analog comparators (Trigger and Threshold).
3. An internal SR latch.
4. An open-collector NPN discharge transistor connected to Pin 7.

### Astable Multivibrator Mode (Continuous Clock Generator)
In astable mode, external resistors $R_1, R_2$ and capacitor $C$ generate a continuous square wave.

- **Charge Time ($t_{\\text{high}}$)**: Capacitor charges from $\\frac{1}{3} V_{CC}$ to $\\frac{2}{3} V_{CC}$ through $R_1 + R_2$:
$$t_{\\text{high}} = \\ln(2) (R_1 + R_2) C \\approx 0.693 (R_1 + R_2) C$$

- **Discharge Time ($t_{\\text{low}}$)**: Capacitor discharges from $\\frac{2}{3} V_{CC}$ down to $\\frac{1}{3} V_{CC}$ through $R_2$ alone via Pin 7:
$$t_{\\text{low}} = \\ln(2) R_2 C \\approx 0.693 R_2 C$$

- **Total Period ($T$) & Frequency ($f$)**:
$$T = t_{\\text{high}} + t_{\\text{low}} = 0.693 (R_1 + 2 R_2) C$$
$$f = \\frac{1}{T} = \\frac{1.44}{(R_1 + 2 R_2) C}$$

- **Duty Cycle ($D$)**:
$$D = \\frac{t_{\\text{high}}}{T} = \\frac{R_1 + R_2}{R_1 + 2 R_2} \\times 100\\%$$

Notice that in standard astable configuration, duty cycle is always strictly greater than $50\\%$ because charging path includes $R_1 + R_2$ whereas discharging path includes only $R_2$.`,
    theorySections: [
      {
        id: "achieving-50-percent-duty",
        title: "Achieving a Symmetric 50% Duty Cycle",
        content: "To produce a precise 50% square wave (or duty cycles below 50%), connect a signal diode (1N4148) in parallel with R2 pointing towards the capacitor. The capacitor charges through R1 + Diode, bypassing R2, and discharges through R2 alone, enabling independent control of t_high and t_low.",
      },
      {
        id: "monostable-oneshot",
        title: "Monostable One-Shot Operation",
        content: "In monostable mode, a negative trigger pulse (< 1/3 Vcc) applied to Pin 2 sets the internal latch, driving Output Pin 3 HIGH for a precise duration t_pulse = 1.1 * R1 * C before the capacitor reaches 2/3 Vcc and automatically resets.",
      },
    ],
    codeExamples: [
      {
        title: "C 555 Astable Clock Frequency & Duty Cycle Calculator",
        language: "c",
        code: `#include <stdio.h>

int main(void) {
    double r1 = 4700.0;          // 4.7 kOhm
    double r2 = 10000.0;         // 10 kOhm
    double c = 100.0e-9;         // 100 nF (0.1 uF)
    
    double t_high = 0.693 * (r1 + r2) * c;
    double t_low = 0.693 * r2 * c;
    double t_period = t_high + t_low;
    double f = 1.0 / t_period;
    double duty = (t_high / t_period) * 100.0;
    
    printf("Freq: %.1f Hz, Period: %.2f ms, Thigh: %.2f ms, Tlow: %.2f ms, Duty: %.1f%%\\n",
           f, t_period * 1000.0, t_high * 1000.0, t_low * 1000.0, duty);
    return 0;
}`,
        description: "Computes frequency, timing intervals, and duty cycle for a 555 astable oscillator.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "555 Timer Astable Oscillator",
      description: "Interactive clock pulse generator displaying capacitor ramp voltages and output square wave.",
      config: { mode: "analog" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Freq: 584.2 Hz, Period: 1.71 ms, Thigh: 1.02 ms, Tlow: 0.69 ms, Duty: 59.5%\n"),
    exercise: exercise(
      "ex-circ-555-timing",
      "Calculate 555 Astable Frequency and Duty Cycle",
      "For R1 = 4.7k (4700), R2 = 10k (10000), and C = 100 nF (0.0000001 F), compute frequency f in Hz, period in ms, Thigh in ms, Tlow in ms, and duty cycle %. Print: 'Freq: {f} Hz, Period: {period} ms, Thigh: {thigh} ms, Tlow: {tlow} ms, Duty: {duty}%' with f and duty to 1 decimal, and times to 2 decimals.",
      `const r1 = 4700.0, r2 = 10000.0, c = 1e-7;\nconst thigh = 0.693 * (r1 + r2) * c;\nconst tlow = 0.693 * r2 * c;\nconst period = thigh + tlow;\nconst f = 1.0 / period;\nconst duty = (thigh / period) * 100.0;\nconsole.log(\`Freq: \${f.toFixed(1)} Hz, Period: \${(period * 1000).toFixed(2)} ms, Thigh: \${(thigh * 1000).toFixed(2)} ms, Tlow: \${(tlow * 1000).toFixed(2)} ms, Duty: \${duty.toFixed(1)}%\`);`,
      "circ-555-timer-obj",
      "Compute 555 timer RC charge/discharge timings and oscillator frequency.",
      [
        "thigh = 0.693 * (R1 + R2) * C.",
        "tlow = 0.693 * R2 * C.",
        "period = thigh + tlow. f = 1 / period. Duty = (thigh / period) * 100.",
      ],
      "Developing",
      `// 555 Astable timer calculator\nconst r1 = 4700.0, r2 = 10000.0, c = 1e-7;\n\n// TODO: Calculate f, period, thigh, tlow, duty and log output\n`,
      [
        {
          id: "tc-555-timing",
          label: "Verifies 555 timer frequency ~ 584 Hz and ~ 59.5% duty cycle",
          expectedStdout: "Freq: 584.2 Hz, Period: 1.71 ms, Thigh: 1.02 ms, Tlow: 0.69 ms, Duty: 59.5%\n",
        },
        {
          id: "tc-555-duty-greater-50",
          label: "Confirms standard astable duty cycle strictly exceeds 50%",
          expectedStdout: "Freq: 584.2 Hz, Period: 1.71 ms, Thigh: 1.02 ms, Tlow: 0.69 ms, Duty: 59.5%\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why must resistor R1 never be 0 ohms in a standard 555 astable circuit?",
      "When the discharge transistor turns ON, Pin 7 connects directly to ground. If R1 were 0 ohms, the Vcc supply would short-circuit directly to ground through Pin 7, destroying the chip.",
    ),
  },

  {
    id: "circuits-transformer-three-phase",
    order: 10,
    title: "Ideal Transformers & Three-Phase Star/Delta Power Distribution",
    summary: "Calculate voltage transformation ratios, impedance reflection, and line vs. phase relationships in 3-phase AC networks.",
    type: "interactive-simulation",
    objectiveIds: ["circ-transformer-3ph-obj"],
    prerequisiteLessonIds: ["circuits-555-timer-multivibrators"],
    estimatedDurationMinutes: 40,
    content: `Large-scale electric power distribution relies on transformers and 3-phase AC networks to transmit high power across continents with minimal transmission line $I^2 R$ loss.

### The Ideal Transformer
An ideal transformer operates via mutual electromagnetic induction between primary ($N_p$) and secondary ($N_s$) windings sharing a common magnetic core:

$$\\text{Turns Ratio } a = \\frac{N_p}{N_s} = \\frac{V_p}{V_s} = \\frac{I_s}{I_p}$$

#### Impedance Reflection
A load impedance $Z_L$ connected to the secondary appears at the primary terminals multiplied by the square of the turns ratio:
$$Z_p = a^2 Z_L = \\left( \\frac{N_p}{N_s} \\right)^2 Z_L$$
This impedance-matching principle is fundamental in audio amplifiers and RF antenna systems.

### Three-Phase Power Systems
Three-phase AC power consists of three sinusoidal voltages of identical frequency and amplitude, displaced from each other by $120^\\circ$ ($e^{j 0^\\circ}, e^{-j 120^\\circ}, e^{j 120^\\circ}$).

#### 1. Star (Wye, Y) Configuration
Phases connect to a common neutral point:
- **Line-to-Line Voltage**: $V_{LL} = \\sqrt{3} \\times V_{\\text{phase}} \\approx 1.732 \\times V_{\\text{phase}}$
- **Line Current**: $I_{\\text{line}} = I_{\\text{phase}}$
(Example: Indian/European mains has $230\\text{ V}$ phase-to-neutral, producing $\\sqrt{3} \\times 230\\text{ V} = 400\\text{ V}$ line-to-line).

#### 2. Delta ($\\Delta$) Configuration
Phases connect in a closed triangle without a neutral conductor:
- **Line Voltage**: $V_{LL} = V_{\\text{phase}}$
- **Line Current**: $I_{\\text{line}} = \\sqrt{3} \\times I_{\\text{phase}}$

#### 3. Total Three-Phase Power
Regardless of Star or Delta configuration, total real electrical power is:
$$P_{3\\phi} = \\sqrt{3} \\times V_{LL} \\times I_{\\text{line}} \\times \\cos \\theta$$`,
    theorySections: [
      {
        id: "three-phase-advantages",
        title: "Advantages of Three-Phase Over Single-Phase",
        content: "1. Constant Instantaneous Power: Total power delivered by a balanced 3-phase supply is constant in time, eliminating torque pulsation and mechanical vibration in heavy industrial motors. 2. Conductor Economy: A 3-phase line transmits 3x the power of single-phase using only 1.5x the conductor copper mass.",
      },
      {
        id: "transformer-dot-convention",
        title: "Dot Convention for Polarity",
        content: "The dot convention marks terminals that share identical instantaneous AC polarity due to mutual flux coupling. When current enters the dotted terminal of one winding, it induces a positive voltage at the dotted terminal of the other winding.",
      },
    ],
    codeExamples: [
      {
        title: "C Transformer and Three-Phase Power System Analyzer",
        language: "c",
        code: `#include <stdio.h>
#include <math.h>

int main(void) {
    // 1. Transformer impedance reflection
    double np = 500.0, ns = 50.0; // 10:1 step-down
    double z_load = 8.0;          // 8 Ohm loudspeaker
    double a = np / ns;
    double z_primary = a * a * z_load;
    
    // 2. Three-Phase Star System
    double v_phase = 230.0;
    double v_line = sqrt(3.0) * v_phase;
    double i_line = 15.0;         // 15 A motor load
    double pf = 0.85;             // cos(theta)
    double p_total = sqrt(3.0) * v_line * i_line * pf;
    
    printf("Reflected Z: %.0f Ohm | 3-Phase: Vline = %.1f V, Ptotal = %.2f kW\\n",
           z_primary, v_line, p_total / 1000.0);
    return 0;
}`,
        description: "Computes transformer reflected impedance and 3-phase active power in C.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Three-Phase Star/Delta & Transformers",
      description: "Interactive line vs phase voltage waveforms with 120° phase displacements.",
      config: { mode: "analog" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Reflected Z: 800 Ohm | 3-Phase: Vline = 398.4 V, Ptotal = 8.80 kW\n"),
    exercise: exercise(
      "ex-circ-3phase-transformer",
      "Calculate Transformer Reflected Impedance and 3-Phase Power",
      "For a transformer with Np = 500, Ns = 50, and secondary load Zload = 8 ohms, compute reflected primary impedance Zp. For a 3-phase Star network with Vphase = 230V, Iline = 15A, and PF = 0.85, calculate Vline in Volts and total power Ptotal in kW. Print: 'Reflected Z: {zp} Ohm | 3-Phase: Vline = {vline} V, Ptotal = {ptotal} kW' with Zp to 0 decimals, Vline to 1 decimal, and Ptotal to 2 decimals.",
      `const np = 500.0, ns = 50.0, z_load = 8.0;\nconst a = np / ns;\nconst zp = a * a * z_load;\nconst v_phase = 230.0, i_line = 15.0, pf = 0.85;\nconst vline = Math.sqrt(3.0) * v_phase;\nconst ptotal = (Math.sqrt(3.0) * vline * i_line * pf) / 1000.0;\nconsole.log(\`Reflected Z: \${zp.toFixed(0)} Ohm | 3-Phase: Vline = \${vline.toFixed(1)} V, Ptotal = \${ptotal.toFixed(2)} kW\`);`,
      "circ-transformer-3ph-obj",
      "Compute impedance reflection and balanced 3-phase Star line voltage and power.",
      [
        "a = Np / Ns. Zp = a^2 * Zload.",
        "Vline = sqrt(3) * Vphase.",
        "Ptotal = sqrt(3) * Vline * Iline * PF / 1000 (for kW).",
      ],
      "Developing",
      `// Transformer and 3-phase power calculator\nconst np = 500.0, ns = 50.0, z_load = 8.0;\nconst v_phase = 230.0, i_line = 15.0, pf = 0.85;\n\n// TODO: Calculate Zp, Vline, and Ptotal in kW and log output\n`,
      [
        {
          id: "tc-3phase-calc",
          label: "Verifies transformer reflected impedance and 3-phase power",
          expectedStdout: "Reflected Z: 800 Ohm | 3-Phase: Vline = 398.4 V, Ptotal = 8.80 kW\n",
        },
        {
          id: "tc-3phase-vline",
          label: "Verifies line voltage is sqrt(3) times phase voltage",
          expectedStdout: "Reflected Z: 800 Ohm | 3-Phase: Vline = 398.4 V, Ptotal = 8.80 kW\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why is the neutral current zero in a perfectly balanced three-phase Star system?",
      "Because the three return phase currents have identical amplitudes displaced by 120°, and the vector sum of three symmetric 120° phasors cancels to exactly zero.",
    ),
  },
];

export const circuitsEeeCorePath: LearningCourse = {
  id: "circuits-eee-core",
  subjectId: circuitsEeeCoreSubject.id,
  title: "Circuit Theory & Analog Systems Mastery",
  description: "From multi-mesh KVL/KCL and Thevenin equivalents to AC phasors, RLC resonance, diode rectifiers, transistor biasing, op-amps, and active filters.",
  level: "Developing",
  version: "1.0.0",
  prerequisites: [
    "Basic Ohm's Law and DC circuit intuition.",
    "High school algebra, trigonometry, and complex numbers.",
  ],
  objectives: circuitsEeeCoreObjectives,
  learningOutcomes: [
    "Formulate and solve multi-mesh loop currents and nodal voltages using matrix Cramer's rule.",
    "Synthesize Thevenin and Norton equivalent networks and calculate Maximum Power Transfer conditions.",
    "Determine resonant frequency, damping ratio, and oscillatory transient response in series RLC networks.",
    "Resolve AC complex impedance, power triangles, and power factor correction using complex phasors.",
    "Calculate bridge rectifier DC output voltages, diode PIV ratings, and filter ripple factors.",
    "Design stable BJT voltage-divider Q-points and compute AC small-signal Common-Emitter voltage gain.",
    "Apply operational amplifier golden rules to inverting, non-inverting, and buffer circuits.",
    "Design second-order Sallen-Key active Butterworth low-pass and high-pass filters.",
    "Calculate precision timing, frequency, and duty cycle for NE555 astable multivibrators.",
    "Analyze transformer impedance reflection and balanced 3-phase Star and Delta power systems.",
  ],
  estimatedDurationMinutes: 480,
  publicationStatus: "published",
  modules: [
    moduleData(
      "mod-circ-dc-theorems",
      1,
      "Network Theorems & DC Loop Analysis",
      "Kirchhoff's Laws (KVL/KCL), 2-mesh matrix solutions, Thevenin/Norton equivalents, and Maximum Power Transfer.",
      circuitsEeeCoreLessons.slice(0, 2),
    ),
    moduleData(
      "mod-circ-ac-resonance",
      2,
      "AC Sinusoidal Steady State & Resonant Dynamics",
      "Second-order series RLC transient ringing, damping regimes, AC complex phasors, and power factor correction.",
      circuitsEeeCoreLessons.slice(2, 4),
    ),
    moduleData(
      "mod-circ-diodes-transistors",
      3,
      "Semiconductor Diodes & Transistor Biasing",
      "PN junction forward drops, full-wave bridge rectification, capacitor ripple reduction, and BJT Common-Emitter Q-points.",
      circuitsEeeCoreLessons.slice(4, 6),
    ),
    moduleData(
      "mod-circ-opamps-filters",
      4,
      "Linear Integrated Circuits & Operational Amplifiers",
      "Ideal op-amp golden rules, virtual ground, inverting/non-inverting gains, and second-order Sallen-Key active filters.",
      circuitsEeeCoreLessons.slice(6, 8),
    ),
    moduleData(
      "mod-circ-timers-power",
      5,
      "Timing Generators & Industrial Power Distribution",
      "NE555 precision timer astable multivibrators, transformer impedance reflection, and 3-phase Star/Delta networks.",
      circuitsEeeCoreLessons.slice(8, 10),
    ),
  ],
};
