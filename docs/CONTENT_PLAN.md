# KATALYST Content Expansion & Technical Architecture Plan

**Author:** KATALYST Engineering Team  
**Date:** 2026-11-21  
**Target Audience:** Engineering students (EEE, ECE, CS) across India and global self-directed learners.  
**Platform Core Promise:** Hands-on embedded systems, circuit analysis, digital design, and systems programming in one browser tab with zero installation, zero external execution servers, and zero setup friction.

---

## 1. Inventory of Current State

### 1.1 Course & Lesson Inventory (Baseline)

| # | Course ID | Subject ID | Level | Baseline Modules | Baseline Lessons | Runtime / Primary Lab |
|---|---|---|---|---|---|---|
| 1 | `c-programming-foundations` | `c-programming` | Beginner | 6 | 16 | Browser WebAssembly C Runner (`clang`/`lld`/WASI) |
| 2 | `cpp-programming` | `cpp-programming` | Developing | 3 | 8 | C++17 (Compiler Run disabled, "Coming soon") |
| 3 | `python-programming-foundations` | `python-programming` | Beginner | 7 | 19 | Pyodide in Web Worker |
| 4 | `ai-app-web-dev` | `ai-app-web-dev` | Applied | 3 | 6 | JavaScript Worker / DOM Sandbox |
| 5 | `arduino-embedded` | `arduino-embedded` | Developing | 3 | 6 | Hardware Sketch Interpreter + Virtual Uno |
| 6 | `esp32-iot-systems` | `esp32-iot` | Developing | 3 | 6 | Hardware Sketch Interpreter + Virtual ESP32 |
| 7 | `breadboard-electronics` | `breadboard-electronics` | Beginner | 3 | 6 | Circuit Simulator (DC & RC modes) |
| 8 | `js-systems-algorithms` | `javascript-programming` | Developing | 4 | 10 | JavaScript Worker Runner |
| 9 | `sql-databases` | `sql-databases` | Beginner | 3 | 8 | SQLite (WASM / `sql.js`) |
| 10 | `html-css-web` | `html-css-web` | Beginner | 3 | 8 | In-browser iframe preview |
| 11 | `dsa-mastery` | `dsa-mastery` | Developing | 4 | 10 | JavaScript / C algorithm runners |
| 12 | `prompt-engineering` | `prompt-engineering` | Beginner | 3 | 6 | LLM System Simulator |
| 13 | `photo-editing-media` | `photo-editing-media` | Beginner | 3 | 6 | Canvas Image Lab Visualizer |
| 14 | `digital-logic-circuits` | `digital-circuits` | Beginner | 3 | 8 | Interactive Logic Gate Simulator |
| **Total** | **14 Courses** | — | — | **48 Modules** | **123 Lessons** | — |

---

## 2. Simulator & Hardware Engine Capability Matrix

### 2.1 Hardware Sketch Interpreter (`src/lib/hardware-sketch-interpreter.ts`)

