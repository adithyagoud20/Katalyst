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

export const engineeringCareerPrepSubject: LearningSubject = {
  id: "engineering-career-prep-subject",
  title: "Engineering Career & GATE Practice",
  description: "Master high-yield GATE (EEE, ECE, CS) technical questions, core embedded systems hardware interview diagnostics, circuit theorems, and real-time RTOS concurrency.",
};

export const engineeringCareerPrepObjectives: LearningObjective[] = [
  { id: "career-gate-eee-obj", title: "Solve two-port network transmission parameters and symmetrical components for balanced/unbalanced 3-phase networks." },
  { id: "career-gate-ece-obj", title: "Evaluate continuous convolution integrals, Z-transform regions of convergence, and CMOS propagation delays." },
  { id: "career-gate-cs-obj", title: "Apply the Master Theorem to divide-and-conquer recurrences and calculate virtual memory two-level page table lookups." },
  { id: "career-embedded-c-obj", title: "Answer rigorous embedded C interview questions: volatile qualifiers, register bitfields, and interrupt reentrancy." },
  { id: "career-psu-machines-obj", title: "Analyze induction motor slip-torque curves, transformer voltage regulation, and DC machine speed control." },
  { id: "career-digital-timing-obj", title: "Calculate digital flip-flop setup/hold time slacks, maximum clock frequencies, and clock skew margins." },
  { id: "career-rtos-concurrency-obj", title: "Diagnose priority inversion hazards and evaluate priority inheritance protocols in RTOS task scheduling." },
  { id: "career-formula-drill-obj", title: "Solve high-yield engineering formulas spanning network theorems, Shannon capacity, and algorithmic time complexity." },
];

