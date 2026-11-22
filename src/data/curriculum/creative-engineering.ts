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

export const creativeEngineeringSubject: LearningSubject = {
  id: "creative-engineering-subject",
  title: "Creative Engineering & Puzzles",
  description: "Engage with playful physical computing, chiptune 8-bit sound synthesis, optical Morse communications, terminal games in C, circuit bug hunting, and logic gate puzzles.",
};

export const creativeEngineeringObjectives: LearningObjective[] = [
  { id: "creative-piezo-obj", title: "Synthesize 8-bit square wave musical melodies using microcontroller timers and Web Audio oscillator frequencies." },
  { id: "creative-morse-obj", title: "Translate alphanumeric text into international Morse code time-unit pulses for optical LED transmission." },
  { id: "creative-snake-obj", title: "Implement grid coordinate math, state machine collision detection, and food spawning for terminal snake in C." },
  { id: "creative-bug-obj", title: "Diagnose and fix real-world hardware circuit flaws: floating inputs, missing pull-ups, wrong polarity, and short circuits." },
  { id: "creative-asm-obj", title: "Trace assembly instructions, accumulator registers, and condition flags to decode a simulated firmware puzzle." },
  { id: "creative-maze-obj", title: "Solve a multi-stage combinational logic gate puzzle to discover the binary key unlocking a virtual vault." },
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

export const creativeEngineeringLessons: LearningLesson[] = [
  // 1. Piezoelectric 8-Bit Melody Player
  {
    id: "creative-piezo-melody",
    order: 1,
    title: "Piezoelectric 8-Bit Melody Player",
    summary: "Program chiptune audio frequencies, note durations, and Web Audio synthesis.",
    type: "interactive-simulation",
    objectiveIds: ["creative-piezo-obj"],
    prerequisiteLessonIds: [],
    estimatedDurationMinutes: 30,
    content: `Early video game consoles like the Nintendo Entertainment System (NES) and Game Boy generated iconic music using pure programmable sound generators (PSGs) producing square, triangle, and noise waveforms.

### Musical Pitch and Frequency
Sound pitch corresponds to fundamental frequency ($f$). In modern 12-tone equal temperament:
$$f_n = f_0 \\times 2^{n/12}$$
Where $A_4 = 440\\text{ Hz}$ serves as the international concert pitch reference standard:
- $C_4$ (Middle C): $261.63\\text{ Hz}$
- $D_4$: $293.66\\text{ Hz}$
- $E_4$: $329.63\\text{ Hz}$
- $F_4$: $349.23\\text{ Hz}$
- $G_4$: $392.00\\text{ Hz}$
- $A_4$: $440.00\\text{ Hz}$
- $B_4$: $493.88\\text{ Hz}$
- $C_5$: $523.25\\text{ Hz}$

### Web Audio & Browser Autoplay Policy
Modern web browsers enforce strict security policies prohibiting automated sound playback until the user initiates an explicit user gesture (such as clicking a "Play Melody" button). Audio contexts created before user gesture remain suspended.`,
    theorySections: [
      {
        id: "square-wave-timbre",
        title: "Chiptune Harmonics & Square Waves",
        content: "A square wave contains only odd harmonics (f, 3f, 5f, 7f...) with amplitudes inversely proportional to harmonic number (1/n). This produces the signature hollow, bright, buzzy retro chiptune sound.",
      },
      {
        id: "timer-pwm-tone",
        title: "Hardware Timer Frequency Synthesis",
        content: "Microcontrollers synthesize audio using hardware timer interrupts in CTC (Clear Timer on Compare Match) mode, toggling the output pin at twice the desired audio frequency.",
      },
    ],
    codeExamples: [
      {
        title: "C Musical Note Lookup",
        language: "c",
        code: `#include <stdio.h>
#include <string.h>

float getFreq(const char* note) {
    if (strcmp(note, "A4") == 0) return 440.00f;
    if (strcmp(note, "C4") == 0) return 261.63f;
    if (strcmp(note, "E5") == 0) return 659.25f;
    return 0.0f;
}

int main(void) {
    printf("NOTE: A4, FREQ: %.2f Hz\\n", getFreq("A4"));
    return 0;
}`,
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Chiptune Audio Synthesizer",
      description: "Experiment with note frequencies, square wave timbre, and melodic presets with user-initiated Web Audio playback.",
      config: { mode: "melody" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("NOTE: A4, FREQ: 440.00 Hz\n"),
    exercise: exercise(
      "ex-creative-piezo-melody",
      "Musical Note to Frequency Converter",
      "Given note = 'A4': lookup frequency in Hz (A4 = 440.00, C4 = 261.63, E5 = 659.25). Log: 'NOTE: {note}, FREQ: {freq.toFixed(2)} Hz'. Write the evaluation script.",
      `const note = "A4";\nconst table = { A4: 440.00, C4: 261.63, E5: 659.25 };\nconst freq = table[note] ?? 0;\nconsole.log(\`NOTE: \${note}, FREQ: \${freq.toFixed(2)} Hz\`);`,
      "creative-piezo-obj",
      "Returns exact pitch frequency for musical note identifiers.",
      [
        "Create a lookup object mapping notes to numeric frequencies.",
        "Lookup note and use toFixed(2).",
        "Log formatted string.",
      ],
      "Applied",
      `// Note frequency resolver\nconst note = "A4";\n\n// TODO: Lookup frequency and log formatted note frequency\n`,
      [
        {
          id: "tc-piezo-a4",
          label: "Verifies standard 440 Hz concert pitch for A4",
          expectedStdout: "NOTE: A4, FREQ: 440.00 Hz\n",
        },
        {
          id: "tc-piezo-decimals",
          label: "Confirms two decimal places formatting",
          expectedStdout: "NOTE: A4, FREQ: 440.00 Hz\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why do modern browsers prevent AudioContext.start() before a user gesture like clicking a button?",
      "To protect users from unwanted noisy advertisements and audio autoplay fatigue.",
    ),
  },

  // 2. Optical Morse Code Transmitter
  {
    id: "creative-optical-morse",
    order: 2,
    title: "Optical Morse Code Transmitter",
    summary: "Encode text into standardized international Morse code optical pulses.",
    type: "interactive-simulation",
    objectiveIds: ["creative-morse-obj"],
    prerequisiteLessonIds: ["creative-piezo-melody"],
    estimatedDurationMinutes: 30,
    content: `# Optical Morse Code Transmitter

Optical and line-of-sight visual communication (Aldis lamps, infrared beacons) transmits digital messages across long distances using international Morse code timing standards.

### Standard Timing Rules
1. **Basic Dot ($T$)**: The duration of one dot (e.g., $100\\text{ ms}$).
2. **Dash ($3T$)**: Exactly 3 times the duration of a dot.
3. **Intra-character spacing ($1T$)**: Silence between consecutive dots or dashes within the same letter.
4. **Letter spacing ($3T$)**: Silence between letters of a word.
5. **Word spacing ($7T$)**: Silence between distinct words.`,
    theorySections: [
      {
        id: "optical-baud-rate",
        title: "Optical Communication Bandwidth",
        content: "Standard Morse transmission word speed (WPM) uses the PARIS standard: PARIS contains exactly 50 time units. At 20 WPM, 1 unit T = 1200 / 20 = 60 ms.",
      },
      {
        id: "visual-contrast",
        title: "Photodiode Visual Acuity",
        content: "High-intensity optical beacons use focused parabolic reflectors and collimating lenses to concentrate LED photons across multiple kilometers.",
      },
    ],
    codeExamples: [
      {
        title: "C Morse Pulse Sequence Generator",
        language: "c",
        code: `#include <stdio.h>

void printMorseSOS(void) {
    printf("MORSE: ... --- ...\\n");
}

int main(void) {
    printMorseSOS();
    return 0;
}`,
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Optical Morse Rig",
      description: "Convert string text to international Morse timings and observe simulated LED pulse modulation.",
      config: { mode: "morse" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("MORSE: ... --- ...\n"),
    exercise: exercise(
      "ex-creative-optical-morse",
      "Text to Morse Code String",
      "Given text = 'SOS': map S -> '...', O -> '---'. Join characters in a word with space. Output: 'MORSE: {encoded}'. Write the script.",
      `const text = "SOS";\nconst map = { S: "...", O: "---" };\nconst encoded = text.split("").map(c => map[c]).join(" ");\nconsole.log(\`MORSE: \${encoded}\`);`,
      "creative-morse-obj",
      "Accurately translates text characters to spaced Morse code strings.",
      [
        "Split text into characters.",
        "Map each character to Morse string.",
        "Join with spaces and log MORSE: prefix.",
      ],
      "Applied",
      `// Morse code encoder\nconst text = "SOS";\n\n// TODO: Encode text and log MORSE: string\n`,
      [
        {
          id: "tc-morse-sos",
          label: "Verifies international distress signal SOS encoding",
          expectedStdout: "MORSE: ... --- ...\n",
        },
        {
          id: "tc-morse-spaces",
          label: "Confirms single space separation between letters",
          expectedStdout: "MORSE: ... --- ...\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "How many basic time units (T) is a Morse dash relative to a dot?",
      "Exactly 3 units (a dash is 3 times the length of a dot).",
    ),
  },

  // 3. In-Browser Terminal Snake in C
  {
    id: "creative-terminal-snake",
    order: 3,
    title: "In-Browser Terminal Snake in C",
    summary: "Architect grid coordinate arithmetic, direction vectors, and body movement.",
    type: "interactive-simulation",
    objectiveIds: ["creative-snake-obj"],
    prerequisiteLessonIds: ["creative-optical-morse"],
    estimatedDurationMinutes: 35,
    content: `# In-Browser Terminal Snake in C

Implementing a retro Snake game exercises core systems programming skills: fixed-size 2D memory arrays, structure coordinates, delta direction vectors, and discrete game loop update ticks.

### Coordinate Grid & Direction Vectors
The board is represented as an $R \\times C$ grid where $(0, 0)$ is the top-left cell:
- **UP**: $dx = 0, dy = -1$
- **DOWN**: $dx = 0, dy = +1$
- **LEFT**: $dx = -1, dy = 0$
- **RIGHT**: $dx = +1, dy = 0$

### Ring Buffer Body Movement
Instead of shifting an entire array on every tick ($O(N)$ operations), high-performance implementations use a circular queue where the new head position is written to the next head index, and the tail pointer advances unless food is consumed.`,
    theorySections: [
      {
        id: "snake-coordinate-math",
        title: "2D Array Row-Major Flattening",
        content: "In memory-constrained microcontrollers without dynamic 2D pointers, an R x C grid is flattened to a 1D array index = r * C + c.",
      },
      {
        id: "snake-collision-logic",
        title: "O(1) Self-Collision Bitmaps",
        content: "Rather than iterating through the entire body list to detect self-collision, a bitset grid marks occupied coordinates, enabling O(1) collision detection.",
      },
    ],
    codeExamples: [
      {
        title: "C Snake Coordinate Stepping",
        language: "c",
        code: `#include <stdio.h>

void stepHead(int x, int y, int dx, int dy) {
    int nx = x + dx;
    int ny = y + dy;
    printf("HEAD: (%d, %d)\\n", nx, ny);
}

int main(void) {
    stepHead(5, 5, 1, 0); // Move RIGHT
    return 0;
}`,
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Terminal Snake Game Loop",
      description: "Play and inspect the 2D coordinate grid and state transitions driving the classic Snake game.",
      config: { mode: "snake" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("HEAD: (6, 5)\n"),
    exercise: exercise(
      "ex-creative-terminal-snake",
      "Snake Next Head Coordinate",
      "Given headX = 5, headY = 5, and dir = 'RIGHT' (dx = 1, dy = 0): calculate new coordinate nx = headX + dx, ny = headY + dy. Log: 'HEAD: ({nx}, {ny})'. Write the evaluation script.",
      `const headX = 5, headY = 5, dir = "RIGHT";\nconst dx = 1, dy = 0;\nconst nx = headX + dx, ny = headY + dy;\nconsole.log(\`HEAD: (\${nx}, \${ny})\`);`,
      "creative-snake-obj",
      "Calculates next head coordinate based on direction vector.",
      [
        "Add dx to headX.",
        "Add dy to headY.",
        "Log HEAD: (x, y).",
      ],
      "Applied",
      `// Snake coordinate stepper\nconst headX = 5, headY = 5, dir = "RIGHT";\n\n// TODO: Compute next coordinate and log formatted string\n`,
      [
        {
          id: "tc-snake-step",
          label: "Verifies rightward head step increments X",
          expectedStdout: "HEAD: (6, 5)\n",
        },
        {
          id: "tc-snake-y-stable",
          label: "Ensures Y coordinate remains unchanged when moving horizontally",
          expectedStdout: "HEAD: (6, 5)\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why does a circular queue improve Snake game performance over a shifting array?",
      "Moving head and tail pointers operates in O(1) time complexity, whereas shifting N body elements takes O(N) time per frame.",
    ),
  },

  // 4. Reverse-Engineering Circuit Bug Hunt
  {
    id: "creative-circuit-bug-hunt",
    order: 4,
    title: "Reverse-Engineering Circuit Bug Hunt",
    summary: "Troubleshoot floating microcontroller inputs, inverted LEDs, and short-circuit faults.",
    type: "interactive-simulation",
    objectiveIds: ["creative-bug-obj"],
    prerequisiteLessonIds: ["creative-terminal-snake"],
    estimatedDurationMinutes: 30,
    content: `# Reverse-Engineering Circuit Bug Hunt

Real-world hardware debugging requires systematic fault isolation. Common novice bench mistakes include floating CMOS digital inputs, reversed diode polarity, and missing current-limiting resistors.

### Critical Bench Faults
1. **Floating Digital Inputs**:
   - High-impedance CMOS inputs pick up ambient electro-static radiation if not actively tied to $V_{CC}$ or $GND$.
   - **Remedy**: Enable internal pull-up resistor (\`pinMode(pin, INPUT_PULLUP)\`) or wire external $10\\,\\text{k}\\Omega$ resistor.
2. **Reversed LED Polarity**:
   - LEDs are unidirectional diodes. Anode must connect towards positive rail; cathode (flat edge / shorter leg) towards ground.
3. **Missing Current Limiter**:
   - Forward voltage of red LED is $\\approx 2.0\\text{ V}$. Connecting directly across $5\\text{ V}$ causes excessive current ($> 100\\text{ mA}$), destroying the LED or GPIO pad.
   - **Required Resistor**:
     $$R = \\frac{V_{CC} - V_f}{I_f} = \\frac{5.0 - 2.0}{0.015} = 200\\,\\Omega \\implies 220\\,\\Omega\\text{ standard}$$`,
    theorySections: [
      {
        id: "floating-input-noise",
        title: "CMOS High-Impedance Electrostatic Pick-up",
        content: "A disconnected CMOS gate has an input impedance exceeding 10^12 ohms. The gate capacitance charges from 50/60 Hz mains EMI, causing the digital Schmitt trigger to toggle erratically.",
      },
      {
        id: "short-circuit-protection",
        title: "Power Rail Short-Circuit Overcurrent",
        content: "Placing a probe incorrectly across VCC and GND drops rail voltage to near zero and triggers thermal shutdown in linear voltage regulators (AMS1117 / 7805).",
      },
    ],
    codeExamples: [
      {
        title: "C Bench Fault Diagnostic Table",
        language: "c",
        code: `#include <stdio.h>
#include <string.h>

const char* diagnose(const char* symptom) {
    if (strcmp(symptom, "RANDOM_READINGS") == 0) return "FLOATING_INPUT";
    if (strcmp(symptom, "BURNT_LED") == 0) return "MISSING_SERIES_RESISTOR";
    return "UNKNOWN";
}

int main(void) {
    printf("SYMPTOM: RANDOM_READINGS, FAULT: %s\\n", diagnose("RANDOM_READINGS"));
    return 0;
}`,
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Interactive Hardware Diagnostics",
      description: "Inspect circuit faults and verify corrective schematic repairs.",
      config: { mode: "breadboard" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("SYMPTOM: RANDOM_READINGS, FAULT: FLOATING_INPUT\n"),
    exercise: exercise(
      "ex-creative-circuit-bug-hunt",
      "Diagnose Circuit Fault",
      "Given symptom = 'RANDOM_READINGS': map 'RANDOM_READINGS' to 'FLOATING_INPUT', and 'BURNT_LED' to 'MISSING_SERIES_RESISTOR'. Log: 'SYMPTOM: {symptom}, FAULT: {fault}'. Write code to evaluate.",
      `const symptom = "RANDOM_READINGS";\nconst map = { RANDOM_READINGS: "FLOATING_INPUT", BURNT_LED: "MISSING_SERIES_RESISTOR" };\nconst fault = map[symptom] ?? "UNKNOWN";\nconsole.log(\`SYMPTOM: \${symptom}, FAULT: \${fault}\`);`,
      "creative-bug-obj",
      "Identifies root electrical causes from bench symptoms.",
      [
        "Create a dictionary mapping symptoms to faults.",
        "Lookup symptom.",
        "Log formatted string.",
      ],
      "Applied",
      `// Circuit fault diagnosis\nconst symptom = "RANDOM_READINGS";\n\n// TODO: Map symptom to electrical fault and log string\n`,
      [
        {
          id: "tc-bug-floating",
          label: "Correctly identifies floating input from fluctuating readings",
          expectedStdout: "SYMPTOM: RANDOM_READINGS, FAULT: FLOATING_INPUT\n",
        },
        {
          id: "tc-bug-syntax",
          label: "Verifies standard formatted diagnostic output",
          expectedStdout: "SYMPTOM: RANDOM_READINGS, FAULT: FLOATING_INPUT\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "How do internal pull-up resistors resolve floating digital input instability?",
      "They weakly tie the pin to VCC when disconnected, guaranteeing a deterministic HIGH logic state until an external switch pulls it to ground.",
    ),
  },

  // 5. Microcontroller Assembly Code Puzzle
  {
    id: "creative-assembly-puzzle",
    order: 5,
    title: "Microcontroller Assembly Code Puzzle",
    summary: "Trace opcodes, accumulator register state, and zero flags to decrypt a value.",
    type: "interactive-simulation",
    objectiveIds: ["creative-asm-obj"],
    prerequisiteLessonIds: ["creative-circuit-bug-hunt"],
    estimatedDurationMinutes: 30,
    content: `# Microcontroller Assembly Code Puzzle

Before high-level compilers existed, embedded engineers hand-crafted assembly code, manually tracking accumulator contents, carry bits, and zero flags across clock cycles.

### Toy Architecture Instruction Set
- \`LDA <val>\`: Load immediate value into Accumulator (\`ACC = val\`).
- \`ADD <val>\`: Add immediate value to Accumulator (\`ACC = (ACC + val) & 0xFF\`).
- \`SUB <val>\`: Subtract immediate value from Accumulator (\`ACC = (ACC - val) & 0xFF\`).
- \`XOR <val>\`: Bitwise XOR immediate with Accumulator (\`ACC = ACC ^ val\`).
- \`SHL\`: Shift Accumulator left by 1 bit (\`ACC = (ACC << 1) & 0xFF\`).`,
    theorySections: [
      {
        id: "accumulator-alu-wrap",
        title: "8-Bit Modulo Arithmetic Wrapping",
        content: "In an 8-bit register, values greater than 255 wrap around (modulo 256) and set the Carry or Overflow flag in the Status Register (SREG).",
      },
      {
        id: "zero-flag-branches",
        title: "Status Register Conditional Branching",
        content: "Instructions like SUB and CMP set the Zero Flag (Z) to 1 if the result is 0x00. Conditional branch instructions (BREQ / JZ) inspect the Z flag to alter program flow.",
      },
    ],
    codeExamples: [
      {
        title: "C 8-Bit Assembly Emulator",
        language: "c",
        code: `#include <stdio.h>

int main(void) {
    int acc = 0;
    acc = 10;          // LDA 10
    acc = (acc + 5);   // ADD 5
    acc = (acc - 3);   // SUB 3
    printf("ACC: %d\\n", acc);
    return 0;
}`,
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Toy CPU Instruction Stepper",
      description: "Step through machine instructions and observe accumulator register mutations.",
      config: { mode: "toycpu" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("ACC: 12\n"),
    exercise: exercise(
      "ex-creative-assembly-puzzle",
      "Trace 8-Bit Assembly Program",
      "Execute the instruction sequence: LDA 10, ADD 5, SUB 3. Compute final accumulator value acc. Log: 'ACC: {acc}'. Write the evaluation script.",
      `let acc = 0;\nacc = 10;\nacc = (acc + 5) & 0xFF;\nacc = (acc - 3) & 0xFF;\nconsole.log(\`ACC: \${acc}\`);`,
      "creative-asm-obj",
      "Correctly executes sequence of assembly instructions on 8-bit accumulator.",
      [
        "Initialize acc = 10.",
        "Add 5 to get 15.",
        "Subtract 3 to get 12.",
        "Log ACC: 12.",
      ],
      "Applied",
      `// Assembly trace puzzle\nlet acc = 0;\n\n// TODO: Execute LDA 10, ADD 5, SUB 3 and log final ACC\n`,
      [
        {
          id: "tc-asm-exec",
          label: "Verifies correct arithmetic accumulation (10 + 5 - 3 = 12)",
          expectedStdout: "ACC: 12\n",
        },
        {
          id: "tc-asm-modulo",
          label: "Confirms 8-bit register boundaries",
          expectedStdout: "ACC: 12\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "What happens to an 8-bit unsigned accumulator holding 255 if an ADD 1 instruction is executed?",
      "It wraps to 0 (overflow) and sets the Carry Flag (C = 1) in the status register.",
    ),
  },

  // 6. Combinational Logic Gate Maze
  {
    id: "creative-logic-maze",
    order: 6,
    title: "Combinational Logic Gate Maze",
    summary: "Deduce boolean switch inputs that satisfy multi-stage gate conditions.",
    type: "interactive-simulation",
    objectiveIds: ["creative-maze-obj"],
    prerequisiteLessonIds: ["creative-assembly-puzzle"],
    estimatedDurationMinutes: 30,
    content: `# Combinational Logic Gate Maze

Digital security circuits and electronic safes implement logic cascades where unlocking requires a multi-bit binary input sequence satisfying simultaneous boolean equations.

### Maze Gate Conditions
Consider a security vault controlled by 4 binary switches ($A, B, C, D \\in \\{0, 1\\}$):
1. **Door 1**: $A \\oplus B = 1$ (A and B must be distinct).
2. **Door 2**: $(B \\cdot C) + \\overline{D} = 1$ (Either B and C are both 1, or D is 0).
3. **Door 3**: $\\overline{A + C} = 0 \\iff A + C = 1$ (At least one of A or C must be 1).

### Boolean Deduction
- If $A = 0$, then Door 1 requires $B = 1$.
- Door 3 requires $A + C = 1 \\implies C = 1$.
- With $B = 1, C = 1$, Door 2 is satisfied regardless of $D$.
- Hence, $(A=0, B=1, C=1, D=0)$ is a valid unlocking vector.`,
    theorySections: [
      {
        id: "boolean-satisfiability",
        title: "Combinational SAT Verification",
        content: "Boolean satisfiability (SAT) determines if there exists an assignment of binary variables that makes a given boolean formula evaluate to TRUE. Hardware security verifies all gates concurrently without instruction execution cycles.",
      },
      {
        id: "xor-parity-check",
        title: "XOR Inversion & Parity Matching",
        content: "The XOR gate acts as a controlled inverter: if one input is 1, the output is the inverted state of the other input. In cryptography, XOR forms the basis of one-time pads and Feistel ciphers.",
      },
    ],
    codeExamples: [
      {
        title: "C Boolean Maze Condition Checker",
        language: "c",
        code: `#include <stdio.h>
#include <stdbool.h>

bool checkMaze(int a, int b, int c, int d) {
    bool d1 = (a ^ b) == 1;
    bool d2 = (b && c) || (!d);
    bool d3 = !(a == 0 && c == 0);
    return d1 && d2 && d3;
}

int main(void) {
    printf("VAULT: %s\\n", checkMaze(0, 1, 1, 0) ? "UNLOCKED" : "LOCKED");
    return 0;
}`,
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Interactive Combinational Maze",
      description: "Flip binary switches to open digital security gates and unlock the vault.",
      config: { mode: "maze" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("VAULT: UNLOCKED\n"),
    exercise: exercise(
      "ex-creative-logic-maze",
      "Verify Maze Vault Key",
      "Given switches a = 0, b = 1, c = 1, d = 0: evaluate d1 = (a ^ b) === 1, d2 = (b === 1 && c === 1) || d === 0, and d3 = !(a === 0 && c === 0). If all three are true, log 'VAULT: UNLOCKED', otherwise log 'VAULT: LOCKED'. Write the code.",
      `const a = 0, b = 1, c = 1, d = 0;\nconst d1 = (a ^ b) === 1;\nconst d2 = (b === 1 && c === 1) || d === 0;\nconst d3 = !(a === 0 && c === 0);\nconsole.log(\`VAULT: \${d1 && d2 && d3 ? "UNLOCKED" : "LOCKED"}\`);`,
      "creative-maze-obj",
      "Returns unlocked status when all 3 combinational maze gates are satisfied.",
      [
        "Compute d1, d2, d3.",
        "Check d1 && d2 && d3.",
        "Log 'VAULT: UNLOCKED'.",
      ],
      "Applied",
      `// Logic maze validator\nconst a = 0, b = 1, c = 1, d = 0;\n\n// TODO: Check door conditions and log VAULT: UNLOCKED or LOCKED\n`,
      [
        {
          id: "tc-maze-unlock",
          label: "Verifies valid switch combination unlocks the vault",
          expectedStdout: "VAULT: UNLOCKED\n",
        },
        {
          id: "tc-maze-simultaneous",
          label: "Confirms all three gates evaluate concurrently",
          expectedStdout: "VAULT: UNLOCKED\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "In combinational logic, how fast does the circuit output update when an input switch is toggled?",
      "Almost instantaneously, constrained only by the physical propagation delay (nanoseconds) of the logic silicon gates.",
    ),
  },
];

export const creativeEngineeringModules: LearningModule[] = [
  moduleData(
    "mod-creative-audio",
    1,
    "Audio & Signals",
    "8-bit square wave pitch synthesis, melody presets, and Web Audio API user gesture handling.",
    creativeEngineeringLessons.slice(0, 1),
  ),
  moduleData(
    "mod-creative-optical",
    2,
    "Optical Communications",
    "International Morse code time-unit pulses, dot-dash encoding, and LED transmission.",
    creativeEngineeringLessons.slice(1, 2),
  ),
  moduleData(
    "mod-creative-games",
    3,
    "Game Systems in C",
    "Grid coordinate math, direction vectors, collision logic, and circular queues.",
    creativeEngineeringLessons.slice(2, 3),
  ),
  moduleData(
    "mod-creative-diagnostics",
    4,
    "Diagnostic Engineering",
    "Bench troubleshooting: floating inputs, reversed diodes, and current limiter sizing.",
    creativeEngineeringLessons.slice(3, 4),
  ),
  moduleData(
    "mod-creative-assembly",
    5,
    "Low-Level Instruction Puzzles",
    "Accumulator tracing, condition flags, and machine opcode execution.",
    creativeEngineeringLessons.slice(4, 5),
  ),
  moduleData(
    "mod-creative-puzzles",
    6,
    "Combinational Puzzles",
    "Multi-stage digital logic gates, XOR condition solving, and electronic lock verification.",
    creativeEngineeringLessons.slice(5, 6),
  ),
];

export const creativeEngineeringPath: LearningCourse = {
  id: "creative-engineering-lab",
  subjectId: creativeEngineeringSubject.id,
  title: "Creative Engineering Lab & Hardware Puzzles",
  description: "Engage with playful physical computing, chiptune 8-bit sound synthesis, optical Morse communications, terminal games in C, circuit bug hunting, and logic gate puzzles.",
  level: "Developing",
  prerequisites: ["digital-logic-circuits", "c-programming-foundations"],
  objectives: creativeEngineeringObjectives,
  learningOutcomes: [
    "Program square wave frequency timers and play interactive chiptune melodies.",
    "Modulate optical LED signals using standard Morse code time units.",
    "Build retro terminal grid movement and state machines in C.",
    "Diagnose real bench electronic circuit faults: floating gates, polarity, and short circuits.",
    "Trace low-level assembly instruction sets, accumulator mutations, and status flags.",
    "Deduce multi-stage combinational boolean vectors to unlock digital security gates.",
  ],
  estimatedDurationMinutes: 180,
  publicationStatus: "published",
  modules: creativeEngineeringModules,
};
