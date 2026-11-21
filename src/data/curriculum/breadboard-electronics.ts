import type {
  ExerciseTestCase,
  LearningCheckpoint,
  LearningCourse,
  LearningDifficulty,
  LearningExercise,
  LearningLesson,
  LearningModule,
  LearningObjective,
  LearningSubject,
} from "@/lib/learning-curriculum";

export const breadboardElectronicsSubject: LearningSubject = {
  id: "breadboard-electronics-subject",
  title: "Practical Breadboard Prototyping & Circuits",
  description: "Master physical circuit prototyping on solderless breadboards, terminal bus architectures, current limiting, voltage dividers, and multimeter troubleshooting.",
};

const objectives: LearningObjective[] = [
  { id: "bb-bus-continuity", title: "Trace internal breadboard phosphor-bronze spring clips, 5-hole terminal rows, and DIP isolation center trenches." },
  { id: "bb-power-rails", title: "Distribute dual power rails (5V/3.3V/GND), bridge middle split gaps, and add bypass decoupling capacitors." },
  { id: "bb-led-resistors", title: "Calculate LED forward voltage drops, size current-limiting resistors with Ohm's Law, and decode 4-band/5-band color rings." },
  { id: "bb-switch-pullups", title: "Wire tactile pushbuttons with external pull-up/pull-down resistor networks to prevent indeterminate floating CMOS states." },
  { id: "bb-voltage-dividers", title: "Construct two-resistor voltage dividers, read potentiometers, and scale analog sensor voltages to microcontroller limits." },
  { id: "bb-troubleshooting", title: "Systematically debug breadboard faults using digital multimeters (voltage, continuity buzzer, and resistance modes)." },
  { id: "bb-diodes", title: "Analyze diode forward voltage drops (0.7V silicon), reverse breakdown, and bridge rectification circuits." },
  { id: "bb-bjt-switches", title: "Design NPN BJT transistor driver switches with base resistors to drive loads exceeding microcontroller GPIO current limits." },
  { id: "bb-555-astable", title: "Calculate frequency and duty cycle for 555 timer astable multivibrator pulse generator circuits." },
  { id: "bb-capstone-proto", title: "Synthesize breadboard layout rules, active semiconductors, and fault diagnosis in a prototyping assessment." },
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
    language: "javascript",
    ...(starterCode ? { starterCode } : {}),
    ...(testCases ? { testCases } : {}),
  };
}