| Subsystem / Peripheral | Supported in Baseline | Target Capability in Expansion | Test Verification Strategy |
|---|---|---|---|
| **Digital GPIO** | `pinMode`, `digitalWrite`, `digitalRead` (OUTPUT, INPUT, INPUT_PULLUP) | Retain & add pin change event logging | Unit test pin state array & edge transitions |
| **PWM Output** | `analogWrite` (0–255), `ledcWrite`, `ledcAttach` | Duty cycle tracking, multi-channel LEDC, frequency modeling | Unit tests verifying PWM duty percentage |
| **ADC Input** | `analogRead` (10-bit Uno 0–1023, 12-bit ESP32 0–4095) | Add noise filtering model, multi-sample averaging, voltage scaling | Unit test ADC linear translation & quantization |
| **Timing & Delay** | `delay`, `delayMicroseconds`, `millis` | Non-blocking delta timing, timer overflow math | Test deterministic elapsed time tracking |
| **Hardware Interrupts** | ❌ None | `attachInterrupt`, `detachInterrupt`, `digitalPinToInterrupt`, ISR callback dispatch on simulated button edge (RISING, FALLING, CHANGE) | Unit test ISR trigger on button press |
| **Tone & Buzzer** | ❌ None | `tone(pin, freq, duration)`, `noTone(pin)` with frequency registers and audio generation | Unit test frequency parsing and buzzer state |
| **Servo Motors** | ❌ None | `Servo` class (`attach`, `write`, `read`) with pulse-width (544–2400 µs) to angle (0–180°) mapping | Unit test angle-to-PWM transformation |
| **Stepper & DC Motor Drivers** | ❌ None | H-bridge logic (`IN1`, `IN2`, `ENA`) and Stepper 4-step sequence | Unit test full-step state progression |
| **I2C Protocol (`Wire`)** | ❌ None | `Wire.begin()`, `beginTransmission()`, `write()`, `endTransmission()`, `requestFrom()`, `read()` | Mock I2C transaction buffer & register reads |
| **I2C OLED & LCD** | ❌ None | `Adafruit_SSD1306` & `LiquidCrystal_I2C` commands (`setCursor`, `print`, `clear`) | Output buffer verification in simulated display state |
| **I2C Sensors** | ❌ None | Simulated BME280 / BMP280 temperature, pressure & humidity registers | Deterministic register telemetry tests |
| **SPI Protocol** | ❌ None | `SPI.begin()`, `transfer(byte)` | Mock SPI transaction byte exchange |
| **EEPROM / NVS** | ❌ None | `EEPROM.read(addr)`, `EEPROM.write(addr, val)`, `commit()` | In-memory 1 KB simulated non-volatile storage |
| **ESP32 FreeRTOS** | ❌ None | `xTaskCreatePinnedToCore`, `vTaskDelay`, `xQueueCreate`, `xQueueSend`, `xQueueReceive` | Dual-task interleaving unit tests |
| **ESP32 Deep Sleep** | ❌ None | `esp_deep_sleep_start()`, `esp_sleep_enable_timer_wakeup()` | Wakeup cause and cycle counter assertions |
| **Wi-Fi & MQTT Client** | ❌ None | In-memory simulated MQTT/HTTP client (`WiFi.begin`, `client.publish`, `client.subscribe`) | Verified message publishing queue |

---

### 2.2 Circuit & Electronics Simulator (`src/components/simulators/circuit-simulator.tsx`)

| Laboratory Surface | Supported in Baseline | Expansion Capabilities | UI / Studio Interface |
|---|---|---|---|
| **Digital Logic Gates** | Basic 2-input AND, OR, NOT, NAND, NOR, XOR truth table | Multi-input gates, interactive truth table with timing diagrams | Logic Studio panel with gate schematics |
| **Karnaugh Map (K-Map)** | ❌ None | Interactive 2, 3, and 4-variable K-Map solver with minterm selection, prime implicant loop visualizer, and minimal SOP boolean equation generator | Visual K-Map Grid with grouped loop highlights |
| **Sequential Logic & Flip-Flops** | ❌ None | SR Latch, D Flip-Flop, JK Flip-Flop, and T Flip-Flop with interactive clock pulse toggle, timing waveforms, and characteristic equations | Interactive clock generator and timing viewer |
| **Binary Counters & Registers** | ❌ None | 4-bit asynchronous ripple counter, synchronous decade counter (7490/mod-10), 4-bit shift register with LED visualization | LED state indicators and clock stepping |
| **Finite State Machine (FSM)** | ❌ None | Interactive state transition visualizer (Traffic light, sequence detector 1011), state diagram, transition table | Visual node-and-arrow state diagram |
| **Simple 8-Bit Toy CPU** | ❌ None | Accumulator-based 8-bit CPU with Program Counter (PC), Accumulator (ACC), Instruction Register (IR), Flags (Zero, Carry), and live instruction step-through | Register view, memory dump, instruction step controls |
| **Analog DC Ohm's Law** | Basic V, R, C sliders and power calculation | Resistor color code calculator, series and parallel resistance solver | Circuit schematic with live current and node voltage badges |
| **Kirchhoff's Laws (KVL & KCL)** | ❌ None | Two-mesh DC network with mesh equations, branch currents, and node voltages | Interactive mesh circuit with meter points |
| **Thevenin & Norton Equivalents** | ❌ None | Interactive load resistor sweep, $V_{th}$, $R_{th}$, $I_N$, and Maximum Power Transfer theorem ($R_L = R_{th}$) curve | Plot of power vs. load resistance |
| **RLC Transients & Damping** | RC charge curve only | Series RLC step response: Overdamped ($\zeta > 1$), Critically Damped ($\zeta = 1$), and Underdamped ($\zeta < 1$) oscillation | Dynamic SVG waveform showing ringing and decay envelope |
| **Diodes & Rectification** | ❌ None | Silicon diode IV forward curve ($V_f \approx 0.7\text{ V}$), Half-wave & Full-wave bridge rectifier with filter capacitor ripple | Input AC sine wave vs. filtered DC output overlay |
| **Transistors (BJT & MOSFET)** | ❌ None | NPN BJT switch (Cutoff, Active, Saturation), base drive current, and MOSFET gate threshold $V_{GS(th)}$ | Switch operation status, load current indicator |
| **Operational Amplifiers (Op-Amps)** | ❌ None | Inverting ($G = -R_f/R_{in}$), Non-inverting ($G = 1 + R_f/R_{in}$), Comparator with reference threshold, and Summing amplifier | Dual-trace oscilloscope with input and output waveforms |
| **Passive Filters** | ❌ None | 1st order Low-Pass and High-Pass RC filters with cutoff frequency $f_c = \frac{1}{2\pi R C}$ and Bode frequency response plot | Frequency response magnitude plot |
| **Virtual Dual-Trace Oscilloscope** | ❌ None | Dual-trace oscilloscope display with Time/Div, Volts/Div, Channel A (Input), Channel B (Output), and trigger controls | Professional dark-theme CRT/digital oscilloscope UI |

