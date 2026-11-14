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

export const arduinoEmbeddedSubject: LearningSubject = {
  id: "arduino-embedded-subject",
  title: "Arduino Uno Embedded Systems & ATmega328P",
  description: "Master physical computing, AVR Harvard architecture, digital/analog GPIO registers, PWM modulation, and non-blocking firmware state machines.",
};

const objectives: LearningObjective[] = [
  { id: "ard-sketch-lifecycle", title: "Understand ATmega328P AVR Harvard architecture, setup() initialization, and loop() execution cycles." },
  { id: "ard-digital-io", title: "Configure digital GPIO direction with pinMode(), source/sink currents, and execute single-cycle port manipulation." },
  { id: "ard-pullup-inputs", title: "Interface pushbuttons with INPUT_PULLUP and implement software debounce state filters." },
  { id: "ard-adc-analog", title: "Sample continuous analog voltages using the 10-bit Successive Approximation ADC and calculate millivolt resolutions." },
  { id: "ard-pwm-serial", title: "Generate analog-equivalent signals via Pulse-Width Modulation (PWM) and stream UART serial telemetry." },
  { id: "ard-millis-fsm", title: "Design non-blocking finite state machines using millis() time slicing to eliminate blocking delay() calls." },
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

export const arduinoEmbeddedLessons: LearningLesson[] = [
  // Module 1: Sketch Lifecycle & Digital Out
  {
    id: "arduino-sketch-lifecycle",
    order: 1,
    title: "Arduino Sketch Lifecycle, Setup/Loop & Pin Mapping",
    summary: "Understand the ATmega328P core, setup() and loop() execution lifecycles, and board header mapping.",
    type: "guided-coding",
    objectiveIds: ["ard-sketch-lifecycle"],
    prerequisiteLessonIds: [],
    estimatedDurationMinutes: 25,
    interactiveDemo: {
      kind: "circuit",
      title: "Arduino Uno Interactive Circuit Simulator",
      description: "Inspect digital pin headers, onboard LED L (Pin 13), and interactive virtual serial monitor.",
    },
    content: `# Arduino Sketch Lifecycle, Setup/Loop & Pin Mapping

The Arduino Uno is powered by the Microchip ATmega328P, an 8-bit AVR RISC microcontroller clocked at 16 MHz. Understanding the underlying execution lifecycle and memory boundaries is essential for writing reliable real-time embedded code.

## The Microcontroller Execution Cycle

Unlike desktop operating systems that launch processes in protected user space and terminate when finished, an embedded microcontroller begins executing instructions from flash memory immediately upon reset or power application and never terminates:

\`\`\`
Power Applied / Reset High
          │
          ▼
   AVR Bootloader (optiboot)
          │
          ▼
    C++ main() Entry
          │
          ├──> setup()  [Runs Exactly Once]
          │
          └──> while (true) { loop(); }  [Repeats Indefinitely]
\`\`\`

The classic Arduino \`main.cpp\` runtime boilerplate implements this lifecycle cleanly:

\`\`\`cpp
#include <Arduino.h>

int main(void) {
    init();          // Configures hardware timers for millis() and PWM
    setup();         // User hardware initialization
    for (;;) {
        loop();      // Continuous polling executive
        if (serialEventRun) serialEventRun();
    }
    return 0;
}
\`\`\`

## ATmega328P Physical Header Pinout

The Uno exposes 14 digital I/O pins (pins 0–13) and 6 analog input pins (A0–A5):
- **Pins 0 (RX) & 1 (TX)**: Connected to the ATmega16U2 USB-to-UART bridge. Using these for general I/O disrupts serial communication and sketch uploading.
- **Pins 3, 5, 6, 9, 10, 11**: Capable of 8-bit Pulse-Width Modulation (marked with \`~\`).
- **Pin 13**: Connected to the onboard surface-mount LED through an operational amplifier buffer.
- **Pins A0–A5**: Connected to the internal 10-bit Successive Approximation ADC multiplexer. Pins A4 (SDA) and A5 (SCL) also double as the hardware I2C interface bus.`,
    theorySections: [
      {
        id: "harvard-vs-von-neumann",
        title: "Harvard Architecture & SRAM Constraints",
        content: `The ATmega328P implements a modified Harvard architecture where program code resides in 32 KB of Non-Volatile Flash memory while runtime data, global variables, and the call stack share a constrained 2 KB of Static RAM (SRAM). Attempting to allocate large string literals or big arrays in SRAM quickly causes stack collisions and silent system reboots. The F() macro or PROGMEM attribute directs string literals to remain in Flash memory.`,
      },
      {
        id: "power-rails-regulation",
        title: "Power Rails, Vin & Low-Dropout Regulation",
        content: `The Uno can be powered via the 5V USB port or through the DC barrel jack (Vin). An onboard NCP1117 low-dropout (LDO) linear regulator steps down 7–12V input to a clean 5.0V system rail. Supplying more than 12V causes excessive thermal dissipation in the regulator package, risking thermal shutdown or permanent failure.`,
      },
    ],
    codeExamples: [
      {
        title: "Arduino Blink with Serial Telemetry",
        language: "c",
        code: `// Classic Blink and Serial Output
#include <stdio.h>

void setup(void) {
  printf("System Initialized at 16MHz\\n");
}

void loop(int cycle) {
  printf("Cycle %d: LED ON\\n", cycle);
  printf("Cycle %d: LED OFF\\n", cycle);
}

int main(void) {
  setup();
  for (int i = 1; i <= 3; i++) {
    loop(i);
  }
  return 0;
}`,
        description: "Emulated Arduino lifecycle demonstrating setup execution followed by repeating loop calls.",
      },
    ],
    exercise: exercise(
      "ex-ard-lifecycle-sim",
      "Simulate Arduino Setup and Loop Execution",
      "Write a function `runSketch(iterations)` that returns an array of strings representing execution logs. The first element must be `'SETUP: READY'`. Then, for each cycle from 1 up to `iterations`, add `'LOOP: TICK ' + i`. Print the output formatted as JSON for 2 iterations.",
      `function runSketch(iterations) {
  const log = ["SETUP: READY"];
  for (let i = 1; i <= iterations; i++) {
    log.push("LOOP: TICK " + i);
  }
  return log;
}

console.log(JSON.stringify(runSketch(2)));`,
      "ard-sketch-lifecycle",
      "Model the sequential setup and looping execution flow of an embedded sketch.",
      [
        "Start with ['SETUP: READY'] as the initial log entry.",
        "Loop from 1 to iterations inclusive.",
        "Output array serialized with JSON.stringify.",
      ],
      "Beginner",
      `function runSketch(iterations) {
  // Return setup and loop log entries
  return [];
}

console.log(JSON.stringify(runSketch(2)));`,
      [
        testCase("tc-ard-life-2", "Simulates 2 loop iterations", '["SETUP: READY","LOOP: TICK 1","LOOP: TICK 2"]'),
        testCase("tc-ard-life-1", "Simulates 1 loop iteration", '["SETUP: READY","LOOP: TICK 1"]', "", true),
      ],
    ),
    checkpoint: checkpoint(
        "Why does an embedded microcontroller run an infinite loop in main() rather than returning 0?",
        "Unlike desktop computers where programs run on top of an OS and terminate upon completion, a microcontroller is dedicated to controlling hardware continuously until electrical power is disconnected.",
      ),
  },

  // Lesson 2: Digital Output & Direct Port Manipulation
  {
    id: "arduino-digital-io",
    order: 2,
    title: "Digital Output, Current Sinking/Sourcing & Port Registers",
    summary: "Configure pin direction, sink and source current within electrical limits, and manipulate PORTB/DDRB registers.",
    type: "guided-coding",
    objectiveIds: ["ard-digital-io"],
    prerequisiteLessonIds: ["arduino-sketch-lifecycle"],
    estimatedDurationMinutes: 25,
    interactiveDemo: {
      kind: "circuit",
      title: "Digital I/O & Current Simulation",
      description: "Toggle digital pins HIGH and LOW to inspect current sourcing, sinking, and port register states.",
    },
    content: `# Digital Output, Current Sinking/Sourcing & Port Registers

Every general-purpose input/output (GPIO) pin on the ATmega328P can be configured dynamically to drive external loads or sense electrical levels.

## Electrical Limits: Sourcing vs Sinking

The ATmega328P operates with 5V CMOS push-pull driver transistors:
- **Sourcing Current (HIGH)**: The internal PMOS transistor connects the pin to $V_{CC}$ (5V). Current flows *out* of the pin into the external load to ground.
- **Sinking Current (LOW)**: The internal NMOS transistor connects the pin to GND (0V). Current flows from an external supply *into* the pin to ground.

### Absolute Maximum Ratings:
- **Maximum Current per Pin**: 40 mA (recommended continuous design maximum: **20 mA**).
- **Maximum Current for Entire Chip (VCC/GND total)**: 200 mA across all pins combined.
Exceeding 40 mA on a single pin or 200 mA total causes thermal degradation and permanently destroys the silicon output transistors.

## Standard Arduino API vs Direct Port Registers

The standard \`digitalWrite()\` function is user-friendly and handles pin-to-timer dissociation, but it costs approximately 50 CPU cycles (~3.1 microseconds at 16 MHz).

For high-speed protocols (SPI bit-banging, ultra-fast PWM, pulse timing), AVR exposes direct memory-mapped 8-bit registers:
1. **DDRx (Data Direction Register)**: 1 = OUTPUT, 0 = INPUT.
2. **PORTx (Data Register)**: When configured as output, 1 = HIGH, 0 = LOW.
3. **PINx (Input Pins Address)**: Reads physical logic level at the pin.

\`\`\`
Port B: Controls Digital Pins 8 through 13
DDRB |= (1 << DDB5);   // Configures Pin 13 as OUTPUT
PORTB |= (1 << PORTB5); // Sets Pin 13 HIGH in 1 CPU cycle (62.5ns)
PORTB &= ~(1 << PORTB5);// Sets Pin 13 LOW in 1 CPU cycle
\`\`\``,
    theorySections: [
      {
        id: "port-mapping-tables",
        title: "AVR Port Mapping on Arduino Uno",
        content: `The 14 digital and 6 analog pins map across three 8-bit AVR hardware ports:
- Port B: Digital Pins 8 to 13 (bits 0 to 5).
- Port C: Analog Pins A0 to A5 (bits 0 to 5).
- Port D: Digital Pins 0 to 7 (bits 0 to 7).
Accessing an entire 8-bit port in one clock cycle allows setting 8 physical pins simultaneously without intermediate jitter.`,
      },
      {
        id: "push-pull-cmos-output",
        title: "CMOS Push-Pull Transistor Stage",
        content: `Each GPIO pin contains a complementary pair of MOSFETs. When driven HIGH, the high-side PMOS turns on and low-side NMOS turns off. When driven LOW, the PMOS turns off and NMOS pulls the pin to GND. Never connect two output pins directly together if one is HIGH and one is LOW, as this creates a low-impedance short circuit directly through the silicon.`,
      },
    ],
    codeExamples: [
      {
        title: "Bitmask Register Simulation",
        language: "c",
        code: `// Simulating AVR register bit manipulation
#include <stdio.h>
#include <stdint.h>

#define PIN13_BIT 5

int main(void) {
  uint8_t portb = 0x00;
  
  // Set Pin 13 HIGH
  portb |= (1 << PIN13_BIT);
  printf("PORTB after SET: 0x%02X (Pin 13 is %s)\\n", 
         portb, (portb & (1 << PIN13_BIT)) ? "HIGH" : "LOW");
         
  // Clear Pin 13 LOW
  portb &= ~(1 << PIN13_BIT);
  printf("PORTB after CLEAR: 0x%02X (Pin 13 is %s)\\n", 
         portb, (portb & (1 << PIN13_BIT)) ? "HIGH" : "LOW");
         
  return 0;
}`,
        description: "Bitwise manipulation of port registers using shift and mask operations.",
      },
    ],
    exercise: exercise(
      "ex-ard-bitmask-calc",
      "Compute Register Bitmask for Port Manipulation",
      "Write a function `setPinInPort(currentPort, pinBit, state)` where `currentPort` is an 8-bit integer (0-255), `pinBit` is 0-7, and `state` is boolean (`true` for HIGH, `false` for LOW). If state is true, set that bit to 1 using bitwise OR. If false, clear that bit to 0 using bitwise AND with inverted mask. Return the new port value. Test with currentPort = 0x00, pinBit = 5, state = true. Print the hex string formatted as `0x` followed by uppercase hex (e.g. `0x20`).",
      `function setPinInPort(currentPort, pinBit, state) {
  if (state) {
    return currentPort | (1 << pinBit);
  } else {
    return currentPort & ~(1 << pinBit);
  }
}

const val = setPinInPort(0x00, 5, true);
console.log("0x" + val.toString(16).toUpperCase());`,
      "ard-digital-io",
      "Apply bitwise operations to simulate hardware register configuration.",
      [
        "Use bitwise OR (1 << pinBit) to set a bit.",
        "Use bitwise AND with bitwise NOT ~(1 << pinBit) to clear a bit.",
        "Format as hex using .toString(16).toUpperCase().",
      ],
      "Developing",
      `function setPinInPort(currentPort, pinBit, state) {
  // Apply bitmask operation
  return 0;
}

const val = setPinInPort(0x00, 5, true);
console.log("0x" + val.toString(16).toUpperCase());`,
      [
        testCase("tc-ard-port-set", "Sets bit 5 in empty register", "0x20"),
        testCase("tc-ard-port-clr", "Clears bit 5 in full register", "0xDF", "", true),
      ],
    ),
    checkpoint: checkpoint(
        "What is the maximum safe continuous current a single ATmega328P GPIO pin can source or sink?",
        "The recommended continuous design limit is 20 mA per pin, with an absolute maximum threshold of 40 mA before thermal destruction risks occur.",
      ),
  },

  // Module 2: Digital In & Analog Sensing
  {
    id: "arduino-pullup-inputs",
    order: 3,
    title: "Internal Pull-Up Resistors, Pushbuttons & Switch Debounce",
    summary: "Prevent floating CMOS input states using INPUT_PULLUP and filter mechanical switch contact bouncing in software.",
    type: "guided-coding",
    objectiveIds: ["ard-pullup-inputs"],
    prerequisiteLessonIds: ["arduino-digital-io"],
    estimatedDurationMinutes: 25,
    interactiveDemo: {
      kind: "circuit",
      title: "Pushbutton & Debounce Simulation",
      description: "Test active-low switch behavior with internal pull-up and observe contact bounce waveforms.",
    },
    content: `# Internal Pull-Up Resistors, Pushbuttons & Switch Debounce

When a GPIO pin is configured as a digital input with \`pinMode(pin, INPUT)\`, its input impedance exceeds 100 Megaohms ($10^8\\,\\Omega$). This high impedance makes it an exceptionally sensitive sensor—but also an open antenna.

## The Floating Pin Dilemma

If a pushbutton connects a pin to 5V when pressed but is left disconnected when released:
- **Button Pressed**: Pin is connected to 5V $\\rightarrow$ Reads steady \`HIGH\` (1).
- **Button Released**: Pin connects to high-impedance open air $\\rightarrow$ Ambient radio waves, 60Hz electromagnetic mains induction, and electrostatic charges cause the digital read to flicker randomly between 0 and 1 millions of times per second.

## The Solution: Active-Low \`INPUT_PULLUP\`

The ATmega328P silicon die contains built-in internal pull-up resistors ($20\\,\\text{k}\\Omega$ to $50\\,\\text{k}\\Omega$):
\`\`\`cpp
pinMode(BUTTON_PIN, INPUT_PULLUP);
\`\`\`
- **Button Released (Open)**: The resistor gently pulls the pin to 5V ($V_{CC}$). Pin reads solid \`HIGH (1)\`.
- **Button Pressed (Closed to GND)**: Current passes safely through the $30\\,\\text{k}\\Omega$ resistor to ground. Pin reads \`LOW (0)\`.
This is known as **Active-Low** logic.

## Mechanical Switch Contact Bounce

When the metallic contacts inside a physical pushbutton strike each other, they do not make instant electrical connection. Instead, the spring metal rebounds microscopically, generating a train of electrical pulses over 5 to 20 milliseconds:

\`\`\`
Ideal Signal:     ──┐
                    └───────────
Real Switch:      ──┐ ┌─┐ ┌─────
                    └─┘ └─┘
                    ◄─ 10ms ─►
\`\`\`
Without software debouncing, pressing a button once may trigger a counter 10 to 50 times!`,
    theorySections: [
      {
        id: "active-low-advantages",
        title: "Why Industrial Embedded Systems Prefer Active-Low",
        content: `Wiring switches between an MCU pin and ground is standard across automotive and industrial systems because routing ground traces throughout a chassis is significantly safer than routing active VCC power traces. A pinched or shorted ground wire simply triggers an input state rather than blowing a fuse or damaging power delivery lines.`,
      },
      {
        id: "rc-hardware-debounce",
        title: "RC Hardware Filtering vs Software Timing",
        content: `Switch bounce can be suppressed in hardware by adding a 100 nF ceramic capacitor in parallel with the switch contacts. The capacitor absorbs high-frequency bounce spikes through an RC time constant ($\tau = R \times C$). However, software debouncing with non-blocking timing saves component cost and board footprint.`,
      },
    ],
    codeExamples: [
      {
        title: "Software Debounce Implementation",
        language: "c",
        code: `// Non-blocking software debounce logic
#include <stdio.h>
#include <stdbool.h>

typedef struct {
  bool lastReading;
  bool stableState;
  unsigned long lastDebounceTime;
  unsigned long debounceDelay;
} Debouncer;

bool updateDebouncer(Debouncer *d, bool currentReading, unsigned long currentTime) {
  if (currentReading != d->lastReading) {
    d->lastDebounceTime = currentTime;
  }
  
  if ((currentTime - d->lastDebounceTime) >= d->debounceDelay) {
    d->stableState = currentReading;
  }
  
  d->lastReading = currentReading;
  return d->stableState;
}

int main(void) {
  Debouncer btn = { true, true, 0, 20 };
  printf("Initial released state: %d\\n", btn.stableState);
  return 0;
}`,
        description: "Standard software debouncer filter with hysteresis timing window.",
      },
    ],
    exercise: exercise(
      "ex-ard-debounce-filter",
      "Implement Software Switch Debouncer",
      "Write a function `filterBounce(readings, threshold)` where `readings` is an array of raw logic values `[0, 1]` sampled at 1ms intervals, and `threshold` is the number of identical consecutive readings required to validate a state change. Start with confirmed state = 1. Return the final confirmed state after processing the array. Test with `readings = [1, 0, 0, 1, 0, 0, 0, 0]` and `threshold = 3`. Print the result.",
      `function filterBounce(readings, threshold) {
  let confirmed = 1;
  let candidate = readings[0];
  let count = 0;

  for (const r of readings) {
    if (r === candidate) {
      count++;
      if (count >= threshold) {
        confirmed = candidate;
      }
    } else {
      candidate = r;
      count = 1;
    }
  }
  return confirmed;
}

console.log(filterBounce([1, 0, 0, 1, 0, 0, 0, 0], 3));`,
      "ard-pullup-inputs",
      "Filter transient mechanical switch noise to produce a stable digital state.",
      [
        "Track the candidate reading and count how many times in a row it appears.",
        "When the count reaches the threshold, update the confirmed state.",
        "Print 0 for the given test case.",
      ],
      "Developing",
      `function filterBounce(readings, threshold) {
  // Implement debouncing state filter
  return 1;
}

console.log(filterBounce([1, 0, 0, 1, 0, 0, 0, 0], 3));`,
      [
        testCase("tc-ard-debounce-low", "Confirms pressed state after 4 stable LOW readings", "0"),
        testCase("tc-ard-debounce-high", "Maintains released state when bounce is rejected", "1", "", true),
      ],
    ),
    checkpoint: checkpoint(
        "Why does an INPUT_PULLUP pin read LOW when a pushbutton is pressed?",
        "The pushbutton connects the pin directly to Ground (0V). Because the internal pull-up resistor has high resistance (30kΩ), current safely flows to ground and the pin measures 0V.",
      ),
  },

  // Lesson 4: Analog Sensing & 10-Bit ADC
  {
    id: "arduino-adc-analog",
    order: 4,
    title: "10-Bit ADC Architecture, Potentiometers & Sensor Sampling",
    summary: "Sample continuous analog signals, calculate quantization steps, and convert analogRead() raw counts to voltages.",
    type: "guided-coding",
    objectiveIds: ["ard-adc-analog"],
    prerequisiteLessonIds: ["arduino-pullup-inputs"],
    estimatedDurationMinutes: 30,
    interactiveDemo: {
      kind: "circuit",
      title: "Interactive 10-Bit ADC & Potentiometer Lab",
      description: "Adjust virtual potentiometer slider to see continuous 0-5V input convert into discrete 0-1023 ADC counts.",
    },
    content: `# 10-Bit ADC Architecture, Potentiometers & Sensor Sampling

The physical world operates on continuous analog phenomena—ambient temperature, atmospheric pressure, acoustic vibrations, and light intensity. Microcontrollers require an **Analog-to-Digital Converter (ADC)** to translate continuous voltages into discrete digital numbers.

## Successive Approximation Register (SAR) ADC

The ATmega328P features an internal 10-bit Successive Approximation Register ADC:
- **Resolution**: 10 bits $\\rightarrow 2^{10} = 1024$ discrete digital quantizations ($0$ to $1023$).
- **Reference Voltage ($V_{REF}$)**: Default is $5.0\\text{ V}$ (or $1.1\\text{ V}$ internal bandgap, or external $AREF$).
- **Quantization Step (Resolution per LSB)**:
  \`\`\`
  Resolution = V_REF / 1024 = 5.0 V / 1024 = 4.8828 mV per count
  \`\`\`

## Converting Counts to Voltage

In Arduino C++, calling \`analogRead(A0)\` halts execution for ~104 microseconds while the 10-bit binary search runs:
\`\`\`cpp
int rawADC = analogRead(A0);                   // 0 to 1023
float voltage = (rawADC * 5.0f) / 1023.0f;     // Calculated voltage in Volts
\`\`\`

## Potentiometer as a Variable Voltage Divider

A potentiometer has three pins:
1. Outer terminal 1: Tied to $5\\text{V}$.
2. Outer terminal 2: Tied to $\\text{GND}$.
3. Center wiper: Connects to an ADC pin (A0).
Wiping the contact along the resistive carbon track divides the voltage proportionally according to Ohm's law:
\`\`\`
V_out = V_CC * (R_bottom / (R_top + R_bottom))
\`\`\``,
    theorySections: [
      {
        id: "adc-input-impedance-requirements",
        title: "Sample-and-Hold Capacitor & Source Impedance",
        content: `Before conversion begins, an internal 14 pF sampling capacitor must charge to the input voltage level during a narrow sample window. The ATmega328P datasheet specifies that the analog source output impedance must not exceed 10 kΩ. If a high-impedance sensor (>50 kΩ) is connected directly without an op-amp buffer, the capacitor fails to fully charge, resulting in severe gain compression and inaccurate readings.`,
      },
      {
        id: "adc-prescaler-timing",
        title: "ADC Clock Prescaler & Conversion Accuracy",
        content: `The SAR core requires an input clock between 50 kHz and 200 kHz for full 10-bit accuracy. On a 16 MHz Arduino Uno, the hardware prescaler is set to 128 (16 MHz / 128 = 125 kHz). Each conversion requires 13 ADC clock cycles (~104 µs). Setting a faster prescaler increases sampling throughput at the expense of lower effective number of bits (ENOB).`,
      },
    ],
    codeExamples: [
      {
        title: "ADC Conversion & Scaling in C",
        language: "c",
        code: `// Converting raw ADC counts to physical voltage and sensor units
#include <stdio.h>

float rawToVoltage(int rawAdc, float vRef) {
  return ((float)rawAdc * vRef) / 1023.0f;
}

int main(void) {
  int samples[] = { 0, 256, 512, 768, 1023 };
  for (int i = 0; i < 5; i++) {
    printf("Raw: %4d -> Voltage: %.3f V\\n", samples[i], rawToVoltage(samples[i], 5.0f));
  }
  return 0;
}`,
        description: "Mapping discrete 10-bit ADC integer counts to physical voltage values.",
      },
    ],
    exercise: exercise(
      "ex-ard-adc-calc",
      "Calculate Physical Voltage from Raw ADC Count",
      "Write a function `rawToMillivolts(rawCount, vRefVolts)` that calculates the measured potential in millivolts rounded to the nearest integer. Formula: `Math.round((rawCount * (vRefVolts * 1000)) / 1023)`. Calculate the millivolts for rawCount = 512 with vRef = 5.0V. Print the result.",
      `function rawToMillivolts(rawCount, vRefVolts) {
  return Math.round((rawCount * (vRefVolts * 1000)) / 1023);
}

console.log(rawToMillivolts(512, 5.0));`,
      "ard-adc-analog",
      "Convert discrete 10-bit ADC integer readings to real-world electrical quantities.",
      [
        "Multiply vRefVolts by 1000 to get reference millivolts (5000 mV).",
        "Multiply rawCount by 5000 and divide by 1023.",
        "Round using Math.round to obtain 2502.",
      ],
      "Beginner",
      `function rawToMillivolts(rawCount, vRefVolts) {
  // Convert count to millivolts
  return 0;
}

console.log(rawToMillivolts(512, 5.0));`,
      [
        testCase("tc-ard-adc-mid", "Calculates midscale 512 count voltage", "2502"),
        testCase("tc-ard-adc-max", "Calculates fullscale 1023 count voltage", "5000", "", true),
      ],
    ),
    checkpoint: checkpoint(
        "What is the voltage resolution per step for the Arduino Uno 10-bit ADC with a 5V reference?",
        "Approximately 4.88 millivolts (5.0V / 1024 counts).",
      ),
  },

  // Module 3: PWM & Non-Blocking State Machines
  {
    id: "arduino-pwm-serial",
    order: 5,
    title: "Pulse-Width Modulation (PWM), Timers & UART Serial Telemetry",
    summary: "Control LED brightness and motor speed using hardware PWM duty cycles and stream structured telemetry over UART.",
    type: "guided-coding",
    objectiveIds: ["ard-pwm-serial"],
    prerequisiteLessonIds: ["arduino-adc-analog"],
    estimatedDurationMinutes: 30,
    interactiveDemo: {
      kind: "circuit",
      title: "PWM Waveform & Serial Telemetry Console",
      description: "Modulate duty cycle percentages and view synthetic oscilloscope square waves alongside serial data streams.",
    },
    content: `# Pulse-Width Modulation (PWM), Timers & UART Serial Telemetry

A digital microcontroller pin can only output discrete states: 0V or 5V. It cannot natively generate intermediate voltages like 2.5V without an expensive Digital-to-Analog Converter (DAC).

## How Pulse-Width Modulation Works

Instead of altering voltage amplitude, **Pulse-Width Modulation (PWM)** rapidly switches the pin between 0V and 5V at a fixed frequency (~490 Hz or 980 Hz on Uno). By varying the ratio of **ON time** to total period, we control the **average power** delivered to a load:

\`\`\`
Duty Cycle (%) = (T_ON / (T_ON + T_OFF)) * 100%
V_average = V_CC * (Duty Cycle / 100)
\`\`\`

- **0% Duty Cycle (\`analogWrite(pin, 0)\`)**: Pin is constantly LOW (0V average).
- **50% Duty Cycle (\`analogWrite(pin, 127)\`)**: Square wave, half ON, half OFF (2.5V average).
- **100% Duty Cycle (\`analogWrite(pin, 255)\`)**: Pin is constantly HIGH (5.0V average).

## Hardware Timers & PWM Pins

The ATmega328P has three independent hardware timer/counters:
- **Timer0 (8-bit)**: Controls Pins 5 & 6 (980 Hz, also drives \`millis()\`).
- **Timer1 (16-bit)**: Controls Pins 9 & 10 (490 Hz).
- **Timer2 (8-bit)**: Controls Pins 3 & 11 (490 Hz).

## UART Serial Telemetry

The Universal Asynchronous Receiver-Transmitter (UART) peripheral transmits data byte-by-byte over a single wire using framing bits (Start Bit, 8 Data Bits, Stop Bit):
\`\`\`cpp
void setup() {
  Serial.begin(115200); // Set baud rate to 115200 bits per second
}

void loop() {
  Serial.print("TELEMETRY,");
  Serial.println(analogRead(A0));
  delay(100);
}
\`\`\``,
    theorySections: [
      {
        id: "low-pass-filter-pwm-dac",
        title: "Converting PWM to Pure DC with an RC Filter",
        content: `While human vision and motor inertia naturally integrate rapid PWM pulses, analog audio or sensitive reference circuits require a steady DC voltage. Placing a passive Low-Pass RC Filter (e.g., 4.7 kΩ resistor and 10 µF capacitor) smooths out high-frequency switching ripple, producing a true analog DC voltage proportional to the duty cycle.`,
      },
      {
        id: "baud-rate-clock-error",
        title: "UART Clock Drift & Baud Rate Error",
        content: `UART communication is asynchronous—no shared clock wire exists between sender and receiver. Both devices must share a synchronized baud rate clock derived from crystal oscillators. If oscillator drift exceeds 2.5% across a 10-bit frame, the receiver samples data bits during transitions, causing framing errors and corrupted characters.`,
      },
    ],
    codeExamples: [
      {
        title: "PWM Duty Cycle and Power Calculator",
        language: "c",
        code: `// Calculating average voltage from 8-bit PWM value
#include <stdio.h>

float calculateAverageVoltage(int pwmValue, float vSupply) {
  if (pwmValue <= 0) return 0.0f;
  if (pwmValue >= 255) return vSupply;
  return ((float)pwmValue / 255.0f) * vSupply;
}

int main(void) {
  int pwms[] = { 0, 64, 128, 191, 255 };
  for (int i = 0; i < 5; i++) {
    printf("PWM: %3d -> Vavg: %.2f V\\n", pwms[i], calculateAverageVoltage(pwms[i], 5.0f));
  }
  return 0;
}`,
        description: "Computing equivalent average DC output voltage across 8-bit duty cycle range.",
      },
    ],
    exercise: exercise(
      "ex-ard-pwm-calc",
      "Compute 8-Bit PWM Register Value",
      "Write a function `targetVoltageToPwm(targetVolts, vSupply)` that computes the 8-bit integer PWM value (0 to 255) needed to produce a desired average voltage. Clamp output between 0 and 255: `Math.min(255, Math.max(0, Math.round((targetVolts / vSupply) * 255)))`. Calculate PWM for 3.3V on a 5.0V supply. Print the resulting integer.",
      `function targetVoltageToPwm(targetVolts, vSupply) {
  return Math.min(255, Math.max(0, Math.round((targetVolts / vSupply) * 255)));
}

console.log(targetVoltageToPwm(3.3, 5.0));`,
      "ard-pwm-serial",
      "Calculate 8-bit timer register duty cycles for proportional power modulation.",
      [
        "Divide targetVolts by vSupply to get fractional duty cycle.",
        "Multiply by 255 and round with Math.round.",
        "Expect 168 for 3.3V on a 5V supply.",
      ],
      "Beginner",
      `function targetVoltageToPwm(targetVolts, vSupply) {
  // Return clamped 8-bit PWM value
  return 0;
}

console.log(targetVoltageToPwm(3.3, 5.0));`,
      [
        testCase("tc-ard-pwm-3v3", "Calculates PWM for 3.3V on 5V supply", "168"),
        testCase("tc-ard-pwm-2v5", "Calculates PWM for 2.5V on 5V supply", "128", "", true),
      ],
    ),
    checkpoint: checkpoint(
        "Why does an LED appear dimmer when driven with a 50% PWM signal compared to 100%?",
        "The LED turns on and off 490 times per second. Human persistence of vision integrates the pulses, perceiving the average light output over time rather than rapid individual flickers.",
      ),
  },

  // Lesson 6: Non-Blocking Finite State Machines with millis()
  {
    id: "arduino-millis-fsm",
    order: 6,
    title: "Non-Blocking Finite State Machines with millis() & Scheduling",
    summary: "Eliminate blocking delay() calls using software timers, cooperative multitasking, and finite state machines.",
    type: "guided-coding",
    objectiveIds: ["ard-millis-fsm"],
    prerequisiteLessonIds: ["arduino-pwm-serial"],
    estimatedDurationMinutes: 30,
    interactiveDemo: {
      kind: "circuit",
      title: "Non-Blocking Traffic Controller Lab",
      description: "Interact with multiple asynchronous LEDs and button inputs executing simultaneously without blocking pauses.",
    },
    content: `# Non-Blocking Finite State Machines with millis() & Scheduling

The single greatest bottleneck in amateur microcontroller programming is the \`delay()\` function. 

## The Catastrophe of \`delay()\`

When you execute \`delay(1000)\`, the processor enters a busy-wait loop for 16,000,000 clock cycles. During this entire second:
- It **cannot** detect button presses.
- It **cannot** respond to sensor threshold emergencies.
- It **cannot** service incoming UART serial commands.
- It **cannot** refresh display screens or calculate motion kinematics.

## Cooperative Multitasking with \`millis()\`

The Arduino runtime increments an internal 32-bit unsigned millisecond counter driven by Timer0 overflow interrupts. By comparing current time against timestamp checkpoints, we schedule tasks without pausing execution:

\`\`\`cpp
unsigned long previousMillis = 0;
const unsigned long INTERVAL = 1000;

void loop() {
  unsigned long currentMillis = millis();

  // Check if target duration has elapsed
  if (currentMillis - previousMillis >= INTERVAL) {
    previousMillis = currentMillis;
    // Perform periodic task here
    toggleLed();
  }

  // Other tasks execute immediately with ZERO latency!
  checkEmergencyStopButton();
}
\`\`\`

## Handling Timer Overflow (Rollover)

Because \`millis()\` returns a 32-bit unsigned long (\`uint32_t\`), it overflows back to 0 after approximately **49.7 days**.
Using unsigned subtraction \`(currentMillis - previousMillis >= INTERVAL)\` is mathematically immune to overflow because binary two's-complement arithmetic wraps around seamlessly! Never use \`(currentMillis >= previousMillis + INTERVAL)\`, which breaks during rollover.

## Finite State Machine (FSM) Architecture

An FSM separates system behavior into discrete states with explicit transitions triggered by events or elapsed time:

\`\`\`
[STATE_IDLE] ──(Button Pressed)──> [STATE_ARMED] ──(5s Elapsed)──> [STATE_ACTIVE]
\`\`\``,
    theorySections: [
      {
        id: "rollover-math-proof",
        title: "Mathematical Proof of Unsigned Rollover Safety",
        content: `Consider an 8-bit unsigned integer clock that rolls over at 255. Suppose previous = 250 and current = 5 (after rollover). In unsigned arithmetic:
(5 - 250) mod 256 = -245 mod 256 = 11.
The elapsed delta (11 units) is perfectly accurate across the rollover boundary without requiring conditional logic!`,
      },
      {
        id: "state-machine-enum-switch",
        title: "Clean FSM Implementation via enum and switch",
        content: `Structuring embedded logic with an enum for states (\`enum SystemState { IDLE, WARNING, ALARM };\`) and a top-level \`switch (currentState)\` block prevents race conditions and makes adding new operational modes straightforward.`,
      },
    ],
    codeExamples: [
      {
        title: "Cooperative Task Scheduler in C",
        language: "c",
        code: `// Multi-tasking scheduler without delay()
#include <stdio.h>
#include <stdbool.h>

typedef struct {
  unsigned long lastRun;
  unsigned long interval;
  void (*taskFunc)(unsigned long now);
} ScheduledTask;

void taskA(unsigned long now) { printf("[%lu ms] Task A (Fast: 500ms)\\n", now); }
void taskB(unsigned long now) { printf("[%lu ms] Task B (Slow: 1000ms)\\n", now); }

int main(void) {
  ScheduledTask tasks[] = {
    { 0, 500, taskA },
    { 0, 1000, taskB }
  };
  
  // Simulate time progression
  for (unsigned long now = 0; now <= 1500; now += 250) {
    for (int i = 0; i < 2; i++) {
      if (now - tasks[i].lastRun >= tasks[i].interval) {
        tasks[i].lastRun = now;
        tasks[i].taskFunc(now);
      }
    }
  }
  return 0;
}`,
        description: "Non-blocking task dispatching using millisecond delta comparison.",
      },
    ],
    exercise: exercise(
      "ex-ard-fsm-sim",
      "Simulate Traffic Light State Transitions",
      "Write a function `simulateTrafficLight(ticks)` that advances a state machine through states `'GREEN'`, `'YELLOW'`, `'RED'`. Duration rules: GREEN lasts 3 ticks, YELLOW lasts 1 tick, RED lasts 2 ticks. Starting at tick 0 in GREEN, run for `ticks` transitions and return an array of the active state at each tick from 0 to ticks - 1. Test with `ticks = 7`. Print as JSON.",
      `function simulateTrafficLight(ticks) {
  const states = [];
  const schedule = [
    "GREEN", "GREEN", "GREEN",
    "YELLOW",
    "RED", "RED"
  ];
  for (let i = 0; i < ticks; i++) {
    states.push(schedule[i % schedule.length]);
  }
  return states;
}

console.log(JSON.stringify(simulateTrafficLight(7)));`,
      "ard-millis-fsm",
      "Model cyclic finite state machines for predictable embedded automation.",
      [
        "Define an array containing 3 GREEN, 1 YELLOW, and 2 RED entries (6 ticks per cycle).",
        "Use modulo arithmetic (i % 6) to index into the cyclic schedule.",
        "Serialize output array using JSON.stringify.",
      ],
      "Developing",
      `function simulateTrafficLight(ticks) {
  // Simulate timed traffic state machine
  return [];
}

console.log(JSON.stringify(simulateTrafficLight(7)));`,
      [
        testCase("tc-ard-fsm-7", "Outputs 7-tick traffic state progression", '["GREEN","GREEN","GREEN","YELLOW","RED","RED","GREEN"]'),
        testCase("tc-ard-fsm-4", "Outputs 4-tick traffic state progression", '["GREEN","GREEN","GREEN","YELLOW"]', "", true),
      ],
    ),
    checkpoint: checkpoint(
        "Why is (currentMillis - previousMillis >= interval) preferred over (currentMillis >= previousMillis + interval)?",
        "Unsigned subtraction correctly handles 32-bit integer overflow rollover at 49.7 days without requiring any special condition checks.",
      ),
  },
];

export const arduinoEmbeddedModules: LearningModule[] = [
  moduleData(
    "ard-module-lifecycle",
    1,
    "Sketch Lifecycle & Digital Out",
    "Master the ATmega328P execution cycle, pin mapping, electrical limits, and port registers.",
    arduinoEmbeddedLessons.slice(0, 2),
  ),
  moduleData(
    "ard-module-io-sensing",
    2,
    "Digital In & Analog Sensing",
    "Interface active-low pushbuttons with internal pull-ups, filter contact bounce, and sample 10-bit analog voltages.",
    arduinoEmbeddedLessons.slice(2, 4),
  ),
  moduleData(
    "ard-module-pwm-fsm",
    3,
    "PWM & Non-Blocking State Machines",
    "Generate pulse-width modulated outputs, stream UART serial telemetry, and construct non-blocking state machines.",
    arduinoEmbeddedLessons.slice(4, 6),
  ),
];

export const arduinoEmbeddedCourse: LearningCourse = {
  id: "arduino-embedded",
  subjectId: "arduino-embedded-subject",
  title: "Arduino Uno Embedded Systems & ATmega328P",
  description: "Master physical computing, AVR Harvard architecture, digital/analog GPIO registers, PWM modulation, and non-blocking firmware state machines.",
  level: "Developing",
  version: "1.0.0",
  prerequisites: ["Basic C/C++ or programming syntax", "Elementary electronics concepts (Ohm's law)"],
  objectives,
  learningOutcomes: [
    "Understand ATmega328P AVR Harvard architecture and sketch execution lifecycles.",
    "Configure digital GPIO pins and manipulate direct port registers at single-cycle speeds.",
    "Eliminate floating input noise using internal pull-up resistors and debouncing.",
    "Sample continuous physical quantities with the 10-bit Successive Approximation ADC.",
    "Modulate actuator power and brightness using hardware PWM duty cycles.",
    "Construct cooperative non-blocking state machines with millis() timing.",
  ],
  estimatedDurationMinutes: 165,
  publicationStatus: "published",
  modules: arduinoEmbeddedModules,
};

export const arduinoEmbeddedCourseSummary = {
  id: arduinoEmbeddedCourse.id,
  subjectId: arduinoEmbeddedCourse.subjectId,
  title: arduinoEmbeddedCourse.title,
  description: arduinoEmbeddedCourse.description,
  level: arduinoEmbeddedCourse.level,
  version: arduinoEmbeddedCourse.version,
  prerequisites: arduinoEmbeddedCourse.prerequisites,
  objectives: arduinoEmbeddedCourse.objectives,
  learningOutcomes: arduinoEmbeddedCourse.learningOutcomes,
  estimatedDurationMinutes: arduinoEmbeddedCourse.estimatedDurationMinutes,
  publicationStatus: arduinoEmbeddedCourse.publicationStatus,
  modules: arduinoEmbeddedCourse.modules.map((m) => ({
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
