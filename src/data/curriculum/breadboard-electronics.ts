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
];

export const breadboardElectronicsCourse: LearningCourse = {
  id: "breadboard-electronics",
  subjectId: "breadboard-electronics-subject",
  title: "Practical Breadboard Prototyping & Circuits",
  description: "Master physical circuit prototyping on solderless breadboards, terminal bus architectures, current limiting, voltage dividers, and multimeter troubleshooting.",
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
  ],
  estimatedDurationMinutes: 150,
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
