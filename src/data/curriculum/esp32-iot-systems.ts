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
  ],
  estimatedDurationMinutes: 175,
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
