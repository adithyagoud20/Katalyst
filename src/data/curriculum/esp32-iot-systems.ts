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

export const esp32IotSubject: LearningSubject = {
  id: "esp32-iot-subject",
  title: "ESP32 Dual-Core IoT Systems & FreeRTOS",
  description: "Architect connected IoT systems using the Xtensa dual-core processor, FreeRTOS tasks, 3.3V logic constraints, 12-bit ADC, LEDC PWM, and Wi-Fi telemetry.",
};

const objectives: LearningObjective[] = [
  { id: "esp-dual-core-logic", title: "Navigate Xtensa 32-bit dual-core architecture, FreeRTOS task scheduling, and strict 3.3V logic level constraints." },
  { id: "esp-gpio-strapping", title: "Identify bootstrap/strapping pins, input-only pins (GPIO 34-39), and select safe peripherals without boot failures." },
  { id: "esp-12bit-adc", title: "Configure 12-bit ADC attenuation curves (0dB to 11dB), correct silicon non-linearity, and sample sensors on ADC1." },
  { id: "esp-ledc-pwm", title: "Allocate hardware LEDC timers, assign channels to arbitrary GPIOs, and modulate duty cycle with up to 16-bit resolution." },
  { id: "esp-wifi-telemetry", title: "Establish 802.11 b/g/n Wi-Fi station connectivity and transmit serialized JSON telemetry payloads via HTTP REST." },
  { id: "esp-deep-sleep", title: "Configure Ultra-Low-Power (ULP) deep sleep modes, preserve variables in RTC slow memory, and handle external wakeups." },
  { id: "esp-freertos-tasks", title: "Create pinned tasks on Core 0 and Core 1 with priority scheduling and stack allocation." },
  { id: "esp-freertos-queues", title: "Implement thread-safe inter-task communication using FreeRTOS FIFO queues and mutexes." },
  { id: "esp-adc-multisampling", title: "Calibrate 12-bit ADC non-linearity using multisampling and lookup tables." },
  { id: "esp-deep-sleep-advanced", title: "Design ultra-low-power duty cycles using timer and touch wakeups with RTC SRAM state persistence." },
  { id: "esp-mqtt-telemetry", title: "Publish and subscribe to lightweight IoT telemetry using the MQTT protocol over TLS." },
  { id: "esp-iot-capstone", title: "Synthesize dual-core FreeRTOS tasks, sensor sampling, and cloud telemetry into a resilient IoT node." },
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

export const esp32IotLessons: LearningLesson[] = [
  // Module 1: ESP32 Architecture & 3.3V Logic
  {
    id: "esp32-dual-core-logic",
    order: 1,
    title: "ESP32 Tensilica Dual-Core Architecture & 3.3V Logic Constraints",
    summary: "Master the Xtensa LX6 dual-core architecture, FreeRTOS background tasks, and critical 3.3V electrical boundaries.",
    type: "guided-coding",
    objectiveIds: ["esp-dual-core-logic"],
    prerequisiteLessonIds: [],
    estimatedDurationMinutes: 30,
    interactiveDemo: {
      kind: "circuit",
      title: "ESP32 Pinout & 3.3V Logic Checker",
      description: "Inspect dual-core processor stats, memory maps, and 3.3V logic level threshold tolerances.",
    },
    content: `# ESP32 Tensilica Dual-Core Architecture & 3.3V Logic Constraints

The Espressif ESP32 is a powerhouse IoT system-on-a-chip (SoC) featuring two 32-bit Xtensa LX6 microprocessor cores running at up to 240 MHz, 520 KB of internal SRAM, 4 MB of external SPI flash, integrated 2.4 GHz Wi-Fi (802.11 b/g/n), and Bluetooth v4.2 BR/EDR and BLE.

## Dual-Core Architecture & FreeRTOS

Unlike single-core microcontrollers that can execute only one instruction stream at a time:
- **Core 0 (Protocol Core)**: Typically runs the FreeRTOS networking stack, handling Wi-Fi handshakes, TCP/IP sockets, and Bluetooth low-energy advertising.
- **Core 1 (Application Core)**: By default executes your Arduino \`setup()\` and \`loop()\` user application logic.

FreeRTOS allows pinning compute-intensive or real-time tasks to specific cores using \`xTaskCreatePinnedToCore()\`:

\`\`\`cpp
// Pin an audio decoding or motor control task to Core 0
xTaskCreatePinnedToCore(
  motorControlTask,   // Task function
  "MotorTask",        // Name
  4096,               // Stack depth in words
  NULL,               // Parameter
  2,                  // Priority
  NULL,               // Task handle
  0                   // Core ID (0 or 1)
);
\`\`\`

## Strict 3.3V Electrical Limits: Never Feed 5V to ESP32!

The single most common mistake when transitioning from Arduino Uno to ESP32 is electrical overvoltage:
- **Arduino Uno**: Operates at $5.0\\text{ V}$ logic levels. A HIGH output delivers $\\sim 5.0\\text{ V}$.
- **ESP32**: Operates strictly at **$3.3\\text{ V}$ logic**.
- **Maximum Safe Input Voltage on ANY GPIO**: **$3.6\\text{ V}$**.

Connecting a 5V sensor, 5V serial line, or 5V logic signal directly to an ESP32 GPIO pin triggers electrostatic clamp diode breakdown, resulting in permanent silicon death.

To interface a 5V sensor with ESP32, use a **bidirectional logic level converter** or a **resistive voltage divider**:
\`\`\`
V_out = 5.0 V * (R2 / (R1 + R2))
Choose R1 = 1.0 kΩ, R2 = 2.0 kΩ:
V_out = 5.0 * (2000 / 3000) = 3.33 V (Safe!)
\`\`\``,
    theorySections: [
      {
        id: "freertos-preemptive-scheduling",
        title: "FreeRTOS Preemptive Priority Scheduling",
        content: `FreeRTOS uses a preemptive priority-based scheduler. When a high-priority task unblocks (e.g., in response to an interrupt or timer event), the kernel immediately suspends the lower-priority task, saves its registers onto its task stack, and switches context. Tasks of equal priority share CPU time via round-robin time slicing (typically 1 ms tick rate).`,
      },
      {
        id: "gpio-drive-strength",
        title: "Current Drive Capabilities per GPIO",
        content: `ESP32 GPIO pins can source or sink approximately 12 mA under standard settings, with a software-configurable maximum of up to 40 mA across specific pins. However, total chip current dissipation should remain under 250 mA to prevent thermal throttling.`,
      },
    ],
    codeExamples: [
      {
        title: "Voltage Divider Level Shifter Calculator",
        language: "c",
        code: `// Calculating resistor values for 5V to 3.3V step-down
#include <stdio.h>

float calculateSteppedVoltage(float vIn, float r1, float r2) {
  return vIn * (r2 / (r1 + r2));
}

int main(void) {
  float v5 = 5.0f;
  float r1 = 1000.0f; // 1k ohm
  float r2 = 2000.0f; // 2k ohm
  
  float vSafe = calculateSteppedVoltage(v5, r1, r2);
  printf("5V Input -> Stepped Down: %.2f V (%s)\\n", 
         vSafe, vSafe <= 3.6f ? "SAFE FOR ESP32" : "DANGER OVERVOLTAGE");
  return 0;
}`,
        description: "Verify safe voltage attenuation for ESP32 inputs.",
      },
    ],
    exercise: exercise(
      "ex-esp-logic-divider",
      "Calculate 5V to 3.3V Voltage Divider Ratio",
      "Write a function `isSafeForEsp32(vIn, r1, r2)` that returns `true` if the attenuated voltage `vIn * (r2 / (r1 + r2))` is less than or equal to `3.6` volts, and `false` if it exceeds 3.6V. Test with `vIn = 5.0, r1 = 1000, r2 = 2000` (safe) and `vIn = 5.0, r1 = 500, r2 = 2000` (overvoltage). Print the two boolean results joined by a comma.",
      `function isSafeForEsp32(vIn, r1, r2) {
  const vOut = vIn * (r2 / (r1 + r2));
  return vOut <= 3.6;
}

console.log(isSafeForEsp32(5.0, 1000, 2000) + "," + isSafeForEsp32(5.0, 500, 2000));`,
      "esp-dual-core-logic",
      "Evaluate voltage divider circuit parameters to protect 3.3V ESP32 silicon.",
      [
        "Compute vOut = vIn * (r2 / (r1 + r2)).",
        "Compare vOut <= 3.6.",
        "Expected output: 'true,false'.",
      ],
      "Beginner",
      `function isSafeForEsp32(vIn, r1, r2) {
  // Check if output voltage <= 3.6V
  return false;
}

console.log(isSafeForEsp32(5.0, 1000, 2000) + "," + isSafeForEsp32(5.0, 500, 2000));`,
      [
        testCase("tc-esp-safe-divider", "Evaluates safe 3.33V and dangerous 4.0V dividers", "true,false"),
        testCase("tc-esp-edge-divider", "Evaluates boundary condition at exactly 3.6V", "true", "", true),
      ],
    ),
    checkpoint: checkpoint(
        "What is the absolute maximum voltage you can safely apply to any ESP32 GPIO pin?",
        "3.6 Volts. Any voltage exceeding 3.6V (such as direct 5V from an Arduino Uno or 5V sensor) risks permanently burning the GPIO driver circuitry.",
      ),
  },

  // Lesson 2: GPIO Matrix, Strapping Pins & Safe Pin Selection
  {
    id: "esp32-gpio-strapping",
    order: 2,
    title: "GPIO Matrix, Strapping Pins & Safe Pin Selection",
    summary: "Identify hardware strapping/boot pins, input-only pins, and configure safe GPIOs without causing boot loops.",
    type: "guided-coding",
    objectiveIds: ["esp-gpio-strapping"],
    prerequisiteLessonIds: ["esp32-dual-core-logic"],
    estimatedDurationMinutes: 25,
    interactiveDemo: {
      kind: "circuit",
      title: "ESP32 GPIO Pin Safe-Selector",
      description: "Interactive pinout showing which pins are safe to use for buttons, relays, and LEDs without triggering boot failures.",
    },
    content: `# GPIO Matrix, Strapping Pins & Safe Pin Selection

On typical microcontrollers like the ATmega328P, peripheral hardware (UART, SPI, I2C, PWM) is hardwired to specific physical pins. The ESP32 features an advanced **GPIO Matrix** that can route almost any internal peripheral signal to almost any physical pin!

However, not all 36 physical pins are created equal. Using the wrong pin can prevent your ESP32 from booting or cause bizarre reset loops.

## Pin Categorization & Restrictions

### 1. Strapping (Boot) Pins: Handle with Care
During reset or power-up, the ESP32 samples the logic levels of specific pins to determine whether to boot from Flash or enter Serial Flashing Mode:
- **GPIO 0**: Must be HIGH for normal SPI boot. If pulled LOW during reset, the chip enters UART Download/Flashing mode!
- **GPIO 2**: Connected to the onboard blue LED. Must be left floating or pulled LOW during boot.
- **GPIO 12 (MTDI)**: Selects internal flash voltage (3.3V vs 1.8V). If pulled HIGH during boot, flash voltage changes and boot crashes!
- **GPIO 15**: Outputs PWM debug messages during boot; must be HIGH for normal boot.

### 2. Input-Only Pins (GPI): GPIO 34, 35, 36 (VP), 39 (VN)
- These pins have **NO output drivers** (cannot run \`digitalWrite\`).
- They have **NO internal pull-up or pull-down resistors**!
- Ideal exclusively for analog sensor inputs (potentiometers, light sensors).

### 3. SPI Flash Pins: NEVER USE! (GPIO 6 to 11)
- Pins 6, 7, 8, 9, 10, and 11 are directly wired to the onboard 4MB SPI Flash chip.
- Attempting to use them crashes the chip immediately!

### 4. Safe General-Purpose Pins:
The safest pins for general inputs, outputs, LEDs, and relays are:
\`GPIO 4, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33\`.`,
    theorySections: [
      {
        id: "gpio-matrix-mux",
        title: "The Flexible ESP32 GPIO Matrix",
        content: `The ESP32 includes an internal crossbar switch (the GPIO Matrix) between the peripheral output signals and the physical IO PADs. This allows remapping I2C (Wire.begin(SDA, SCL)) or SPI pins to any arbitrary general-purpose digital pin, dramatically simplifying PCB routing.`,
      },
      {
        id: "glitch-at-boot",
        title: "Boot Glitches & Relay Chatter",
        content: `Several pins (such as GPIO 0, 1, 3, 5, 14, 15) output brief high-frequency PWM or serial debug pulses for 10–50 ms during initial power-up. If a sensitive relay or actuator is wired to one of these pins, it may briefly trigger ('chatter') whenever the device reboots. Always choose glitch-free pins (like GPIO 18, 19, 21, 22, 23) for relays.`,
      },
    ],
    codeExamples: [
      {
        title: "Pin Safety Validator in C",
        language: "c",
        code: `// Pin safety classifier
#include <stdio.h>
#include <stdbool.h>

typedef enum { PIN_SAFE, PIN_STRAPPING, PIN_INPUT_ONLY, PIN_FLASH_FORBIDDEN } PinType;

PinType classifyPin(int gpio) {
  if (gpio >= 6 && gpio <= 11) return PIN_FLASH_FORBIDDEN;
  if (gpio >= 34 && gpio <= 39) return PIN_INPUT_ONLY;
  if (gpio == 0 || gpio == 2 || gpio == 12 || gpio == 15) return PIN_STRAPPING;
  return PIN_SAFE;
}

int main(void) {
  int pins[] = { 4, 0, 34, 7 };
  for (int i = 0; i < 4; i++) {
    printf("GPIO %2d: Type %d\\n", pins[i], classifyPin(pins[i]));
  }
  return 0;
}`,
        description: "Validating GPIO pin safety before peripheral assignment.",
      },
    ],
    exercise: exercise(
      "ex-esp-pin-checker",
      "Classify ESP32 GPIO Capability",
      "Write a function `canPinOutput(gpio)` that returns `true` if the GPIO pin is capable of driving an output, and `false` if it is an input-only pin (34, 35, 36, 39) or connected to internal flash memory (6, 7, 8, 9, 10, 11). Test with GPIOs `[4, 34, 7, 21]` and print the results as JSON.",
      `function canPinOutput(gpio) {
  if (gpio >= 6 && gpio <= 11) return false;
  if ([34, 35, 36, 39].includes(gpio)) return false;
  return true;
}

const testPins = [4, 34, 7, 21];
console.log(JSON.stringify(testPins.map(canPinOutput)));`,
      "esp-gpio-strapping",
      "Filter ESP32 GPIOs based on hardware capabilities and silicon constraints.",
      [
        "Check if gpio is in range 6-11 (internal flash -> false).",
        "Check if gpio is in [34, 35, 36, 39] (GPI input only -> false).",
        "Return true for other pins like 4 and 21.",
        "Expected output: [true,false,false,true].",
      ],
      "Beginner",
      `function canPinOutput(gpio) {
  // Return true if pin can output
  return false;
}

const testPins = [4, 34, 7, 21];
console.log(JSON.stringify(testPins.map(canPinOutput)));`,
      [
        testCase("tc-esp-pins-check", "Checks output validity across safe and restricted pins", "[true,false,false,true]"),
        testCase("tc-esp-pins-edge", "Checks GPIO 0 strapping pin capability", "true", "", true),
      ],
    ),
    checkpoint: checkpoint(
        "What happens if an external circuit pulls GPIO 0 LOW while the ESP32 is powered on or reset?",
        "The chip enters UART Download/Flashing bootloader mode instead of executing application firmware from SPI Flash.",
      ),
  },

  // Module 2: High-Resolution ADC & LEDC PWM
  {
    id: "esp32-12bit-adc",
    order: 3,
    title: "12-Bit Successive Approximation ADC, Attenuation & Non-Linearity",
    summary: "Sample analog signals with 4096 levels, configure dB attenuation, and account for silicon non-linearity near 0V and 3.3V.",
    type: "guided-coding",
    objectiveIds: ["esp-12bit-adc"],
    prerequisiteLessonIds: ["esp32-gpio-strapping"],
    estimatedDurationMinutes: 30,
    interactiveDemo: {
      kind: "circuit",
      title: "12-Bit ADC Non-Linearity & Curve Visualizer",
      description: "Compare linear 10-bit Arduino readings against 12-bit ESP32 ADC curves with non-linear saturation zones.",
    },
    content: `# 12-Bit Successive Approximation ADC, Attenuation & Non-Linearity

While the Arduino Uno ADC provides 10-bit resolution (1024 discrete counts), the ESP32 features two 12-bit Successive Approximation Register ADCs offering **4096 discrete levels ($0$ to $4095$)**.

## ADC1 vs ADC2 & Wi-Fi Conflict!

- **ADC1**: Has 8 channels on GPIOs 32–39. **Always use ADC1 for sensors!**
- **ADC2**: Has 10 channels on GPIOs 0, 2, 4, 12–15, 25–27.
**CRITICAL RESTRICTION**: ADC2 is shared with the Wi-Fi subsystem hardware! Whenever Wi-Fi is active, \`analogRead()\` calls on ADC2 pins will fail or return invalid readings. Always wire analog sensors to ADC1 pins (GPIO 32 to 39).

## Programmable Input Attenuation (dB)

By default, the internal ADC reference is approximately $1.1\\text{ V}$. To measure higher voltages up to $3.3\\text{ V}$, the ESP32 includes an integrated programmable resistor divider (attenuator):

| Attenuation | Nominal Input Voltage Range | Voltage Step per Count |
| :--- | :--- | :--- |
| \`ADC_0db\` | $0\\text{ V} - 1.1\\text{ V}$ | $\\approx 0.27\\text{ mV}$ |
| \`ADC_2_5db\` | $0\\text{ V} - 1.5\\text{ V}$ | $\\approx 0.37\\text{ mV}$ |
| \`ADC_6db\` | $0\\text{ V} - 2.2\\text{ V}$ | $\\approx 0.54\\text{ mV}$ |
| \`ADC_11db\` | $0\\text{ V} - 3.12\\text{ V}$ (Default) | $\\approx 0.81\\text{ mV}$ |

\`\`\`cpp
analogSetAttenuation(ADC_11db); // Full range measurement up to ~3.1V
\`\`\`

## Non-Linearity & Dead Zones

The ESP32 ADC is notorious for non-linearity:
- **Bottom Dead Zone ($0\\text{ V}$ to $\\sim 0.1\\text{ V}$)**: Reads 0 even when small voltage is present.
- **Top Saturation Zone ($> 3.12\\text{ V}$)**: Saturaes at 4095 before reaching true 3.3V rail.
For precision measurements, use multi-point polynomial calibration or an external I2C ADC (such as the 16-bit ADS1115).`,
    theorySections: [
      {
        id: "silicon-calibration-efuse",
        title: "Factory eFuse Voltage Calibration",
        content: `Modern ESP32 chips are calibrated during factory production. Specific calibration constants (Two-Point or Vref) are burned into non-volatile eFuses. Using the ESP-IDF esp_adc_cal APIs allows software to read these eFuse tables and correct gain and offset errors automatically.`,
      },
      {
        id: "adc-thermal-noise",
        title: "Oversampling and Multisample Averaging",
        content: `Due to high digital clock frequencies (240MHz) and RF switching on the same silicon substrate, the ESP32 ADC exhibits substantial thermal noise (up to 20-30 counts of jitter). Reading 64 consecutive samples and averaging them (oversampling) improves Effective Number of Bits (ENOB) by filtering high-frequency white noise.`,
      },
    ],
    codeExamples: [
      {
        title: "Oversampling Filter in C",
        language: "c",
        code: `// Multisample averaging filter for ESP32 ADC
#include <stdio.h>

#define SAMPLE_COUNT 16

int readAveragedAdc(const int *samples, int count) {
  long sum = 0;
  for (int i = 0; i < count; i++) {
    sum += samples[i];
  }
  return (int)(sum / count);
}

int main(void) {
  int noisyReadings[SAMPLE_COUNT] = {
    2045, 2050, 2038, 2060, 2042, 2048, 2055, 2039,
    2044, 2051, 2040, 2058, 2041, 2049, 2052, 2040
  };
  printf("Filtered ADC Count: %d\\n", readAveragedAdc(noisyReadings, SAMPLE_COUNT));
  return 0;
}`,
        description: "Averaging raw analog samples to eliminate high-frequency RF jitter.",
      },
    ],
    exercise: exercise(
      "ex-esp-adc-resolution",
      "Calculate 12-Bit ADC Voltage with Attenuation",
      "Write a function `adcCountToMillivolts(rawCount, maxMillivolts)` that converts a 12-bit ADC reading (0 to 4095) into millivolts rounded to the nearest integer. Formula: `Math.round((rawCount * maxMillivolts) / 4095)`. Calculate for rawCount = 2048 with maxMillivolts = 3120 (11dB attenuation). Print the result.",
      `function adcCountToMillivolts(rawCount, maxMillivolts) {
  return Math.round((rawCount * maxMillivolts) / 4095);
}

console.log(adcCountToMillivolts(2048, 3120));`,
      "esp-12bit-adc",
      "Calculate calibrated voltage measurements from 12-bit ADC data.",
      [
        "Multiply rawCount by maxMillivolts (2048 * 3120).",
        "Divide by 4095 and round with Math.round.",
        "Expected output: 1560.",
      ],
      "Beginner",
      `function adcCountToMillivolts(rawCount, maxMillivolts) {
  // Convert 12-bit count to millivolts
  return 0;
}

console.log(adcCountToMillivolts(2048, 3120));`,
      [
        testCase("tc-esp-adc-mid", "Calculates midscale voltage at 11dB attenuation", "1560"),
        testCase("tc-esp-adc-full", "Calculates fullscale voltage", "3120", "", true),
      ],
    ),
    checkpoint: checkpoint(
        "Why should you never use ADC2 pins for analog sensors in an IoT project?",
        "ADC2 is internally shared with the ESP32 Wi-Fi hardware controller. As soon as Wi-Fi connects or transmits packets, ADC2 conversions fail.",
      ),
  },

  // Lesson 4: LEDC Hardware PWM Channels
  {
    id: "esp32-ledc-pwm",
    order: 4,
    title: "LEDC Hardware PWM Channels, Timers & Duty Cycle Resolution",
    summary: "Configure the ESP32 LED Control (LEDC) peripheral with customizable bit resolution, frequency, and channel routing.",
    type: "guided-coding",
    objectiveIds: ["esp-ledc-pwm"],
    prerequisiteLessonIds: ["esp32-12bit-adc"],
    estimatedDurationMinutes: 25,
    interactiveDemo: {
      kind: "circuit",
      title: "ESP32 LEDC PWM Synthesizer",
      description: "Experiment with PWM timer resolutions from 8-bit to 16-bit and observe frequency/duty cycle boundaries.",
    },
    content: `# LEDC Hardware PWM Channels, Timers & Duty Cycle Resolution

The ESP32 does not use traditional AVR-style \`analogWrite()\`. Instead, it features a dedicated hardware peripheral called **LEDC (LED Control)**.

## LEDC Architecture: 16 Independent Channels

The LEDC module offers:
- **16 Independent PWM Channels** (0–15).
- **4 Dedicated Hardware Timers** (0–3).
- **Configurable Bit Resolution**: From 1-bit up to **16-bit** ($0$ to $65535$).
- **Arbitrary Pin Assignment**: Route any channel to any safe GPIO pin via the GPIO Matrix!

## The Frequency vs Resolution Tradeoff

The timer clock source runs at 80 MHz (APB bus). The maximum achievable PWM frequency depends directly on the chosen duty resolution:
\`\`\`
Max Frequency = 80,000,000 Hz / (2^Resolution_Bits)
\`\`\`
- At **8-bit resolution** ($2^8 = 256$ steps): Maximum frequency is **312.5 kHz**.
- At **13-bit resolution** ($2^{13} = 8192$ steps): Maximum frequency is **9.76 kHz**.
- At **16-bit resolution** ($2^{16} = 65536$ steps): Maximum frequency is **1.22 kHz**.

## Three-Step LEDC Setup

\`\`\`cpp
#define LED_PIN 18
#define PWM_CHANNEL 0
#define PWM_FREQ 5000       // 5 kHz frequency
#define PWM_RESOLUTION 8    // 8-bit (0-255)

void setup() {
  // Step 1: Configure timer with frequency and resolution
  ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
  
  // Step 2: Attach PWM channel to physical GPIO pin
  ledcAttachPin(LED_PIN, PWM_CHANNEL);
  
  // Step 3: Write duty cycle
  ledcWrite(PWM_CHANNEL, 128); // 50% duty cycle
}
\`\`\``,
    theorySections: [
      {
        id: "hardware-fade-acceleration",
        title: "Hardware Fade without CPU Overhead",
        content: `The LEDC hardware controller includes an automatic gradient fading engine. By calling ledcSetFadeWithTime(), the silicon automatically steps through duty cycle increments at hardware intervals, producing butter-smooth visual breathing or motor acceleration curves without consuming a single CPU cycle.`,
      },
      {
        id: "audio-tone-generation",
        title: "Buzzer and Audio Tone Generation",
        content: `Because LEDC frequencies can be dynamically changed on the fly with ledcWriteTone(channel, freq), the peripheral functions as an audio synthesizer capable of producing musical melodies or acoustic alert tones on piezoelectric transducers.`,
      },
    ],
    codeExamples: [
      {
        title: "PWM Resolution Range Calculator",
        language: "c",
        code: `// Compute maximum duty cycle value from bit depth
#include <stdio.h>

int getMaxDuty(int bitResolution) {
  return (1 << bitResolution) - 1;
}

int main(void) {
  for (int bits = 8; bits <= 16; bits += 2) {
    printf("%2d-bit Resolution -> Max Duty: %5d counts\\n", bits, getMaxDuty(bits));
  }
  return 0;
}`,
        description: "Calculating maximum integer duty cycle count for different LEDC bit resolutions.",
      },
    ],
    exercise: exercise(
      "ex-esp-pwm-maxduty",
      "Compute Maximum LEDC Duty Cycle Value",
      "Write a function `maxDutyForResolution(bits)` that returns the maximum duty cycle integer: `(1 << bits) - 1`. For bits = 10 (10-bit resolution), the result is `1023`. Test with bits = 10 and bits = 12. Print the two values joined by a comma.",
      `function maxDutyForResolution(bits) {
  return (1 << bits) - 1;
}

console.log(maxDutyForResolution(10) + "," + maxDutyForResolution(12));`,
      "esp-ledc-pwm",
      "Calculate hardware timer register boundaries across arbitrary PWM resolutions.",
      [
        "Use bit shift (1 << bits) - 1.",
        "For 10 bits: 1023.",
        "For 12 bits: 4095.",
        "Expected output: '1023,4095'.",
      ],
      "Beginner",
      `function maxDutyForResolution(bits) {
  // Compute max duty count
  return 0;
}

console.log(maxDutyForResolution(10) + "," + maxDutyForResolution(12));`,
      [
        testCase("tc-esp-pwm-res", "Calculates 10-bit and 12-bit max duty boundaries", "1023,4095"),
        testCase("tc-esp-pwm-16", "Calculates 16-bit max duty boundary", "65535", "", true),
      ],
    ),
    checkpoint: checkpoint(
        "Why can you attach LEDC PWM channel 0 to virtually any GPIO pin on the ESP32?",
        "The ESP32 features an internal GPIO Matrix crossbar switch that routes peripheral digital output signals to arbitrary physical pins.",
      ),
  },

  // Module 3: Wireless Telemetry & Low Power
  {
    id: "esp32-wifi-http-telemetry",
    order: 5,
    title: "Wi-Fi Station Mode, REST API Client & JSON Telemetry",
    summary: "Connect to 802.11 b/g/n networks, serialize sensor readings into JSON, and dispatch HTTP POST telemetry payloads.",
    type: "guided-coding",
    objectiveIds: ["esp-wifi-telemetry"],
    prerequisiteLessonIds: ["esp32-ledc-pwm"],
    estimatedDurationMinutes: 35,
    interactiveDemo: {
      kind: "circuit",
      title: "Interactive Wi-Fi & REST Telemetry Console",
      description: "Simulate connecting to Wi-Fi access points, DHCP IP assignment, and transmitting HTTP POST JSON payloads.",
    },
    content: `# Wi-Fi Station Mode, REST API Client & JSON Telemetry

The superpower of the ESP32 is its integrated 2.4 GHz 802.11 b/g/n Wi-Fi radio. This transforms an isolated microcontroller into a connected Internet of Things (IoT) node.

## Station (STA) Mode vs Access Point (AP) Mode

- **Station Mode (\`WIFI_STA\`)**: The ESP32 acts as a client device (like a smartphone or laptop), connecting to an existing wireless router and obtaining an IP address via DHCP.
- **Access Point Mode (\`WIFI_AP\`)**: The ESP32 broadcasts its own Wi-Fi SSID network, allowing other devices to connect directly to it.

\`\`\`cpp
#include <WiFi.h>

const char* ssid = "LabNetwork";
const char* password = "SecretPassword";

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected! IP: " + WiFi.localIP().toString());
}
\`\`\`

## Transmitting Telemetry via HTTP REST API

Using \`HTTPClient\` and \`ArduinoJson\`, the ESP32 constructs and sends structured payloads to cloud backends:

\`\`\`cpp
#include <HTTPClient.h>

void sendTelemetry(float temp, float humidity) {
  HTTPClient http;
  http.begin("https://api.iotlab.internal/telemetry");
  http.addHeader("Content-Type", "application/json");

  String jsonPayload = "{\\"temp\\":" + String(temp) + 
                       ",\\"humidity\\":" + String(humidity) + "}";

  int httpCode = http.POST(jsonPayload);
  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("Response: " + response);
  }
  http.end();
}
\`\`\``,
    theorySections: [
      {
        id: "rf-current-spikes",
        title: "Wi-Fi RF Transmission Current Spikes",
        content: `During RF calibration and packet transmission, the 2.4GHz power amplifier draws brief current spikes of up to 500 mA to 800 mA for a few milliseconds. If power delivery traces are thin or the 3.3V power supply is inadequate, the system rail sags below the brownout detection threshold (2.43V), causing sudden Brownout Reset crashes. Always include a 10µF to 100µF decoupling capacitor near the ESP32 power pins.`,
      },
      {
        id: "tls-memory-overhead",
        title: "HTTPS and TLS Certificate Validation",
        content: `Establishing secure TLS (HTTPS) connections requires dynamic memory for cryptographic handshake buffers (~35 KB of heap). Using WiFiClientSecure with mbedTLS verifies the server's root CA certificate or fingerprint, preventing man-in-the-middle attacks on sensitive sensor telemetry.`,
      },
    ],
    codeExamples: [
      {
        title: "JSON Telemetry Formatter in C",
        language: "c",
        code: `// Formatting JSON payload buffer
#include <stdio.h>

void buildTelemetry(char *buf, size_t maxLen, const char *nodeId, float temp, int battery) {
  snprintf(buf, maxLen, "{\\"node\\":\\"%s\\",\\"temp\\":%.1f,\\"battery\\":%d}", 
           nodeId, temp, battery);
}

int main(void) {
  char payload[128];
  buildTelemetry(payload, sizeof(payload), "esp32-node-01", 24.5f, 92);
  printf("Serialized Payload: %s\\n", payload);
  return 0;
}`,
        description: "Constructing serialized JSON telemetry string with safe buffer boundaries.",
      },
    ],
    exercise: exercise(
      "ex-esp-telemetry-fmt",
      "Format JSON Telemetry Payload",
      "Write a function `formatTelemetry(deviceId, tempC, lightLux)` that returns a valid JSON string with keys `\"id\"`, `\"temp\"`, and `\"lux\"`. Values should be `deviceId` (string), `tempC` (rounded to 1 decimal place), and `lightLux` (integer). Test with `formatTelemetry(\"node-alpha\", 23.456, 450)`. Print the JSON string.",
      `function formatTelemetry(deviceId, tempC, lightLux) {
  return JSON.stringify({
    id: deviceId,
    temp: Number(tempC.toFixed(1)),
    lux: Math.round(lightLux)
  });
}

console.log(formatTelemetry("node-alpha", 23.456, 450));`,
      "esp-wifi-telemetry",
      "Serialize embedded sensor data into standard JSON format for cloud APIs.",
      [
        "Format temp to 1 decimal place with toFixed(1).",
        "Round lux to integer.",
        "Expected output: '{\"id\":\"node-alpha\",\"temp\":23.5,\"lux\":450}'.",
      ],
      "Beginner",
      `function formatTelemetry(deviceId, tempC, lightLux) {
  // Format JSON payload
  return "";
}

console.log(formatTelemetry("node-alpha", 23.456, 450));`,
      [
        testCase("tc-esp-json-fmt", "Serializes node telemetry correctly", '{"id":"node-alpha","temp":23.5,"lux":450}'),
        testCase("tc-esp-json-temp", "Handles whole number temperature", '{"id":"sensor-1","temp":20,"lux":100}', "", true),
      ],
    ),
    checkpoint: checkpoint(
        "Why can an inadequate 3.3V power supply cause the ESP32 to reboot continuously when connecting to Wi-Fi?",
        "The Wi-Fi radio power amplifier draws sudden transient spikes of up to 500-800 mA during RF packet bursts. If the power supply sags below 2.43V, the hardware brownout detector triggers a reset.",
      ),
  },

  // Lesson 6: Deep Sleep Power Modes & RTC Memory
  {
    id: "esp32-deep-sleep-rtc",
    order: 6,
    title: "Deep Sleep Power Modes, RTC Memory & External Wakeup Sources",
    summary: "Reduce power consumption from 150mA to 10µA using Deep Sleep, preserve state in RTC slow memory, and configure wakeups.",
    type: "guided-coding",
    objectiveIds: ["esp-deep-sleep"],
    prerequisiteLessonIds: ["esp32-wifi-http-telemetry"],
    estimatedDurationMinutes: 30,
    interactiveDemo: {
      kind: "circuit",
      title: "ESP32 Battery Life & Power Calculator",
      description: "Calculate expected battery longevity in days and years based on deep sleep duration versus active Wi-Fi transmit time.",
    },
    content: `# Deep Sleep Power Modes, RTC Memory & External Wakeup Sources

A standard ESP32 running with Wi-Fi enabled consumes **100 mA to 240 mA**. On a standard 2000 mAh LiPo battery, the device would deplete completely in less than 15 hours!

To operate an IoT sensor in the field for months or years on battery power, you must utilize **Deep Sleep Mode**.

## Power Consumption Comparison

| Mode | Active Peripherals | Typical Current Draw |
| :--- | :--- | :--- |
| **Active (Wi-Fi TX)** | Dual Cores, Wi-Fi Radio, Flash, ADC | $\\sim 150 - 240\\text{ mA}$ |
| **Modem Sleep** | Cores active, Wi-Fi radio powered down | $\\sim 20 - 30\\text{ mA}$ |
| **Light Sleep** | CPU paused, digital peripherals idle, RTC on | $\\sim 0.8\\text{ mA}$ |
| **Deep Sleep** | Main CPUs, RAM, and Flash powered OFF; only RTC running | **$\\sim 10 - 15\\,\\mu\\text{A}$** |

In Deep Sleep, power consumption drops by **over 10,000x**!

## Preserving State with \`RTC_DATA_ATTR\`

Because the main 520 KB SRAM is completely unpowered during Deep Sleep, normal global variables are lost when entering sleep!

The ESP32 includes 8 KB of **RTC Slow Memory** that remains powered during Deep Sleep. Variables annotated with \`RTC_DATA_ATTR\` survive across sleep cycles:

\`\`\`cpp
// This variable survives deep sleep resets!
RTC_DATA_ATTR int bootCounter = 0;

void setup() {
  bootCounter++;
  Serial.printf("Boot count: %d\\n", bootCounter);

  // Configure timer wakeup for 10 minutes (in microseconds)
  esp_sleep_enable_timer_wakeup(10 * 60 * 1000000ULL);

  // Enter deep sleep
  esp_deep_sleep_start();
}

void loop() {
  // Never reached!
}
\`\`\`

## Wakeup Sources

The ESP32 can be awakened by:
1. **Timer**: Elapsed microsecond interval via internal RTC clock.
2. **Touch Pins**: Capacitive touch threshold triggers.
3. **External Signals (EXT0 / EXT1)**: Logic level changes on RTC GPIO pins (e.g. PIR motion sensor or door reed switch).`,
    theorySections: [
      {
        id: "boot-sequence-after-sleep",
        title: "Deep Sleep Wakeup Behaves Like a Hard Reset",
        content: `When the ESP32 wakes from Deep Sleep, it does NOT resume execution from where it slept. Instead, the chip reboots from the beginning, executing setup() again. Calling esp_sleep_get_wakeup_cause() allows your code to distinguish between a cold power-on reset and a scheduled timer wakeup.`,
      },
      {
        id: "energy-budgeting-math",
        title: "Calculating Battery Longevity",
        content: `Average current is calculated as:
I_avg = (T_active * I_active + T_sleep * I_sleep) / (T_active + T_sleep)
If a device is awake for 3 seconds transmitting Wi-Fi (150 mA) and sleeps for 57 seconds (15 µA), the average current is only 7.5 mA, extending battery life from 15 hours to over 11 days. Sleeping for 10 minutes between bursts extends battery life to well over a year.`,
      },
    ],
    codeExamples: [
      {
        title: "Battery Longevity Calculator in C",
        language: "c",
        code: `// Battery runtime estimation in days
#include <stdio.h>

float estimateBatteryLifeDays(float batteryMah, float activeMa, float activeSec, 
                             float sleepUa, float sleepSec) {
  float sleepMa = sleepUa / 1000.0f;
  float totalPeriod = activeSec + sleepSec;
  float avgMa = (activeSec * activeMa + sleepSec * sleepMa) / totalPeriod;
  float hours = batteryMah / avgMa;
  return hours / 24.0f;
}

int main(void) {
  // 2500 mAh battery, 150mA for 2s, 15uA for 300s (5 min)
  float days = estimateBatteryLifeDays(2500.0f, 150.0f, 2.0f, 15.0f, 300.0f);
  printf("Estimated Battery Life: %.1f days (%.1f months)\\n", days, days / 30.0f);
  return 0;
}`,
        description: "Duty-cycle power model for battery-powered IoT devices.",
      },
    ],
    exercise: exercise(
      "ex-esp-sleep-battery",
      "Calculate Average IoT Current Consumption",
      "Write a function `calcAverageCurrent(activeMa, activeSec, sleepUa, sleepSec)` that calculates the average current in milliamperes rounded to 3 decimal places. Formula: `(activeSec * activeMa + sleepSec * (sleepUa / 1000)) / (activeSec + sleepSec)`. Compute for activeMa = 120, activeSec = 2, sleepUa = 15, sleepSec = 58. Print the rounded number.",
      `function calcAverageCurrent(activeMa, activeSec, sleepUa, sleepSec) {
  const sleepMa = sleepUa / 1000;
  const totalTime = activeSec + sleepSec;
  const avg = (activeSec * activeMa + sleepSec * sleepMa) / totalTime;
  return Number(avg.toFixed(3));
}

console.log(calcAverageCurrent(120, 2, 15, 58));`,
      "esp-deep-sleep",
      "Calculate weighted average power consumption across active and deep sleep operational duty cycles.",
      [
        "Convert sleepUa to sleepMa by dividing by 1000.",
        "Calculate total charge divided by total cycle seconds (60s).",
        "Expected output: 4.015.",
      ],
      "Developing",
      `function calcAverageCurrent(activeMa, activeSec, sleepUa, sleepSec) {
  // Return average current in mA
  return 0;
}

console.log(calcAverageCurrent(120, 2, 15, 58));`,
      [
        testCase("tc-esp-pwr-avg", "Calculates average current for 2s active / 58s sleep cycle", "4.015"),
        testCase("tc-esp-pwr-long", "Calculates average current for 1s active / 599s sleep cycle", "0.215", "", true),
      ],
    ),
    checkpoint: checkpoint(
        "Why must variables intended to survive deep sleep be annotated with RTC_DATA_ATTR?",
        "Standard SRAM is completely unpowered during Deep Sleep to conserve energy. Only the 8 KB of RTC slow memory remains powered to preserve annotated state variables.",
      ),
  },
  // Module 4: FreeRTOS Dual-Core Concurrency & Calibration
  {
    id: "esp32-freertos-tasks",
    order: 7,
    title: "FreeRTOS Dual-Core Multitasking & Task Pinning",
    summary: "Spawn dedicated tasks pinned to Core 0 and Core 1 with xTaskCreatePinnedToCore, configure priority levels, and handle watchdog timeouts.",
    type: "guided-coding",
    objectiveIds: ["esp-freertos-tasks"],
    prerequisiteLessonIds: ["esp32-deep-sleep-rtc"],
    estimatedDurationMinutes: 30,
    interactiveDemo: {
      kind: "circuit",
      title: "ESP32 Dual-Core FreeRTOS Task Scheduler",
      description: "Inspect concurrent task execution across Core 0 (Protocol) and Core 1 (Application) with real-time priority preemption.",
    },
    content: `# FreeRTOS Dual-Core Multitasking & Task Pinning

The ESP32 SoC contains two independent 32-bit Xtensa LX6 microprocessor cores. Rather than running a monolithic super-loop that blocks when handling networking or complex sensor math, the ESP-IDF runtime runs **FreeRTOS** natively across both symmetrical cores.

## Core Allocation & Task Pinning

By convention in the Arduino ESP32 framework:
- **Core 0 (Protocol Core / PRO_CPU)**: Manages Wi-Fi, Bluetooth LE stacks, and TCP/IP background threads.
- **Core 1 (Application Core / APP_CPU)**: Executes your standard \`setup()\` and \`loop()\` functions.

Using \`xTaskCreatePinnedToCore()\`, you can launch dedicated background threads pinned to either core:

\`\`\`cpp
BaseType_t xTaskCreatePinnedToCore(
  TaskFunction_t pvTaskCode,   // Pointer to task function (void fn(void *param))
  const char *pcName,          // Descriptive name for debugging
  const uint32_t usStackDepth, // Stack size in 32-bit WORDS (e.g. 4096 words = 16 KB)
  void *pvParameters,          // Pointer to input arguments passed to task
  UBaseType_t uxPriority,      // Priority (0 = lowest, configMAX_PRIORITIES - 1 = highest)
  TaskHandle_t *pvCreatedTask, // Optional pointer to receive task handle
  const BaseType_t xCoreID     // Core affinity: 0, 1, or tskNO_AFFINITY
);
\`\`\`

## Task Function Anatomy & The Infinite Loop

A FreeRTOS task function must NEVER return or exit normally like a regular C function. It must execute an infinite loop and **yield CPU time** when idle:

\`\`\`cpp
void telemetryTask(void *pvParameters) {
  for (;;) {
    // 1. Perform high-priority sensor read or computation
    readSensors();

    // 2. Yield control to scheduler for 500 milliseconds
    vTaskDelay(pdMS_TO_TICKS(500));
  }
  // If a task must terminate, it must delete itself:
  vTaskDelete(NULL);
}
\`\`\`

## The Task Watchdog Timer (TWDT)

FreeRTOS on ESP32 includes an active Task Watchdog Timer (TWDT) enabled on both cores. If a high-priority task executes a tight \`while(1) {}\` loop without calling \`vTaskDelay()\` or blocking on a queue, the **IDLE task** for that core is starved. After 5 seconds of starvation, the TWDT triggers a system panic and reboots the chip!`,
    theorySections: [
      {
        id: "stack-high-water-mark",
        title: "Stack Sizing & High Water Mark Detection",
        content: `Allocating too little stack space to a task causes silent stack overflow, overwriting adjacent memory heaps and causing unpredictable crashes. Use \`uxTaskGetStackHighWaterMark(NULL)\` inside your task to query the minimum amount of unused stack remaining. If it approaches 200 words, increase \`usStackDepth\`.`,
      },
      {
        id: "preemptive-priority-scheduling",
        title: "Preemptive Priority vs Round-Robin Slicing",
        content: `FreeRTOS scheduler is strictly preemptive. A higher priority task immediately preempts a lower priority task as soon as it becomes READY. Tasks with identical priorities share the core via round-robin time slicing governed by the 1000 Hz system tick timer (1 ms slice).`,
      },
    ],
    codeExamples: [
      {
        title: "Dual-Core Task Pinning & High-Frequency Sensor Loop",
        language: "c",
        description: "Spawns a dedicated fast acquisition task on Core 0 while loop() continues running on Core 1.",
        code: `#include <Arduino.h>

TaskHandle_t sensorTaskHandle;

void sensorWorker(void *pvParameters) {
  Serial.print("Sensor task running on core: ");
  Serial.println(xPortGetCoreID());

  for (;;) {
    // High-frequency sensor acquisition
    int rawValue = analogRead(36);
    // Yield for 50 milliseconds
    vTaskDelay(pdMS_TO_TICKS(50));
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  xTaskCreatePinnedToCore(
    sensorWorker,       // Function
    "SensorWorker",     // Name
    4096,               // Stack size (words)
    NULL,               // Params
    2,                  // Priority (higher than loop priority 1)
    &sensorTaskHandle,  // Handle
    0                   // Pin to Core 0!
  );
}

void loop() {
  Serial.print("Main loop running on core: ");
  Serial.println(xPortGetCoreID());
  delay(1000);
}`,
      },
    ],
    exercise: exercise(
      "ex-esp-tasks",
      "Simulate Preemptive Priority Task Scheduling",
      "Implement a function `simulateTaskScheduler(tasks, totalTicks)` that models a single-core preemptive priority scheduler. Each task is `{ name: string, priority: number, period: number, duration: number }`. When a task triggers at `tick % period === 0`, it runs for `duration` ticks. If multiple tasks want to run, the one with highest priority runs. Return an array of task names executed at each tick (or 'IDLE').",
      `function simulateTaskScheduler(tasks, totalTicks) {
  const executionLog = [];
  const activeQueues = [];

  for (let tick = 0; tick < totalTicks; tick++) {
    // Check if new task instances are released
    for (const task of tasks) {
      if (tick % task.period === 0) {
        activeQueues.push({ name: task.name, priority: task.priority, remaining: task.duration });
      }
    }

    if (activeQueues.length === 0) {
      executionLog.push("IDLE");
      continue;
    }

    // Sort by priority descending
    activeQueues.sort((a, b) => b.priority - a.priority);
    const current = activeQueues[0];
    executionLog.push(current.name);
    current.remaining--;
    if (current.remaining <= 0) {
      activeQueues.shift();
    }
  }

  return executionLog;
}

console.log(JSON.stringify(simulateTaskScheduler([
  { name: "NET", priority: 2, period: 4, duration: 1 },
  { name: "APP", priority: 1, period: 2, duration: 1 }
], 6)));`,
      "esp-freertos-tasks",
      "Model preemptive priority scheduling and IDLE yield semantics accurately.",
      [
        "Track pending task instances with remaining execution duration.",
        "On each tick, release tasks where tick % period === 0.",
        "Select active task with highest priority; decrement remaining ticks, removing when done.",
      ],
      "Developing",
      `function simulateTaskScheduler(tasks, totalTicks) {
  // Simulate preemptive priority execution log across totalTicks
  return [];
}

console.log(JSON.stringify(simulateTaskScheduler([
  { name: "NET", priority: 2, period: 4, duration: 1 },
  { name: "APP", priority: 1, period: 2, duration: 1 }
], 6)));`,
      [
        testCase("tc-esp-task-1", "Preempts lower priority task with higher priority task", '["NET","APP","APP","IDLE","NET","APP"]'),
        testCase("tc-esp-task-2", "Logs IDLE when no tasks are ready", '["IDLE","IDLE"]', "", true),
      ],
    ),
    checkpoint: checkpoint(
      "Why must every FreeRTOS task function contain a vTaskDelay() or blocking synchronization call inside its loop?",
      "Without yielding or blocking, a task running on a core starves lower-priority threads and the FreeRTOS IDLE task, triggering the Task Watchdog Timer (TWDT) reset after 5 seconds.",
    ),
  },

  // Lesson 8: Thread-Safe Inter-Core Communication with FreeRTOS Queues
  {
    id: "esp32-freertos-queues",
    order: 8,
    title: "Thread-Safe Inter-Core Communication with FreeRTOS Queues",
    summary: "Transfer structured telemetry safely between Core 0 and Core 1 without race conditions using FreeRTOS FIFO queues and binary semaphores.",
    type: "guided-coding",
    objectiveIds: ["esp-freertos-queues"],
    prerequisiteLessonIds: ["esp32-freertos-tasks"],
    estimatedDurationMinutes: 30,
    interactiveDemo: {
      kind: "circuit",
      title: "Inter-Core FreeRTOS Queue Visualizer",
      description: "Push structured telemetry packets from Core 0 and observe atomic FIFO retrieval and buffer depth on Core 1.",
    },
    content: `# Thread-Safe Inter-Core Communication with FreeRTOS Queues

In multi-threaded and multi-core embedded systems, two CPU cores running concurrently must never access or modify shared variables (such as arrays, buffers, or structs) without synchronization. Unsynchronized shared memory access causes **data races**, torn reads, and heap corruption.

## The FreeRTOS Queue Primitive

A **Queue** is the primary thread-safe inter-task communication primitive in FreeRTOS:
- **FIFO (First-In, First-Out)**: Items are retrieved in the order they were inserted.
- **Copy-by-Value**: Items sent to a queue are copied byte-by-byte into the queue's internal buffer, eliminating lifetime and scope hazards.
- **Thread-Safe**: Internal spinlocks protect queue access across both Core 0 and Core 1.
- **Blocking with Timeout**: Tasks can block waiting to read from an empty queue or write to a full queue without burning CPU cycles.

## Creating and Using Queues

\`\`\`cpp
// 1. Declare payload struct and queue handle
typedef struct {
  float temperature;
  uint32_t timestamp;
} SensorPacket;

QueueHandle_t sensorQueue;

void setup() {
  // Create queue capable of holding 10 SensorPacket items
  sensorQueue = xQueueCreate(10, sizeof(SensorPacket));
}

// Producer Task (Running on Core 0)
void producerTask(void *pvParam) {
  for (;;) {
    SensorPacket packet = { 24.5f, millis() };
    // Send packet, waiting up to 10 ticks if full
    xQueueSend(sensorQueue, &packet, pdMS_TO_TICKS(10));
    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

// Consumer Task (Running on Core 1)
void consumerTask(void *pvParam) {
  SensorPacket receivedPacket;
  for (;;) {
    // Wait indefinitely (portMAX_DELAY) until an item arrives
    if (xQueueReceive(sensorQueue, &receivedPacket, portMAX_DELAY) == pdTRUE) {
      Serial.printf("Got temp: %.1f at %u\\n", receivedPacket.temperature, receivedPacket.timestamp);
    }
  }
}
\`\`\`

## Mutexes for Shared Hardware Peripherals

While Queues transfer data between tasks, **Mutexes (Mutual Exclusion Semaphores)** guard shared hardware buses like I2C or SPI:

\`\`\`cpp
SemaphoreHandle_t i2cMutex;

void readI2CDevice() {
  if (xSemaphoreTake(i2cMutex, pdMS_TO_TICKS(100)) == pdTRUE) {
    // Safe exclusive access to I2C bus
    Wire.requestFrom(0x68, 6);
    xSemaphoreGive(i2cMutex); // Release lock
  }
}
\`\`\``,
    theorySections: [
      {
        id: "queue-copy-vs-reference",
        title: "Pass by Value vs Pass by Reference",
        content: `Small structs (up to 32–64 bytes) should always be copied directly into the queue by value. For large payloads (e.g. 50 KB camera JPEG images), send a pointer to dynamically allocated memory (\`ps_malloc\`) through the queue, transferring ownership to the receiving task to avoid buffer copies.`,
      },
      {
        id: "priority-inversion-mutex",
        title: "Priority Inversion & Mutex Priority Inheritance",
        content: `Priority inversion occurs when a low-priority task holds a lock needed by a high-priority task, while a medium-priority task preempts the low-priority task. FreeRTOS Mutexes implement Priority Inheritance, temporarily elevating the priority of the lock-holding task to resolve the deadlock.`,
      },
    ],
    codeExamples: [
      {
        title: "Thread-Safe Multi-Core Sensor Pipeline with Queues",
        language: "c",
        description: "Produces sensor telemetry on Core 0 and delivers it safely via Queue to Core 1 for serial logging.",
        code: `#include <Arduino.h>

typedef struct {
  uint16_t adcRaw;
  uint32_t tickMs;
} TelemetryData;

QueueHandle_t telemetryQueue;

void samplerTask(void *param) {
  for (;;) {
    TelemetryData data;
    data.adcRaw = analogRead(34);
    data.tickMs = millis();
    xQueueSend(telemetryQueue, &data, 0); // Non-blocking send
    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

void setup() {
  Serial.begin(115200);
  telemetryQueue = xQueueCreate(8, sizeof(TelemetryData));

  xTaskCreatePinnedToCore(samplerTask, "Sampler", 2048, NULL, 2, NULL, 0);
}

void loop() {
  TelemetryData item;
  if (xQueueReceive(telemetryQueue, &item, pdMS_TO_TICKS(50)) == pdTRUE) {
    Serial.printf("Raw: %u at %u ms\\n", item.adcRaw, item.tickMs);
  }
}`,
      },
    ],
    exercise: exercise(
      "ex-esp-queues",
      "Simulate Bounded FIFO Queue Operations",
      "Implement a function `simulateQueue(capacity, operations)` that models a FreeRTOS bounded FIFO queue. Operations is an array of `{ type: 'SEND' | 'RECEIVE', value?: any }`. If SEND is called when full, the item is dropped (increment `droppedCount`). If RECEIVE is called when empty, record `null` in `receivedValues`. Return `{ remainingItems: [...], droppedCount: number, receivedValues: [...] }`.",
      `function simulateQueue(capacity, operations) {
  const queue = [];
  const receivedValues = [];
  let droppedCount = 0;

  for (const op of operations) {
    if (op.type === "SEND") {
      if (queue.length < capacity) {
        queue.push(op.value);
      } else {
        droppedCount++;
      }
    } else if (op.type === "RECEIVE") {
      if (queue.length > 0) {
        receivedValues.push(queue.shift());
      } else {
        receivedValues.push(null);
      }
    }
  }

  return { remainingItems: queue, droppedCount, receivedValues };
}

console.log(JSON.stringify(simulateQueue(2, [
  { type: "SEND", value: 10 },
  { type: "SEND", value: 20 },
  { type: "SEND", value: 30 },
  { type: "RECEIVE" },
  { type: "RECEIVE" }
])));`,
      "esp-freertos-queues",
      "Implement bounded FIFO capacity, packet dropping, and non-blocking dequeue behavior.",
      [
        "Initialize queue = [], receivedValues = [], droppedCount = 0.",
        "For 'SEND', test if queue.length < capacity; push value if space exists, otherwise increment droppedCount.",
        "For 'RECEIVE', shift from queue if not empty, otherwise push null to receivedValues.",
      ],
      "Developing",
      `function simulateQueue(capacity, operations) {
  // Simulate FIFO queue with capacity limits
  return null;
}

console.log(JSON.stringify(simulateQueue(2, [
  { type: "SEND", value: 10 },
  { type: "SEND", value: 20 },
  { type: "SEND", value: 30 },
  { type: "RECEIVE" },
  { type: "RECEIVE" }
])));`,
      [
        testCase("tc-esp-q-1", "Enforces capacity limits and drops overflow items", '{"remainingItems":[],"droppedCount":1,"receivedValues":[10,20]}'),
        testCase("tc-esp-q-2", "Handles empty queue receive without crash", '{"remainingItems":[],"droppedCount":0,"receivedValues":[null]}', "", true),
      ],
    ),
    checkpoint: checkpoint(
      "Why is copying items by value into a FreeRTOS queue safer than passing pointers to local variables?",
      "Local variables allocated on a task's stack are destroyed when that function exits or context changes; passing by value guarantees the receiving task receives valid, immutable data regardless of stack state.",
    ),
  },

  // Lesson 9: 12-Bit ADC Non-Linearity Compensation & Multisampling
  {
    id: "esp32-adc-calibration",
    order: 9,
    title: "12-Bit ADC Non-Linearity Compensation & Multisampling",
    summary: "Overcome the ESP32 SAR ADC non-linear transfer curve, dead zones at 0V and 3.3V, and implement multi-sample statistical smoothing.",
    type: "guided-coding",
    objectiveIds: ["esp-adc-multisampling"],
    prerequisiteLessonIds: ["esp32-freertos-queues"],
    estimatedDurationMinutes: 30,
    interactiveDemo: {
      kind: "circuit",
      title: "ESP32 SAR ADC Linearization Curve Simulator",
      description: "Compare raw non-linear ADC transfer curves against factory eFuse characterized polynomial correction.",
    },
    content: `# 12-Bit ADC Non-Linearity Compensation & Multisampling

The ESP32 features two 12-bit Successive Approximation Register (SAR) Analog-to-Digital Converters. However, unlike the laser-trimmed 10-bit ADC of the ATmega328P, the ESP32 ADC is notoriously non-linear and exhibits distinct physical imperfections:
1. **Dead Zone at 0V**: Voltages below $\\sim 100\\text{ mV}$ register as 0.
2. **Saturation near 3.3V**: At 11 dB attenuation, voltages above $\\sim 3.1\\text{ V}$ saturate at 4095.
3. **Non-Linear Transfer Function**: The step size is non-uniform across the range.

## Attenuation (dB) Settings

The ESP32 ADC internal reference is $1.1\\text{ V}$. An internal resistive attenuator scales higher voltages into the ADC range:
- **ADC_ATTEN_DB_0 ($0\\text{ dB}$)**: Range $0 - 1.1\\text{ V}$ full scale.
- **ADC_ATTEN_DB_2_5 ($2.5\\text{ dB}$)**: Range $0 - 1.5\\text{ V}$.
- **ADC_ATTEN_DB_6 ($6\\text{ dB}$)**: Range $0 - 2.2\\text{ V}$.
- **ADC_ATTEN_DB_11 ($11\\text{ dB}$)**: Range $0 - 3.3\\text{ V}$ (Most common for 3.3V sensors).

## Factory eFuse Calibration (esp_adc_cal)

Espressif burns unique factory calibration parameters into on-chip **eFuses** during silicon fabrication. The ESP-IDF \`esp_adc_cal\` API reads these eFuses to compute a tailored polynomial correction:

\`\`\`cpp
#include "esp_adc_cal.h"

esp_adc_cal_characteristics_t adc_chars;

void setup() {
  // Characterize ADC1 at 11 dB attenuation using eFuse Vref
  esp_adc_cal_characterize(
    ADC_UNIT_1,
    ADC_ATTEN_DB_11,
    ADC_WIDTH_BIT_12,
    1100, // Default Vref if eFuse not burned
    &adc_chars
  );
}

uint32_t readCalibratedMillivolts(adc1_channel_t channel) {
  uint32_t raw = adc1_get_raw(channel);
  // Converts raw 12-bit value directly to linearized millivolts
  return esp_adc_cal_raw_to_voltage(raw, &adc_chars);
}
\`\`\`

## Hardware Multisampling (Oversampling)

Electrical switching noise from the internal Wi-Fi radio and high-speed CPU clocks couples into analog ground planes. Multisampling (taking 32 to 64 successive samples and averaging them) dramatically reduces Gaussian thermal noise:

\`\`\`cpp
uint32_t multisampleADC(uint8_t pin, uint8_t sampleCount) {
  uint32_t sum = 0;
  for (uint8_t i = 0; i < sampleCount; i++) {
    sum += analogRead(pin);
  }
  return sum / sampleCount;
}
\`\`\``,
    theorySections: [
      {
        id: "adc2-wifi-conflict",
        title: "ADC2 & Wi-Fi Radio Incompatibility",
        content: `ESP32 GPIOs are divided between ADC1 (GPIO 32–39) and ADC2 (GPIO 0, 2, 4, 12–15, 25–27). **ADC2 is shared with the Wi-Fi subsystem**. When the Wi-Fi radio is active, calls to \`analogRead()\` on ADC2 pins return error codes or garbage data. **Always connect analog sensors strictly to ADC1 pins (GPIO 32 through 39)**!`,
      },
      {
        id: "oversampling-enob",
        title: "Oversampling and Effective Resolution",
        content: `According to sampling theory, oversampling by a factor of 4 increases effective resolution by 1 bit ($2^{2n}$ samples for $n$ additional bits). Averaging 64 samples increases the Effective Number of Bits (ENOB) by 3 bits while filtering out high-frequency white noise.`,
      },
    ],
    codeExamples: [
      {
        title: "Robust Calibrated Analog Acquisition with Outlier Rejection",
        language: "c",
        description: "Samples ADC1 with 16-sample multisampling and eFuse millivolt conversion.",
        code: `#include <Arduino.h>
#include "esp_adc_cal.h"

#define ADC_PIN 34
esp_adc_cal_characteristics_t adcChars;

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  analogSetPinAttenuation(ADC_PIN, ADC_11db);

  esp_adc_cal_characterize(
    ADC_UNIT_1,
    ADC_ATTEN_DB_11,
    ADC_WIDTH_BIT_12,
    1100,
    &adcChars
  );
}

void loop() {
  uint32_t rawSum = 0;
  const uint8_t SAMPLES = 32;
  for (uint8_t i = 0; i < SAMPLES; i++) {
    rawSum += analogRead(ADC_PIN);
    delayMicroseconds(50);
  }
  uint32_t rawAvg = rawSum / SAMPLES;
  uint32_t voltageMv = esp_adc_cal_raw_to_voltage(rawAvg, &adcChars);

  Serial.printf("Raw: %u, Calibrated Voltage: %u mV\\n", rawAvg, voltageMv);
  delay(1000);
}`,
      },
    ],
    exercise: exercise(
      "ex-esp-adc",
      "Linearize and Calibrate Raw 12-Bit ADC Samples",
      "Implement a function `calibrateADCSamples(rawSamples, vMaxMv = 3300)` that discards the lowest and highest raw sample (trimmed mean to reject spikes), averages the remaining samples, and maps the average 12-bit value ($0-4095$) linearly into millivolts rounded to the nearest integer.",
      `function calibrateADCSamples(rawSamples, vMaxMv = 3300) {
  if (rawSamples.length < 3) return 0;
  const sorted = [...rawSamples].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, sorted.length - 1);
  const sum = trimmed.reduce((acc, val) => acc + val, 0);
  const avg = sum / trimmed.length;
  return Math.round((avg / 4095) * vMaxMv);
}

console.log(calibrateADCSamples([2000, 2048, 2050, 4095, 100]));`,
      "esp-adc-multisampling",
      "Apply outlier rejection and proportional voltage mapping to multi-sample ADC data.",
      [
        "Sort rawSamples in ascending numeric order.",
        "Slice off index 0 and the final index to reject extreme outliers.",
        "Compute average of trimmed samples, multiply by (vMaxMv / 4095), and round.",
      ],
      "Developing",
      `function calibrateADCSamples(rawSamples, vMaxMv = 3300) {
  // Discard min/max, average remaining, and convert 12-bit to millivolts
  return 0;
}

console.log(calibrateADCSamples([2000, 2048, 2050, 4095, 100]));`,
      [
        testCase("tc-esp-adc-1", "Trims spikes and converts mid-scale to ~1650 mV", "1650"),
        testCase("tc-esp-adc-2", "Converts full scale reading correctly", "3300", "", true),
      ],
    ),
    checkpoint: checkpoint(
      "Why should you never connect analog sensors to ADC2 pins when building a Wi-Fi enabled ESP32 project?",
      "ADC2 hardware is shared with the 2.4 GHz Wi-Fi radio; when the Wi-Fi stack transmits or receives, ADC2 reads fail or yield corrupted values.",
    ),
  },

  // Module 5: Ultra-Low-Power Duty Cycles & MQTT Capstone
  {
    id: "esp32-deep-sleep-wakeup",
    order: 10,
    title: "Advanced Ultra-Low-Power Deep Sleep & Multiple Wakeup Sources",
    summary: "Maximize battery endurance by dropping to 10µA sleep current, configuring timer/ext0/ext1 wakeups, and persisting variables in RTC memory.",
    type: "guided-coding",
    objectiveIds: ["esp-deep-sleep-advanced"],
    prerequisiteLessonIds: ["esp32-adc-calibration"],
    estimatedDurationMinutes: 30,
    interactiveDemo: {
      kind: "circuit",
      title: "ESP32 Battery Lifetime & Sleep Mode Calculator",
      description: "Model battery discharge profiles across Active, Modem-Sleep, Light-Sleep, and Deep-Sleep duty cycles.",
    },
    content: `# Advanced Ultra-Low-Power Deep Sleep & Multiple Wakeup Sources

A standard ESP32 operating in Active Wi-Fi transmit mode draws approximately **$160\\text{ mA}$ to $240\\text{ mA}$**. Powered continuously from a typical 2500 mAh 18650 Li-ion battery, the device exhausts its charge in under **12 hours**!

By utilizing **Deep Sleep**, current consumption plummets to just **$10\\text{ }\\mu\\text{A} - 15\\text{ }\\mu\\text{A}$**, extending battery runtime from hours to **multiple years**.

## What Happens in Deep Sleep?

When entering Deep Sleep via \`esp_deep_sleep_start()\`:
- Both Xtensa CPU cores, high-speed RAM, and digital peripherals are completely unpowered.
- The 2.4 GHz Wi-Fi and Bluetooth radios are shut down.
- **Powered Components**: Only the Real-Time Clock (RTC) controller, RTC peripherals, and **8 KB of RTC Slow Memory** remain energized.

\`\`\`
Active Phase (100 ms at 150 mA) ──> Connect Wi-Fi, Read Sensors, POST Telemetry
                                  │
                                  ▼ esp_deep_sleep_start()
Sleep Phase (10 minutes at 10 µA) ──> CPU OFF, Radios OFF, RTC Running
                                  │
                                  ▼ Timer or GPIO Wakeup Event
System Reset / Re-execution     ──> CPU Bootstraps setup() again
\`\`\`

## Multiple Wakeup Sources

The ESP32 can be awakened by multiple independent hardware triggers:

1. **Timer Wakeup**:
\`\`\`cpp
esp_sleep_enable_timer_wakeup(10ULL * 60 * 1000000); // 10 minutes in microseconds
\`\`\`

2. **EXT0 Wakeup (Single RTC GPIO)**:
Wakes up when a specific RTC pin reaches HIGH or LOW logic level:
\`\`\`cpp
esp_sleep_enable_ext0_wakeup(GPIO_NUM_33, 1); // Wake on HIGH
\`\`\`

3. **EXT1 Wakeup (Multiple RTC GPIOs)**:
Wakes up when any combination of RTC pins matches a bitmask:
\`\`\`cpp
esp_sleep_enable_ext1_wakeup((1ULL << GPIO_NUM_33) | (1ULL << GPIO_NUM_32), ESP_EXT1_WAKEUP_ANY_HIGH);
\`\`\`

## Preserving State Across Sleep Cycles with RTC_DATA_ATTR

Because standard SRAM is powered down during Deep Sleep, normal global variables reset to their initial values upon reboot. Storing data in **RTC Slow Memory** preserves it across sleep cycles:

\`\`\`cpp
RTC_DATA_ATTR uint32_t bootCount = 0;
RTC_DATA_ATTR float lastRecordedTemperature = 0.0f;

void setup() {
  bootCount++; // Increments and persists across every sleep cycle!
}
\`\`\``,
    theorySections: [
      {
        id: "wakeup-cause-detection",
        title: "Inspecting Wakeup Cause",
        content: `Upon waking from Deep Sleep, the chip executes setup() from the beginning. Call \`esp_sleep_get_wakeup_cause()\` to determine what woke the processor: \`ESP_SLEEP_WAKEUP_TIMER\`, \`ESP_SLEEP_WAKEUP_EXT0\`, or \`ESP_SLEEP_WAKEUP_TOUCHPAD\`.`,
      },
      {
        id: "battery-duty-cycle-math",
        title: "Calculating Average Current Draw",
        content: `The average current draw of a duty-cycled sensor node is given by: $I_{avg} = \\frac{I_{active} t_{active} + I_{sleep} t_{sleep}}{t_{active} + t_{sleep}}$. If active time is 1 second at 100 mA and sleep time is 3599 seconds at 15 µA, $I_{avg} \\approx 42.7\\text{ }\\mu\\text{A}$, yielding over 5 years on a 2000 mAh battery!`,
      },
    ],
    codeExamples: [
      {
        title: "Deep Sleep with Timer Wakeup and RTC Memory Counter",
        language: "c",
        description: "Increments persistent boot count in RTC memory and sleeps for 60 seconds between boots.",
        code: `#include <Arduino.h>

RTC_DATA_ATTR int bootCounter = 0;

void setup() {
  Serial.begin(115200);
  delay(500);

  bootCounter++;
  Serial.printf("Wakeup number: %d\\n", bootCounter);

  esp_sleep_wakeup_cause_t wakeup_reason = esp_sleep_get_wakeup_cause();
  if (wakeup_reason == ESP_SLEEP_WAKEUP_TIMER) {
    Serial.println("Wakeup caused by timer");
  } else {
    Serial.println("Initial power-on or external reset");
  }

  // Sleep for 60 seconds (in microseconds)
  esp_sleep_enable_timer_wakeup(60ULL * 1000000);
  Serial.println("Entering Deep Sleep...");
  Serial.flush();
  esp_deep_sleep_start();
}

void loop() {
  // Never executed
}`,
      },
    ],
    exercise: exercise(
      "ex-esp-sleep",
      "Calculate Battery Endurance from Duty Cycle",
      "Implement a function `calculateBatteryLifeDays(batteryMah, activeMa, activeSec, sleepUa, sleepSec)` that computes the weighted average current draw in milliamperes and returns the expected operational lifetime in days (assuming 90% usable battery capacity): `Math.floor((batteryMah * 0.90) / (avgMa * 24))`.",
      `function calculateBatteryLifeDays(batteryMah, activeMa, activeSec, sleepUa, sleepSec) {
  const totalPeriod = activeSec + sleepSec;
  const sleepMa = sleepUa / 1000;
  const avgMa = (activeMa * activeSec + sleepMa * sleepSec) / totalPeriod;
  const usableMah = batteryMah * 0.90;
  return Math.floor(usableMah / (avgMa * 24));
}

console.log(calculateBatteryLifeDays(2000, 150, 2, 15, 298));`,
      "esp-deep-sleep-advanced",
      "Accurately calculate weighted average current and projected battery lifetime.",
      [
        "Convert sleepUa to sleepMa by dividing by 1000.",
        "Calculate avgMa = (activeMa * activeSec + sleepMa * sleepSec) / (activeSec + sleepSec).",
        "Calculate total lifetime in days = Math.floor((batteryMah * 0.90) / (avgMa * 24)).",
      ],
      "Developing",
      `function calculateBatteryLifeDays(batteryMah, activeMa, activeSec, sleepUa, sleepSec) {
  // Compute average current and return operational battery life in days
  return 0;
}

console.log(calculateBatteryLifeDays(2000, 150, 2, 15, 298));`,
      [
        testCase("tc-esp-sleep-1", "Calculates realistic IoT sensor battery life", "73"),
        testCase("tc-esp-sleep-2", "Models ultra-low active duty cycle", "724", "", true),
      ],
    ),
    checkpoint: checkpoint(
      "Why must variables intended to survive Deep Sleep be tagged with the RTC_DATA_ATTR qualifier?",
      "Standard internal SRAM is unpowered in Deep Sleep to conserve energy; only the 8 KB RTC Slow Memory retains power and content during the sleep state.",
    ),
  },

  // Lesson 11: MQTT Pub/Sub Telemetry Protocol
  {
    id: "esp32-mqtt-telemetry",
    order: 11,
    title: "MQTT Pub/Sub Telemetry Protocol for Constrained IoT Devices",
    summary: "Implement lightweight MQTT client messaging, Quality of Service (QoS) levels, topic hierarchies, and keepalive pings.",
    type: "guided-coding",
    objectiveIds: ["esp-mqtt-telemetry"],
    prerequisiteLessonIds: ["esp32-deep-sleep-wakeup"],
    estimatedDurationMinutes: 30,
    interactiveDemo: {
      kind: "protocol-explorer",
      title: "Interactive MQTT Protocol & Packet Inspector",
      description: "Inspect MQTT CONNECT, CONNACK, QoS 1 PUBLISH frames, and byte-level packet flags in action.",
      config: {
        scenarioId: "mqtt-telemetry",
      },
    },
    content: `# MQTT Pub/Sub Telemetry Protocol for Constrained IoT Devices

While HTTP REST is the cornerstone of the World Wide Web, it is notoriously inefficient for low-power microcontrollers. HTTP headers add hundreds of bytes of overhead per request, and opening a new TLS socket for every reading wastes severe battery power.

**MQTT (Message Queuing Telemetry Transport)** is the industry standard protocol for IoT:
- **Tiny 2-Byte Fixed Header**: Extreme bandwidth efficiency.
- **Persistent Long-Lived TCP Connection**: Eliminates connection handshake overhead.
- **Publish / Subscribe Decoupling**: Sensors publish data to named topics without knowing who (or how many) clients are receiving it.

## MQTT Topic Hierarchies

Topics are structured like file system paths with forward slashes:
\`\`\`
building-a/floor-2/room-204/temperature
sensors/india/hyderabad/air-quality/pm25
\`\`\`

### Subscription Wildcards:
- **\`+\` (Single-Level Wildcard)**: Matches exactly one topic level.
  - \`building-a/+/room-204/temperature\` matches floor-1, floor-2, etc.
- **\`#\` (Multi-Level Wildcard)**: Matches all remaining child levels (must be placed at the end).
  - \`sensors/india/#\` matches all Indian sensors regardless of depth.

## Quality of Service (QoS) Levels

1. **QoS 0 (At most once / Fire & Forget)**: Fast and light; packets are transmitted without acknowledgment. Suitable for periodic sensor streams where dropping a reading is harmless.
2. **QoS 1 (At least once)**: The broker acknowledges receipt with a \`PUBACK\`. Packets are retried until confirmed. May deliver duplicate packets.
3. **QoS 2 (Exactly once)**: Four-step handshake ensuring no duplicate deliveries. Incurs higher latency and memory footprint.

## The Arduino PubSubClient

\`\`\`cpp
#include <WiFi.h>
#include <PubSubClient.h>

WiFiClient espClient;
PubSubClient client(espClient);

void connectMQTT() {
  while (!client.connected()) {
    if (client.connect("ESP32_Sensor_Node_1")) {
      client.publish("telemetry/status", "online");
      client.subscribe("commands/actuators/#");
    } else {
      delay(2000);
    }
  }
}
\`\`\``,
    theorySections: [
      {
        id: "lwt-and-retained",
        title: "Last Will and Testament (LWT) & Retained Messages",
        content: `When connecting, a client can register a Last Will and Testament (LWT) message with the broker. If the ESP32 unexpectedly loses power or Wi-Fi drops, the broker detects the dead socket and publishes the LWT payload (e.g. \`status: offline\`) automatically. A 'retained' message is held by the broker and immediately sent to any new subscriber.`,
      },
      {
        id: "keep-alive-heartbeats",
        title: "Keep-Alive Interval & PINGREQ",
        content: `MQTT connections stay open indefinitely. If no data has been transmitted within the Keep-Alive interval (e.g. 60 seconds), the client sends a 2-byte PINGREQ frame. If the broker does not reply with PINGRESP, the client drops the socket and reconnects.`,
      },
    ],
    codeExamples: [
      {
        title: "ESP32 MQTT Publisher with JSON Sensor Payload",
        language: "c",
        description: "Connects to Wi-Fi and MQTT broker, serializes telemetry JSON, and publishes to topic.",
        code: `#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "LabNetwork";
const char* password = "SecretPassword";
const char* mqttServer = "broker.hivemq.com";

WiFiClient espClient;
PubSubClient mqttClient(espClient);

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(250);

  mqttClient.setServer(mqttServer, 1883);
}

void loop() {
  if (!mqttClient.connected()) {
    if (mqttClient.connect("ESP32_Telemetry_Node")) {
      Serial.println("Connected to MQTT broker!");
    }
  }
  mqttClient.loop();

  static unsigned long lastPub = 0;
  if (millis() - lastPub >= 5000) {
    lastPub = millis();
    char payload[64];
    snprintf(payload, sizeof(payload), "{\\"adc\\":%d,\\"mv\\":%d}", analogRead(34), 1650);
    mqttClient.publish("katalyst/nodes/node-1/telemetry", payload);
  }
}`,
      },
    ],
    exercise: exercise(
      "ex-esp-mqtt",
      "Evaluate MQTT Topic Wildcard Matcher",
      "Implement a function `matchesMqttTopic(pattern, topic)` that evaluates whether an incoming topic string matches a subscription pattern supporting wildcards `+` (single level) and `#` (multi-level ending wildcard).",
      `function matchesMqttTopic(pattern, topic) {
  const pParts = pattern.split("/");
  const tParts = topic.split("/");

  for (let i = 0; i < pParts.length; i++) {
    if (pParts[i] === "#") return true;
    if (i >= tParts.length) return false;
    if (pParts[i] !== "+" && pParts[i] !== tParts[i]) return false;
  }

  return pParts.length === tParts.length;
}

console.log(matchesMqttTopic("home/+/temperature", "home/kitchen/temperature"));`,
      "esp-mqtt-telemetry",
      "Accurately match MQTT topic paths using single-level and multi-level wildcard syntax.",
      [
        "Split pattern and topic by '/'.",
        "Iterate through pattern segments; if '#' is encountered, return true immediately.",
        "Compare segments; '+' matches any single word, otherwise literal strings must match.",
        "If pattern finishes without '#', check that lengths are equal.",
      ],
      "Developing",
      `function matchesMqttTopic(pattern, topic) {
  // Test if topic matches MQTT wildcard pattern (+ and #)
  return false;
}

console.log(matchesMqttTopic("home/+/temperature", "home/kitchen/temperature"));`,
      [
        testCase("tc-esp-mqtt-1", "Matches single level wildcard (+)", "true"),
        testCase("tc-esp-mqtt-2", "Matches multi-level wildcard (#)", "true", "", true),
      ],
    ),
    checkpoint: checkpoint(
      "Why is MQTT preferred over HTTP REST for battery-powered IoT devices?",
      "MQTT maintains an open TCP socket with a tiny 2-byte header, avoiding the heavy HTTP header overhead, TLS re-handshakes, and connection teardown of REST.",
    ),
  },

  // Lesson 12: IoT Station Capstone
  {
    id: "esp32-capstone-iot-station",
    order: 12,
    title: "IoT Station Capstone: Resilient Dual-Core Remote Telemetry Node",
    summary: "Build a production-grade remote sensor station orchestrating dual-core FreeRTOS tasks, queue-buffered telemetry, Wi-Fi reconnection, and fail-safe recovery.",
    type: "guided-coding",
    objectiveIds: ["esp-iot-capstone"],
    prerequisiteLessonIds: ["esp32-mqtt-telemetry"],
    estimatedDurationMinutes: 35,
    interactiveDemo: {
      kind: "circuit",
      title: "Resilient IoT Telemetry Station Architecture",
      description: "Simulate network dropouts, test offline queue buffer spooling, and verify automatic broker reconnect.",
    },
    content: `# IoT Station Capstone: Resilient Dual-Core Remote Telemetry Node

Building a hobby prototype that sends data to the cloud is straightforward when Wi-Fi is flawless. However, production IoT devices must withstand real-world adversities: Wi-Fi routers rebooting, DHCP lease expirations, MQTT broker outages, and power brownouts.

In this capstone, we architect a resilient, dual-core industrial IoT telemetry station.

## Dual-Core Architecture Partitioning

\`\`\`
               CORE 0 (Networking & Cloud)            CORE 1 (Sensor Acquisition)
             ┌─────────────────────────────┐        ┌─────────────────────────────┐
             │                             │        │                             │
             │   Wi-Fi Management Task     │        │    Analog Sampling Task     │
             │   • Auto-reconnect          │        │    • Multisampling (32x)    │
             │   • Exponential backoff     │        │    • Outlier trimming       │
             │                             │        │                             │
             │   MQTT Transmission Task    │        │    Digital Filter Task      │
             │   • Dequeues sensor packets │        │    • Threshold evaluation   │
             │   • Publishes JSON payload  │        │                             │
             └──────────────▲──────────────┘        └──────────────┬──────────────┘
                            │                                      │
                            │      FreeRTOS Thread-Safe Queue      │
                            └──────────────────────────────────────┘
                                  (16-Packet FIFO Ring Buffer)
\`\`\`

## Offline Ring Buffering & Network Backpressure

When Wi-Fi or MQTT connectivity drops, sensor acquisition must continue uninterrupted:
1. Core 1 continues reading sensors and pushes packets into the FreeRTOS Queue.
2. If connectivity remains down and the queue reaches full capacity (16 packets), the oldest packets are discarded or spooled to flash (LittleFS).
3. Once Core 0 restores network connection, it drains the queued telemetry backlog in FIFO order.

## Exponential Backoff for Reconnection

When the Wi-Fi router restarts, dozens of connected devices must not batter it with simultaneous reconnection attempts (a **thundering herd** problem):

\`\`\`cpp
uint32_t retryDelayMs = 1000;
const uint32_t MAX_RETRY_MS = 60000;

void reconnectWiFi() {
  while (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    vTaskDelay(pdMS_TO_TICKS(retryDelayMs));
    retryDelayMs = min(retryDelayMs * 2, MAX_RETRY_MS); // Exponential backoff
  }
  retryDelayMs = 1000; // Reset upon successful connection
}
\`\`\``,
    theorySections: [
      {
        id: "thundering-herd-mitigation",
        title: "Reconnection Storms & Jitter",
        content: `To prevent synchronized reconnection spikes across a building after a power outage, add randomized jitter to the backoff interval: \`delay = retryDelayMs + random(0, 1000)\`.`,
      },
      {
        id: "spiffs-littlefs-spooling",
        title: "Non-Volatile Spooling with LittleFS",
        content: `When offline periods extend beyond available SRAM buffer limits (e.g. hours of outage), packets can be written to the on-chip SPI flash file system using LittleFS, then uploaded once cloud connectivity resumes.`,
      },
    ],
    codeExamples: [
      {
        title: "Production Dual-Core Telemetry Node Architecture",
        language: "c",
        description: "Complete firmware orchestrating FreeRTOS queues, dual-core task isolation, and exponential reconnect.",
        code: `#include <WiFi.h>
#include <PubSubClient.h>

typedef struct {
  uint16_t adcRaw;
  uint32_t timestamp;
} TelemetryPacket;

QueueHandle_t dataQueue;
WiFiClient netClient;
PubSubClient mqttClient(netClient);

void telemetryTask(void *pvParam) {
  for (;;) {
    TelemetryPacket pkt;
    if (xQueueReceive(dataQueue, &pkt, pdMS_TO_TICKS(500)) == pdTRUE) {
      if (mqttClient.connected()) {
        char buf[64];
        snprintf(buf, sizeof(buf), "{\\"raw\\":%u,\\"t\\":%u}", pkt.adcRaw, pkt.timestamp);
        mqttClient.publish("katalyst/node/data", buf);
      }
    }
  }
}

void sensorTask(void *pvParam) {
  for (;;) {
    TelemetryPacket pkt;
    pkt.adcRaw = analogRead(34);
    pkt.timestamp = millis();
    xQueueSend(dataQueue, &pkt, 0); // Non-blocking
    vTaskDelay(pdMS_TO_TICKS(1000));
  }
}

void setup() {
  Serial.begin(115200);
  dataQueue = xQueueCreate(16, sizeof(TelemetryPacket));

  xTaskCreatePinnedToCore(telemetryTask, "NetTask", 4096, NULL, 1, NULL, 0);
  xTaskCreatePinnedToCore(sensorTask, "SensTask", 2048, NULL, 2, NULL, 1);
}

void loop() {
  vTaskDelay(pdMS_TO_TICKS(1000));
}`,
      },
    ],
    exercise: exercise(
      "ex-esp-capstone",
      "Simulate Resilient Telemetry Queue and Auto-Flush",
      "Implement a function `simulateResilientNode(events, queueCapacity)` that models an offline spooling queue. Events is an array of `{ action: 'SAMPLE' | 'NET_DOWN' | 'NET_UP', reading?: number }`. When online, samples transmit immediately (push to `transmitted`). When offline, samples enter queue up to `queueCapacity` (excess are `dropped`). When 'NET_UP' occurs, all queued items are flushed to `transmitted` in FIFO order. Return `{ transmitted: [...], droppedCount: number, finalQueueLength: number }`.",
      `function simulateResilientNode(events, queueCapacity) {
  let isOnline = true;
  const queue = [];
  const transmitted = [];
  let droppedCount = 0;

  for (const ev of events) {
    if (ev.action === "NET_DOWN") {
      isOnline = false;
    } else if (ev.action === "NET_UP") {
      isOnline = true;
      while (queue.length > 0) {
        transmitted.push(queue.shift());
      }
    } else if (ev.action === "SAMPLE") {
      if (isOnline) {
        transmitted.push(ev.reading);
      } else {
        if (queue.length < queueCapacity) {
          queue.push(ev.reading);
        } else {
          droppedCount++;
        }
      }
    }
  }

  return { transmitted, droppedCount, finalQueueLength: queue.length };
}

console.log(JSON.stringify(simulateResilientNode([
  { action: "SAMPLE", reading: 100 },
  { action: "NET_DOWN" },
  { action: "SAMPLE", reading: 200 },
  { action: "SAMPLE", reading: 300 },
  { action: "SAMPLE", reading: 400 },
  { action: "NET_UP" }
], 2)));`,
      "esp-iot-capstone",
      "Simulate resilient offline queueing, packet dropping, and auto-flush on reconnection.",
      [
        "Track isOnline state flag initialized to true.",
        "On 'NET_DOWN', set isOnline = false.",
        "On 'SAMPLE', if isOnline push to transmitted; else push to queue if length < queueCapacity, else increment droppedCount.",
        "On 'NET_UP', set isOnline = true and flush queue into transmitted.",
      ],
      "Developing",
      `function simulateResilientNode(events, queueCapacity) {
  // Simulate offline spooling, queue limits, and auto-flush
  return null;
}

console.log(JSON.stringify(simulateResilientNode([
  { action: "SAMPLE", reading: 100 },
  { action: "NET_DOWN" },
  { action: "SAMPLE", reading: 200 },
  { action: "SAMPLE", reading: 300 },
  { action: "SAMPLE", reading: 400 },
  { action: "NET_UP" }
], 2)));`,
      [
        testCase("tc-esp-cap-1", "Flushes queued packets upon reconnection and records drops", '{"transmitted":[100,200,300],"droppedCount":1,"finalQueueLength":0}'),
        testCase("tc-esp-cap-2", "Direct transmission when online without drops", '{"transmitted":[50],"droppedCount":0,"finalQueueLength":0}', "", true),
      ],
    ),
    checkpoint: checkpoint(
      "Why is segregating networking tasks to Core 0 and sensor tasks to Core 1 best practice on the ESP32?",
      "Wi-Fi handshakes and TCP transmissions can block for hundreds of milliseconds; pinning sensor acquisition to Core 1 ensures physical data sampling never suffers timing jitter or deadline misses.",
    ),
  },
];

export const esp32IotModules: LearningModule[] = [
  moduleData(
    "esp-module-arch-logic",
    1,
    "ESP32 Architecture & 3.3V Logic",
    "Navigate the Xtensa dual-core architecture, FreeRTOS background tasks, 3.3V limits, and bootstrap strapping pins.",
    esp32IotLessons.slice(0, 2),
  ),
  moduleData(
    "esp-module-adc-pwm",
    2,
    "High-Resolution ADC & LEDC PWM",
    "Configure 12-bit ADC attenuation curves, compensate for non-linearity, and allocate hardware LEDC PWM timers.",
    esp32IotLessons.slice(2, 4),
  ),
  moduleData(
    "esp-module-wifi-lowpower",
    3,
    "Wireless Telemetry & Low Power",
    "Connect to 802.11 Wi-Fi networks, stream JSON REST payloads, and maximize battery lifetime using Deep Sleep.",
    esp32IotLessons.slice(4, 6),
  ),
  moduleData(
    "esp-module-freertos",
    4,
    "FreeRTOS Dual-Core Concurrency & Calibration",
    "Architect multi-core firmware with FreeRTOS tasks, thread-safe queues, and 12-bit ADC curve linearization.",
    esp32IotLessons.slice(6, 9),
  ),
  moduleData(
    "esp-module-iot-telemetry-capstone",
    5,
    "Ultra-Low-Power Duty Cycles & MQTT Capstone",
    "Optimize battery duty cycles, implement lightweight MQTT telemetry, and build a resilient dual-core IoT node.",
    esp32IotLessons.slice(9, 12),
  ),
];

export const esp32IotCourse: LearningCourse = {
  id: "esp32-iot-systems",
  subjectId: "esp32-iot-subject",
  title: "ESP32 Dual-Core IoT Systems & FreeRTOS",
  description: "Architect connected IoT systems using the Xtensa dual-core processor, FreeRTOS tasks, 3.3V logic constraints, 12-bit ADC, LEDC PWM, and Wi-Fi telemetry.",
  level: "Developing",
  version: "1.0.0",
  prerequisites: ["Embedded C/C++ syntax", "Microcontroller basics (Arduino or AVR)"],
  objectives,
  learningOutcomes: [
    "Navigate Xtensa 32-bit dual-core architecture and FreeRTOS task scheduling.",
    "Prevent silicon overvoltage using voltage dividers and logic level shifters.",
    "Identify bootstrap strapping pins and select safe peripheral GPIOs.",
    "Sample analog sensors with the 12-bit ADC using dB attenuation curves.",
    "Allocate hardware LEDC timers and modulate PWM duty cycle with up to 16-bit resolution.",
    "Stream structured JSON sensor telemetry over 802.11 Wi-Fi networks.",
    "Reduce power consumption to 15µA using Deep Sleep and RTC memory.",
    "Pin real-time tasks to Core 0 and Core 1 with priority preemption.",
    "Transfer structured telemetry between cores using thread-safe FreeRTOS queues.",
    "Linearize and calibrate 12-bit ADC sensor data using multisampling.",
    "Publish and subscribe to lightweight MQTT broker topics with wildcard filtering.",
    "Architect resilient, fault-tolerant edge IoT nodes with auto-reconnection and buffering.",
  ],
  estimatedDurationMinutes: 330,
  publicationStatus: "published",
  modules: esp32IotModules,
};

export const esp32IotCourseSummary = {
  id: esp32IotCourse.id,
  subjectId: esp32IotCourse.subjectId,
  title: esp32IotCourse.title,
  description: esp32IotCourse.description,
  level: esp32IotCourse.level,
  version: esp32IotCourse.version,
  prerequisites: esp32IotCourse.prerequisites,
  objectives: esp32IotCourse.objectives,
  learningOutcomes: esp32IotCourse.learningOutcomes,
  estimatedDurationMinutes: esp32IotCourse.estimatedDurationMinutes,
  publicationStatus: esp32IotCourse.publicationStatus,
  modules: esp32IotCourse.modules.map((m) => ({
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