---

### 2.3 Algorithms, Control & Systems Studios

| Studio / Visualizer | Capabilities | Application |
|---|---|---|
| **DSA Algorithm Visualizer** | Interactive visual step-through for Arrays, Singly/Doubly Linked Lists, Stacks, Queues, Binary Search Trees, and Sorting (Bubble, Selection, Insertion, Merge Sort) | `dsa-mastery` and C placement preparation |
| **PID Controller Simulator** | Live plant simulator (DC motor speed / temperature control) with Setpoint, $K_p$, $K_i$, $K_d$ sliders, disturbance injector, and real-time step response plot | Control and Signals track |
| **Signal Sampling & FFT Studio** | Continuous signal generator, sample-and-hold at variable sampling frequency $f_s$, Nyquist-Shannon aliasing demonstration, and live FFT magnitude spectrum | Signals & Systems and DSP tracks |
| **GATE & Career Exam Suite** | Multi-topic exam engine covering EEE, ECE, CS with step-by-step mathematical solutions and instant feedback | Exam and career readiness |
| **Daily Engineering Challenge** | Continuous daily technical puzzle with streak counter stored in `katalyst.daily_challenge.v1` | Daily learner habit loop |

---

## 3. Curriculum Expansion Catalog & New Courses

### 3.1 Course Expansion Metrics

1. **Course 1: `c-programming-foundations`** (16 $\to$ 22 lessons, +37.5%)
   - Adds Module 7: Systems & Defensive C Programming
   - Lessons: Call stack & recursion, file I/O error handling, bitwise flags & hardware registers, dynamic arrays & realloc, function pointer dispatch tables, defensive programming & assertions.
2. **Course 2: `cpp-programming`** (8 lessons, C++ Run disabled with "Coming Soon" notice; moved below active tracks in Explore lists).
3. **Course 3: `python-programming-foundations`** (19 $\to$ 25 lessons, +31.6%)
   - Adds Module 8: Pythonic Architecture & Advanced Constructs
   - Lessons: Generators & `yield`, Context managers & `with`, Function decorators, OOP inheritance & polymorphism, Regular expressions, Unit testing with `unittest`.
4. **Course 4: `arduino-embedded`** (6 $\to$ 12 lessons, +100%)
   - Adds Module 4: Hardware Timers, Interrupts & Actuators
   - Adds Module 5: Communication Buses & Displays
   - Lessons: Hardware interrupts & debounce, non-blocking `millis()`, PWM frequency & tone generation, I2C LCD/OLED sensor dashboard, Servo motor precision sweep, Multi-sensor line follower controller.