function exercise(
  id: string,
  title: string,
  prompt: string,
  solution: string,
  objectiveId: string,
  expectedOutcome: string,
  hints: string[],
  difficulty: LearningDifficulty = "Applied",
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

export const engineeringCareerPrepLessons: LearningLesson[] = [
  // 1. GATE EEE: Two-Port Networks & Symmetrical Faults
  {
    id: "career-gate-eee-circuits",
    order: 1,
    title: "GATE EEE: Two-Port Networks & Symmetrical Components",
    summary: "Derive ABCD transmission matrices, reciprocity constraints, and 3-phase Fortescue sequence networks.",
    type: "interactive-simulation",
    objectiveIds: ["career-gate-eee-obj"],
    prerequisiteLessonIds: [],
    estimatedDurationMinutes: 45,
    content: `Two-port networks and Fortescue symmetrical components represent two of the highest-yield subjects in the GATE Electrical Engineering examination.

### Two-Port Transmission (ABCD) Parameters
For a two-port electrical network relating input port $(V_1, I_1)$ to output port $(V_2, I_2)$ where $I_2$ flows outwards:
$$\\begin{bmatrix} V_1 \\\\ I_1 \\end{bmatrix} = \\begin{bmatrix} A & B \\\\ C & D \\end{bmatrix} \\begin{bmatrix} V_2 \\\\ I_2 \\end{bmatrix}$$
- **Condition for Reciprocity**:
  $$AD - BC = 1$$
- **Condition for Symmetry**:
  $$A = D$$

### Symmetrical Components (Fortescue Theorem)
Any unbalanced 3-phase system of phasors $(V_a, V_b, V_c)$ can be uniquely decomposed into 3 balanced symmetrical components:
1. **Positive Sequence ($V_1$)**: Same phase sequence ($a-b-c$) as original generator.
2. **Negative Sequence ($V_2$)**: Reversed phase sequence ($a-c-b$).
3. **Zero Sequence ($V_0$)**: Identical magnitude and phase in all 3 lines ($V_{a0} = V_{b0} = V_{c0}$).
$$V_{a0} = \\frac{1}{3}(V_a + V_b + V_c)$$`,
    theorySections: [
      {
        id: "reciprocity-derivation",
        title: "Two-Port Reciprocity Condition",
        content: "A network containing only linear passive bilateral components (resistors, inductors, capacitors) is reciprocal: Z12 = Z21, Y12 = Y21, and AD - BC = 1.",
      },
      {
        id: "ground-fault-zero-seq",
        title: "Single Line-to-Ground (SLG) Fault Sequence Network",
        content: "In an SLG fault on Phase A to ground, the positive, negative, and zero sequence networks are connected in series: Ia1 = Ia2 = Ia0 = E_a / (Z1 + Z2 + Z0 + 3Zn).",
      },
    ],
    codeExamples: [
      {
        title: "C ABCD Matrix Determinant Verifier",
        language: "c",
        code: `#include <stdio.h>
#include <stdbool.h>
#include <math.h>

bool isReciprocal(double a, double b, double c, double d) {
    double det = a * d - b * c;
    return fabs(det - 1.0) < 1e-6;
}

int main(void) {
    printf("RECIPROCAL: %s\\n", isReciprocal(2.0, 3.0, 1.0, 2.0) ? "TRUE" : "FALSE");
    return 0;
}`,
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Two-Port Network Parameter Solver",
      description: "Inspect port voltage-current relationships and verify ABCD transmission reciprocity.",
      config: { mode: "analog" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("RECIPROCAL: TRUE\n"),
    exercise: exercise(
      "ex-career-gate-eee-circuits",
      "Two-Port Reciprocity Checker",
      "Given transmission parameters A = 2.0, B = 3.0, C = 1.0, D = 2.0: compute det = A * D - B * C. If Math.abs(det - 1.0) < 1e-5, log 'RECIPROCAL: TRUE', otherwise log 'RECIPROCAL: FALSE'.",
      `const a = 2.0, b = 3.0, c = 1.0, d = 2.0;\nconst det = a * d - b * c;\nconst rec = Math.abs(det - 1.0) < 1e-5;\nconsole.log(\`RECIPROCAL: \${rec ? "TRUE" : "FALSE"}\`);`,
      "career-gate-eee-obj",
      "Verifies reciprocity condition AD - BC = 1.",
      [
        "Compute det = a * d - b * c.",
        "Check Math.abs(det - 1.0) < 1e-5.",
        "Log RECIPROCAL: TRUE.",
      ],
      "Applied",
      `// Two-port reciprocity verifier\nconst a = 2.0, b = 3.0, c = 1.0, d = 2.0;\n\n// TODO: Compute determinant and log reciprocity status\n`,
      [
        {
          id: "tc-gate-eee-recip",
          label: "Verifies reciprocity for A=2, B=3, C=1, D=2 (2*2 - 3*1 = 1)",
          expectedStdout: "RECIPROCAL: TRUE\n",
        },
        {
          id: "tc-gate-eee-determinant",
          label: "Confirms AD - BC equals unity",
          expectedStdout: "RECIPROCAL: TRUE\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "What is the physical interpretation of the A parameter in a two-port ABCD transmission matrix?",
      "A = V1 / V2 when I2 = 0, which is the open-circuit reverse voltage ratio.",
    ),
  },

  // 2. GATE ECE: Signals, Z-Transform ROC & CMOS Inverter Delays
  {
    id: "career-gate-ece-signals",
    order: 2,
    title: "GATE ECE: Z-Transform ROC & CMOS Propagation Delays",
    summary: "Analyze discrete poles, region of convergence stability, and CMOS digital inverter delay metrics.",
    type: "interactive-simulation",
    objectiveIds: ["career-gate-ece-obj"],
    prerequisiteLessonIds: ["career-gate-eee-circuits"],
    estimatedDurationMinutes: 45,
    content: `# GATE ECE: Z-Transform ROC & CMOS Propagation Delays

Digital signal processing and digital VLSI design form foundational pillars of the GATE Electronics and Communication Engineering syllabus.

### Discrete Z-Transform & Region of Convergence (ROC)
The bilateral Z-transform of sequence $x[n]$ is defined as:
$$X(z) = \\sum_{n=-\\infty}^{\\infty} x[n] z^{-n}$$
- **Causality**: The ROC is the exterior of a circle bounded by the outermost pole ($|z| > r_{\\max}$).
- **Stability (BIBO)**: The system is stable if and only if the ROC includes the unit circle ($|z| = 1$).
- **Right-sided sequence $a^n u[n]$**: $X(z) = \\frac{1}{1 - a z^{-1}}$ with $\\text{ROC}: |z| > |a|$. Stable if $|a| < 1$.

### CMOS Inverter Propagation Delay ($t_{pd}$)
Propagation delay is determined by charging and discharging load capacitance $C_L$:
$$t_{pd} = \\frac{t_{pHL} + t_{pLH}}{2} \\approx \\frac{C_L V_{DD}}{2 I_{\\text{sat}}}$$
Where $t_{pHL}$ is high-to-low delay governed by the NMOS pull-down network, and $t_{pLH}$ is low-to-high delay governed by the PMOS pull-up network.`,
    theorySections: [
      {
        id: "roc-properties",
        title: "ROC Convergence Properties",
        content: "1. The ROC cannot contain any poles. 2. If x[n] is finite duration, the ROC is the entire z-plane except possibly z = 0 or z = infinity.",
      },
      {
        id: "cmos-sizing-ratio",
        title: "CMOS Sizing for Equal Rise and Fall Times",
        content: "Because hole mobility in silicon is 2 to 3 times lower than electron mobility (mu_n ≈ 2.5 * mu_p), symmetric delays require PMOS channel width to be 2 to 3 times wider than NMOS width (W_p / W_n ≈ 2.5).",
      },
    ],
    codeExamples: [
      {
        title: "C Z-Transform Pole Stability Evaluator",
        language: "c",
        code: `#include <stdio.h>
#include <math.h>

void checkStability(double poleMag) {
    if (poleMag < 1.0) printf("STABLE: YES, RADIUS: %.2f\\n", poleMag);
    else printf("STABLE: NO, RADIUS: %.2f\\n", poleMag);
}

int main(void) {
    checkStability(0.75);
    return 0;
}`,
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Z-Plane Pole-Zero Visualizer",
      description: "Inspect discrete pole locations relative to the unit circle and observe impulse responses.",
      config: { mode: "fft" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("STABLE: YES, RADIUS: 0.75\n"),
    exercise: exercise(
      "ex-career-gate-ece-signals",
      "Z-Transform Pole Stability Tester",
      "Given poleMag = 0.75: if poleMag < 1.0, log 'STABLE: YES, RADIUS: {poleMag.toFixed(2)}', else log 'STABLE: NO, RADIUS: {poleMag.toFixed(2)}'. Write the check.",
      `const poleMag = 0.75;\nconst stable = poleMag < 1.0;\nconsole.log(\`STABLE: \${stable ? "YES" : "NO"}, RADIUS: \${poleMag.toFixed(2)}\`);`,
      "career-gate-ece-obj",
      "Confirms system stability condition that poles lie strictly inside the unit circle.",
      [
        "Check poleMag < 1.0.",
        "Format radius with toFixed(2).",
        "Log formatted string.",
      ],
      "Applied",
      `// Z-plane pole stability check\nconst poleMag = 0.75;\n\n// TODO: Check if pole is inside unit circle and log string\n`,
      [
        {
          id: "tc-gate-ece-stable",
          label: "Verifies pole inside unit circle is strictly BIBO stable",
          expectedStdout: "STABLE: YES, RADIUS: 0.75\n",
        },
        {
          id: "tc-gate-ece-radius",
          label: "Confirms radius formatting to 2 decimal places",
          expectedStdout: "STABLE: YES, RADIUS: 0.75\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why must the ROC of a stable continuous system include the imaginary jw axis in the s-plane?",
      "Because the continuous Fourier transform X(jw) is the Laplace transform evaluated along the imaginary axis.",
    ),
  },

  // 3. GATE CS: Master Theorem & Virtual Memory Address Translation
  {
    id: "career-gate-cs-algorithms",
    order: 3,
    title: "GATE CS: Master Theorem & Virtual Memory Paging",
    summary: "Solve recurrence relations using Master Theorem and calculate two-level page table physical addresses.",
    type: "interactive-simulation",
    objectiveIds: ["career-gate-cs-obj"],
    prerequisiteLessonIds: ["career-gate-ece-signals"],
    estimatedDurationMinutes: 45,
    content: `# GATE CS: Master Theorem & Virtual Memory Paging

Algorithmic complexity analysis and operating system memory architecture feature heavily in every GATE Computer Science exam.

### The Master Theorem for Recurrences
For recurrences of the form:
$$T(n) = a T\\left(\\frac{n}{b}\\right) + f(n)$$
Where $a \\ge 1, b > 1$. Let $c = \\log_b a$:
1. **Case 1**: If $f(n) = O(n^{c - \\epsilon})$ for $\\epsilon > 0$, then $T(n) = \\Theta(n^c)$.
2. **Case 2**: If $f(n) = \\Theta(n^c \\log^k n)$ for $k \\ge 0$, then $T(n) = \\Theta(n^c \\log^{k+1} n)$.
3. **Case 3**: If $f(n) = \\Omega(n^{c + \\epsilon})$ for $\\epsilon > 0$ and regularity condition $a f(n/b) \\le d f(n)$ holds, then $T(n) = \\Theta(f(n))$.

### Virtual Memory Paging (Two-Level Page Table)
In a 32-bit virtual memory system with $4\\text{ KB}$ ($2^{12}\\text{ bytes}$) page size:
- Offset: 12 bits ($2^{12} = 4096$).
- Virtual Page Number (VPN): $32 - 12 = 20$ bits.
- Split into two levels: 10-bit Page Directory Index (PDI) + 10-bit Page Table Index (PTI).
- Physical Address = $(\\text{Frame Number} \\times \\text{Page Size}) + \\text{Offset}$.`,
    theorySections: [
      {
        id: "merge-sort-recurrence",
        title: "Merge Sort Recurrence Analysis",
        content: "Merge sort divides input into 2 halves and merges in linear time: T(n) = 2T(n/2) + O(n). Here a = 2, b = 2, c = log2(2) = 1. Since f(n) = Theta(n^1), Case 2 applies with k = 0, yielding T(n) = Theta(n log n).",
      },
      {
        id: "tlb-hit-ratio",
        title: "Effective Memory Access Time (EMAT) with TLB",
        content: "EMAT = h * (t_tlb + t_mem) + (1 - h) * (t_tlb + 2 * t_mem), where h is the TLB hit ratio and t_mem is memory access latency.",
      },
    ],
    codeExamples: [
      {
        title: "C Virtual Address Translation",
        language: "c",
        code: `#include <stdio.h>

void translateAddress(unsigned int vaddr, unsigned int frame) {
    unsigned int offset = vaddr & 0xFFF; // 12-bit offset for 4KB page
    unsigned int paddr = (frame << 12) | offset;
    printf("PHYSICAL: 0x%08X\\n", paddr);
}

int main(void) {
    translateAddress(0x00401234, 0x05);
    return 0;
}`,
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Algorithmic Complexity & Pointer Tracer",
      description: "Inspect data structures and verify asymptotic memory access bounds.",
      config: { mode: "dsa" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("PHYSICAL: 0x00005234\n"),
    exercise: exercise(
      "ex-career-gate-cs-algorithms",
      "Virtual to Physical Address Translation",
      "Given virtual address vaddr = 0x00401234 and physical frame = 0x05 for a 4KB (12-bit offset) page: extract offset = vaddr & 0xFFF, compute paddr = (frame << 12) | offset. Log: 'PHYSICAL: 0x{hex8}' with paddr formatted as 8-character uppercase hex padded with leading zeros.",
      `const vaddr = 0x00401234, frame = 0x05;\nconst offset = vaddr & 0xFFF;\nconst paddr = (frame << 12) | offset;\nconst hex = paddr.toString(16).toUpperCase().padStart(8, "0");\nconsole.log(\`PHYSICAL: 0x\${hex}\`);`,
      "career-gate-cs-obj",
      "Translates virtual address offset and frame into physical address.",
      [
        "Compute offset using vaddr & 0xFFF.",
        "Shift frame left by 12 and bitwise OR with offset.",
        "Use .toString(16).toUpperCase().padStart(8, '0').",
      ],
      "Applied",
      `// Address translation solver\nconst vaddr = 0x00401234, frame = 0x05;\n\n// TODO: Calculate physical address and log PHYSICAL: 0xHEX string\n`,
      [
        {
          id: "tc-gate-cs-paddr",
          label: "Verifies correct frame substitution preserving 12-bit offset 0x234",
          expectedStdout: "PHYSICAL: 0x00005234\n",
        },
        {
          id: "tc-gate-cs-padding",
          label: "Confirms 8-digit hexadecimal uppercase padding",
          expectedStdout: "PHYSICAL: 0x00005234\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why does a two-level page table reduce overall memory consumption compared to a single-level page table?",
      "Page table entries for unallocated virtual address ranges do not need to be instantiated in physical RAM.",
    ),
  },

  // 4. Core Embedded Systems Technical Interviews
  {
    id: "career-embedded-interview-c",
    order: 4,
    title: "Core Embedded Systems: Volatile, Bitfields & Reentrancy",
    summary: "Master volatile qualifier semantics, hardware memory-mapped register bit-flipping, and reentrant ISR code.",
    type: "interactive-simulation",
    objectiveIds: ["career-embedded-c-obj"],
    prerequisiteLessonIds: ["career-gate-cs-algorithms"],
    estimatedDurationMinutes: 45,
    content: `# Core Embedded Systems: Volatile, Bitfields & Reentrancy

Top hardware and firmware companies (Texas Instruments, Qualcomm, Bosch, ARM, Intel) rigorously quiz embedded software candidates on pointer semantics, memory barriers, and race conditions.

### The \`volatile\` Type Qualifier
Tells the optimizing compiler that a variable's value can change at any instant outside the compiler's control (e.g., via hardware peripheral register or concurrent ISR).
- **Required In**:
  1. Memory-mapped peripheral registers (\`#define UART_STAT (*(volatile uint32_t*)0x40001000)\`).
  2. Global variables shared between an Interrupt Service Routine (ISR) and main loop.
  3. Delay loops relying on busy-waiting variables that would otherwise be optimized away.

### Bit Manipulation in Hardware Registers
- **Set Bit $n$**: \`REG |= (1U << n);\`
- **Clear Bit $n$**: \`REG &= ~(1U << n);\`
- **Toggle Bit $n$**: \`REG ^= (1U << n);\`
- **Test Bit $n$**: \`if (REG & (1U << n))\`

### Reentrant Functions
A function is reentrant if it can be safely interrupted in mid-execution and re-entered by another thread or ISR without data corruption. Reentrant functions:
- Do NOT use \`static\` or global non-const variables.
- Do NOT call non-reentrant functions (e.g., \`malloc\`, \`printf\`).
- Work strictly with local stack variables or caller-supplied buffers.`,
    theorySections: [
      {
        id: "compiler-dead-code-elimination",
        title: "Compiler Optimization without Volatile",
        content: "Without volatile, a loop like 'while (!flag);' where flag is modified by an ISR will be optimized by GCC to 'if (!flag) while(1);', causing an infinite hang because the compiler caches flag in a CPU register.",
      },
      {
        id: "atomic-read-modify-write",
        title: "Atomic Read-Modify-Write Hazards",
        content: "Bit operations like REG |= (1 << 3) compile to three machine instructions: LDR, ORR, STR. If an ISR fires between LDR and STR, register updates made by the ISR will be overwritten.",
      },
    ],
    codeExamples: [
      {
        title: "C Bitmask Clear and Set",
        language: "c",
        code: `#include <stdio.h>
#include <stdint.h>

uint8_t modifyRegister(uint8_t reg, int bit, int val) {
    if (val) reg |= (1U << bit);
    else reg &= ~(1U << bit);
    return reg;
}

int main(void) {
    uint8_t reg = 0b00001111;
    reg = modifyRegister(reg, 2, 0); // Clear bit 2
    printf("REG: 0x%02X\\n", reg);
    return 0;
}`,
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Register Bitfield & IO Inspector",
      description: "Test bit-setting, clearing, and mask operations on simulated microcontroller registers.",
      config: { mode: "toycpu" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("REG: 0x0B\n"),
    exercise: exercise(
      "ex-career-embedded-interview-c",
      "Register Bit Modification",
      "Given reg = 0x0F (binary 00001111): clear bit 2 using `reg & ~(1 << 2)`. Format the result as 2-character uppercase hex padded with leading zeros. Log: 'REG: 0x{hex}'.",
      `let reg = 0x0F;\nreg &= ~(1 << 2);\nconst hex = reg.toString(16).toUpperCase().padStart(2, "0");\nconsole.log(\`REG: 0x\${hex}\`);`,
      "career-embedded-c-obj",
      "Accurately clears specified bit in hardware register.",
      [
        "Compute reg &= ~(1 << 2).",
        "0x0F is 15. Clearing bit 2 (value 4) yields 11 (0x0B).",
        "Log REG: 0x0B.",
      ],
      "Applied",
      `// Hardware bitwise register modifier\nlet reg = 0x0F;\n\n// TODO: Clear bit 2 and log formatted REG: 0xHEX string\n`,
      [
        {
          id: "tc-embedded-clear-bit",
          label: "Verifies clearing bit 2 from 0x0F yields 0x0B",
          expectedStdout: "REG: 0x0B\n",
        },
        {
          id: "tc-embedded-hex-pad",
          label: "Confirms two-digit uppercase hex formatting",
          expectedStdout: "REG: 0x0B\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Can a variable be both const and volatile simultaneously in C?",
      "Yes. A read-only hardware status register (e.g., const volatile uint32_t *uart_rx) changes externally by hardware, but software code is forbidden from writing to it.",
    ),
  },

  // 5. PSU & Core Industry: Electric Machines & Transformers
  {
    id: "career-psu-power-machines",
    order: 5,
    title: "PSU Core Engineering: Induction Motors & Transformers",
    summary: "Calculate 3-phase induction motor synchronous speed, slip, and transformer voltage regulation.",
    type: "interactive-simulation",
    objectiveIds: ["career-psu-machines-obj"],
    prerequisiteLessonIds: ["career-embedded-interview-c"],
    estimatedDurationMinutes: 40,
    content: `# PSU Core Engineering: Induction Motors & Transformers

Public Sector Undertakings (BHEL, NTPC, ONGC, PowerGrid, IOCL) emphasize rotating electric machinery, electromagnetic conversion, and substation transformer operations in their recruitment interviews.

### 3-Phase Induction Motor Speed & Slip
Stator windings supplied with balanced 3-phase AC create a rotating magnetic field (RMF) spinning at synchronous speed:
$$N_s = \\frac{120 f}{P}\\quad\\text{[RPM]}$$
Where $f$ is supply frequency (typically $50\\text{ Hz}$ in India) and $P$ is pole count.
- **Rotor Slip ($s$)**:
  $$s = \\frac{N_s - N_r}{N_s}$$
- **Rotor Speed ($N_r$)**:
  $$N_r = N_s (1 - s)$$
- **Rotor Frequency ($f_r$)**:
  $$f_r = s f$$

### Transformer Voltage Regulation
Voltage regulation quantifies the change in terminal voltage from no-load to full-load:
$$\\%\\text{VR} = \\frac{V_{\\text{no-load}} - V_{\\text{full-load}}}{V_{\\text{full-load}}} \\times 100$$
For lagging power factor $\\cos\\phi$:
$$\\%\\text{VR} \\approx \\frac{I (R_{eq} \\cos\\phi + X_{eq} \\sin\\phi)}{V_2} \\times 100$$`,
    theorySections: [
      {
        id: "torque-slip-curve",
        title: "Induction Motor Breakdown Torque",
        content: "Maximum (breakdown) torque is independent of rotor resistance, but the slip at which maximum torque occurs is directly proportional to rotor resistance (s_maxT = R2 / X2).",
      },
      {
        id: "transformer-efficiency-max",
        title: "Maximum Efficiency Condition",
        content: "A transformer operates at maximum efficiency when variable copper losses (I^2 * R) equal fixed core iron losses (P_cu = P_iron).",
      },
    ],
    codeExamples: [
      {
        title: "C Induction Motor Slip Calculator",
        language: "c",
        code: `#include <stdio.h>

void calculateMotor(double f, int p, double nr) {
    double ns = (120.0 * f) / p;
    double s = (ns - nr) / ns;
    printf("NS: %.0f RPM, SLIP: %.3f\\n", ns, s);
}

int main(void) {
    calculateMotor(50.0, 4, 1440.0);
    return 0;
}`,
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Three-Phase Power & Transformer Studio",
      description: "Analyze balanced 3-phase Star/Delta voltages and transformer regulation.",
      config: { mode: "analog" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("NS: 1500 RPM, SLIP: 0.040\n"),
    exercise: exercise(
      "ex-career-psu-power-machines",
      "Induction Motor Speed & Slip Solver",
      "Given frequency f = 50 Hz, poles P = 4, and rotor speed Nr = 1440 RPM: compute synchronous speed Ns = (120 * f) / P, and slip s = (Ns - Nr) / Ns. Log: 'NS: {Ns} RPM, SLIP: {s.toFixed(3)}'.",
      `const f = 50, P = 4, Nr = 1440;\nconst Ns = (120 * f) / P;\nconst s = (Ns - Nr) / Ns;\nconsole.log(\`NS: \${Ns} RPM, SLIP: \${s.toFixed(3)}\`);`,
      "career-psu-machines-obj",
      "Calculates synchronous speed and fractional motor slip.",
      [
        "Compute Ns = (120 * f) / P.",
        "Compute s = (Ns - Nr) / Ns.",
        "Format slip with toFixed(3).",
      ],
      "Applied",
      `// Induction motor solver\nconst f = 50, P = 4, Nr = 1440;\n\n// TODO: Compute Ns and slip s and log formatted output\n`,
      [
        {
          id: "tc-psu-slip-calc",
          label: "Verifies 1500 RPM synchronous speed and 4% slip for 4-pole motor at 1440 RPM",
          expectedStdout: "NS: 1500 RPM, SLIP: 0.040\n",
        },
        {
          id: "tc-psu-speed-formula",
          label: "Confirms Ns = 120f / P relationship",
          expectedStdout: "NS: 1500 RPM, SLIP: 0.040\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why can an induction motor never run at synchronous speed (Nr = Ns) under motor action?",
      "If Nr = Ns, relative speed is zero, so no EMF is induced in rotor bars, producing zero torque.",
    ),
  },

  // 6. VLSI & Digital Timing: Setup/Hold Slack & Clock Skew
  {
    id: "career-digital-timing-fsm",
    order: 6,
    title: "VLSI Digital Timing: Setup Time, Hold Time & Clock Skew",
    summary: "Calculate flip-flop timing slacks, maximum clock frequency, and hold time race violations.",
    type: "interactive-simulation",
    objectiveIds: ["career-digital-timing-obj"],
    prerequisiteLessonIds: ["career-psu-power-machines"],
    estimatedDurationMinutes: 45,
    content: `# VLSI Digital Timing: Setup Time, Hold Time & Clock Skew

Static Timing Analysis (STA) is the core discipline of digital ASIC and FPGA design interviews. Every synchronous register-to-register path must satisfy rigorous setup and hold time constraints.

### Timing Constraints
Consider two flip-flops (FF1 $\\to$ FF2) separated by combinational logic with delay $t_{\\text{comb}}$ and clock skew $T_{\\text{skew}} = T_{clk2} - T_{clk1}$:
1. **Setup Time Constraint ($T_{clk} \\ge T_{\\min}$)**:
   Data launched by FF1 must arrive and stabilize at FF2 before the next clock edge:
   $$T_{clk} \\ge t_{cq} + t_{\\text{comb,\\max}} + t_{\\text{setup}} - T_{\\text{skew}}$$
   - **Setup Slack**:
     $$\\text{Slack}_{\\text{setup}} = T_{clk} - (t_{cq} + t_{\\text{comb,\\max}} + t_{\\text{setup}} - T_{\\text{skew}})$$
   - Must be $\\ge 0$ for correct operation at frequency $f = 1/T_{clk}$.
2. **Hold Time Constraint (Independent of $T_{clk}$)**:
   Data launched by FF1 must NOT race through and corrupt the existing data at FF2 during the current clock edge:
   $$t_{cq} + t_{\\text{comb,\\min}} \\ge t_{\\text{hold}} + T_{\\text{skew}}$$
   - **Hold Slack**:
     $$\\text{Slack}_{\\text{hold}} = (t_{cq} + t_{\\text{comb,\\min}}) - (t_{\\text{hold}} + T_{\\text{skew}})$$
   - Hold violations CANNOT be fixed by slowing down the clock! They require inserting delay buffers into the data path.`,
    theorySections: [
      {
        id: "clock-skew-polarity",
        title: "Positive vs Negative Clock Skew",
        content: "Positive skew (clock arrives at destination FF2 later than launch FF1) helps setup time by granting more time, but hurts hold time. Negative skew hurts setup time.",
      },
      {
        id: "metastability-mtbf",
        title: "Metastability & Two-Flip-Flop Synchronizers",
        content: "Asynchronous inputs violating setup/hold times cause flip-flop outputs to hover at an intermediate voltage (metastable). Adding a dual-flip-flop synchronizer dramatically increases Mean Time Between Failures (MTBF).",
      },
    ],
    codeExamples: [
      {
        title: "C Static Timing Setup Slack Calculator",
        language: "c",
        code: `#include <stdio.h>

void computeTiming(double tclk, double tcq, double tcomb, double tsetup, double tskew) {
    double req = tclk + tskew - tsetup;
    double arr = tcq + tcomb;
    double slack = req - arr;
    printf("SLACK: %.2f ns, STATUS: %s\\n", slack, slack >= 0 ? "MET" : "VIOLATED");
}

int main(void) {
    computeTiming(10.0, 1.5, 5.0, 1.0, 0.5);
    return 0;
}`,
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Sequential Clock & Timing Diagram Rig",
      description: "Inspect clock propagation edges, flip-flop setup windows, and hold intervals.",
      config: { mode: "fsm" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("SLACK: 3.00 ns, STATUS: MET\n"),
    exercise: exercise(
      "ex-career-digital-timing-fsm",
      "Setup Time Slack Analyzer",
      "Given clock period tclk = 10.0 ns, tcq = 1.5 ns, tcomb = 5.0 ns, tsetup = 1.0 ns, and tskew = 0.5 ns: compute required time req = tclk + tskew - tsetup, arrival time arr = tcq + tcomb, and slack = req - arr. Log: 'SLACK: {slack.toFixed(2)} ns, STATUS: {slack >= 0 ? \"MET\" : \"VIOLATED\"}'.",
      `const tclk = 10.0, tcq = 1.5, tcomb = 5.0, tsetup = 1.0, tskew = 0.5;\nconst req = tclk + tskew - tsetup;\nconst arr = tcq + tcomb;\nconst slack = req - arr;\nconsole.log(\`SLACK: \${slack.toFixed(2)} ns, STATUS: \${slack >= 0 ? "MET" : "VIOLATED"}\`);`,
      "career-digital-timing-obj",
      "Calculates setup slack and verifies timing closure.",
      [
        "Compute req = tclk + tskew - tsetup.",
        "Compute arr = tcq + tcomb.",
        "Compute slack = req - arr.",
      ],
      "Applied",
      `// Static timing analysis slack solver\nconst tclk = 10.0, tcq = 1.5, tcomb = 5.0, tsetup = 1.0, tskew = 0.5;\n\n// TODO: Compute setup slack and log formatted string\n`,
      [
        {
          id: "tc-timing-setup-slack",
          label: "Verifies 3.00 ns positive setup slack meets timing",
          expectedStdout: "SLACK: 3.00 ns, STATUS: MET\n",
        },
        {
          id: "tc-timing-status-met",
          label: "Confirms STATUS: MET string formatting",
          expectedStdout: "SLACK: 3.00 ns, STATUS: MET\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why can a hold time violation NOT be resolved by decreasing the system clock frequency?",
      "Both launch and capture occur on the same clock edge, so the clock period Tclk does not appear in the hold equation.",
    ),
  },

  // 7. RTOS Concurrency: Priority Inversion & Deadlocks
  {
    id: "career-embedded-rtos-concurrency",
    order: 7,
    title: "RTOS Concurrency: Priority Inversion & Deadlock",
    summary: "Diagnose priority inversion anomalies, Priority Inheritance Protocols, and dining philosophers deadlocks.",
    type: "interactive-simulation",
    objectiveIds: ["career-rtos-concurrency-obj"],
    prerequisiteLessonIds: ["career-digital-timing-fsm"],
    estimatedDurationMinutes: 45,
    content: `# RTOS Concurrency: Priority Inversion & Deadlock

Real-Time Operating Systems (FreeRTOS, Zephyr, VxWorks) guarantee deterministic task execution. However, improper mutex synchronization can cause catastrophic failures (such as the famous 1997 Mars Pathfinder software reset).

### Unbounded Priority Inversion
Occurs when:
1. Low-priority task ($T_L$) acquires a shared resource mutex $M$.
2. High-priority task ($T_H$) preempts $T_L$ and requests $M \\to$ blocks waiting for $T_L$ to release $M$.
3. Medium-priority task ($T_M$), requiring NO shared resources, preempts $T_L$.
4. **Anomaly**: $T_H$ is indirectly blocked by $T_M$ for an unbounded duration!

### Priority Inheritance Protocol (PIP)
When $T_H$ blocks on a mutex held by $T_L$:
- The RTOS temporarily elevates the priority of $T_L$ to match $T_H$.
- $T_M$ can no longer preempt $T_L$.
- Once $T_L$ releases the mutex, its priority reverts to normal, and $T_H$ unblocks immediately.

### Coffman Deadlock Conditions
A deadlock occurs if and only if all 4 conditions hold simultaneously:
1. **Mutual Exclusion**: Exclusive resource access.
2. **Hold and Wait**: Tasks hold resources while requesting others.
3. **No Preemption**: Resources cannot be forcibly revoked.
4. **Circular Wait**: $T_1$ waits for $T_2$, and $T_2$ waits for $T_1$.`,
    theorySections: [
      {
        id: "mars-pathfinder-incident",
        title: "The Mars Pathfinder 1997 Anomaly",
        content: "A shared information bus mutex between a high-priority attitude control thread and a low-priority meteorological task was preempted by medium-priority communications tasks, triggering watchdog system resets on Mars.",
      },
      {
        id: "deadlock-avoidance-hierarchy",
        title: "Strict Lock Acquisition Hierarchy",
        content: "Enforcing a global lock ordering rule (always acquire Mutex A before Mutex B) breaks Coffman's circular wait condition, mathematically guaranteeing that deadlocks cannot occur.",
      },
    ],
    codeExamples: [
      {
        title: "C Priority Inheritance Logic",
        language: "c",
        code: `#include <stdio.h>

int resolvePriority(int taskPriority, int lockOwnerPriority, int waitingTaskPriority) {
    if (waitingTaskPriority > lockOwnerPriority) {
        return waitingTaskPriority; // Inherit higher priority
    }
    return lockOwnerPriority;
}

int main(void) {
    int inherited = resolvePriority(1, 1, 5); // Task L (prio 1) inherits Task H (prio 5)
    printf("BOOSTED_PRIORITY: %d\\n", inherited);
    return 0;
}`,
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "RTOS Multithreaded Task Scheduler Rig",
      description: "Observe dual-core FreeRTOS task slicing, mutex contention, and priority inheritance.",
      config: { mode: "esp32" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("BOOSTED_PRIORITY: 5\n"),
    exercise: exercise(
      "ex-career-embedded-rtos-concurrency",
      "Priority Inheritance Resolver",
      "Given lowPriorityTask = 1, highPriorityTask = 5: under priority inheritance, when the high-priority task blocks on a mutex owned by the low-priority task, the owner inherits boostedPriority = Math.max(lowPriorityTask, highPriorityTask). Log: 'BOOSTED_PRIORITY: {boostedPriority}'.",
      `const lowPriorityTask = 1, highPriorityTask = 5;\nconst boosted = Math.max(lowPriorityTask, highPriorityTask);\nconsole.log(\`BOOSTED_PRIORITY: \${boosted}\`);`,
      "career-rtos-concurrency-obj",
      "Elevates mutex holder priority to prevent unbounded priority inversion.",
      [
        "Use Math.max(lowPriorityTask, highPriorityTask).",
        "Log BOOSTED_PRIORITY: 5.",
      ],
      "Applied",
      `// Priority inheritance solver\nconst lowPriorityTask = 1, highPriorityTask = 5;\n\n// TODO: Compute inherited priority and log string\n`,
      [
        {
          id: "tc-rtos-pip-boost",
          label: "Verifies priority boost elevates task to priority 5",
          expectedStdout: "BOOSTED_PRIORITY: 5\n",
        },
        {
          id: "tc-rtos-inversion-prevented",
          label: "Confirms medium priority tasks cannot preempt boosted mutex owner",
          expectedStdout: "BOOSTED_PRIORITY: 5\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "What is the difference between a binary semaphore and a mutex in an RTOS?",
      "A mutex has ownership and supports priority inheritance; a semaphore is a signaling mechanism without ownership tracking.",
    ),
  },

  // 8. Comprehensive Formula & Concept Speed Drill
  {
    id: "career-high-yield-formulas",
    order: 8,
    title: "Comprehensive Engineering Formula & Concept Speed Drill",
    summary: "Rapid mathematical mastery: Ohm, Thevenin, Nyquist, Shannon channel capacity, and Big-O notation.",
    type: "interactive-simulation",
    objectiveIds: ["career-formula-drill-obj"],
    prerequisiteLessonIds: ["career-embedded-rtos-concurrency"],
    estimatedDurationMinutes: 40,
    content: `# Comprehensive Engineering Formula & Concept Speed Drill

Speed and conceptual accuracy define competitive technical examinations and live coding rounds. This capstone drill synthesizes essential equations across electrical, electronics, and computer science engineering.

### Formula Reference Summary
1. **Shannon-Hartley Channel Capacity**:
   $$C = B \\log_2\\left(1 + \\frac{S}{N}\\right)\\quad\\text{[bits/second]}$$
   Where $B$ is channel bandwidth in Hz, and $S/N$ is linear signal-to-noise ratio.
2. **Resonant Frequency of LC Tank**:
   $$f_0 = \\frac{1}{2\\pi \\sqrt{L C}}$$
3. **Euler's Identity for Complex Phasors**:
   $$e^{j\\theta} = \\cos\\theta + j\\sin\\theta$$
4. **Ohm's & Joule's Heating**:
   $$P = V I = I^2 R = \\frac{V^2}{R}$$
5. **Op-Amp Inverting vs Non-Inverting Gains**:
   $$A_{v,\\text{inv}} = -\\frac{R_f}{R_{in}},\\quad A_{v,\\text{non}} = 1 + \\frac{R_f}{R_{in}}$$`,
    theorySections: [
      {
        id: "shannon-capacity-limits",
        title: "Theoretical Channel Capacity Limit",
        content: "Even in an infinite bandwidth channel (B -> infinity), capacity is bounded by C_inf = (S / N0) * log2(e) ≈ 1.44 * (S / N0).",
      },
      {
        id: "lc-resonance-impedance",
        title: "Series vs Parallel LC Resonance",
        content: "Series LC exhibits zero impedance (short circuit) at resonance; parallel LC exhibits infinite theoretical impedance (open circuit) at resonance.",
      },
    ],
    codeExamples: [
      {
        title: "C Shannon Channel Capacity Calculator",
        language: "c",
        code: `#include <stdio.h>
#include <math.h>

void computeCapacity(double bw, double snrLinear) {
    double c = bw * (log(1.0 + snrLinear) / log(2.0));
    printf("CAPACITY: %.0f bps\\n", c);
}

int main(void) {
    computeCapacity(3000.0, 31.0); // 3kHz channel, SNR = 31 (≈ 15 dB)
    return 0;
}`,
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Interactive Engineering Equation Bench",
      description: "Experiment with component values and observe instant formula calculation.",
      config: { mode: "analog" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("CAPACITY: 15000 bps\n"),
    exercise: exercise(
      "ex-career-high-yield-formulas",
      "Shannon Channel Capacity Solver",
      "Given bandwidth B = 3000 Hz and linear SNR = 31: compute capacity C = B * Math.log2(1 + SNR). Log: 'CAPACITY: {Math.round(C)} bps'.",
      `const B = 3000, SNR = 31;\nconst C = B * Math.log2(1 + SNR);\nconsole.log(\`CAPACITY: \${Math.round(C)} bps\`);`,
      "career-formula-drill-obj",
      "Calculates maximum information carrying capacity of noisy channel.",
      [
        "Compute 1 + SNR = 32.",
        "Math.log2(32) is 5.",
        "Multiply 3000 * 5 = 15000.",
      ],
      "Applied",
      `// Shannon capacity calculator\nconst B = 3000, SNR = 31;\n\n// TODO: Calculate C = B * log2(1 + SNR) and log formatted string\n`,
      [
        {
          id: "tc-shannon-capacity",
          label: "Verifies 15000 bps capacity for B=3000 Hz, SNR=31",
          expectedStdout: "CAPACITY: 15000 bps\n",
        },
        {
          id: "tc-shannon-unit",
          label: "Confirms bits per second (bps) unit formatting",
          expectedStdout: "CAPACITY: 15000 bps\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "If a signal-to-noise ratio is given as 20 dB, what is its linear power ratio (S/N)?",
      "SNR_linear = 10^(20 / 10) = 10^2 = 100.",
    ),
  },
];

export const engineeringCareerPrepModules: LearningModule[] = [
  moduleData(
    "mod-career-eee-core",
    1,
    "GATE Electrical Engineering (EEE)",
    "Two-port network Z/Y/ABCD parameters, transmission reciprocity, and symmetrical components.",
    engineeringCareerPrepLessons.slice(0, 1),
  ),
  moduleData(
    "mod-career-ece-core",
    2,
    "GATE Electronics & Communication (ECE)",
    "Z-transform pole stability, region of convergence, and CMOS inverter propagation delay.",
    engineeringCareerPrepLessons.slice(1, 2),
  ),
  moduleData(
    "mod-career-cs-core",
    3,
    "GATE Computer Science (CS)",
    "Master Theorem divide-and-conquer recurrences and virtual memory page table translation.",
    engineeringCareerPrepLessons.slice(2, 3),
  ),
  moduleData(
    "mod-career-embedded-c",
    4,
    "Core Embedded Systems Interviews",
    "Volatile qualifiers, memory-mapped register bitfields, and reentrant ISR code.",
    engineeringCareerPrepLessons.slice(3, 4),
  ),
  moduleData(
    "mod-career-psu-machines",
    5,
    "PSU & Core Industry Interviews",
    "Induction motor slip-torque curves, synchronous speed, and transformer voltage regulation.",
    engineeringCareerPrepLessons.slice(4, 5),
  ),
  moduleData(
    "mod-career-vlsi-timing",
    6,
    "VLSI & Digital Timing Analysis",
    "Setup time, hold time, clock skew, and maximum operational frequency limits.",
    engineeringCareerPrepLessons.slice(5, 6),
  ),
  moduleData(
    "mod-career-rtos-systems",
    7,
    "Real-Time Operating Systems (RTOS)",
    "Priority inversion, Priority Inheritance Protocol, and Coffman deadlock conditions.",
    engineeringCareerPrepLessons.slice(6, 7),
  ),
  moduleData(
    "mod-career-formula-drill",
    8,
    "Comprehensive Concept Speed Drill",
    "Shannon-Hartley channel capacity, LC resonance, and core engineering calculations.",
    engineeringCareerPrepLessons.slice(7, 8),
  ),
];

export const engineeringCareerPrepPath: LearningCourse = {
  id: "engineering-career-prep",
  subjectId: engineeringCareerPrepSubject.id,
  title: "GATE & PSU Technical Interview Practice",
  description: "Master high-yield GATE (EEE, ECE, CS) questions, technical interview algorithms, core hardware diagnostics, and circuit analysis with instant auto-grading.",
  level: "Applied",
  prerequisites: ["circuits-eee-core", "control-and-signals", "dsa-mastery"],
  objectives: engineeringCareerPrepObjectives,
  learningOutcomes: [
    "Solve two-port network ABCD matrices and 3-phase symmetrical fault components.",
    "Evaluate discrete Z-transform ROC stability and CMOS digital inverter delays.",
    "Apply the Master Theorem to divide-and-conquer recurrences and calculate virtual memory paging.",
    "Master volatile qualifier semantics, hardware register bitmasking, and interrupt reentrancy.",
    "Calculate induction motor slip, synchronous speed, and transformer voltage regulation.",
    "Perform static timing analysis for setup/hold time slacks and clock skew margins.",
    "Resolve real-time priority inversion using priority inheritance protocols.",
    "Calculate Shannon-Hartley channel capacity and high-yield engineering formulas.",
  ],
  estimatedDurationMinutes: 360,
  publicationStatus: "published",
  modules: engineeringCareerPrepModules,
};
