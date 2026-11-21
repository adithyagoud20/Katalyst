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
  { id: "ard-hardware-interrupts", title: "Attach external hardware interrupts (INT0/INT1) and write race-free ISRs with volatile flags." },
  { id: "ard-non-blocking-timing", title: "Build complex multi-rate non-blocking schedulers and software timers without blocking delays." },
  { id: "ard-tone-piezo", title: "Drive piezo buzzers using Timer2 square waves with tone() and calculate acoustic pitch frequencies." },
  { id: "ard-servo-actuator", title: "Control 50 Hz PWM servo motors with 544µs to 2400µs pulse widths for angular positioning." },
  { id: "ard-i2c-bus", title: "Communicate with sensors and displays over the 2-wire I2C bus (A4/SDA, A5/SCL) using the Wire library." },
  { id: "ard-multisensor-capstone", title: "Synthesize interrupt handling, sensor fusion, and actuator actuation in an autonomous controller." },
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
  // Module 4: Hardware Timers, Interrupts & Actuators
  {
    id: "arduino-hardware-interrupts",
    order: 7,
    title: "External Hardware Interrupts (INT0 / INT1) & Race-Free ISRs",
    summary: "Harness hardware interrupt pins 2 and 3, configure RISING/FALLING edges, and write volatile-safe ISR routines.",
    type: "guided-coding",
    objectiveIds: ["ard-hardware-interrupts"],
    prerequisiteLessonIds: ["arduino-millis-fsm"],
    estimatedDurationMinutes: 30,
    interactiveDemo: {
      kind: "circuit",
      title: "ATmega328P External Interrupt Simulator",
      description: "Trigger digital pulses on INT0 (Pin 2) and observe asynchronous ISR invocation and variable updates.",
    },
    content: `# External Hardware Interrupts (INT0 / INT1) & Race-Free ISRs

In standard polling architectures, the microcontroller must continuously check the electrical state of a pin within \`loop()\`. If a critical event occurs while the CPU is executing a slow computation or delay, the pulse is missed. Hardware interrupts solve this by immediately suspending main program execution to run an Interrupt Service Routine (ISR).

## ATmega328P Hardware Interrupt Architecture

The ATmega328P features two dedicated external interrupt pins:
- **INT0 (Digital Pin 2)**: Triggers interrupt vector \`__vector_1\`.
- **INT1 (Digital Pin 3)**: Triggers interrupt vector \`__vector_2\`.

When an electrical edge arrives on Pin 2 or 3, the CPU finishes the current instruction, pushes the Program Counter onto the stack, and jumps directly to the ISR.

\`\`\`
Main loop() execution
      │
      ├─── Pulse arrives on Pin 2 (INT0)
      │    │
      │    ▼
      │    CPU saves Program Counter (PC)
      │    Jumps to ISR vector table
      │    Executes ISR code immediately
      │    Executes RETI (Return from Interrupt)
      │    CPU restores PC
      ▼
Main loop() resumes seamlessly
\`\`\`

## The \`attachInterrupt()\` API

Arduino configures external interrupts via the \`attachInterrupt\` function:

\`\`\`cpp
attachInterrupt(digitalPinToInterrupt(pin), ISR_callback, mode);
\`\`\`

Available interrupt trigger modes:
- **RISING**: Triggers when pin transitions from LOW to HIGH.
- **FALLING**: Triggers when pin transitions from HIGH to LOW.
- **CHANGE**: Triggers on both rising and falling edges.
- **LOW**: Triggers continuously as long as the pin remains LOW.

## The Critical Role of \`volatile\`

Any global variable shared between an ISR and normal code must be declared with the \`volatile\` type qualifier:

\`\`\`cpp
volatile uint32_t pulseCount = 0;
\`\`\`

Without \`volatile\`, the C++ compiler's optimizer assumes the variable cannot change during a loop that doesn't explicitly modify it. It may cache the variable in a CPU register (like \`r24\`), ignoring updates written to SRAM by the ISR!

## Atomic Access to Multi-Byte Variables

The ATmega328P is an 8-bit architecture. Reading a 32-bit integer (\`uint32_t\`) requires four separate \`LDS\` instructions. If an interrupt fires between the second and third read, the main loop reads a corrupted, hybrid value (a **torn read**). To prevent this, disable interrupts momentarily during the read:

\`\`\`cpp
uint32_t safeCount;
noInterrupts();          // Disable interrupts (cli)
safeCount = pulseCount; // Atomic copy
interrupts();            // Re-enable interrupts (sei)
\`\`\``,
    theorySections: [
      {
        id: "isr-rules-and-constraints",
        title: "Golden Rules for ISR Implementation",
        content: `Because interrupts run in privileged asynchronous contexts, adhere strictly to these rules:
1. **Keep it ultra-short**: An ISR should set a flag or increment a counter and return immediately.
2. **Never call delay()**: delay() relies on the Timer0 overflow interrupt. Since interrupts are disabled inside an ISR, delay() will hang forever.
3. **Avoid Serial.print()**: Serial output relies on UART transmit interrupts. Sending long strings inside an ISR can cause buffer overflow and deadlock.
4. **Use volatile variables**: Always mark variables shared between ISR and loop() as volatile.`,
      },
      {
        id: "hardware-vs-software-debounce",
        title: "Interrupt Contact Debouncing",
        content: `Mechanical switches bounce mechanically for 5 to 20 milliseconds upon closing. Because an interrupt triggers in sub-microsecond time, a single button press can trigger 10 to 50 interrupt events! Debounce by comparing current millis() against last interrupt timestamp: if (now - lastInterruptTime > 50) { ... }.`,
      },
    ],
    codeExamples: [
      {
        title: "Interrupt-Driven Pulse Counter (Tachometer)",
        language: "c",
        description: "Counts high-speed incoming pulses on INT0 (Pin 2) with atomic reading in loop().",
        code: `#include <Arduino.h>

const uint8_t SENSOR_PIN = 2; // INT0
volatile uint32_t pulseCount = 0;
volatile unsigned long lastInterruptTime = 0;

void onPulseISR() {
  unsigned long now = millis();
  if (now - lastInterruptTime > 15) { // 15 ms debounce
    pulseCount++;
    lastInterruptTime = now;
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(SENSOR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(SENSOR_PIN), onPulseISR, FALLING);
}

void loop() {
  static unsigned long lastReport = 0;
  if (millis() - lastReport >= 1000) {
    lastReport = millis();
    uint32_t copy;
    noInterrupts();
    copy = pulseCount;
    pulseCount = 0;
    interrupts();
    Serial.print("Pulses per sec: ");
    Serial.println(copy);
  }
}`,
      },
    ],
    exercise: exercise(
      "ex-ard-interrupts",
      "Simulate Interrupt Pulse Counter with Debounce",
      "Implement a function `simulatePulseCounter(pulseTimesMs, debounceMs)` that filters a chronological series of incoming pulse timestamps, rejecting bounces occurring within `debounceMs` of the last registered pulse. Return the final count of valid pulses.",
      `function simulatePulseCounter(pulseTimesMs, debounceMs) {
  let validCount = 0;
  let lastRegisteredTime = -Infinity;
  for (const time of pulseTimesMs) {
    if (time - lastRegisteredTime >= debounceMs) {
      validCount++;
      lastRegisteredTime = time;
    }
  }
  return validCount;
}

console.log(simulatePulseCounter([10, 15, 22, 60, 65, 120], 20));`,
      "ard-hardware-interrupts",
      "Accurately filter noisy interrupt pulses using software timestamp debouncing.",
      [
        "Initialize validCount = 0 and lastRegisteredTime = -Infinity.",
        "Iterate over each pulse timestamp in pulseTimesMs.",
        "Check if (time - lastRegisteredTime >= debounceMs); if so, increment validCount and update lastRegisteredTime.",
      ],
      "Developing",
      `function simulatePulseCounter(pulseTimesMs, debounceMs) {
  // Filter noisy pulse events using debounce threshold
  return 0;
}

console.log(simulatePulseCounter([10, 15, 22, 60, 65, 120], 20));`,
      [
        testCase("tc-ard-int-1", "Filters rapid bounce pulses", "3"),
        testCase("tc-ard-int-2", "Accepts all well-spaced pulses", "4", "", true),
      ],
    ),
    checkpoint: checkpoint(
      "Why must multi-byte variables updated in an ISR be read with interrupts disabled in the main loop?",
      "On an 8-bit AVR, reading a 16-bit or 32-bit variable takes multiple CPU instructions; without disabling interrupts, an ISR could fire mid-read and produce a corrupted torn value.",
    ),
  },

  // Lesson 8: Multi-Rate Non-Blocking Schedulers
  {
    id: "arduino-non-blocking-millis",
    order: 8,
    title: "Multi-Rate Cooperative Schedulers with millis()",
    summary: "Build scalable multi-rate task schedulers using millis() interval tracking without blocking delay() calls.",
    type: "guided-coding",
    objectiveIds: ["ard-non-blocking-timing"],
    prerequisiteLessonIds: ["arduino-hardware-interrupts"],
    estimatedDurationMinutes: 25,
    interactiveDemo: {
      kind: "circuit",
      title: "Cooperative Task Scheduler Visualizer",
      description: "Observe independent software timers executing sensor reads, LED flashes, and serial telemetry concurrently.",
    },
    content: `# Multi-Rate Cooperative Schedulers with millis()

Real-world embedded systems must handle multiple concurrent tasks: blinking an indicator LED at 1 Hz, sampling a temperature sensor at 10 Hz, and streaming serial telemetry at 2 Hz. Calling \`delay(1000)\` blocks the CPU completely, rendering multi-rate operations impossible.

## The Delta-Time Architecture

The ATmega328P Timer0 interrupt maintains an internal 32-bit millisecond counter accessed via \`millis()\`. By storing the timestamp of the last task execution and comparing the difference against a desired interval, multiple tasks run cooperatively:

\`\`\`cpp
unsigned long now = millis();
if (now - lastSensorRead >= SENSOR_INTERVAL) {
  lastSensorRead = now;
  readSensors();
}
if (now - lastHeartbeat >= HEARTBEAT_INTERVAL) {
  lastHeartbeat = now;
  toggleHeartbeatLED();
}
\`\`\`

## Unsigned Subtraction & 49.7-Day Rollover Protection

The 32-bit counter returned by \`millis()\` overflows and rolls over to 0 after approximately 49.7 days ($2^{32} - 1$ milliseconds). 

Using unsigned subtraction:
\`\`\`cpp
if (currentMillis - previousMillis >= interval)
\`\`\`
is **100% immune to rollover bugs**. In two's complement unsigned binary arithmetic:
\`\`\`
(uint32_t)(5 - 4294967290) = 11
\`\`\`
The difference calculation wraps naturally and produces the exact elapsed interval. In contrast, \`if (currentMillis >= previousMillis + interval)\` fails catastrophically when the addition overflows!

## Struct-Based Task Descriptors

For clean scalable firmware, encapsulate tasks in a table of function pointers and intervals:

\`\`\`cpp
typedef struct {
  void (*execute)(void);
  unsigned long interval;
  unsigned long lastRun;
} Task;

Task scheduler[] = {
  { sampleSensors, 100, 0 },
  { updateDisplay, 250, 0 },
  { transmitTelemetry, 1000, 0 }
};
\`\`\``,
    theorySections: [
      {
        id: "task-starvation",
        title: "Cooperative Multitasking & Task Starvation",
        content: `In cooperative multitasking without an RTOS, each task must execute quickly and yield control back to the main loop. If one task executes a slow 50 ms calculation, all other tasks are delayed by 50 ms. Break long operations into sequential state machine steps to maintain responsive loop latency.`,
      },
      {
        id: "timer0-hardware-details",
        title: "Hardware Timer0 Prescaler & Overflow",
        content: `Timer0 runs at 16 MHz / 64 = 250 kHz (4 µs tick). It overflows every 256 ticks = 1.024 ms. The Arduino core ISR adds 1 ms to the counter on each overflow and applies fractional adjustments every ~41 milliseconds to keep millis() synchronized with real time.`,
      },
    ],
    codeExamples: [
      {
        title: "Table-Driven Non-Blocking Task Scheduler",
        language: "c",
        description: "Orchestrates three concurrent tasks with different execution periods using a descriptor array.",
        code: `#include <Arduino.h>

void taskFastLED(void) {
  digitalWrite(13, !digitalRead(13));
}

void taskPrintTelemetry(void) {
  Serial.print("Uptime: ");
  Serial.println(millis());
}

typedef struct {
  void (*run)(void);
  unsigned long period;
  unsigned long prev;
} ScheduledTask;

ScheduledTask tasks[] = {
  { taskFastLED, 200, 0 },
  { taskPrintTelemetry, 1000, 0 }
};

const uint8_t TASK_COUNT = sizeof(tasks) / sizeof(tasks[0]);

void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  unsigned long now = millis();
  for (uint8_t i = 0; i < TASK_COUNT; i++) {
    if (now - tasks[i].prev >= tasks[i].period) {
      tasks[i].prev = now;
      tasks[i].run();
    }
  }
}`,
      },
    ],
    exercise: exercise(
      "ex-ard-scheduler",
      "Simulate Multi-Rate Cooperative Scheduler",
      "Implement a function `simulateScheduler(tasks, totalDurationMs)` that models a cooperative scheduler. Each task is an object `{ name: string, period: number }`. When `t % period === 0` (starting at t = 0), record the task name. Return an array of all executed task events in chronological order.",
      `function simulateScheduler(tasks, totalDurationMs) {
  const events = [];
  for (let t = 0; t < totalDurationMs; t += 10) {
    for (const task of tasks) {
      if (t % task.period === 0) {
        events.push(\`\${t}ms: \${task.name}\`);
      }
    }
  }
  return events;
}

console.log(JSON.stringify(simulateScheduler([
  { name: "LED", period: 20 },
  { name: "SENS", period: 40 }
], 50)));`,
      "ard-non-blocking-timing",
      "Accurately model periodic task firing in cooperative systems.",
      [
        "Initialize an empty events array.",
        "Iterate time t from 0 to totalDurationMs in 10ms increments.",
        "For each task, test if t % task.period === 0 and push formatted string.",
      ],
      "Developing",
      `function simulateScheduler(tasks, totalDurationMs) {
  // Simulate task firing at their respective periods
  return [];
}

console.log(JSON.stringify(simulateScheduler([
  { name: "LED", period: 20 },
  { name: "SENS", period: 40 }
], 50)));`,
      [
        testCase("tc-ard-sched-1", "Schedules multi-rate events correctly", '["0ms: LED","0ms: SENS","20ms: LED","40ms: LED","40ms: SENS"]'),
        testCase("tc-ard-sched-2", "Handles higher duration schedules", '["0ms: HEARTBEAT","50ms: HEARTBEAT"]', "", true),
      ],
    ),
    checkpoint: checkpoint(
      "Why is (currentMillis - previousMillis >= interval) mathematically safe against timer overflow at 49.7 days?",
      "In unsigned two's complement subtraction, wrapping around 0 yields the true positive elapsed difference without negative numbers or special case branches.",
    ),
  },

  // Lesson 9: Acoustic Tone Generation & Piezo Transducers
  {
    id: "arduino-tone-buzzer",
    order: 9,
    title: "Acoustic Tone Generation, Timer2 & Piezo Transducers",
    summary: "Generate square-wave audio frequencies using ATmega328P Timer2 CTC mode and the tone() library API.",
    type: "guided-coding",
    objectiveIds: ["ard-tone-piezo"],
    prerequisiteLessonIds: ["arduino-non-blocking-millis"],
    estimatedDurationMinutes: 25,
    interactiveDemo: {
      kind: "circuit",
      title: "Piezo Acoustic Transducer Synthesizer",
      description: "Trigger musical scale notes, adjust square wave frequencies, and inspect acoustic duty-cycle waveforms.",
    },
    content: `# Acoustic Tone Generation, Timer2 & Piezo Transducers

Microcontrollers interact with the physical world not only through visual LEDs and serial logs, but also acoustically. Producing musical tones, audible error alarms, and user feedback clicks requires synthesizing controlled square wave audio frequencies.

## Piezoelectric Transducers: Active vs Passive

There are two primary types of buzzer components:
1. **Active Buzzer**: Contains an integrated internal oscillator transistor circuit. Supplying continuous DC voltage ($5\\text{ V}$) immediately produces a fixed single-frequency buzz (typically 2.5 kHz). It cannot generate varying musical notes.
2. **Passive Buzzer (Piezo Transducer)**: Contains only a piezoelectric ceramic crystal. It requires an AC square wave signal from the microcontroller to oscillate and produce sound at selectable pitches.

## How the \`tone()\` Function Operates

The Arduino core provides the built-in \`tone()\` function:

\`\`\`cpp
tone(pin, frequency, duration);
noTone(pin);
\`\`\`

Under the hood, \`tone()\` reconfigures the ATmega328P **Timer2** hardware into CTC (Clear Timer on Compare Match) mode. Timer2 toggles the designated output pin automatically at the target frequency without CPU software intervention:

\`\`\`
f = F_CPU / (2 * Prescaler * (1 + OCR2A))
\`\`\`

## Musical Note Frequencies & 12-Tone Equal Temperament

Musical pitches are standardized by the 12-Tone Equal Temperament (12-TET) scale, anchored at Concert Pitch $A4 = 440\\text{ Hz}$:

\`\`\`
f_n = 440 * 2^((n - 69) / 12)
\`\`\`

Common note frequencies:
- **C4 (Middle C)**: $262\\text{ Hz}$
- **D4**: $294\\text{ Hz}$
- **E4**: $330\\text{ Hz}$
- **G4**: $392\\text{ Hz}$
- **A4**: $440\\text{ Hz}$
- **C5**: $523\\text{ Hz}$

## Hardware Conflict: Timer2 and PWM

Because \`tone()\` repurposes Timer2, calling \`tone()\` disables PWM output on **Pins 3 and 11** (OC2B and OC2A). Always avoid using Pins 3 or 11 for \`analogWrite()\` while playing tones!`,
    theorySections: [
      {
        id: "piezo-inductive-kickback",
        title: "Piezo Transducer Impedance & Flyback Spikes",
        content: `While piezo buzzers are predominantly capacitive loads, electromagnetic buzzers (magnetic transducers) are highly inductive coils. When turning off an inductive buzzer pin, the collapsing magnetic field creates a reverse voltage spike that can exceed 30V! Always place a flyback diode (1N4148) in reverse parallel across electromagnetic buzzers to protect the AVR output stage.`,
      },
      {
        id: "frequency-vs-pitch-perception",
        title: "Human Auditory Range & Logarithmic Perception",
        content: `The human ear perceives frequency logarithmically. Doubling the frequency corresponds to an increase of one musical octave. Our ears are most sensitive between 2 kHz and 4 kHz, making 2.5 kHz to 3.5 kHz the ideal frequency band for emergency alerts and alarms.`,
      },
    ],
    codeExamples: [
      {
        title: "Playing a Musical Melody Sequence",
        language: "c",
        description: "Plays a sequential melody array with proportional note pauses using tone() and noTone().",
        code: `#include <Arduino.h>

#define NOTE_C4 262
#define NOTE_E4 330
#define NOTE_G4 392
#define NOTE_C5 523

const uint8_t BUZZER_PIN = 8;

const int melody[] = { NOTE_C4, NOTE_E4, NOTE_G4, NOTE_C5 };
const int durations[] = { 250, 250, 250, 500 };

void setup() {
  for (int thisNote = 0; thisNote < 4; thisNote++) {
    int duration = durations[thisNote];
    tone(BUZZER_PIN, melody[thisNote], duration);
    delay(duration * 1.30); // 30% pause between notes
    noTone(BUZZER_PIN);
  }
}

void loop() {
  // Idle after melody finishes
}`,
      },
    ],
    exercise: exercise(
      "ex-ard-tone",
      "Calculate 12-TET Note Frequencies",
      "Implement a function `calculateNoteFrequencies(semitoneOffsets)` that takes an array of integer semitone offsets relative to A4 (0 = 440 Hz, -9 = C4 ~ 262 Hz, 3 = C5 ~ 523 Hz) and computes the exact frequency in Hz rounded to the nearest integer: `round(440 * Math.pow(2, offset / 12))`.",
      `function calculateNoteFrequencies(semitoneOffsets) {
  return semitoneOffsets.map(offset => Math.round(440 * Math.pow(2, offset / 12)));
}

console.log(JSON.stringify(calculateNoteFrequencies([0, -9, 3])));`,
      "ard-tone-piezo",
      "Accurately calculate acoustic note frequencies using 12-TET logarithmic pitch math.",
      [
        "Use Array.prototype.map over semitoneOffsets.",
        "Apply formula: Math.round(440 * Math.pow(2, offset / 12)).",
        "Return the mapped array of integer frequencies.",
      ],
      "Developing",
      `function calculateNoteFrequencies(semitoneOffsets) {
  // Map semitone offsets from A4 into rounded Hz frequencies
  return [];
}

console.log(JSON.stringify(calculateNoteFrequencies([0, -9, 3])));`,
      [
        testCase("tc-ard-tone-1", "Computes A4, C4, C5 note frequencies", "[440,262,523]"),
        testCase("tc-ard-tone-2", "Computes D4 and E4 note frequencies", "[294,330]", "", true),
      ],
    ),
    checkpoint: checkpoint(
      "Why does calling tone() on an Arduino Uno disable analogWrite() PWM on pins 3 and 11?",
      "tone() takes over the 8-bit Timer2 hardware to generate the CTC square wave, which disables Timer2's PWM channels OC2A (pin 11) and OC2B (pin 3).",
    ),
  },

  // Lesson 10: Precision Servo Motor Actuation
  {
    id: "arduino-servo-control",
    order: 10,
    title: "Precision Servo Motor Actuation & 50 Hz PWM Pulses",
    summary: "Control angular position of RC hobby servos using 50 Hz control pulses (544µs to 2400µs) and the Servo library.",
    type: "guided-coding",
    objectiveIds: ["ard-servo-actuator"],
    prerequisiteLessonIds: ["arduino-tone-buzzer"],
    estimatedDurationMinutes: 30,
    interactiveDemo: {
      kind: "circuit",
      title: "RC Servo Motor Pulse-Width Simulator",
      description: "Vary control pulse durations between 544µs and 2400µs and watch the simulated servo horn rotate from 0° to 180°.",
    },
    content: `# Precision Servo Motor Actuation & 50 Hz PWM Pulses

RC hobby servo motors (such as the ubiquitous SG90 and MG996R) provide closed-loop angular position control without external encoders. They are ubiquitous in robotics, pan-tilt camera mounts, and automated valves.

## The 50 Hz Pulse Duration Protocol

Unlike high-frequency 490 Hz or 980 Hz power PWM used for DC motor speed control, standard servos use a specialized **Pulse-Duration Modulation** protocol with a fixed **50 Hz frame rate** (20 ms period):

\`\`\`
        ◄───────────── 20 ms (50 Hz) ─────────────►
        ┌──────┐                                  ┌──────┐
        │ Pulse│                                  │ Pulse│
  ──────┘      └──────────────────────────────────┘      └───────────
        ◄──────►
         Pulse Width:
         • 544 µs (or 1000 µs) ──> 0°  (Minimum deflection)
         • 1500 µs            ──> 90° (Neutral center)
         • 2400 µs (or 2000 µs) ──> 180° (Maximum deflection)
\`\`\`

## The Arduino \`Servo\` Library

The Arduino \`Servo\` library abstracts pulse generation using the 16-bit **Timer1** peripheral:

\`\`\`cpp
#include <Servo.h>

Servo myServo;

void setup() {
  myServo.attach(9); // Attaches servo on pin 9
}

void loop() {
  myServo.write(90);        // Move to 90 degrees
  delay(1000);
  myServo.writeMicroseconds(1500); // Direct microsecond precision
  delay(1000);
}
\`\`\`

## Electrical Warning: The Power Rail Danger

A hobby servo motor contains a DC motor, reduction gears, a feedback potentiometer, and an H-bridge driver. Under mechanical stall or sudden acceleration, an SG90 draws **500 mA to 1 A**, while larger MG996R servos draw **over 2.5 A**!

**CRITICAL RULE**: **Never power servo motors directly from the Arduino Uno 5V header pin.**
Drawing high stall currents through the Uno's onboard AMS1117 regulator triggers thermal shutdown or voltage sag below 4.3V, causing the ATmega328P to suffer an immediate **Brown-Out Reset (BOR)**.

### Proper Wiring:
1. Power the servo from an **external regulated 5V power supply** (e.g. 5V 2A adapter or battery pack).
2. **Connect the Ground (GND) of the external supply directly to Arduino GND** to establish a common voltage reference!
3. Connect the Arduino signal pin (e.g. Pin 9) directly to the servo yellow/white control wire.`,
    theorySections: [
      {
        id: "timer1-and-pwm-tradeoffs",
        title: "Timer1 Consumption by Servo Library",
        content: `The standard Arduino Servo library utilizes the 16-bit Timer1 to generate pulse widths with sub-microsecond precision. Consequently, using the Servo library disables hardware analogWrite() PWM on **Pins 9 and 10** on the Uno, even if the servo is attached to a different pin!`,
      },
      {
        id: "closed-loop-potentiometer",
        title: "Closed-Loop Potentiometer Servo Mechanics",
        content: `Inside the servo casing, the final gear is mechanically linked to a rotary potentiometer. An internal comparator circuit compares the voltage generated by the incoming pulse width against the potentiometer wiper voltage. The internal H-bridge powers the DC motor until the position error reaches zero.`,
      },
    ],
    codeExamples: [
      {
        title: "Smooth Non-Blocking Servo Sweep",
        language: "c",
        description: "Sweeps a servo back and forth between 0° and 180° incrementally without blocking delays.",
        code: `#include <Arduino.h>
#include <Servo.h>

Servo panServo;
const uint8_t SERVO_PIN = 9;

int currentAngle = 0;
int stepDirection = 1;
unsigned long lastMoveTime = 0;
const unsigned long STEP_INTERVAL = 15; // 15 ms per degree = 2.7 sec sweep

void setup() {
  panServo.attach(SERVO_PIN);
  panServo.write(currentAngle);
}

void loop() {
  unsigned long now = millis();
  if (now - lastMoveTime >= STEP_INTERVAL) {
    lastMoveTime = now;
    currentAngle += stepDirection;
    if (currentAngle >= 180) {
      currentAngle = 180;
      stepDirection = -1;
    } else if (currentAngle <= 0) {
      currentAngle = 0;
      stepDirection = 1;
    }
    panServo.write(currentAngle);
  }
}`,
      },
    ],
    exercise: exercise(
      "ex-ard-servo",
      "Calculate Servo Angle from Microsecond Pulse Width",
      "Implement a function `pulseToAngle(pulseUs, minPulseUs = 544, maxPulseUs = 2400)` that clamps the microsecond pulse between `minPulseUs` and `maxPulseUs` and converts it linearly into degrees in the range `[0, 180]`, rounded to the nearest integer.",
      `function pulseToAngle(pulseUs, minPulseUs = 544, maxPulseUs = 2400) {
  const clamped = Math.max(minPulseUs, Math.min(maxPulseUs, pulseUs));
  const ratio = (clamped - minPulseUs) / (maxPulseUs - minPulseUs);
  return Math.round(ratio * 180);
}

console.log(pulseToAngle(1472));`,
      "ard-servo-actuator",
      "Correctly translate microsecond pulse widths into calibrated servo rotation angles.",
      [
        "Clamp pulseUs between minPulseUs and maxPulseUs.",
        "Calculate the normalized ratio: (clamped - minPulseUs) / (maxPulseUs - minPulseUs).",
        "Multiply by 180 and round using Math.round.",
      ],
      "Developing",
      `function pulseToAngle(pulseUs, minPulseUs = 544, maxPulseUs = 2400) {
  // Convert pulse microsecond duration to rounded degree angle
  return 0;
}

console.log(pulseToAngle(1472));`,
      [
        testCase("tc-ard-servo-1", "Calculates center neutral angle (90 deg)", "90"),
        testCase("tc-ard-servo-2", "Clamps minimum pulse to 0 deg", "0", "", true),
      ],
    ),
    checkpoint: checkpoint(
      "Why must the ground of an external servo power supply be connected to the Arduino GND pin?",
      "Voltage is a relative potential difference; without a common ground reference between the external supply and the Arduino, the control signal cannot be referenced and causes erratic servo jitter.",
    ),
  },

  // Module 5: Communication Buses & Capstone System
  {
    id: "arduino-i2c-wire-oled",
    order: 11,
    title: "The I2C Bus Protocol, Two-Wire Interface & OLED Displays",
    summary: "Master synchronous serial I2C bus communication (SDA/SCL), 7-bit addressing, and interfacing SSD1306 OLED displays.",
    type: "guided-coding",
    objectiveIds: ["ard-i2c-bus"],
    prerequisiteLessonIds: ["arduino-servo-control"],
    estimatedDurationMinutes: 30,
    interactiveDemo: {
      kind: "circuit",
      title: "I2C Bus Protocol Packet Analyzer",
      description: "Transmit 7-bit slave address frames, R/W control bits, and inspect ACK/NACK handshake states on SDA and SCL.",
    },
    content: `# The I2C Bus Protocol, Two-Wire Interface & OLED Displays

In complex embedded projects, connecting multiple sensors, memories, and displays using individual digital pins rapidly depletes available I/O lines. The **I2C (Inter-Integrated Circuit)** bus, also known as the Two-Wire Interface (TWI), solves this by connecting dozens of peripheral ICs using only two shared physical lines.

## I2C Physical Layer: Open-Drain & Pull-Up Resistors

The I2C bus utilizes two bidirectional signals:
- **SDA (Serial Data)**: Carries data bits. On Uno, this is Pin **A4** (or dedicated SDA header pin).
- **SCL (Serial Clock)**: Carries clock pulses driven by the bus Master. On Uno, this is Pin **A5** (or dedicated SCL header pin).

Both SDA and SCL utilize **open-drain / open-collector drivers** with external **pull-up resistors** (typically $4.7\\text{ k}\\Omega$ to $5\\text{ V}$):

\`\`\`
        +5V Rail
          │        │
         [4.7k]   [4.7k]
          │        │
  SCL ────┴────────┼─────────────────── SCL Master & Slaves
                   │
  SDA ─────────────┴─────────────────── SDA Master & Slaves
\`\`\`

Because pins can only pull lines LOW or let them float HIGH, bus contention never damages silicon outputs. If two devices transmit simultaneously, a zero bit (LOW) dominates, allowing clean collision arbitration.

## The I2C Frame Transaction

An I2C frame consists of:
1. **START Condition**: SDA transitions HIGH-to-LOW while SCL is HIGH.
2. **7-Bit Address + R/W Bit**: 7 address bits followed by 0 (Write) or 1 (Read).
3. **ACK / NACK Bit**: The receiver pulls SDA LOW to acknowledge receipt of each byte.
4. **Data Bytes**: 8 bits of payload, each followed by an ACK bit.
5. **STOP Condition**: SDA transitions LOW-to-HIGH while SCL is HIGH.

\`\`\`
SDA: ──┐      ┌──[A6]─[A5]─[A4]─[A3]─[A2]─[A1]─[A0]─[R/W]──[ACK]──┐   ┌──
       └──────┘                                            └───┘   └───
SCL: ────┐      ┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐     ┌───┐
         └──────┘   └───┘   └───┘   └───┘   └───┘   └───┘   └─────┘   └──
         START                7-Bit Slave Address + Direction     STOP
\`\`\`

## The Arduino \`Wire\` Library

Arduino handles I2C transactions using the built-in \`Wire\` library:

\`\`\`cpp
#include <Wire.h>

void setup() {
  Wire.begin(); // Join bus as Master
}

void writeRegister(uint8_t devAddr, uint8_t regAddr, uint8_t value) {
  Wire.beginTransmission(devAddr); // Start condition + Address (W)
  Wire.write(regAddr);             // Target register
  Wire.write(value);               // Register value
  Wire.endTransmission();          // Stop condition
}
\`\`\``,
    theorySections: [
      {
        id: "i2c-addressing-conflicts",
        title: "7-Bit Device Addressing & Multiplexers",
        content: `Each I2C device on a shared bus must possess a unique 7-bit address (0x08 to 0x77). Popular sensor addresses include 0x68 (MPU6050 accelerometer) and 0x3C or 0x3D (SSD1306 OLED). If you need multiple identical sensors with fixed addresses, use an I2C multiplexer such as the TCA9548A.`,
      },
      {
        id: "clock-stretching",
        title: "Clock Stretching by Slave Peripherals",
        content: `When a slow microcontroller or slave device needs extra time to process a received byte or prepare output data, it can hold the SCL clock line LOW. The master detects this and halts clock generation until the slave releases SCL.`,
      },
    ],
    codeExamples: [
      {
        title: "I2C Bus Address Scanner Utility",
        language: "c",
        description: "Scans all 127 possible I2C addresses and reports active responding devices on the Serial monitor.",
        code: `#include <Arduino.h>
#include <Wire.h>

void setup() {
  Wire.begin();
  Serial.begin(115200);
  while (!Serial);
  Serial.println("Scanning I2C bus...");

  uint8_t count = 0;
  for (uint8_t address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    uint8_t error = Wire.endTransmission();

    if (error == 0) {
      Serial.print("Device found at address 0x");
      if (address < 16) Serial.print("0");
      Serial.println(address, HEX);
      count++;
    }
  }
  Serial.print("Scan complete. Devices found: ");
  Serial.println(count);
}

void loop() {
  // Idle after scan
}`,
      },
    ],
    exercise: exercise(
      "ex-ard-i2c",
      "Parse I2C Protocol Frame Packet",
      "Implement a function `parseI2CFrame(addressByte, dataBytes)` that parses the first I2C transaction byte into the 7-bit target device address in hex (e.g. \"0x3C\") and the operation mode (\"READ\" if bit 0 is 1, \"WRITE\" if bit 0 is 0), along with payload count.",
      `function parseI2CFrame(addressByte, dataBytes) {
  const address7Bit = (addressByte >> 1) & 0x7F;
  const isRead = (addressByte & 0x01) === 1;
  const hexAddress = "0x" + address7Bit.toString(16).toUpperCase().padStart(2, "0");
  return {
    address: hexAddress,
    mode: isRead ? "READ" : "WRITE",
    byteCount: dataBytes.length
  };
}

console.log(JSON.stringify(parseI2CFrame(0x78, [0x00, 0xAF])));`,
      "ard-i2c-bus",
      "Correctly decode I2C address bytes and read/write control flags.",
      [
        "Shift addressByte right by 1 to isolate the 7-bit device address: (addressByte >> 1) & 0x7F.",
        "Check bit 0 of addressByte: if 1 mode is 'READ', else 'WRITE'.",
        "Format address as uppercase 2-digit hex string prefixed with '0x'.",
      ],
      "Developing",
      `function parseI2CFrame(addressByte, dataBytes) {
  // Decode 7-bit address and mode from addressByte
  return null;
}

console.log(JSON.stringify(parseI2CFrame(0x78, [0x00, 0xAF])));`,
      [
        testCase("tc-ard-i2c-1", "Parses write frame to SSD1306 (0x3C)", '{"address":"0x3C","mode":"WRITE","byteCount":2}'),
        testCase("tc-ard-i2c-2", "Parses read frame from sensor (0x68)", '{"address":"0x68","mode":"READ","byteCount":0}', "", true),
      ],
    ),
    checkpoint: checkpoint(
      "What happens on an I2C bus if the pull-up resistors on SDA and SCL are completely missing?",
      "Because I2C drivers are open-drain, the lines cannot return to a logic HIGH state on their own, causing the bus to remain permanently LOW and freeze.",
    ),
  },

  // Lesson 12: Embedded Systems Capstone
  {
    id: "arduino-capstone-multisensor",
    order: 12,
    title: "Embedded Capstone: Autonomous Multisensor Controller",
    summary: "Synthesize hardware interrupts, ADC sensor filtering, non-blocking state schedulers, and actuator control into a complete embedded application.",
    type: "guided-coding",
    objectiveIds: ["ard-multisensor-capstone"],
    prerequisiteLessonIds: ["arduino-i2c-wire-oled"],
    estimatedDurationMinutes: 35,
    interactiveDemo: {
      kind: "circuit",
      title: "Autonomous Multisensor Controller Dashboard",
      description: "Interact with live sensor streams, test watchdog timer auto-recovery, and inspect closed-loop motor/buzzer responses.",
    },
    content: `# Embedded Capstone: Autonomous Multisensor Controller

Professional embedded engineering requires orchestrating multiple subsystems—analog acquisition, interrupt handling, actuator modulation, and fault recovery—into an integrated, robust firmware architecture. In this capstone, we synthesize every concept into an industrial environmental controller.

## System Architecture

The autonomous controller executes four concurrent roles:
1. **Interrupt-Driven Pulse Counter**: Logs optical tachometer pulses on INT0 (Pin 2).
2. **Moving-Average Analog Filtering**: Samples raw analog temperature voltage and filters high-frequency thermal noise.
3. **Non-Blocking Finite State Machine**: Evaluates system states (\`IDLE\`, \`ACTIVE\`, \`ALARM\`) based on sensor thresholds.
4. **Hardware Watchdog Protection**: Armed with the AVR Watchdog Timer (WDT) to guarantee automatic reboot within 2 seconds if a software hang occurs.

\`\`\`
                 ┌───────────────────────────────────────┐
                 │        AVR ATmega328P Core            │
                 │                                       │
 INT0 (Pin 2) ──>│ ISR: Increment pulse counter          │
                 │                                       │
 ADC (Pin A0) ──>│ Moving average circular filter (10Hz) │
                 │                                       │
 Timer0 Sched ──>│ State Machine: IDLE -> ACTIVE -> ALARM│
                 │                                       │
 WDT (2.0s)   ──>│ wdt_reset() inside loop()             │
                 └──────────────┬────────────────────────┘
                                │
                  ┌─────────────┴─────────────┐
                  ▼                           ▼
            PWM Servo (Pin 9)        Piezo Alarm (Pin 8)
\`\`\`

## Watchdog Timer (WDT) Integration

The ATmega328P includes an independent on-chip 128 kHz oscillator running a hardware Watchdog Timer. If the firmware enters an infinite loop, deadlocks on a bus, or suffers stack corruption:

\`\`\`cpp
#include <avr/wdt.h>

void setup() {
  wdt_enable(WDTO_2S); // Reboot if not serviced within 2 seconds
}

void loop() {
  // Execute non-blocking state tasks
  wdt_reset(); // Service (kick) the watchdog
}
\`\`\`

If \`wdt_reset()\` is not called within 2 seconds, the WDT generates a hardware system reset, bringing the microcontroller back to \`setup()\`.

## Production Firmware Checklist
- Zero \`delay()\` calls in \`loop()\`.
- All ISR-modified variables declared as \`volatile\`.
- Multi-byte variable reads protected with atomic \`noInterrupts()\` / \`interrupts()\`.
- Watchdog timer enabled and kicked in main loop.
- Decoupling capacitors (100nF ceramic) present across all sensor power rails.`,
    theorySections: [
      {
        id: "moving-average-circular-buffers",
        title: "Moving Average Filtering on Constrained Microcontrollers",
        content: `Floating-point digital filtering incurs heavy computational overhead on 8-bit AVR microcontrollers without hardware FPUs. An integer circular buffer of size N (ideally a power of two, e.g. 8 or 16) allows computing moving averages with bit-shifting: sum = sum - buffer[idx] + newSample; buffer[idx] = newSample; average = sum >> 3;.`,
      },
      {
        id: "brownout-protection-wdt",
        title: "Brown-Out Detection (BOD) Fuses",
        content: `Microcontrollers operating under marginal supply voltages (e.g. 3.5V on a 5V ATmega328P) can execute invalid opcodes and corrupt flash memory. Setting the AVR BOD fuse to 4.3V holds the CPU in reset until power supply voltage stabilizes.`,
      },
    ],
    codeExamples: [
      {
        title: "Integrated Multisensor Embedded Controller",
        language: "c",
        description: "Complete firmware combining external interrupts, analog filtering, watchdog timer, and state machine.",
        code: `#include <Arduino.h>
#include <avr/wdt.h>

volatile uint16_t pulseCount = 0;
void onPulse(void) { pulseCount++; }

#define WINDOW_SIZE 4
uint16_t adcSamples[WINDOW_SIZE] = {0};
uint8_t sampleIdx = 0;
uint32_t sampleSum = 0;

uint16_t getFilteredADC(uint16_t raw) {
  sampleSum -= adcSamples[sampleIdx];
  adcSamples[sampleIdx] = raw;
  sampleSum += raw;
  sampleIdx = (sampleIdx + 1) % WINDOW_SIZE;
  return sampleSum / WINDOW_SIZE;
}

enum State { ST_NORMAL, ST_WARNING, ST_CRITICAL };
State currentState = ST_NORMAL;

void setup() {
  Serial.begin(115200);
  pinMode(2, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(2), onPulse, FALLING);
  pinMode(13, OUTPUT);
  wdt_enable(WDTO_2S);
}

void loop() {
  wdt_reset();
  static unsigned long lastTick = 0;
  if (millis() - lastTick >= 200) {
    lastTick = millis();
    uint16_t currentReading = getFilteredADC(analogRead(A0));
    if (currentReading > 700) currentState = ST_CRITICAL;
    else if (currentReading > 400) currentState = ST_WARNING;
    else currentState = ST_NORMAL;

    digitalWrite(13, currentState == ST_CRITICAL ? HIGH : LOW);
  }
}`,
      },
    ],
    exercise: exercise(
      "ex-ard-capstone",
      "Simulate Moving Average Environmental Controller",
      "Implement a function `simulateController(rawReadings, windowSize, warningThreshold, criticalThreshold)` that processes an array of raw sensor readings through a moving average filter of size `windowSize`. For each step (once window is primed), classify state as \"CRITICAL\" if average >= criticalThreshold, \"WARNING\" if average >= warningThreshold, or \"NORMAL\". Return array of classifications.",
      `function simulateController(rawReadings, windowSize, warningThreshold, criticalThreshold) {
  const results = [];
  const buffer = [];
  let sum = 0;

  for (const val of rawReadings) {
    buffer.push(val);
    sum += val;
    if (buffer.length > windowSize) {
      sum -= buffer.shift();
    }
    if (buffer.length === windowSize) {
      const avg = sum / windowSize;
      if (avg >= criticalThreshold) results.push("CRITICAL");
      else if (avg >= warningThreshold) results.push("WARNING");
      else results.push("NORMAL");
    }
  }
  return results;
}

console.log(JSON.stringify(simulateController([300, 320, 350, 420, 500, 750], 3, 400, 700)));`,
      "ard-multisensor-capstone",
      "Implement real-time moving average smoothing and multi-threshold state classification.",
      [
        "Maintain a sliding window buffer and running sum.",
        "When buffer reaches windowSize, compute avg = sum / windowSize.",
        "Classify avg against criticalThreshold and warningThreshold, pushing state string to results.",
      ],
      "Developing",
      `function simulateController(rawReadings, windowSize, warningThreshold, criticalThreshold) {
  // Process readings through moving average and return state classifications
  return [];
}

console.log(JSON.stringify(simulateController([300, 320, 350, 420, 500, 750], 3, 400, 700)));`,
      [
        testCase("tc-ard-cap-1", "Filters sensor noise and detects transitions", '["NORMAL","WARNING","WARNING","CRITICAL"]'),
        testCase("tc-ard-cap-2", "Maintains NORMAL state under low readings", '["NORMAL","NORMAL"]', "", true),
      ],
    ),
    checkpoint: checkpoint(
      "Why must the Watchdog Timer be refreshed in the main loop rather than inside a hardware timer ISR?",
      "An ISR may continue firing even if the main loop has locked up or crashed; refreshing the watchdog in the main loop verifies that the entire application scheduling loop is running normally.",
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
  moduleData(
    "ard-module-timers-actuators",
    4,
    "Hardware Timers, Interrupts & Actuators",
    "Attach external hardware interrupts, construct multi-rate software schedulers, generate piezo tones, and command servo motors.",
    arduinoEmbeddedLessons.slice(6, 10),
  ),
  moduleData(
    "ard-module-buses-capstone",
    5,
    "Communication Buses & Capstone System",
    "Interface I2C OLED displays and environmental sensors, and build a resilient multi-sensor embedded controller.",
    arduinoEmbeddedLessons.slice(10, 12),
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
    "Attach external hardware interrupts (INT0/INT1) and write race-free ISRs.",
    "Build multi-rate non-blocking schedulers and eliminate blocking delay calls.",
    "Synthesize acoustic musical tones using Timer2 CTC square waves.",
    "Actuate precision RC hobby servos using 50 Hz PWM timing pulses.",
    "Master the I2C two-wire bus protocol to communicate with sensors and OLEDs.",
    "Architect resilient embedded systems with watchdog timers and moving average filtering.",
  ],
  estimatedDurationMinutes: 320,
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