5. **Course 5: `esp32-iot-systems`** (6 $\to$ 12 lessons, +100%)
   - Adds Module 4: Multitasking with FreeRTOS
   - Adds Module 5: Low-Power Modes & IoT Telemetry
   - Lessons: Dual-core FreeRTOS task pinning, FreeRTOS queue communication, ADC non-linearity & multi-sampling, ESP32 deep sleep & timer wakeup, Simulated MQTT telemetry publishing, Smart environmental station capstone.
6. **Course 6: `breadboard-electronics`** (6 $\to$ 10 lessons, +66.7%)
   - Adds Module 4: Active Semiconductor Prototyping
   - Lessons: Voltage dividers under load, Diode rectifiers & filter capacitors, BJT transistor as a digital switch, 555 timer pulse generator circuit.
7. **Course 7: `digital-logic-circuits`** (8 $\to$ 14 lessons, +75%)
   - Adds Module 4: Combinational Minimization with K-Maps
   - Adds Module 5: Sequential Circuits & Finite State Machines
   - Lessons: 3-Variable K-Map simplification, 4-Variable K-Map grouping, SR & D flip-flop storage, JK flip-flop & toggle mode, 4-bit asynchronous ripple counter, Finite State Machine design (sequence detector).
8. **Course 8: `dsa-mastery`** (10 $\to$ 16 lessons, +60%)
   - Adds Module 5: Advanced Non-Linear Structures & Algorithmic Paradigms
   - Lessons: Doubly linked lists & sentinels, Circular queues & ring buffers, Binary Search Tree insertion & traversals, Binary heap & priority queue, Merge sort divide-and-conquer, Dijkstra's shortest path fundamentals.
9. **Course 9: `js-systems-algorithms`** (10 $\to$ 14 lessons, +40%)
   - Adds Module 5: Asynchronous Systems & Binary Data
   - Lessons: Event loop microtasks vs macrotasks, Web Workers & multithreaded messaging, Stream pipelines & transformations, TypedArrays & ArrayBuffers.
10. **Course 10: `sql-databases`** (8 $\to$ 12 lessons, +50%)
    - Adds Module 4: Advanced Relational Queries & Optimization
    - Lessons: Multi-table `LEFT`/`RIGHT`/`FULL` outer joins, Subqueries & Common Table Expressions (CTEs), Index structures & query explain plans, Database transactions & ACID properties.
11. **Course 11: `html-css-web`** (8 $\to$ 12 lessons, +50%)
    - Adds Module 4: Modern Web Layout & Performance Architecture
    - Lessons: CSS Grid two-dimensional layouts, Custom CSS properties & dark/light theming, Web accessibility (ARIA & semantics), CSS transform & keyframe animation performance.
12. **Course 12: `ai-app-web-dev`** (6 $\to$ 9 lessons, +50%)
    - Adds Module 4: Production AI System Engineering
    - Lessons: Structured JSON extraction & Zod validation, Client-side vector cosine similarity embeddings, Resilient streaming & offline fallback caching.
13. **Course 13: `prompt-engineering`** (6 $\to$ 8 lessons, +33.3%)
    - Adds Chain-of-thought mathematical reasoning, System prompt defenses against prompt injection.
14. **Course 14: `photo-editing-media`** (6 $\to$ 8 lessons, +33.3%)
    - Adds 2D spatial convolution edge detection kernels, Histogram equalization & contrast stretching.

---

### 3.2 New Flagship Courses (Stages 4–7)

15. **Course 15: `circuits-eee-core`** (10 lessons)
    - Subject: `Electrical Engineering Core`
    - Level: Applied
    - Modules: DC Circuit Theorems, AC Transients & Resonance, Operational Amplifiers & Filters
    - Labs: KVL/KCL Node Solver, Thevenin/Norton Equivalent visualizer, RLC Ringing Simulator, Active Op-Amp Filter Lab with Dual-Trace Virtual Oscilloscope.
