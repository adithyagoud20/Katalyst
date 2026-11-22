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

export const embeddedCapstonesSubject: LearningSubject = {
  id: "embedded-capstones-subject",
  title: "Hands-on Embedded Engineering",
  description: "Architect, wire, and firmware-implement 6 comprehensive industry-standard micro-controller capstones: automated weather station, smart appliance controller, autonomous line follower, digital keyless lock, 4-way traffic junction, and obstacle rover.",
};

export const embeddedCapstonesObjectives: LearningObjective[] = [
  { id: "capstone-weather-obj", title: "Build an automated weather station logging sensor telemetry to virtual EEPROM and streaming JSON." },
  { id: "capstone-home-obj", title: "Implement a smart home lighting and appliance controller with PIR interrupts, relay drivers, and MQTT state." },
  { id: "capstone-line-obj", title: "Construct an autonomous line follower robot with dual optical sensors and differential motor steering." },
  { id: "capstone-door-lock-obj", title: "Develop a secure digital combination door lock with 4-digit PIN verification, lockout timer, and solenoid actuation." },
  { id: "capstone-traffic-obj", title: "Engineer a four-way smart traffic light junction with pedestrian crossing request interrupts and yellow clearing intervals." },
  { id: "capstone-rover-obj", title: "Build an autonomous obstacle-avoiding micro-rover using HC-SR04 ultrasonic echo timing and servo radar sweep." },
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

export const embeddedCapstonesLessons: LearningLesson[] = [
  // 1. Automated Weather Station & Data Logger
  {
    id: "capstone-weather-station",
    order: 1,
    title: "Automated Weather Station & Data Logger",
    summary: "Acquire multi-sensor analog readings, store ring-buffer records, and stream serial JSON telemetry.",
    type: "interactive-simulation",
    objectiveIds: ["capstone-weather-obj"],
    prerequisiteLessonIds: [],
    estimatedDurationMinutes: 40,
    content: `Environmental monitoring stations are deployed across agricultural fields, solar farms, and weather observatories to capture real-time ambient parameters: temperature, relative humidity, barometric pressure, and ambient lux.

### System Architecture
1. **Sensor Transducers**:
   - Thermistor / Temperature sensor (LM35 / NTC thermistor): Analog voltage linearly proportional to Celsius temperature:
     $$V_{\\text{out}} = 10\\text{ mV}/^\\circ\\text{C}$$
   - LDR photoresistor in a voltage divider: Light intensity translates into an analog voltage between $0\\text{ V}$ and $V_{CC}$.
2. **On-Chip ADC Sampling**:
   - 10-bit ATmega328P ADC ($V_{\\text{ref}} = 5.0\\text{ V}$):
     $$V_{\\text{analog}} = \\text{ADC} \\times \\frac{5.0}{1024}$$
3. **Circular Ring Buffer Logging**:
   - Telemetry points are recorded into local non-volatile memory or RAM circular buffers with head/tail pointers, ensuring bounded memory usage.
4. **Structured JSON Telemetry**:
   - Data is formatted as a compact JSON object for ingestion by IoT dashboards and cloud MQTT brokers.`,
    theorySections: [
      {
        id: "adc-scaling",
        title: "Analog Sensor Linear Calibration",
        content: "To convert 10-bit raw ADC readings (0-1023) to millivolts with Vref = 5.0 V, multiply raw by 5000 / 1024. For an LM35 sensor with sensitivity 10 mV/°C, temperature in Celsius equals millivolts divided by 10.",
      },
      {
        id: "ring-buffer-eeprom",
        title: "Non-Volatile Ring Buffer Logging",
        content: "EEPROM has finite write endurance (typically 100,000 cycles per cell). Writing telemetry into a wear-levelled circular ring buffer spreads erase cycles evenly across memory pages.",
      },
    ],
    codeExamples: [
      {
        title: "Arduino Weather Station Telemetry Serializer",
        language: "c",
        code: `#include <stdio.h>

void logWeather(int tempRaw, int lightRaw) {
    float tempC = ((tempRaw * 5000.0f) / 1024.0f) / 10.0f;
    float lightPct = (lightRaw / 1023.0f) * 100.0f;
    printf("TEMP: %.1f C, LIGHT: %.1f%%\\n", tempC, lightPct);
}

int main(void) {
    logWeather(512, 512);
    return 0;
}`,
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Weather Station Telemetry Rig",
      description: "Inspect simulated environmental analog sensors, ADC conversion, and telemetry streaming.",
      config: { mode: "esp32" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("TEMP: 25.0 C, LIGHT: 50.0%\n"),
    exercise: exercise(
      "ex-capstone-weather-station",
      "Format Weather Station Telemetry",
      "For raw sensor readings tempRaw = 512 and lightRaw = 512 on a 10-bit ADC (Vref = 5.0V, 10 mV = 1 deg C), compute tempC = ((tempRaw * 5000 / 1024) / 10) and lightPct = (lightRaw / 1023 * 100). Log: 'TEMP: {tempC} C, LIGHT: {lightPct}%' with both values formatted to 1 decimal place.",
      `const tempRaw = 512, lightRaw = 512;\nconst tempC = ((tempRaw * 5000) / 1024) / 10;\nconst lightPct = (lightRaw / 1023) * 100;\nconsole.log(\`TEMP: \${tempC.toFixed(1)} C, LIGHT: \${lightPct.toFixed(1)}%\`);`,
      "capstone-weather-obj",
      "Computes calibrated temperature and light percentages.",
      [
        "Compute tempC using ((tempRaw * 5000) / 1024) / 10.",
        "Compute lightPct using (lightRaw / 1023) * 100.",
        "Use toFixed(1) for both numbers.",
      ],
      "Applied",
      `// Weather station telemetry serializer\nconst tempRaw = 512, lightRaw = 512;\n\n// TODO: Compute tempC and lightPct and log formatted string\n`,
      [
        {
          id: "tc-weather-default",
          label: "Verifies telemetry formatting for mid-scale ADC values",
          expectedStdout: "TEMP: 25.0 C, LIGHT: 50.0%\n",
        },
        {
          id: "tc-weather-calibration",
          label: "Confirms 10 mV per degree Celsius conversion factor",
          expectedStdout: "TEMP: 25.0 C, LIGHT: 50.0%\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why is a flyback diode required when controlling an electromagnetic relay from a microcontroller transistor?",
      "To clamp inductive kickback voltage (V = -L di/dt) that occurs when relay coil current is suddenly interrupted.",
    ),
  },

  // 2. Smart Home Lighting & Appliance Controller
  {
    id: "capstone-smart-home",
    order: 2,
    title: "Smart Home Lighting & Appliance Controller",
    summary: "Coordinate PIR presence interrupts, PWM mood dimming, and relay switching.",
    type: "interactive-simulation",
    objectiveIds: ["capstone-home-obj"],
    prerequisiteLessonIds: ["capstone-weather-station"],
    estimatedDurationMinutes: 40,
    content: `# Smart Home Lighting & Appliance Controller

Building automation systems combine occupancy sensing, solid-state or electromagnetic relays, and PWM brightness dimming to conserve energy while enhancing living comfort.

### Hardware Interfacing & Safety
1. **PIR Occupancy Sensor**:
   - Passive Infrared (PIR) modules detect thermal radiation shifts from moving bodies.
   - The digital output pin transitions from LOW to HIGH upon motion detection, triggering a hardware interrupt on the microcontroller.
2. **Relay Driver Circuit**:
   - Microcontroller GPIO pins output $3.3\\text{ V}$ or $5\\text{ V}$ at $\\le 20\\text{ mA}$, insufficient to drive mechanical relay coils ($50\\text{--}100\\text{ mA}$ at $5\\text{ V}$ or $12\\text{ V}$).
   - An NPN BJT (e.g., 2N2222) or N-channel MOSFET acts as a low-side switch.
   - A flyback diode (e.g., 1N4007) is placed antiparallel across the coil to absorb inductive kickback voltage ($V = -L \\frac{di}{dt}$).
3. **PWM Mood Dimming**:
   - LED drivers utilize high-frequency Pulse-Width Modulation ($> 1\\text{ kHz}$) to modulate duty cycle without noticeable optical flicker.`,
    theorySections: [
      {
        id: "relay-transistor-switch",
        title: "Low-Side Relay Switching",
        content: "The transistor base connects to the MCU GPIO via a 1k resistor. When the pin is HIGH, base current drives the BJT into saturation (Vce_sat ≈ 0.2V), energizing the relay coil.",
      },
      {
        id: "lux-hysteresis",
        title: "Ambient Light Threshold Hysteresis",
        content: "Without hysteresis, slight fluctuations around the light threshold cause rapid flickering (chattering). Applying upper (400 lux) and lower (350 lux) thresholds prevents relay contact wear.",
      },
    ],
    codeExamples: [
      {
        title: "C Smart Home Lighting Arbitration",
        language: "c",
        code: `#include <stdio.h>
#include <stdbool.h>

void evaluateLighting(bool motion, int lux) {
    if (!motion || lux >= 400) {
        printf("RELAY: OFF, PWM: 0\\n");
    } else if (lux < 100) {
        printf("RELAY: ON, PWM: 255\\n");
    } else {
        printf("RELAY: ON, PWM: 128\\n");
    }
}

int main(void) {
    evaluateLighting(true, 50);
    return 0;
}`,
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Smart Home Lighting Controller",
      description: "Simulate PIR presence trigger, relay switching, and PWM dimming control.",
      config: { mode: "esp32" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("RELAY: ON, PWM: 255\n"),
    exercise: exercise(
      "ex-capstone-smart-home",
      "Smart Home Automation Logic",
      "Given motion = true and lux = 50: if !motion or lux >= 400, output 'RELAY: OFF, PWM: 0'. If motion and lux < 100, output 'RELAY: ON, PWM: 255'. If motion and lux between 100 and 399, output 'RELAY: ON, PWM: 128'. Write code to evaluate and log the result.",
      `const motion = true, lux = 50;\nif (!motion || lux >= 400) {\n  console.log("RELAY: OFF, PWM: 0");\n} else if (lux < 100) {\n  console.log("RELAY: ON, PWM: 255");\n} else {\n  console.log("RELAY: ON, PWM: 128");\n}`,
      "capstone-home-obj",
      "Outputs appropriate relay and PWM levels based on occupancy and ambient light.",
      [
        "Check (!motion || lux >= 400) first.",
        "Check lux < 100 for full brightness.",
        "Otherwise output mood lighting (PWM: 128).",
      ],
      "Applied",
      `// Smart home lighting controller\nconst motion = true, lux = 50;\n\n// TODO: Implement lighting decision logic and log string\n`,
      [
        {
          id: "tc-home-motion-dark",
          label: "Verifies full illumination during motion in dark room",
          expectedStdout: "RELAY: ON, PWM: 255\n",
        },
        {
          id: "tc-home-relay-state",
          label: "Ensures relay turns ON when motion detected",
          expectedStdout: "RELAY: ON, PWM: 255\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "What is the function of a snubber circuit or flyback diode across an inductive AC or DC relay load?",
      "To suppress high-voltage transients created by inductive energy collapse when switching off.",
    ),
  },

  // 3. Autonomous Two-Sensor Line Follower
  {
    id: "capstone-line-follower",
    order: 3,
    title: "Autonomous Dual-Sensor Line Follower Robot",
    summary: "Process infrared reflectance sensors and drive H-bridge differential motors.",
    type: "interactive-simulation",
    objectiveIds: ["capstone-line-obj"],
    prerequisiteLessonIds: ["capstone-smart-home"],
    estimatedDurationMinutes: 40,
    content: `# Autonomous Dual-Sensor Line Follower Robot

Line-following mobile robots form the backbone of Automated Guided Vehicles (AGVs) in industrial warehouses and smart manufacturing facilities.

### Physical Mechanism & Sensory Feedback
1. **Infrared Reflectance Pair (TCRT5000)**:
   - Emits infrared light onto the driving surface.
   - White surface: High reflectance $\\to$ phototransistor conducts $\\to$ LOW output.
   - Black line (tape): High absorption $\\to$ phototransistor cut off $\\to$ HIGH output.
2. **H-Bridge DC Motor Driver (L298N / L293D)**:
   - Controls direction and speed of Left and Right DC motors:
     - \`IN1, IN2\`: Left motor forward / reverse
     - \`IN3, IN4\`: Right motor forward / reverse
     - \`ENA, ENB\`: PWM speed control pins ($0\\text{--}255$)
3. **Differential Steering Algorithm**:
   - **Both sensors on white**: Robot is centered $\\to$ Forward (\`Left = Forward, Right = Forward\`).
   - **Left sensor on black**: Robot drifted right $\\to$ Hard left turn (\`Left = Stop, Right = Forward\`).
   - **Right sensor on black**: Robot drifted left $\\to$ Hard right turn (\`Left = Forward, Right = Stop\`).
   - **Both sensors on black**: Crossroad intersection or stop marker $\\to$ Stop.`,
    theorySections: [
      {
        id: "differential-steering",
        title: "Differential Drive Kinematics",
        content: "By driving left and right wheels at different angular velocities (wL != wR), the robot rotates about an Instantaneous Center of Curvature (ICC) without requiring a steering rack mechanism.",
      },
      {
        id: "tcrt5000-principles",
        title: "Optical Reflectance Thresholding",
        content: "Ambient light variations can degrade IR sensing. Comparator circuits with potentiometer threshold adjustment (LM393) output clean digital HIGH/LOW levels to the MCU.",
      },
    ],
    codeExamples: [
      {
        title: "C Differential Line Follower Control",
        language: "c",
        code: `#include <stdio.h>
#include <stdbool.h>

void driveLine(bool leftBlack, bool rightBlack) {
    if (leftBlack && rightBlack) {
        printf("ACTION: STOP, LEFT: 0, RIGHT: 0\\n");
    } else if (leftBlack) {
        printf("ACTION: TURN_LEFT, LEFT: 0, RIGHT: 220\\n");
    } else if (rightBlack) {
        printf("ACTION: TURN_RIGHT, LEFT: 220, RIGHT: 0\\n");
    } else {
        printf("ACTION: FORWARD, LEFT: 200, RIGHT: 200\\n");
    }
}

int main(void) {
    driveLine(false, false);
    return 0;
}`,
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Line Follower Differential Motor Rig",
      description: "Inspect IR sensor thresholding and motor direction control logic.",
      config: { mode: "arduino" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("ACTION: FORWARD, LEFT: 200, RIGHT: 200\n"),
    exercise: exercise(
      "ex-capstone-line-follower",
      "Differential Steering Controller",
      "Given leftBlack = false and rightBlack = false: if both black, log 'ACTION: STOP, LEFT: 0, RIGHT: 0'. If leftBlack, log 'ACTION: TURN_LEFT, LEFT: 0, RIGHT: 220'. If rightBlack, log 'ACTION: TURN_RIGHT, LEFT: 220, RIGHT: 0'. Otherwise, log 'ACTION: FORWARD, LEFT: 200, RIGHT: 200'. Write the evaluation script.",
      `const leftBlack = false, rightBlack = false;\nif (leftBlack && rightBlack) {\n  console.log("ACTION: STOP, LEFT: 0, RIGHT: 0");\n} else if (leftBlack) {\n  console.log("ACTION: TURN_LEFT, LEFT: 0, RIGHT: 220");\n} else if (rightBlack) {\n  console.log("ACTION: TURN_RIGHT, LEFT: 220, RIGHT: 0");\n} else {\n  console.log("ACTION: FORWARD, LEFT: 200, RIGHT: 200");\n}`,
      "capstone-line-obj",
      "Outputs appropriate differential drive commands based on sensor states.",
      [
        "Check both true first.",
        "Check leftBlack for TURN_LEFT.",
        "Check rightBlack for TURN_RIGHT.",
        "Default to FORWARD with matched wheel speeds.",
      ],
      "Applied",
      `// Line follower steering controller\nconst leftBlack = false, rightBlack = false;\n\n// TODO: Implement steering decision and log string\n`,
      [
        {
          id: "tc-line-forward",
          label: "Verifies straight forward cruising when centered on track",
          expectedStdout: "ACTION: FORWARD, LEFT: 200, RIGHT: 200\n",
        },
        {
          id: "tc-line-symmetry",
          label: "Ensures balanced wheel speeds during forward movement",
          expectedStdout: "ACTION: FORWARD, LEFT: 200, RIGHT: 200\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "What causes an autonomous line follower to wobble or oscillate violently across the track?",
      "Excessive steering correction gain (over-correcting before sensing the centered position), requiring proportional damping.",
    ),
  },

  // 4. Digital Combination Door Lock
  {
    id: "capstone-digital-door-lock",
    order: 4,
    title: "Digital Combination Keypad Door Lock",
    summary: "Implement keypad entry decoding, PIN authentication, and lock solenoid timing.",
    type: "interactive-simulation",
    objectiveIds: ["capstone-door-lock-obj"],
    prerequisiteLessonIds: ["capstone-line-follower"],
    estimatedDurationMinutes: 40,
    content: `# Digital Combination Keypad Door Lock

Electronic access control systems replace mechanical keys with PIN credentials, smartcards, or biometrics to secure restricted laboratories and server rooms.

### System Architecture
1. **Matrix Keypad Scanning**:
   - $4 \\times 4$ keypads use 4 row pins and 4 column pins to detect 16 distinct pushbuttons with only 8 GPIOs.
   - Microcontroller pulls one row LOW at a time and scans column states with internal pull-up resistors.
2. **Defensive State Machine & Lockout**:
   - Buffer holds entered digits (e.g., 4 characters).
   - If entered code matches master PIN $\\to$ Solenoid relay energizes for 5 seconds, buzzer chimes, and state resets.
   - If entered code is incorrect $\\to$ Increment failure counter.
   - If 3 consecutive failures occur $\\to$ Enter a 30-second penalty lockout state to prevent brute-force dictionary attacks.`,
    theorySections: [
      {
        id: "matrix-scanning",
        title: "Row-Column Multiplexing",
        content: "Scanning sets Row 0 LOW while Rows 1-3 remain HIGH inputs with pull-ups. If Key 1 is pressed (Row 0, Col 0), Col 0 reads LOW. The intersection pin uniquely identifies the pressed key.",
      },
      {
        id: "lockout-security",
        title: "Brute-Force Rate Limiting",
        content: "Without lockout penalties, a 4-digit PIN (10,000 combinations) can be brute-forced in under 15 minutes by an automated key simulator. Adding a 30-second lockout after 3 misses renders attacks infeasible.",
      },
    ],
    codeExamples: [
      {
        title: "C PIN Authentication Routine",
        language: "c",
        code: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>

void verifyPin(const char* master, const char* entered, int attempts) {
    if (strcmp(master, entered) == 0) {
        printf("ACCESS: GRANTED, LOCKOUT: 0 s\\n");
    } else {
        attempts++;
        if (attempts >= 3) {
            printf("ACCESS: DENIED, LOCKOUT: 30 s\\n");
        } else {
            printf("ACCESS: DENIED, LOCKOUT: 0 s\\n");
        }
    }
}

int main(void) {
    verifyPin("1234", "1234", 0);
    return 0;
}`,
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Keypad & Electronic Lock Rig",
      description: "Test PIN entry verification, lockout penalty state, and unlocking pulse.",
      config: { mode: "arduino" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("ACCESS: GRANTED, LOCKOUT: 0 s\n"),
    exercise: exercise(
      "ex-capstone-door-lock",
      "PIN Verification State Machine",
      "Given masterPin = '1234', enteredPin = '1234', and currentAttempts = 0: if entered matches master, log 'ACCESS: GRANTED, LOCKOUT: 0 s'. If not matching and currentAttempts + 1 >= 3, log 'ACCESS: DENIED, LOCKOUT: 30 s'. Otherwise log 'ACCESS: DENIED, LOCKOUT: 0 s'. Implement the logic.",
      `const masterPin = "1234", enteredPin = "1234", currentAttempts = 0;\nif (enteredPin === masterPin) {\n  console.log("ACCESS: GRANTED, LOCKOUT: 0 s");\n} else {\n  const att = currentAttempts + 1;\n  if (att >= 3) {\n    console.log("ACCESS: DENIED, LOCKOUT: 30 s");\n  } else {\n    console.log("ACCESS: DENIED, LOCKOUT: 0 s");\n  }\n}`,
      "capstone-door-lock-obj",
      "Returns authentication result with brute-force lockout defense.",
      [
        "Compare enteredPin with masterPin.",
        "Check (currentAttempts + 1) >= 3 on failure.",
        "Output exact expected string.",
      ],
      "Applied",
      `// PIN verification logic\nconst masterPin = "1234", enteredPin = "1234", currentAttempts = 0;\n\n// TODO: Implement PIN comparison and log status string\n`,
      [
        {
          id: "tc-lock-granted",
          label: "Verifies immediate access grant for valid master PIN",
          expectedStdout: "ACCESS: GRANTED, LOCKOUT: 0 s\n",
        },
        {
          id: "tc-lock-zero-penalty",
          label: "Confirms zero lockout penalty for successful unlock",
          expectedStdout: "ACCESS: GRANTED, LOCKOUT: 0 s\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why must push-button inputs be debounced either in software or with hardware RC low-pass filters?",
      "Mechanical contacts bounce rapidly for 5 to 20 ms upon impact, which can register as dozens of false keypresses.",
    ),
  },

  // 5. Four-Way Smart Traffic Light Junction
  {
    id: "capstone-traffic-light",
    order: 5,
    title: "Four-Way Smart Traffic Light Junction",
    summary: "Coordinate state machine timing, yellow clearing intervals, and emergency overrides.",
    type: "interactive-simulation",
    objectiveIds: ["capstone-traffic-obj"],
    prerequisiteLessonIds: ["capstone-digital-door-lock"],
    estimatedDurationMinutes: 40,
    content: `# Four-Way Smart Traffic Light Junction

Municipal traffic controllers manage multi-phase road junctions to maximize vehicular throughput while guaranteeing safe pedestrian crossing intervals.

### Finite State Machine Phases
A standard 2-axis (North-South vs. East-West) junction cycles through 4 primary phases:
1. **Phase 0 (NS Green)**: North-South Green ($30\\text{ s}$), East-West Red ($30\\text{ s}$).
2. **Phase 1 (NS Yellow)**: North-South Yellow ($4\\text{ s}$ clearance), East-West Red.
3. **Phase 2 (EW Green)**: North-South Red ($25\\text{ s}$), East-West Green ($25\\text{ s}$).
4. **Phase 3 (EW Yellow)**: North-South Red, East-West Yellow ($4\\text{ s}$ clearance).

### Emergency Priority & Pedestrian Interrupts
- **Pedestrian Pushbutton**: Latches an interrupt request that shortens the current green cycle if it exceeds a minimum safe green threshold ($10\\text{ s}$).
- **Emergency Vehicle Strobe (E-Stop)**: Optoelectronic sensor detects flashing sirens and forces immediate transition through yellow to lock opposing traffic at Red.`,
    theorySections: [
      {
        id: "yellow-dilemma-zone",
        title: "Yellow Clearance Interval Physics",
        content: "The yellow duration Ty = t_perception + v / (2 * a_braking). For a 50 km/h urban street, Ty must be at least 3.5 to 4.0 seconds to eliminate the dilemma zone where a car can neither stop safely nor clear the intersection before Red.",
      },
      {
        id: "all-red-clearance",
        title: "All-Red Clearance Phase",
        content: "Heavy intersections insert a 1-2 second All-Red interval between yellow expiry and cross-street green to ensure clearing vehicles have completely exited the conflict zone.",
      },
    ],
    codeExamples: [
      {
        title: "C Four-Way Traffic State Machine",
        language: "c",
        code: `#include <stdio.h>
#include <stdbool.h>

void stepTraffic(int phase, int seconds, bool emergency) {
    if (emergency) {
        printf("PHASE: 0, NS: GREEN, EW: RED\\n");
        return;
    }
    if (phase == 0 && seconds >= 30) printf("PHASE: 1, NS: YELLOW, EW: RED\\n");
    else if (phase == 1 && seconds >= 4) printf("PHASE: 2, NS: RED, EW: GREEN\\n");
    else if (phase == 2 && seconds >= 25) printf("PHASE: 3, NS: RED, EW: YELLOW\\n");
    else if (phase == 3 && seconds >= 4) printf("PHASE: 0, NS: GREEN, EW: RED\\n");
    else printf("PHASE: %d, HOLD\\n", phase);
}

int main(void) {
    stepTraffic(0, 31, false);
    return 0;
}`,
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Smart Traffic Light Controller",
      description: "Simulate North-South and East-West 4-way traffic phases and pedestrian request interrupts.",
      config: { mode: "arduino" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("PHASE: 1, NS: YELLOW, EW: RED\n"),
    exercise: exercise(
      "ex-capstone-traffic-light",
      "Traffic Junction Next-Phase Decider",
      "Given currentPhase = 0, secondsInPhase = 31, and emergency = false: if emergency is true, log 'PHASE: 0, NS: GREEN, EW: RED'. If phase 0 and seconds >= 30, log 'PHASE: 1, NS: YELLOW, EW: RED'. If phase 1 and seconds >= 4, log 'PHASE: 2, NS: RED, EW: GREEN'. If phase 2 and seconds >= 25, log 'PHASE: 3, NS: RED, EW: YELLOW'. If phase 3 and seconds >= 4, log 'PHASE: 0, NS: GREEN, EW: RED'. Write code to evaluate.",
      `const currentPhase = 0, secondsInPhase = 31, emergency = false;\nif (emergency) {\n  console.log("PHASE: 0, NS: GREEN, EW: RED");\n} else if (currentPhase === 0 && secondsInPhase >= 30) {\n  console.log("PHASE: 1, NS: YELLOW, EW: RED");\n} else if (currentPhase === 1 && secondsInPhase >= 4) {\n  console.log("PHASE: 2, NS: RED, EW: GREEN");\n} else if (currentPhase === 2 && secondsInPhase >= 25) {\n  console.log("PHASE: 3, NS: RED, EW: YELLOW");\n} else if (currentPhase === 3 && secondsInPhase >= 4) {\n  console.log("PHASE: 0, NS: GREEN, EW: RED");\n}`,
      "capstone-traffic-obj",
      "Transitions traffic phase accurately according to clearance intervals.",
      [
        "Check emergency first.",
        "Check currentPhase === 0 && secondsInPhase >= 30.",
        "Log exact phase string.",
      ],
      "Applied",
      `// Traffic light state transition logic\nconst currentPhase = 0, secondsInPhase = 31, emergency = false;\n\n// TODO: Implement transition check and log string\n`,
      [
        {
          id: "tc-traffic-yellow-trans",
          label: "Verifies transition to yellow clearance after 30s green",
          expectedStdout: "PHASE: 1, NS: YELLOW, EW: RED\n",
        },
        {
          id: "tc-traffic-ew-red",
          label: "Ensures opposing East-West traffic remains locked at Red",
          expectedStdout: "PHASE: 1, NS: YELLOW, EW: RED\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why must an autonomous traffic controller use a hardware watchdog timer (WDT)?",
      "If firmware hangs in an unexpected loop, opposing greens could be illuminated simultaneously without automatic reset, causing catastrophic collisions.",
    ),
  },

  // 6. Obstacle-Avoiding Micro-Rover with Ultrasonic Sensor
  {
    id: "capstone-obstacle-rover",
    order: 6,
    title: "Obstacle-Avoiding Ultrasonic Micro-Rover",
    summary: "Calculate ultrasonic time-of-flight distances and command avoidance steering.",
    type: "interactive-simulation",
    objectiveIds: ["capstone-rover-obj"],
    prerequisiteLessonIds: ["capstone-traffic-light"],
    estimatedDurationMinutes: 40,
    content: `# Obstacle-Avoiding Ultrasonic Micro-Rover

Autonomous mobile rovers must perceive unexpected obstructions in their path and execute dynamic path redirection to navigate cluttered environments without colliding.

### Ultrasonic Sensor Physics (HC-SR04)
1. **Trigger Pulse**:
   - Host microcontroller drives the \`Trig\` pin HIGH for $\\ge 10\\,\\mu\\text{s}$.
   - Module emits an 8-cycle ultrasonic burst at $40\\text{ kHz}$.
2. **Echo Pulse Duration**:
   - \`Echo\` pin transitions HIGH for the duration of acoustic flight:
     $$\\text{Distance} = \\frac{\\text{Time} \\times v_{\\text{sound}}}{2}$$
   - Speed of sound in ambient air at $20^\\circ\\text{C}$ is approximately:
     $$v_{\\text{sound}} = 343\\text{ m/s} = 0.0343\\text{ cm/}\\mu\\text{s} = \\frac{1}{29.15}\\text{ cm/}\\mu\\text{s}$$
   - Distance in centimeters from microsecond pulse width:
     $$d\\text{ [cm]} = \\frac{t_{\\text{echo}}\\,[\\mu\\text{s}]}{58.2}$$

### Reactive Obstacle Avoidance Strategy
- **$d > 25\\text{ cm}$**: Clear path $\\to$ Drive FORWARD at cruise speed.
- **$12\\text{ cm} \\le d \\le 25\\text{ cm}$**: Impending obstacle $\\to$ Decelerate, sweep radar servo left/right to evaluate clearest escape corridor, and execute a TURN.
- **$d < 12\\text{ cm}$**: Critical close hazard $\\to$ Stop immediately, REVERSE for $500\\text{ ms}$, then pivot $90^\\circ$.`,
    theorySections: [
      {
        id: "speed-of-sound-temp",
        title: "Acoustic Velocity Temperature Dependence",
        content: "Velocity of sound v ≈ 331.3 + 0.606 * T_c (m/s). For high-precision robotics operating outdoors across seasonal extremes (-10°C to +45°C), distance estimation must incorporate temperature compensation.",
      },
      {
        id: "ultrasonic-specular-reflection",
        title: "Acoustic Specular Reflection & Blind Spots",
        content: "If an obstacle surface is tilted at an incident angle greater than 45° to the sonic beam, the echo deflects away from the receiver transducer, causing the sensor to falsely report an infinitely clear path.",
      },
    ],
    codeExamples: [
      {
        title: "C HC-SR04 Ranging and Navigation Command",
        language: "c",
        code: `#include <stdio.h>
#include <math.h>

void navCommand(int echoPulseUs, int leftClearance, int rightClearance) {
    int distCm = (int)round(echoPulseUs / 58.2f);
    if (distCm > 25) {
        printf("DIST: %d cm, ACTION: FORWARD\\n", distCm);
    } else if (distCm < 12) {
        printf("DIST: %d cm, ACTION: REVERSE\\n", distCm);
    } else {
        if (leftClearance > rightClearance) printf("DIST: %d cm, ACTION: TURN_LEFT\\n", distCm);
        else printf("DIST: %d cm, ACTION: TURN_RIGHT\\n", distCm);
    }
}

int main(void) {
    navCommand(2000, 40, 20);
    return 0;
}`,
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Ultrasonic Rover Navigation Rig",
      description: "Inspect HC-SR04 sonar ping timing, obstacle distance thresholding, and servo radar sweep.",
      config: { mode: "arduino" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("DIST: 34 cm, ACTION: FORWARD\n"),
    exercise: exercise(
      "ex-capstone-obstacle-rover",
      "Ultrasonic Navigation Decider",
      "Given echoPulseUs = 2000, leftClearance = 40, and rightClearance = 20: compute distCm = Math.round(echoPulseUs / 58.2). If distCm > 25, log 'DIST: {distCm} cm, ACTION: FORWARD'. If distCm < 12, log 'DIST: {distCm} cm, ACTION: REVERSE'. If distCm between 12 and 25: log 'DIST: {distCm} cm, ACTION: TURN_LEFT' if leftClearance > rightClearance, else 'TURN_RIGHT'. Write the code.",
      `const echoPulseUs = 2000, leftClearance = 40, rightClearance = 20;\nconst distCm = Math.round(echoPulseUs / 58.2);\nif (distCm > 25) {\n  console.log(\`DIST: \${distCm} cm, ACTION: FORWARD\`);\n} else if (distCm < 12) {\n  console.log(\`DIST: \${distCm} cm, ACTION: REVERSE\`);\n} else if (leftClearance > rightClearance) {\n  console.log(\`DIST: \${distCm} cm, ACTION: TURN_LEFT\`);\n} else {\n  console.log(\`DIST: \${distCm} cm, ACTION: TURN_RIGHT\`);\n}`,
      "capstone-rover-obj",
      "Calculates distance and commands forward, reverse, or turning evasion.",
      [
        "Compute distCm using Math.round(echoPulseUs / 58.2).",
        "Check distCm > 25.",
        "Output formatted string with distance and action.",
      ],
      "Applied",
      `// Rover navigation decider\nconst echoPulseUs = 2000, leftClearance = 40, rightClearance = 20;\n\n// TODO: Compute distCm and log navigation decision\n`,
      [
        {
          id: "tc-rover-clear-forward",
          label: "Verifies forward cruise when 34cm clearance detected",
          expectedStdout: "DIST: 34 cm, ACTION: FORWARD\n",
        },
        {
          id: "tc-rover-ranging-math",
          label: "Confirms microsecond to centimeter conversion divisor 58.2",
          expectedStdout: "DIST: 34 cm, ACTION: FORWARD\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why must the HC-SR04 trigger pin be held HIGH for at least 10 microseconds?",
      "To signal the module's onboard microcontroller to emit the 8-cycle 40 kHz ultrasonic burst.",
    ),
  },
];

export const embeddedCapstonesModules: LearningModule[] = [
  moduleData(
    "mod-capstones-environmental",
    1,
    "Sensor & Environmental Stations",
    "Multi-channel analog telemetry acquisition, EEPROM logging, and JSON streaming.",
    embeddedCapstonesLessons.slice(0, 1),
  ),
  moduleData(
    "mod-capstones-home-automation",
    2,
    "Connected Automation & IoT",
    "PIR motion interrupts, relay drivers, flyback protection, and PWM mood lighting.",
    embeddedCapstonesLessons.slice(1, 2),
  ),
  moduleData(
    "mod-capstones-robotics",
    3,
    "Robotics & Motion Control",
    "Dual-sensor optical reflectance tracking and H-bridge differential steering.",
    embeddedCapstonesLessons.slice(2, 3),
  ),
  moduleData(
    "mod-capstones-security",
    4,
    "Security & Access Systems",
    "Keypad matrix scanning, PIN authentication, and brute-force lockout timers.",
    embeddedCapstonesLessons.slice(3, 4),
  ),
  moduleData(
    "mod-capstones-infrastructure",
    5,
    "Infrastructure & State Machines",
    "Multi-phase traffic controller timing, yellow clearance intervals, and emergency overrides.",
    embeddedCapstonesLessons.slice(4, 5),
  ),
  moduleData(
    "mod-capstones-autonomous",
    6,
    "Autonomous Mobile Systems",
    "Ultrasonic time-of-flight acoustic ranging and servo-assisted radar obstacle avoidance.",
    embeddedCapstonesLessons.slice(5, 6),
  ),
];

export const embeddedCapstonesPath: LearningCourse = {
  id: "embedded-capstone-projects",
  subjectId: embeddedCapstonesSubject.id,
  title: "Embedded Systems Capstone Projects",
  description: "Architect, wire, and firmware-implement 6 comprehensive industry-standard micro-controller capstones: automated weather station, smart appliance controller, autonomous line follower, digital keyless lock, 4-way traffic junction, and obstacle rover.",
  level: "Applied",
  prerequisites: ["arduino-embedded", "esp32-iot-systems"],
  objectives: embeddedCapstonesObjectives,
  learningOutcomes: [
    "Wire analog sensor dividers and log calibrated telemetry into non-volatile memory.",
    "Drive relays safely using NPN low-side transistors and inductive flyback suppression diodes.",
    "Implement autonomous differential steering algorithms using optical reflectance feedback.",
    "Design matrix keypad scanning routines and secure brute-force penalty lockouts.",
    "Build municipal traffic phase state machines with yellow interval dilemma-zone physics.",
    "Calculate time-of-flight acoustic distances and command reactive obstacle avoidance.",
  ],
  estimatedDurationMinutes: 240,
  publicationStatus: "published",
  modules: embeddedCapstonesModules,
};