export const breadboardElectronicsLessons: LearningLesson[] = [
  // Module 1: Solderless Breadboard Anatomy & Power Rails
  {
    id: "breadboard-bus-continuity",
    order: 1,
    title: "Solderless Breadboard Anatomy, Internal Clips & Continuity",
    summary: "Discover the internal spring-clip rows, 0.1-inch pitch, and center DIP isolation trench of solderless breadboards.",
    type: "guided-coding",
    objectiveIds: ["bb-bus-continuity"],
    prerequisiteLessonIds: [],
    estimatedDurationMinutes: 20,
    interactiveDemo: {
      kind: "circuit",
      title: "Interactive Solderless Breadboard Explorer",
      description: "Click any breadboard tie point to illuminate all electrically connected internal spring clips in green.",
    },
    content: `# Solderless Breadboard Anatomy, Internal Clips & Continuity

The solderless breadboard (invented by Ronald J. Portugal in 1971) is the quintessential tool of modern electronic engineering. It enables instant physical prototyping of analog and digital circuits without solder, heat, or wire-stripping damage.

## Internal Architecture & Spring Clips

Underneath the molded plastic body lies an array of stamped phosphor-bronze metal spring clips:
- **Terminal Strips (Columns a-b-c-d-e and f-g-h-i-j)**: Groups of 5 vertical tie-points share a single continuous spring clip beneath the plastic. Inserting a component lead into hole \`1a\` establishes instant electrical contact with \`1b\`, \`1c\`, \`1d\`, and \`1e\`.
- **Center Trench (DIP Isolation Divider)**: The standard 0.3-inch (7.62 mm) channel separates columns \`a-e\` from columns \`f-j\`. There is **zero connection** across the trench. This allows Dual-Inline Package (DIP) integrated circuits (such as 555 timers or logic gates) to straddle the middle without shorting opposite pins!
- **0.1-Inch (2.54 mm) Pitch**: The universal spacing between adjacent holes matches standard through-hole component leads and pin headers.

## The Most Common Beginner Mistake: Shorting Across the Clip!

If you insert both legs of a resistor or LED into the **same 5-hole strip** (e.g., both into row 12, columns a and c):
- Both terminals are connected to the exact same piece of metal clip!
- Current bypasses the component entirely through the metal path of least resistance (a dead short circuit).
Components must always bridge across different numbered rows or across the central trench!`,
    theorySections: [
      {
        id: "spring-clip-wear-and-resistance",
        title: "Contact Resistance & Spring Clip Fatigue",
        content: `A brand-new breadboard spring clip exhibits less than 0.05 Ω of contact resistance. However, repeatedly forcing thick wire gauges (>20 AWG) or misaligned component leads permanently deforms the spring tension, increasing contact resistance to several ohms or creating intermittent open circuits that are maddening to troubleshoot. Always use 22 AWG solid-core wire.`,
      },
      {
        id: "stray-capacitance-rf-limits",
        title: "Parasitic Capacitance & High-Frequency Limits",
        content: `Because the parallel metal strips run adjacent to each other separated by plastic dielectric, breadboards introduce 2 to 10 pF of parasitic stray capacitance between adjacent rows. Consequently, solderless breadboards perform poorly at frequencies above 10 MHz (such as high-speed USB data, fast SPI buses, or RF transmission lines).`,
      },
    ],
    codeExamples: [
      {
        title: "Breadboard Continuity Validator in C",
        language: "c",
        code: `// Verify if two tie-points are internally connected
#include <stdio.h>
#include <stdbool.h>

bool arePointsConnected(int row1, char col1, int row2, char col2) {
  if (row1 != row2) return false;
  bool isLeft1 = (col1 >= 'a' && col1 <= 'e');
  bool isLeft2 = (col2 >= 'a' && col2 <= 'e');
  return isLeft1 == isLeft2;
}

int main(void) {
  printf("1a to 1c: %s\\n", arePointsConnected(1, 'a', 1, 'c') ? "CONNECTED" : "ISOLATED");
  printf("1a to 1g: %s\\n", arePointsConnected(1, 'a', 1, 'g') ? "CONNECTED" : "ISOLATED");
  printf("1a to 2a: %s\\n", arePointsConnected(1, 'a', 2, 'a') ? "CONNECTED" : "ISOLATED");
  return 0;
}`,
        description: "Checking breadboard continuity rules across rows and central isolation trench.",
      },
    ],
    exercise: exercise(
      "ex-bb-continuity-eval",
      "Evaluate Breadboard Node Continuity",
      "Write a function `isNodeConnected(rowA, colA, rowB, colB)` that returns `true` if two breadboard coordinates share the same electrical clip, and `false` otherwise. Rule: rowA must equal rowB, and both colA and colB must either be on the left side ('a'-'e') or both on the right side ('f'-'j'). Test with `('15', 'b', '15', 'e')` (connected) and `('15', 'b', '15', 'g')` (separated by trench). Print the two boolean results joined by a comma.",
      `function isNodeConnected(rowA, colA, rowB, colB) {
  if (rowA !== rowB) return false;
  const leftA = colA >= 'a' && colA <= 'e';
  const leftB = colB >= 'a' && colB <= 'e';
  return leftA === leftB;
}

console.log(isNodeConnected(15, 'b', 15, 'e') + "," + isNodeConnected(15, 'b', 15, 'g'));`,
      "bb-bus-continuity",
      "Model breadboard spring clip connectivity rules.",
      [
        "Check row equality first.",
        "Check if both columns belong to the left bank ['a'-'e'] or right bank ['f'-'j'].",
        "Expected output: 'true,false'.",
      ],
      "Beginner",
      `function isNodeConnected(rowA, colA, rowB, colB) {
  // Return true if points are connected
  return false;
}

console.log(isNodeConnected(15, 'b', 15, 'e') + "," + isNodeConnected(15, 'b', 15, 'g'));`,
      [
        testCase("tc-bb-cont-valid", "Tests intra-strip continuity and trench isolation", "true,false"),
        testCase("tc-bb-diff-rows", "Tests different row isolation", "false", "", true),
      ],
    ),
    checkpoint: checkpoint(
        "Why is there an empty center trench separating columns a-e from f-j on a breadboard?",
        "To allow Dual Inline Package (DIP) integrated circuits to sit across the center without their opposing pins being shorted together.",
      ),
  },

  // Lesson 2: Power Rails & Decoupling Capacitors
  {
    id: "breadboard-power-rails",
    order: 2,
    title: "Power Distribution Rails, Decoupling & Supply Isolation",
    summary: "Distribute stable VCC and Ground across breadboard bus strips and eliminate voltage sags using decoupling capacitors.",
    type: "guided-coding",
    objectiveIds: ["bb-power-rails"],
    prerequisiteLessonIds: ["breadboard-bus-continuity"],
    estimatedDurationMinutes: 25,
    interactiveDemo: {
      kind: "circuit",
      title: "Power Rail Distribution & Bypass Lab",
      description: "Wire +5V and GND buses across both sides of the breadboard and observe power rail voltage drops.",
    },
    content: `# Power Distribution Rails, Decoupling & Supply Isolation

In circuit prototyping, delivering clean, stable electrical power with minimal noise is just as critical as routing signal traces.

## Horizontal Power Rails (Buses)

Most full-size breadboards feature two long pairs of horizontal power rails along the top and bottom edges:
- **Red Line (+)**: The positive supply voltage rail ($V_{CC}$, typically $+5.0\\text{ V}$ or $+3.3\\text{ V}$).
- **Blue or Black Line (-)**: The common Ground reference ($GND$, $0\\text{ V}$).

Unlike the vertical 5-hole terminal rows, power rails run **horizontally** along the entire length of the board.

## The Infamous Breadboard Power Rail Split (The Gap!)

On many standard 830-point breadboards, the power rails are **split in half at the middle** (around row 30) to allow powering different sections with different voltages (e.g., 5V on the left, 3.3V on the right).
- If your circuit mysteriously loses power on the right side of the board, check if the red/blue silkscreen line is interrupted in the middle!
- If you need a continuous rail across the whole board, you must install **two jumper wire bridges** to span the middle gap.

## Decoupling (Bypass) Capacitors: Why ICs Need Them

Digital ICs draw sharp pulses of current whenever their internal transistors switch states (switching transients). If an IC is positioned at the far end of long jumper wires, wire inductance prevents the power supply from supplying instantaneous current, causing a temporary voltage dip ("voltage sag"):
- A **$100\\,\\text{nF}$ ($0.1\\,\\mu\\text{F}$) ceramic capacitor** placed directly between an IC's VCC and GND pins acts as a local energy reservoir.
- A **$10\\,\\mu\\text{F} - 100\\,\\mu\\text{F}$ electrolytic capacitor** across the main power entry points filters low-frequency ripple.`,
    theorySections: [
      {
        id: "ground-bounce-inductance",
        title: "Wire Inductance and Ground Bounce",
        content: `Even a few inches of jumper wire possesses significant parasitic inductance (~20 nH/inch). Fast transient switching currents ($di/dt$) create voltage spikes according to Faraday's law: $V = L (di/dt)$. Decoupling capacitors provide an ultra-low-inductance local current path that prevents ground bounce from flipping digital bits.`,
      },
      {
        id: "star-grounding-topology",
        title: "Star Grounding vs Ground Loops",
        content: `Daisy-chaining ground wires from one high-current load (like a motor or relay) through a sensitive analog sensor back to the power supply introduces common impedance coupling. Structuring grounds in a 'star' configuration, where all ground returns connect directly to a single central point, eliminates ground loop interference.`,
      },
    ],
    codeExamples: [
      {
        title: "Decoupling Capacitor Value Rule of Thumb",
        language: "c",
        code: `// Decoupling capacitor selection
#include <stdio.h>

void recommendCapacitors(float switchingFreqMhz, float currentTransientMa) {
  printf("Target: %.1f MHz switching at %.1f mA\\n", switchingFreqMhz, currentTransientMa);
  if (switchingFreqMhz > 1.0f) {
    printf("- Use 100nF (0.1uF) ceramic cap directly adjacent to IC VCC pin\\n");
  }
  if (currentTransientMa > 50.0f) {
    printf("- Add 10uF - 47uF bulk electrolytic cap at breadboard power entry\\n");
  }
}

int main(void) {
  recommendCapacitors(16.0f, 80.0f);
  return 0;
}`,
        description: "Recommending bypass capacitor types and placement based on transient dynamics.",
      },
    ],
    exercise: exercise(
      "ex-bb-bus-gap-check",
      "Check Power Rail Split Continuity",
      "Write a function `isRailContinuous(hasBridgeJumper, boardIndex)` where `boardIndex` is a column number from 1 to 60. On a split breadboard, indices 1 to 30 are on the left section and 31 to 60 are on the right section. If power is fed at index 1, return `true` if `boardIndex <= 30` OR if `hasBridgeJumper` is true. Test for `boardIndex = 45` with `hasBridgeJumper = false` and `true`. Print the two booleans joined by a comma.",
      `function isRailContinuous(hasBridgeJumper, boardIndex) {
  if (boardIndex <= 30) return true;
  return hasBridgeJumper;
}

console.log(isRailContinuous(false, 45) + "," + isRailContinuous(true, 45));`,
      "bb-power-rails",
      "Detect power delivery interruptions caused by breadboard bus split gaps.",
      [
        "Points up to index 30 always have power.",
        "Points beyond index 30 require hasBridgeJumper to be true.",
        "Expected output: 'false,true'.",
      ],
      "Beginner",
      `function isRailContinuous(hasBridgeJumper, boardIndex) {
  // Check if target point receives power
  return false;
}

console.log(isRailContinuous(false, 45) + "," + isRailContinuous(true, 45));`,
      [
        testCase("tc-bb-rail-split", "Evaluates power continuity across split boundary", "false,true"),
        testCase("tc-bb-rail-left", "Evaluates power on left side regardless of jumper", "true", "", true),
      ],
    ),
    checkpoint: checkpoint(
        "Why do some breadboard power rails have an interrupted colored line in the middle?",
        "To indicate that the continuous internal bus is split into two isolated halves, allowing two different supply voltages (e.g. 5V and 3.3V) on the same board.",
      ),
  },

  // Module 2: Passive Components & Switches
  {
    id: "breadboard-led-resistors",
    order: 3,
    title: "LED Current Limiting, Forward Voltage & Resistor Color Codes",
    summary: "Size current-limiting resistors using Ohm's Law, understand diode forward voltage drop (Vf), and decode resistor color bands.",
    type: "guided-coding",
    objectiveIds: ["bb-led-resistors"],
    prerequisiteLessonIds: ["breadboard-power-rails"],
    estimatedDurationMinutes: 25,
    interactiveDemo: {
      kind: "circuit",
      title: "Interactive LED Resistor Sizing Lab",
      description: "Experiment with different LED colors (Red, Green, Blue) and resistor values to observe forward voltage and brightness.",
    },
    content: `# LED Current Limiting, Forward Voltage & Resistor Color Codes

A Light-Emitting Diode (LED) is a specialized semiconductor p-n junction that emits photons when forward-biased. Unlike ordinary linear resistors, LEDs have a non-linear exponential current-voltage characteristic.

## The Forward Voltage Drop ($V_f$)

An LED will not conduct until the applied voltage exceeds its semiconductor bandgap threshold ($V_f$):
- **Red / Amber LEDs**: $V_f \\approx 1.8\\text{ V} - 2.1\\text{ V}$
- **Green / Yellow LEDs**: $V_f \\approx 2.1\\text{ V} - 2.4\\text{ V}$
- **Blue / White LEDs**: $V_f \\approx 3.0\\text{ V} - 3.4\\text{ V}$

Once $V_f$ is reached, the dynamic internal resistance collapses to nearly zero ohms. **Connecting an LED directly to a 5V power supply without a resistor creates a near-infinite current surge that destroys the diode within milliseconds!**

## Ohm's Law for LED Current Limiting

To safely limit current to a standard $15\\,\\text{mA}$ ($0.015\\,\\text{A}$):
\`\`\`
R = (V_supply - V_forward) / I_target
\`\`\`
For a Red LED ($V_f = 2.0\\text{ V}$) on a $5.0\\text{ V}$ rail:
\`\`\`
R = (5.0 V - 2.0 V) / 0.015 A = 3.0 V / 0.015 A = 200 Ω
\`\`\`
The closest standard E12 resistor values are **$220\\,\\Omega$** or **$330\\,\\Omega$**.

## 4-Band Resistor Color Code

Standard through-hole resistors use colored bands:
\`\`\`
Band 1: First Significant Digit
Band 2: Second Significant Digit
Band 3: Multiplier (10^N)
Band 4: Tolerance (Gold = ±5%, Silver = ±10%)
\`\`\`
Example for **$220\\,\\Omega$** (2, 2, $\\times 10^1$):
**Red (2) — Red (2) — Brown ($\times 10$) — Gold (±5%)**

Example for **$10\\,\\text{k}\\Omega$** (1, 0, $\\times 10^3$):
**Brown (1) — Black (0) — Orange ($\times 1000$) — Gold (±5%)**`,
    theorySections: [
      {
        id: "led-polarity-anode-cathode",
        title: "LED Polarity: Identifying Anode and Cathode",
        content: `Diodes are polarized components that only pass current in one direction:
- Anode (+): Longer wire lead; connects toward positive VCC.
- Cathode (-): Shorter wire lead; has a flat edge on the plastic epoxy lens rim; connects toward GND.
Plugging an LED in backwards will not destroy it (unless reverse breakdown voltage > 5V is exceeded), but it will not light up.`,
      },
      {
        id: "resistor-power-ratings",
        title: "Resistor Power Dissipation ($P = I^2 R$)",
        content: `The power dissipated by the current-limiting resistor is converted entirely into heat:
P = I^2 * R = (V_supply - V_f) * I
For a 5V supply, 2V LED, and 20mA current: P = 3.0V * 0.02A = 0.06 Watts (60 mW). Standard 1/4-Watt (250 mW) metal film or carbon film resistors can easily dissipate this with no risk of overheating.`,
      },
    ],
    codeExamples: [
      {
        title: "Ohm's Law LED Resistor Calculator",
        language: "c",
        code: `// Resistor sizing calculation
#include <stdio.h>
#include <math.h>

int calculateResistor(float vSupply, float vForward, float targetCurrentMa) {
  float currentAmps = targetCurrentMa / 1000.0f;
  float idealResistance = (vSupply - vForward) / currentAmps;
  return (int)roundf(idealResistance);
}

int main(void) {
  printf("5V Supply, Red LED (2.0V), 15mA -> %d ohms\\n", 
         calculateResistor(5.0f, 2.0f, 15.0f));
  printf("3.3V Supply, Blue LED (3.0V), 10mA -> %d ohms\\n", 
         calculateResistor(3.3f, 3.0f, 10.0f));
  return 0;
}`,
        description: "Exact resistance calculation for desired LED operational current.",
      },
    ],
    exercise: exercise(
      "ex-bb-resistor-sizing",
      "Calculate Resistor for Green LED on 5V Rail",
      "Write a function `sizeLedResistor(vSupply, vForward, targetCurrentMa)` that computes the ideal resistance in ohms rounded to the nearest integer. Formula: `Math.round((vSupply - vForward) / (targetCurrentMa / 1000))`. Compute for a 5.0V supply driving a Green LED (forward voltage 2.2V) at 14mA. Print the resulting integer.",
      `function sizeLedResistor(vSupply, vForward, targetCurrentMa) {
  const currentAmps = targetCurrentMa / 1000;
  return Math.round((vSupply - vForward) / currentAmps);
}

console.log(sizeLedResistor(5.0, 2.2, 14));`,
      "bb-led-resistors",
      "Apply Ohm's law to size embedded circuit protection components.",
      [
        "Compute (5.0 - 2.2) = 2.8V.",
        "Divide by 0.014 A = 200 ohms.",
        "Expected output: 200.",
      ],
      "Beginner",
      `function sizeLedResistor(vSupply, vForward, targetCurrentMa) {
  // Compute resistor value
  return 0;
}

console.log(sizeLedResistor(5.0, 2.2, 14));`,
      [
        testCase("tc-bb-res-200", "Calculates 200 ohms for 5V green LED", "200"),
        testCase("tc-bb-res-30", "Calculates 30 ohms for 3.3V blue LED", "30", "", true),
      ],
    ),
    checkpoint: checkpoint(
        "Why can you not connect an LED directly between 5V and GND without a resistor?",
        "Once forward voltage is exceeded, the LED exhibits almost zero resistance, causing catastrophic current surge and instant thermal burnout.",
      ),
  },

  // Lesson 4: Tactile Pushbuttons & Pull-Up/Down Networks
  {
    id: "breadboard-switch-pullups",
    order: 4,
    title: "Tactile Pushbuttons, Floating CMOS Gates & Pull-Up/Down Networks",
    summary: "Wire momentary pushbuttons with external 10kΩ pull-up/pull-down resistors to guarantee clean digital transitions.",
    type: "guided-coding",
    objectiveIds: ["bb-switch-pullups"],
    prerequisiteLessonIds: ["breadboard-led-resistors"],
    estimatedDurationMinutes: 25,
    interactiveDemo: {
      kind: "circuit",
      title: "Pull-Up vs Pull-Down Interactive Switch Lab",
      description: "Toggle between Pull-Up and Pull-Down topologies and inspect voltage levels at the microcontroller sensing node.",
    },
    content: `# Tactile Pushbuttons, Floating CMOS Gates & Pull-Up/Down Networks

A tactile momentary pushbutton has 4 metal legs. Internally, pairs of pins are continuously connected in pairs, which is a common source of breadboard confusion!

## 4-Pin Pushbutton Internal Pinout

Look closely at the underside of a standard 6mm tactile button:
- Pins on the same side across the long dimension are **permanently shorted together** inside the casing.
- When you press the button, the spring disc bridges the two opposite pairs together.
- **Best Practice on a Breadboard**: Straddle the center trench with the switch! Place two legs in row 20 columns d-e, and two legs in row 20 columns f-g. Pressing the button bridges across the trench!

## The Floating CMOS Gate Phenomenon

Modern digital inputs (CMOS) use insulated field-effect transistors with an input resistance of hundreds of Megaohms.
- When connected to VCC, the gate charges to HIGH.
- When connected to GND, the gate discharges to LOW.
- **When connected to NOTHING (open switch)**: The gate stores static charge like a tiny capacitor! Ambient electric fields from power wiring cause the gate voltage to float unpredictably, generating random rapid logic oscillations.

## Pull-Up vs Pull-Down Topologies

To guarantee a deterministic voltage when the switch is open, we add a high-value resistor (typically **$10\\,\\text{k}\\Omega$**):

### 1. Active-Low Pull-Up Circuit (Recommended):
- One side of switch $\\rightarrow$ **GND**.
- Other side of switch $\\rightarrow$ **MCU Input Pin**.
- **$10\\,\\text{k}\\Omega$ Resistor** between **MCU Input Pin and $+5\\text{V}$ ($V_{CC}$)**.
- **Released**: Pin reads solid $+5\\text{V}$ (\`HIGH\`).
- **Pressed**: Pin connects directly to GND (\`LOW\`).

### 2. Active-High Pull-Down Circuit:
- One side of switch $\\rightarrow$ **$+5\\text{V}$**.
- Other side of switch $\\rightarrow$ **MCU Input Pin**.
- **$10\\,\\text{k}\\Omega$ Resistor** between **MCU Input Pin and GND**.
- **Released**: Pin reads solid $0\\text{V}$ (\`LOW\`).
- **Pressed**: Pin connects to $+5\\text{V}$ (\`HIGH\`).`,
    theorySections: [
      {
        id: "why-10k-resistor-value",
        title: "Why is 10kΩ the Standard Pull-Up Resistor Value?",
        content: `A pull resistor must balance two competing constraints:
1. Low enough resistance to overcome stray capacitance and pull the pin quickly to VCC.
2. High enough resistance so that when the button is pressed, minimal current is wasted to ground (I = 5V / 10kΩ = 0.5 mA).
A 100Ω resistor would waste 50 mA on every button press, while a 10MΩ resistor would be too sluggish to charge circuit capacitance. 10kΩ is the sweet spot.`,
      },
      {
        id: "normally-open-vs-normally-closed",
        title: "Normally Open (NO) vs Normally Closed (NC)",
        content: `Tactile buttons are Normally Open (NO)—their contacts are separated until actuated. Industrial emergency stop (E-stop) switches and safety interlocks are wired Normally Closed (NC) in series; if a safety wire is accidentally severed or cut, the circuit breaks open, immediately triggering an emergency shutdown.`,
      },
    ],
    codeExamples: [
      {
        title: "Switch Logic Resolver in C",
        language: "c",
        code: `// Resolving switch state based on circuit topology
#include <stdio.h>
#include <stdbool.h>

typedef enum { PULL_UP, PULL_DOWN } PullTopology;

bool isSwitchActive(bool pinLogicLevel, PullTopology topology) {
  if (topology == PULL_UP) {
    return pinLogicLevel == false; // Active LOW: 0V means pressed
  } else {
    return pinLogicLevel == true;  // Active HIGH: 5V means pressed
  }
}

int main(void) {
  printf("Pull-Up (Pin=0): %s\\n", isSwitchActive(false, PULL_UP) ? "PRESSED" : "RELEASED");
  printf("Pull-Up (Pin=1): %s\\n", isSwitchActive(true, PULL_UP) ? "PRESSED" : "RELEASED");
  printf("Pull-Down (Pin=1): %s\\n", isSwitchActive(true, PULL_DOWN) ? "PRESSED" : "RELEASED");
  return 0;
}`,
        description: "Interpreting digital logic levels for pull-up and pull-down configurations.",
      },
    ],
    exercise: exercise(
      "ex-bb-switch-eval",
      "Evaluate Pull-Up vs Pull-Down Switch States",
      "Write a function `getSwitchAction(topology, rawReading)` where `topology` is either `'PULLUP'` or `'PULLDOWN'`, and `rawReading` is `0` or `1`. Return `'PRESSED'` or `'RELEASED'`. For `'PULLUP'`, reading `0` is `'PRESSED'`. For `'PULLDOWN'`, reading `1` is `'PRESSED'`. Test with `('PULLUP', 0)` and `('PULLDOWN', 0)`. Print both results separated by a comma.",
      `function getSwitchAction(topology, rawReading) {
  if (topology === 'PULLUP') {
    return rawReading === 0 ? 'PRESSED' : 'RELEASED';
  } else {
    return rawReading === 1 ? 'PRESSED' : 'RELEASED';
  }
}

console.log(getSwitchAction('PULLUP', 0) + "," + getSwitchAction('PULLDOWN', 0));`,
      "bb-switch-pullups",
      "Interpret digital input logic levels across pull-up and pull-down circuit topologies.",
      [
        "For PULLUP: 0 = PRESSED, 1 = RELEASED.",
        "For PULLDOWN: 1 = PRESSED, 0 = RELEASED.",
        "Expected output: 'PRESSED,RELEASED'.",
      ],
      "Beginner",
      `function getSwitchAction(topology, rawReading) {
  // Return 'PRESSED' or 'RELEASED'
  return "";
}

console.log(getSwitchAction('PULLUP', 0) + "," + getSwitchAction('PULLDOWN', 0));`,
      [
        testCase("tc-bb-switch-act", "Evaluates PULLUP pressed and PULLDOWN released", "PRESSED,RELEASED"),
        testCase("tc-bb-switch-inv", "Evaluates PULLUP released and PULLDOWN pressed", "RELEASED,PRESSED", "", true),
      ],
    ),
    checkpoint: checkpoint(
        "Why does an unconnected microcontroller input pin oscillate randomly between 0 and 1?",
        "CMOS inputs have high impedance (>100MΩ) and act as sensitive antennas that pick up electromagnetic radiation and static charges unless tied to a rail by a pull resistor.",
      ),
  },

  // Module 3: Voltage Dividers & Circuit Debugging
  {
    id: "breadboard-voltage-dividers",
    order: 5,
    title: "Voltage Divider Networks, Potentiometers & Sensor Interfacing",
    summary: "Construct two-resistor voltage dividers, calculate output potential, and integrate resistive sensors (LDRs, thermistors).",
    type: "guided-coding",
    objectiveIds: ["bb-voltage-dividers"],
    prerequisiteLessonIds: ["breadboard-switch-pullups"],
    estimatedDurationMinutes: 30,
    interactiveDemo: {
      kind: "circuit",
      title: "Interactive Voltage Divider & LDR Lab",
      description: "Vary R1 and R2 values to measure output voltage dynamically and explore light-dependent resistor curves.",
    },
    content: `# Voltage Divider Networks, Potentiometers & Sensor Interfacing

The voltage divider is the most widely used passive circuit in electrical engineering. It converts a high voltage into a lower proportional voltage using just two series resistors.

## The Voltage Divider Equation

When two resistors $R_1$ and $R_2$ are placed in series across an input voltage $V_{in}$:
\`\`\`
       V_in
        │
       [R_1]
        │
        ├───> V_out
        │
       [R_2]
        │
       GND
\`\`\`
Since the same current $I = V_{in} / (R_1 + R_2)$ flows through both resistors:
\`\`\`
V_out = I * R_2 = V_in * (R_2 / (R_1 + R_2))
\`\`\`

## Interfacing Variable Resistive Sensors

Many natural sensors change their internal resistance in response to the environment:
- **Photoresistor (LDR)**: Resistance drops from $100\\,\\text{k}\\Omega$ in complete darkness to $<1\\,\\text{k}\\Omega$ in bright sunlight.
- **Thermistor (NTC)**: Resistance decreases as temperature rises.
- **Force Sensitive Resistor (FSR)**: Resistance drops when mechanical pressure is applied.

Because microcontrollers cannot measure raw ohms directly—they can only measure **voltage** via an ADC—we place the sensor in a voltage divider circuit with a fixed reference resistor (typically $10\\,\\text{k}\\Omega$). As ambient light or temperature changes, the divider ratio shifts, creating a changing output voltage that the ADC easily reads!`,
    theorySections: [
      {
        id: "divider-loading-effect",
        title: "The Loading Effect (Source Impedance)",
        content: `The ideal divider formula assumes no current flows out of the V_out node. If you connect a load with low resistance (R_load) across R_2, the effective lower resistance becomes (R_2 || R_load), which sags the output voltage below the calculated value. To prevent loading, the ADC input impedance must be at least 10x to 100x larger than R_2.`,
      },
      {
        id: "potentiometer-as-divider",
        title: "Potentiometers: Continuously Variable Dividers",
        content: `A rotary potentiometer is a physical implementation of a voltage divider. The two outer lugs connect across the full resistive track (e.g. 10kΩ between VCC and GND). The center lug is a sliding wiper that taps off voltage at any point along the track, providing a smoothly variable 0V to VCC reference.`,
      },
    ],
    codeExamples: [
      {
        title: "Voltage Divider Calculator in C",
        language: "c",
        code: `// Voltage divider output calculator
#include <stdio.h>

float calculateVout(float vIn, float r1, float r2) {
  return vIn * (r2 / (r1 + r2));
}

int main(void) {
  printf("5V with R1=10k, R2=10k -> %.2f V\\n", calculateVout(5.0f, 10000.0f, 10000.0f));
  printf("5V with R1=1k, R2=2k   -> %.2f V\\n", calculateVout(5.0f, 1000.0f, 2000.0f));
  printf("12V with R1=10k, R2=5k -> %.2f V\\n", calculateVout(12.0f, 10000.0f, 5000.0f));
  return 0;
}`,
        description: "Computing output voltage for arbitrary resistor divider pairs.",
      },
    ],
    exercise: exercise(
      "ex-bb-divider-calc",
      "Calculate Voltage Divider Output",
      "Write a function `dividerVoltage(vIn, r1, r2)` that returns the output voltage rounded to 2 decimal places: `Number((vIn * (r2 / (r1 + r2))).toFixed(2))`. Compute the output for `vIn = 5.0, r1 = 10000, r2 = 10000` (equal resistors) and `vIn = 5.0, r1 = 1000, r2 = 2000`. Print both results separated by a comma.",
      `function dividerVoltage(vIn, r1, r2) {
  return Number((vIn * (r2 / (r1 + r2))).toFixed(2));
}

console.log(dividerVoltage(5.0, 10000, 10000) + "," + dividerVoltage(5.0, 1000, 2000));`,
      "bb-voltage-dividers",
      "Calculate intermediate node voltages in passive resistor divider networks.",
      [
        "Compute vIn * (r2 / (r1 + r2)).",
        "For 10k/10k: 5.0 * (10000/20000) = 2.50V.",
        "For 1k/2k: 5.0 * (2000/3000) = 3.33V.",
        "Expected output: '2.5,3.33'.",
      ],
      "Beginner",
      `function dividerVoltage(vIn, r1, r2) {
  // Calculate divider voltage
  return 0;
}

console.log(dividerVoltage(5.0, 10000, 10000) + "," + dividerVoltage(5.0, 1000, 2000));`,
      [
        testCase("tc-bb-div-calc", "Calculates midscale and stepped divider voltages", "2.5,3.33"),
        testCase("tc-bb-div-12v", "Calculates 12V automotive battery division", "4", "", true),
      ],
    ),
    checkpoint: checkpoint(
        "Why is a fixed resistor required when measuring a photoresistor (LDR) with a microcontroller ADC?",
        "An ADC measures voltage, not resistance. Placing the LDR in series with a fixed resistor forms a voltage divider that translates changing resistance into measurable changing voltage.",
      ),
  },

  // Lesson 6: Circuit Troubleshooting & Multimeter Testing
  {
    id: "breadboard-troubleshooting",
    order: 6,
    title: "Circuit Troubleshooting with Multimeters, Continuity & Probe Testing",
    summary: "Diagnose short circuits, bad jumpers, and missing grounds using digital multimeter continuity buzzers and voltage probes.",
    type: "guided-coding",
    objectiveIds: ["bb-troubleshooting"],
    prerequisiteLessonIds: ["breadboard-voltage-dividers"],
    estimatedDurationMinutes: 30,
    interactiveDemo: {
      kind: "circuit",
      title: "Interactive Virtual Multimeter & Debugger Lab",
      description: "Place red and black virtual multimeter probes across breadboard pins to test continuity beep, voltage, and resistance.",
    },
    content: `# Circuit Troubleshooting with Multimeters, Continuity & Probe Testing

In physical computing, circuits rarely work on the very first try. Hardware engineering requires a systematic diagnostic methodology rather than guessing.

## The 4 Primary Digital Multimeter (DMM) Modes

1. **Continuity Mode (The Beeper 🔊)**:
   - Emits an audible tone when resistance between the two probes is less than $\\sim 30\\,\\Omega$.
   - **RULE #1**: **ONLY USE CONTINUITY WITH POWER DISCONNECTED!** Testing an energized circuit can blow the internal DMM fuse.
   - Use it to verify jumper wire integrity, find invisible solder bridges, and confirm switch contact closure.
2. **DC Voltage Mode ($V_{\\underline{--}}$)**:
   - Measured with circuit **POWERED ON**.
   - Black probe connects to the common **GND rail**.
   - Red probe taps nodes through the circuit to verify that voltages match theoretical design expectations.
3. **Resistance Mode ($\\Omega$)**:
   - Power must be **DISCONNECTED**.
   - Measures ohms across passive components.
4. **DC Current Mode ($A$ / $mA$)**:
   - Requires breaking the circuit open and inserting the meter in **series** so all current passes through the internal shunt resistor.

## The 5-Step Breadboard Debugging Checklist

Whenever a circuit fails to operate, execute this checklist in order:
1. **The Shared Ground**: Are all ground pins (MCU, sensor, external battery) tied to the same breadboard GND rail?
2. **Power Rail Splits**: Has your power reached both sides of the board, or is the center gap unbridged?
3. **Component Polarity**: Are electrolytic capacitors and LEDs inserted in the correct orientation?
4. **Jumper Wire Breakage**: Cheap jumper wires frequently break internally inside the molded plastic boot while looking fine externally. Test with the continuity buzzer!
5. **Off-by-One Row Errors**: Is a jumper wire accidentally plugged into hole 14 instead of 15?`,
    theorySections: [
      {
        id: "dmm-input-impedance-burden",
        title: "Multimeter Input Impedance & Voltmeter Loading",
        content: `A quality digital multimeter has an internal input resistance of 10 MΩ in DC Voltage mode. This high resistance ensures that the meter draws negligible current (<0.5 µA at 5V) during measurement, preventing the probe from altering the voltage of the circuit being tested.`,
      },
      {
        id: "current-mode-blown-fuses",
        title: "The Danger of Current Mode Shunt Shorts",
        content: `In Current mode (Amps/mA), the multimeter behaves like a direct piece of wire (near-zero resistance). If a beginner accidentally probes across 5V and GND in Amps mode, it creates a massive short circuit across the power supply, instantly blowing the multimeter's internal fast-acting ceramic protection fuse.`,
      },
    ],
    codeExamples: [
      {
        title: "Automated Diagnostic Decision Tree in C",
        language: "c",
        code: `// Diagnostic decision tree for breadboard debugging
#include <stdio.h>
#include <stdbool.h>

const char* diagnoseCircuit(bool powerLedOn, float measuredVcc, bool groundContinuity) {
  if (!groundContinuity) return "FAULT: Common Ground disconnected or open";
  if (measuredVcc < 4.5f) return "FAULT: Excessive voltage sag or short circuit loading power rail";
  if (!powerLedOn) return "FAULT: LED reverse polarity or open circuit";
  return "OK: Power delivery and ground reference verified";
}

int main(void) {
  printf("Test 1: %s\\n", diagnoseCircuit(false, 5.0f, true));
  printf("Test 2: %s\\n", diagnoseCircuit(true, 5.0f, false));
  printf("Test 3: %s\\n", diagnoseCircuit(true, 5.0f, true));
  return 0;
}`,
        description: "Rule-based diagnostics for identifying common physical circuit wiring faults.",
      },
    ],
    exercise: exercise(
      "ex-bb-debug-checklist",
      "Diagnose Breadboard Fault from Measurements",
      "Write a function `diagnoseFault(vMeasured, continuityGnd, ledOriented)` where `vMeasured` is a number (measured volts), `continuityGnd` is boolean, and `ledOriented` is boolean. Return `'NO_GROUND'` if continuityGnd is false. Otherwise, return `'VOLTAGE_SAG'` if vMeasured < 4.5. Otherwise, return `'REVERSED_LED'` if ledOriented is false. Otherwise return `'HEALTHY'`. Test with `(5.0, true, true)` and `(3.2, true, true)`. Print both results separated by a comma.",
      `function diagnoseFault(vMeasured, continuityGnd, ledOriented) {
  if (!continuityGnd) return 'NO_GROUND';
  if (vMeasured < 4.5) return 'VOLTAGE_SAG';
  if (!ledOriented) return 'REVERSED_LED';
  return 'HEALTHY';
}

console.log(diagnoseFault(5.0, true, true) + "," + diagnoseFault(3.2, true, true));`,
      "bb-troubleshooting",
      "Apply systematic troubleshooting logic to isolate physical circuit failures.",
      [
        "Check continuityGnd first -> 'NO_GROUND'.",
        "Check vMeasured < 4.5 -> 'VOLTAGE_SAG'.",
        "Check ledOriented -> 'REVERSED_LED'.",
        "Expected output: 'HEALTHY,VOLTAGE_SAG'.",
      ],
      "Beginner",
      `function diagnoseFault(vMeasured, continuityGnd, ledOriented) {
  // Return diagnostic outcome string
  return "";
}

console.log(diagnoseFault(5.0, true, true) + "," + diagnoseFault(3.2, true, true));`,
      [
        testCase("tc-bb-diag-pass", "Identifies healthy circuit and voltage sag", "HEALTHY,VOLTAGE_SAG"),
        testCase("tc-bb-diag-gnd", "Identifies missing ground reference", "NO_GROUND", "", true),
      ],
    ),
    checkpoint: checkpoint(
        "Why must electrical power be disconnected before using a digital multimeter's continuity buzzer mode?",
        "Continuity mode sends a small internal test current through the probes. Applying external circuit voltage can damage the meter's internal measurement circuit or blow its protection fuse.",
      ),
  },

  {
    id: "bb-diode-rectification-clipping",
    order: 7,
    title: "Diodes, Forward Voltage Drop & Rectification",
    summary: "Understand PN junction diodes, 0.7V forward threshold, reverse polarity protection, and half-wave rectification.",
    type: "interactive-simulation",
    objectiveIds: ["bb-diodes"],
    prerequisiteLessonIds: ["breadboard-troubleshooting"],
    estimatedDurationMinutes: 30,
    interactiveDemo: {
      kind: "circuit",
      title: "Diode Rectification & Clipping Lab",
      description: "Interactive diode IV curve, forward bias voltage drop, and half-wave rectifier waveform with smoothing capacitor.",
    },
    content: `# Diodes, Forward Voltage Drop & Rectification

A **diode** is a semiconductor one-way valve for electric current. It permits current to flow from **Anode** to **Cathode** when forward-biased, but blocks current in reverse bias.

## Forward Voltage Drop ($V_f$)
- Standard Silicon PN Junction (e.g. 1N4001, 1N4148): $V_f \\approx 0.7\\,\\text{V}$.
- Schottky Diode (e.g. 1N5819): $V_f \\approx 0.3\\,\\text{V}$ (preferred for solar and battery power paths due to lower power loss).

## Flyback Diode Protection
When inductive loads (solenoids, DC motors, relays) are turned off, the collapsing magnetic field generates a massive reverse voltage spike ($V = -L \\frac{di}{dt}$) that can exceed hundreds of volts, destroying driving transistors. Placing a reverse-biased **flyback diode** across the coil safely circulates and clamps the inductive energy.`,
    theorySections: [
      {
        id: "bb-rectifier-ripple",
        title: "Half-Wave vs. Full-Wave Rectification",
        content: "A single diode half-wave rectifier passes only the positive half-cycle of an AC waveform. A reservoir capacitor across the output smooths the pulsing DC, with ripple voltage inversely proportional to capacitance and load resistance (V_ripple ≈ I / (f * C)).",
      },
    ],
    codeExamples: [
      {
        title: "Microcontroller Reverse Polarity & Flyback Monitor in C",
        language: "c",
        code: `// C routine simulating diode voltage drop and inductive clamp check
#include <stdio.h>

float calculateDeliveredVoltage(float vSupply, float vForwardDrop) {
    if (vSupply < vForwardDrop) return 0.0f;
    return vSupply - vForwardDrop;
}

int main(void) {
    float vIn = 5.0f;
    float vDelivered = calculateDeliveredVoltage(vIn, 0.7f);
    printf("Supply: %.1fV, Delivered after diode: %.1fV\\n", vIn, vDelivered);
    return 0;
}`,
        description: "Modeling silicon diode forward voltage drop on a 5V breadboard rail.",
      },
    ],
    exercise: exercise(
      "ex-bb-diode-calc",
      "Calculate Delivered Voltage after Reverse Polarity Diode",
      "Write a function `deliveredVoltage(vIn, diodeType)`: if diodeType is 'silicon', subtract 0.7V; if 'schottky', subtract 0.3V. If vIn is negative (reverse polarity) or less than the drop, return 0.0. Calculate for (5.0, 'silicon') and (5.0, 'schottky') rounded to 1 decimal place. Print: `Silicon: ${res1.toFixed(1)}V, Schottky: ${res2.toFixed(1)}V`.",
      `function deliveredVoltage(vIn, diodeType) {
  if (vIn <= 0) return 0.0;
  const drop = diodeType === 'schottky' ? 0.3 : 0.7;
  return vIn < drop ? 0.0 : vIn - drop;
}

const v1 = deliveredVoltage(5.0, 'silicon');
const v2 = deliveredVoltage(5.0, 'schottky');
console.log(\`Silicon: \${v1.toFixed(1)}V, Schottky: \${v2.toFixed(1)}V\`);`,
      "bb-diodes",
      "Model diode forward voltage drops in DC circuits.",
      [
        "Subtract 0.7 for silicon and 0.3 for schottky.",
        "Handle reverse polarity by returning 0.0 when vIn <= 0.",
        "Print 'Silicon: 4.3V, Schottky: 4.7V'.",
      ],
      "Developing",
      `function deliveredVoltage(vIn, diodeType) {
  // Implement diode voltage drop calculation
}

// Calculate and print Silicon: 4.3V, Schottky: 4.7V
`,
      [
        {
          id: "tc-diode-1",
          label: "Correctly computes silicon and schottky voltage drops",
          stdin: "",
          expectedStdout: "Silicon: 4.3V, Schottky: 4.7V",
          matchMode: "trimmed",
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why is a Schottky diode preferred over a silicon diode for battery reverse-polarity protection in low-voltage circuits?",
      "Schottky diodes have a significantly lower forward voltage drop (0.3V vs 0.7V), wasting far less power as heat and delivering more voltage to the system.",
    ),
  },

  {
    id: "bb-bjt-transistor-switch",
    order: 8,
    title: "NPN BJT Transistors as Digital Switches",
    summary: "Control high-current loads (motors, relays, LED strips) from low-current microcontroller GPIO pins using 2N2222 / 2N3904 NPN transistors.",
    type: "interactive-simulation",
    objectiveIds: ["bb-bjt-switches"],
    prerequisiteLessonIds: ["bb-diode-rectification-clipping"],
    estimatedDurationMinutes: 35,
    interactiveDemo: {
      kind: "circuit",
      title: "BJT Transistor Switch Simulator",
      description: "Interactive NPN transistor circuit showing base drive current, collector load current, and cutoff vs. saturation modes.",
    },
    content: `# NPN BJT Transistors as Digital Switches

A microcontroller GPIO pin can only safely supply $20\\text{ to }40\\,\\text{mA}$ of current at $3.3\\,\\text{V}$ or $5\\,\\text{V}$. Driving a $200\\,\\text{mA}$ DC motor, solenoid, or high-power LED array directly from a GPIO will permanently destroy the microcontroller chip.

## The NPN BJT Switch Topology
A Bipolar Junction Transistor (e.g. 2N2222, 2N3904, BC547) acts as a current-controlled digital switch:
- **Base ($B$)**: Connected to the microcontroller GPIO through a current-limiting base resistor $R_b$.
- **Collector ($C$)**: Connected to the low side of the load (load connects between $+V_{cc}$ and Collector).
- **Emitter ($E$)**: Connected directly to the common ground (**GND**) rail.

## Sizing the Base Resistor ($R_b$)
To ensure the transistor enters full **saturation** (turned fully ON with minimum voltage drop $V_{CE(sat)} \\approx 0.2\\,\\text{V}$), designers use a forced beta of $\\beta_{forced} = 10$:
$$I_b = \\frac{I_c}{10}, \\quad R_b = \\frac{V_{GPIO} - V_{BE}}{I_b} = \\frac{V_{GPIO} - 0.7\\,\\text{V}}{I_b}$$`,
    theorySections: [
      {
        id: "bb-bjt-saturation-mode",
        title: "Cutoff vs. Saturation vs. Active Region",
        content: "In digital switching, transistors operate strictly in Cutoff (V_be < 0.7V, I_c = 0, switch OPEN) or Saturation (I_b > I_c / beta, V_ce ≈ 0.2V, switch CLOSED). Operating in the active linear region causes excessive heat dissipation in the transistor (P = V_ce * I_c).",
      },
    ],
    codeExamples: [
      {
        title: "Microcontroller Transistor Base Pulse Driver in C",
        language: "c",
        code: `// C sketch controlling an NPN transistor switch on Arduino Pin 9
#define MOTOR_SWITCH_PIN 9

void setup() {
  pinMode(MOTOR_SWITCH_PIN, OUTPUT);
}

void loop() {
  digitalWrite(MOTOR_SWITCH_PIN, HIGH); // Saturate transistor: Motor ON
  delay(1000);
  digitalWrite(MOTOR_SWITCH_PIN, LOW);  // Cutoff transistor: Motor OFF
  delay(1000);
}`,
        description: "Pulsing an NPN transistor base to switch high-current loads safely.",
      },
    ],
    exercise: exercise(
      "ex-bb-bjt-base-calc",
      "Size the Base Resistor for a 100mA Load",
      "A microcontroller with 5V GPIO drives a 100mA motor via an NPN transistor. Using forced beta = 10: Ib = 100mA / 10 = 10mA (0.01A). Base-emitter drop Vbe = 0.7V. Compute Rb in Ohms: (5.0 - 0.7) / 0.01. Write a function calculateBaseResistor(vGpio, iLoad, betaForced) and print 'Rb: ' followed by the integer ohm value.",
      `function calculateBaseResistor(vGpio, iLoad, betaForced) {
  const iBase = iLoad / betaForced;
  const vDrop = vGpio - 0.7;
  return Math.round(vDrop / iBase);
}

const rb = calculateBaseResistor(5.0, 0.10, 10);
console.log(\`Rb: \${rb} ohms\`);`,
      "bb-bjt-switches",
      "Calculate transistor base resistance for saturated switching.",
      [
        "Compute iBase = iLoad / betaForced.",
        "Calculate (vGpio - 0.7) / iBase.",
        "Print 'Rb: 430 ohms'.",
      ],
      "Developing",
      `function calculateBaseResistor(vGpio, iLoad, betaForced) {
  // Implement base resistor calculation
}

// Calculate for 5.0V, 0.10A, beta 10 and print Rb: 430 ohms
`,
      [
        {
          id: "tc-bjt-1",
          label: "Calculates correct base resistance for 100mA load",
          stdin: "",
          expectedStdout: "Rb: 430 ohms",
          matchMode: "trimmed",
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why is a base resistor mandatory when connecting a microcontroller GPIO to an NPN transistor base?",
      "The base-emitter junction acts like a forward-biased silicon diode to ground (0.7V). Without a resistor, the GPIO pin would short into ground through the junction, destroying the microcontroller pin.",
    ),
  },

  {
    id: "bb-555-timer-astable",
    order: 9,
    title: "555 Timer Astable Multivibrator Pulse Generator",
    summary: "Wire the classic 555 IC in astable mode with two resistors and a capacitor to generate continuous square-wave clock pulses.",
    type: "interactive-simulation",
    objectiveIds: ["bb-555-astable"],
    prerequisiteLessonIds: ["bb-bjt-transistor-switch"],
    estimatedDurationMinutes: 35,
    interactiveDemo: {
      kind: "circuit",
      title: "555 Timer Astable Circuit Lab",
      description: "Interactive 555 timer breadboard wiring showing capacitor charge/discharge between 1/3 Vcc and 2/3 Vcc.",
    },
    content: `# 555 Timer Astable Multivibrator Pulse Generator

The **NE555 Timer** is the most widely produced integrated circuit in electronics history. In **Astable mode**, it continuously oscillates without external triggering, serving as an autonomous hardware clock generator for LEDs, buzzers, and counters.

## Astable Wiring & Timing Components
- $R_1$: Connected between $V_{cc}$ (Pin 8/4) and Discharge (Pin 7).
- $R_2$: Connected between Discharge (Pin 7) and Threshold/Trigger (Pins 6 and 2 tied together).
- $C_1$: Connected between Pins 6/2 and ground (GND).

## Frequency and Duty Cycle Formulas
The capacitor charges through $(R_1 + R_2)$ and discharges strictly through $R_2$:
- **High Time ($t_{high}$)**: $0.693 \\times (R_1 + R_2) \\times C$
- **Low Time ($t_{low}$)**: $0.693 \\times R_2 \\times C$
- **Total Period ($T$)**: $t_{high} + t_{low} = 0.693 \\times (R_1 + 2 R_2) \\times C$
- **Frequency ($f$)**: $\\frac{1.44}{(R_1 + 2 R_2) \\times C}$`,
    theorySections: [
      {
        id: "bb-555-internal-comparators",
        title: "Internal Voltage Divider and Flip-Flop",
        content: "Inside the 555 IC, three 5kΩ resistors divide Vcc into 1/3 Vcc and 2/3 Vcc reference thresholds. Two analog comparators monitor these points to set and reset an internal SR latch, cycling the discharge transistor.",
      },
    ],
    codeExamples: [
      {
        title: "Microcontroller Frequency Measurement of 555 Clock in C",
        language: "c",
        code: `// C sketch measuring external 555 timer clock pulses on Arduino Pin 2
#include <stdio.h>

float calculate555Frequency(float r1, float r2, float cFarads) {
    return 1.44f / ((r1 + 2.0f * r2) * cFarads);
}

int main(void) {
    float r1 = 1000.0f;    // 1k ohm
    float r2 = 10000.0f;   // 10k ohm
    float c = 0.000010f;   // 10 uF
    printf("Clock frequency: %.2f Hz\\n", calculate555Frequency(r1, r2, c));
    return 0;
}`,
        description: "Calculating theoretical oscillation frequency for a breadboard 555 timer.",
      },
    ],
    exercise: exercise(
      "ex-bb-555-freq-calc",
      "Calculate 555 Astable Frequency and Period",
      "Write a function `calculate555Timer(r1, r2, cFarads)`: calculate total period T = 0.693 * (r1 + 2 * r2) * cFarads, and frequency f = 1 / T. For r1 = 10000 (10k), r2 = 47000 (47k), cFarads = 0.000010 (10uF): return { t: T.toFixed(2), f: f.toFixed(2) }. Print: `Period: ${res.t}s, Frequency: ${res.f}Hz`.",
      `function calculate555Timer(r1, r2, cFarads) {
  const T = 0.693 * (r1 + 2 * r2) * cFarads;
  const f = 1 / T;
  return { t: T.toFixed(2), f: f.toFixed(2) };
}

const res = calculate555Timer(10000, 47000, 0.000010);
console.log(\`Period: \${res.t}s, Frequency: \${res.f}Hz\`);`,
      "bb-555-astable",
      "Calculate timing characteristics of a 555 astable multivibrator.",
      [
        "Compute T = 0.693 * (r1 + 2 * r2) * cFarads.",
        "Calculate frequency f = 1 / T.",
        "Print 'Period: 0.72s, Frequency: 1.39Hz'.",
      ],
      "Developing",
      `function calculate555Timer(r1, r2, cFarads) {
  // Implement 555 timer math
}

// Calculate for 10k, 47k, 10uF and print Period: 0.72s, Frequency: 1.39Hz
`,
      [
        {
          id: "tc-555-1",
          label: "Calculates correct period and frequency for 555 timer",
          stdin: "",
          expectedStdout: "Period: 0.72s, Frequency: 1.39Hz",
          matchMode: "trimmed",
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why can a standard 555 timer astable circuit never achieve a duty cycle under 50% without an added steering diode?",
      "Because the capacitor charges through both R1 and R2, but discharges strictly through R2, meaning charge time (thigh) is always strictly greater than discharge time (tlow).",
    ),
  },

  {
    id: "bb-capstone-hardware-prototype",
    order: 10,
    title: "Comprehensive Breadboard Prototyping Assessment",
    summary: "Synthesize bus power distribution, pull-up/pull-down switching, voltage dividers, active semiconductors, and multimeter fault diagnosis.",
    type: "assessment",
    objectiveIds: ["bb-capstone-proto"],
    prerequisiteLessonIds: ["bb-555-timer-astable"],
    estimatedDurationMinutes: 40,
    interactiveDemo: {
      kind: "circuit",
      title: "Interactive Complete Hardware Prototyping Studio",
      description: "Full virtual breadboard laboratory with voltage regulators, active semiconductors, pushbuttons, LEDs, and virtual test equipment.",
    },
    content: `# Comprehensive Breadboard Prototyping Assessment

This capstone assessment validates your mastery across the complete spectrum of solderless breadboard prototyping and circuit diagnosis:
1. **Physical Bus Continuity**: Power rail bridging, common ground bonding, and decoupling.
2. **Component Protection**: Sizing resistors for LEDs and inductive clamp flyback diodes.
3. **Digital & Analog Interfacing**: Noise-immune pull resistors and two-resistor voltage dividers.
4. **Active Control**: NPN BJT digital switches and autonomous 555 clock generators.
5. **Systematic Troubleshooting**: Using digital multimeter voltage and continuity modes to locate faults.`,
    theorySections: [
      {
        id: "bb-capstone-rubric",
        title: "Hardware Engineering Assessment Rubric",
        content: "Prototypes are evaluated for common ground continuity, appropriate thermal and current derating, neat color-coded jumper wiring, and zero short-circuit power hazards.",
      },
    ],
    codeExamples: [
      {
        title: "Complete Hardware Verification Routine in C",
        language: "c",
        code: `// C sketch validating power rails, button input, and transistor driver
#include <stdio.h>
#include <stdbool.h>

struct CircuitStatus {
    bool commonGndVerified;
    float vRail5V;
    bool switchDebounced;
};

void printAudit(struct CircuitStatus s) {
    if (s.commonGndVerified && s.vRail5V >= 4.8f && s.switchDebounced) {
        printf("PROTOTYPE VERIFIED: Circuit is safe for deployment.\\n");
    } else {
        printf("PROTOTYPE FAULT: Check power rails and ground bonding.\\n");
    }
}

int main(void) {
    struct CircuitStatus ok = { true, 4.95f, true };
    printAudit(ok);
    return 0;
}`,
        description: "Checking hardware prototype health parameters before energizing.",
      },
    ],
    exercise: exercise(
      "ex-bb-capstone-audit",
      "Run Complete Hardware Prototype Design Audit",
      "Write a function `auditBreadboardPrototype(vRail, gndContinuity, hasFlybackDiode, rBaseSized)` that returns `{ pass: boolean, issues: string[] }`. Check: 1) gndContinuity must be true (else add 'MISSING_GND'). 2) vRail must be between 4.75 and 5.25 (else add 'OUT_OF_SPEC_VOLTAGE'). 3) hasFlybackDiode must be true (else add 'UNPROTECTED_INDUCTOR'). 4) rBaseSized must be true (else add 'UNSAFE_BASE_DRIVE'). pass is true if issues.length === 0. Test with a valid circuit `(5.0, true, true, true)` and print `Audit: ${res.pass ? 'PASS' : 'FAIL'}, Issues: ${res.issues.length}`.",
      `function auditBreadboardPrototype(vRail, gndContinuity, hasFlybackDiode, rBaseSized) {
  const issues = [];
  if (!gndContinuity) issues.push('MISSING_GND');
  if (vRail < 4.75 || vRail > 5.25) issues.push('OUT_OF_SPEC_VOLTAGE');
  if (!hasFlybackDiode) issues.push('UNPROTECTED_INDUCTOR');
  if (!rBaseSized) issues.push('UNSAFE_BASE_DRIVE');
  return { pass: issues.length === 0, issues };
}

const res = auditBreadboardPrototype(5.0, true, true, true);
console.log(\`Audit: \${res.pass ? 'PASS' : 'FAIL'}, Issues: \${res.issues.length}\`);`,
      "bb-capstone-proto",
      "Validate circuit prototype safety and electrical design criteria.",
      [
        "Verify all 4 safety criteria.",
        "Ensure pass is true and issues.length is 0 for nominal input.",
        "Print 'Audit: PASS, Issues: 0'.",
      ],
      "Applied",
      `function auditBreadboardPrototype(vRail, gndContinuity, hasFlybackDiode, rBaseSized) {
  // Implement prototype design audit
}

// Audit healthy circuit and print Audit: PASS, Issues: 0
`,
      [
        {
          id: "tc-bb-cap-1",
          label: "Verifies healthy prototype passes audit with 0 issues",
          stdin: "",
          expectedStdout: "Audit: PASS, Issues: 0",
          matchMode: "trimmed",
        },
      ],
    ),
    checkpoint: checkpoint(
      "What is the single most common cause of erratic, intermittent behavior in breadboard circuits interfacing multiple modules?",
      "A missing or unbonded common ground (GND) wire between separate boards or power supplies, leaving signals without a shared 0V reference.",
    ),
  },
];

export const breadboardElectronicsModules: LearningModule[] = [
  moduleData(
    "bb-module-anatomy-power",
    1,
    "Solderless Breadboard Anatomy & Power Rails",
    "Master internal phosphor-bronze spring clips, DIP isolation trenches, power buses, and bypass decoupling.",
    breadboardElectronicsLessons.slice(0, 2),
  ),
  moduleData(
    "bb-module-passives-switches",
    2,
    "Passive Components & Switches",
    "Calculate LED current limiting, decode resistor color bands, and eliminate floating CMOS gate noise with pull resistors.",
    breadboardElectronicsLessons.slice(2, 4),
  ),
  moduleData(
    "bb-module-dividers-debug",
    3,
    "Voltage Dividers & Circuit Debugging",
    "Construct two-resistor voltage dividers, interface sensors, and troubleshoot circuits with digital multimeters.",
    breadboardElectronicsLessons.slice(4, 6),
  ),
  moduleData(
    "bb-module-active-semiconductors",
    4,
    "Active Semiconductors & Prototyping Projects",
    "Diode rectifiers, BJT transistor switches, 555 timer pulse generators, and hardware prototyping assessment.",
    breadboardElectronicsLessons.slice(6),
  ),
];

export const breadboardElectronicsCourse: LearningCourse = {
  id: "breadboard-electronics",
  subjectId: "breadboard-electronics-subject",
  title: "Practical Breadboard Prototyping & Circuits",
  description: "Master physical circuit prototyping on solderless breadboards, terminal bus architectures, current limiting, voltage dividers, active semiconductors, and multimeter troubleshooting.",
  level: "Beginner",
  version: "1.0.0",
  prerequisites: ["Elementary algebra", "Basic curiosity about physical computing"],
  objectives,
  learningOutcomes: [
    "Trace internal spring-clip rows and understand DIP component isolation trenches.",
    "Distribute dual power rails and eliminate power rail interruptions caused by split gaps.",
    "Size current-limiting resistors for any LED color using Ohm's Law.",
    "Wire tactile momentary pushbuttons with pull-up and pull-down resistor networks.",
    "Design two-resistor voltage divider circuits and interface resistive analog sensors.",
    "Systematically troubleshoot faulty hardware prototypes using digital multimeters.",
    "Integrate silicon/Schottky diodes for reverse polarity and inductive flyback protection.",
    "Drive high-current DC loads safely using NPN BJT transistor switches and 555 timer clocks."
  ],
  estimatedDurationMinutes: 240,
  publicationStatus: "published",
  modules: breadboardElectronicsModules,
};

export const breadboardElectronicsCourseSummary = {
  id: breadboardElectronicsCourse.id,
  subjectId: breadboardElectronicsCourse.subjectId,
  title: breadboardElectronicsCourse.title,
  description: breadboardElectronicsCourse.description,
  level: breadboardElectronicsCourse.level,
  version: breadboardElectronicsCourse.version,
  prerequisites: breadboardElectronicsCourse.prerequisites,
  objectives: breadboardElectronicsCourse.objectives,
  learningOutcomes: breadboardElectronicsCourse.learningOutcomes,
  estimatedDurationMinutes: breadboardElectronicsCourse.estimatedDurationMinutes,
  publicationStatus: breadboardElectronicsCourse.publicationStatus,
  modules: breadboardElectronicsCourse.modules.map((m) => ({
    id: m.id,
    order: m.order,
    title: m.title,
    summary: m.summary,
    lessons: m.lessons.map((l) => ({
      id: l.id,
      order: l.order,
      title: l.title,
      summary: l.summary,
      type: l.type,
      objectiveIds: l.objectiveIds,
      prerequisiteLessonIds: l.prerequisiteLessonIds,
      estimatedDurationMinutes: l.estimatedDurationMinutes,
      exercise: {
        id: l.exercise.id,
        title: l.exercise.title,
        difficulty: l.exercise.difficulty,
        expectedOutcome: l.exercise.expectedOutcome,
        prompt: l.exercise.prompt,
        objectiveId: l.exercise.objectiveId,
        starterCode: l.exercise.starterCode,
      },
      checkpoint: l.checkpoint,
      interactiveDemo: l.interactiveDemo,
    })),
  })),
};