16. **Course 16: `control-and-signals`** (8 lessons)
    - Subject: `Signals, Systems & Control`
    - Level: Applied
    - Modules: Continuous & Discrete Signals, Feedback Control & PID Tuning
    - Labs: Nyquist-Shannon Sampling & Aliasing Lab, Interactive PID Controller Simulator, FFT Frequency Spectrum Analyzer.
17. **Course 17: `embedded-capstone-projects`** (6 comprehensive projects)
    - Subject: `Hands-on Embedded Engineering`
    - Level: Applied
    - Projects: Automated Weather Station & Data Logger, Smart Home Lighting & Appliance Controller, Autonomous Two-Sensor Line Follower, Digital Combination Door Lock, Four-Way Smart Traffic Light Junction, Obstacle-Avoiding Micro-Rover.
18. **Course 18: `creative-engineering-lab`** (6 lessons)
    - Subject: `Creative Engineering & Puzzles`
    - Level: Beginner / Developing
    - Projects: Piezoelectric 8-Bit Melody Player (Web Audio triggered on user gesture), Optical Morse Code Transmitter, In-Browser Terminal Snake in C, Reverse-Engineering Circuit Bug Hunt, Microcontroller Assembly Code Puzzle, Logic Gate Maze.
19. **Course 19: `engineering-career-prep`** (8 lessons)
    - Subject: `Engineering Career & GATE Practice`
    - Level: Applied
    - Tracks: GATE Electrical & Electronics Core, GATE Computer Science Core, Core Embedded Systems Hardware Interview Questions, High-Yield Formula & Concept Review with auto-checking quizzes.

---

## 4. Technical Constraints & Security Assurances

1. **Security & CSP**:
   - Zero `'unsafe-eval'` or `'unsafe-inline'` script additions.
   - Preserves per-request nonce CSP and strict dynamic headers.
   - All audio synthesis in creative tracks strictly respects browser autoplay policies by requiring a user gesture before starting audio context.
2. **Local Storage & State**:
   - Existing keys (`katalyst.workspace.v1`, `katalyst.learning.v1`, `katalyst.user_preferences.v1`) remain completely untouched.
   - Daily challenge streak uses dedicated isolated key `katalyst.daily_challenge.v1`.
3. **No External Servers**:
   - All compilation, simulation, and verification runs strictly in the browser tab via Web Workers and WebAssembly.
4. **Performance & Lazy Loading**:
   - High-overhead visualizers (Oscilloscope, K-Map, FSM, CPU, PID, DSA Visualizer) are dynamically imported React client components loaded only when their specific interactive demo is opened.

---

## 5. Execution Order & Stage Gates

- **Stage 1**: C++ "Coming Soon" badge and repositioning below working tracks in Explore/Paths lists.
- **Stage 2**: Deepen existing 14 courses by 30–60% with complete lessons, worked examples, common mistakes, and checkpoint quizzes.
- **Stage 3**: Advanced Arduino Uno and ESP32 expansion with timers, interrupts, I2C/SPI, displays, motors, FreeRTOS tasks, simulated MQTT, and capstone labs.
- **Stage 4**: Circuits, EEE core, and Digital Design expansion with K-Maps, Flip-Flops, Counters, FSM, CPU simulator, Op-Amps, RLC transients, and virtual Oscilloscope.
- **Stage 5**: DSA in C, Tools, Control Systems and Signals (DSA Visualizer, PID simulator, Sampling/FFT lab).
- **Stage 6**: Real-world capstone projects and Creative Engineering tracks (Audio buzzer songs, Morse code, Terminal snake, hardware puzzles).
- **Stage 7**: GATE / PSU career practice mode and Daily Engineering Challenge with streak tracking.
- **Stage 8**: Final QA verification (sitemap sync, client JS budget verification, responsive layout audits at 390 px and 1440 px, and `docs/CONTENT_REVIEW.md`).

Every stage gate automatically executes:
```sh
npm run lint && npm run typecheck && npm test && KATALYST_E2E_PRODUCTION=true npx playwright test e2e/c-runner-security.spec.ts e2e/c-execution.spec.ts e2e/workspace.spec.ts:71 && npm run build
```
Once verified, the stage is committed to `content-expansion` with an entry logged to `CHANGELOG.md`.
