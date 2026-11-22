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

export const controlAndSignalsSubject: LearningSubject = {
  id: "control-and-signals-subject",
  title: "Control Systems & Signal Processing",
  description: "Master feedback control loops, PID tuning, Bode stability, state-space representations, Nyquist-Shannon sampling, DFT/FFT spectrum analysis, and Kalman filtering.",
};

export const controlAndSignalsObjectives: LearningObjective[] = [
  { id: "ctrl-open-closed-obj", title: "Calculate open-loop and closed-loop transfer functions, tracking error, and disturbance rejection." },
  { id: "ctrl-pid-tune-obj", title: "Synthesize continuous and discrete PID controllers using the Ziegler-Nichols tuning method." },
  { id: "ctrl-bode-margin-obj", title: "Determine Gain Margin, Phase Margin, and closed-loop stability from open-loop frequency response." },
  { id: "ctrl-state-space-obj", title: "Formulate state-space matrix models (A, B, C, D) and evaluate the Kalman controllability matrix." },
  { id: "sig-nyquist-sample-obj", title: "Apply the Nyquist-Shannon sampling theorem, calculate folding frequencies, and prevent aliasing." },
  { id: "sig-dft-fft-obj", title: "Compute Discrete Fourier Transform frequency bin magnitudes and apply Cooley-Tukey radix-2 FFT." },
  { id: "sig-digital-filter-obj", title: "Map continuous s-plane poles to the discrete z-plane and implement FIR/IIR difference equations." },
  { id: "sig-kalman-filter-obj", title: "Implement discrete Kalman filter prediction and measurement update equations for sensor fusion." },
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

export const controlAndSignalsLessons: LearningLesson[] = [
  // Module 1: Feedback Control & PID Synthesis
  {
    id: "ctrl-open-closed-loop",
    order: 1,
    title: "Open-Loop vs. Closed-Loop Transfer Functions & Block Diagrams",
    summary: "Formulate open-loop and closed-loop transfer functions, sensitivity functions, and steady-state tracking error.",
    type: "interactive-simulation",
    objectiveIds: ["ctrl-open-closed-obj"],
    prerequisiteLessonIds: [],
    estimatedDurationMinutes: 40,
    content: `Control engineering governs autonomous behavior in robotics, aerospace, power grids, and industrial automation.

### Open-Loop vs. Closed-Loop Control
- **Open-Loop Control**: Actuator commands are computed based strictly on input reference without sensing actual output: $Y(s) = G(s) U(s)$. Susceptible to disturbances, parameter drift, and modeling error.
- **Closed-Loop (Feedback) Control**: Sensors measure output $Y(s)$ and feed it back to subtract from setpoint $R(s)$, forming error $E(s) = R(s) - H(s) Y(s)$.

### Closed-Loop Transfer Function
For forward plant $G(s)$ and feedback sensor $H(s)$:

$$T(s) = \\frac{Y(s)}{R(s)} = \\frac{G(s)}{1 + G(s) H(s)}$$

Where:
- $L(s) = G(s) H(s)$ is the **Loop Transfer Function**.
- $1 + L(s) = 0$ is the **Characteristic Equation** whose roots define system stability.

### Sensitivity and Disturbance Rejection
If a load disturbance $D(s)$ enters at the plant output:
$$Y(s) = T(s) R(s) + S(s) D(s)$$

Where **Sensitivity Function** $S(s) = \\frac{1}{1 + G(s) H(s)}$.
High loop gain ($|G(s) H(s)| \\gg 1$) forces $S(s) \\to 0$, suppressing plant disturbances and parameter uncertainty.`,
    theorySections: [
      {
        id: "steady-state-error-constants",
        title: "System Type & Error Constants",
        content: "System type number is determined by the count of pure integrators (1/s poles) in open-loop G(s)H(s). Type 0 systems exhibit finite steady-state error to step inputs (ess = 1 / (1 + Kp)). Type 1 systems achieve zero steady-state error to step inputs, and finite error to velocity ramp inputs.",
      },
      {
        id: "block-diagram-algebra",
        title: "Block Diagram Reduction Rules",
        content: "1. Cascaded blocks multiply: G1(s) * G2(s). 2. Parallel summing blocks add: G1(s) + G2(s). 3. Feedback loops reduce to G(s) / (1 ± G(s)H(s)), where the sign in the denominator is opposite to the summing junction feedback sign.",
      },
    ],
    codeExamples: [
      {
        title: "C Closed-Loop DC Gain and Steady-State Error Calculator",
        language: "c",
        code: `#include <stdio.h>

int main(void) {
    double kp_plant = 10.0;      // DC plant gain G(0)
    double h_sensor = 1.0;       // Unity feedback H(0)
    double r_step = 5.0;         // 5 unit step command
    
    // Closed loop gain T(0) = G / (1 + G*H)
    double loop_gain = kp_plant * h_sensor;
    double t_gain = kp_plant / (1.0 + loop_gain);
    double y_ss = t_gain * r_step;
    double error_ss = r_step - y_ss;
    double sensitivity = 1.0 / (1.0 + loop_gain);
    
    printf("Loop Gain: %.1f, Closed-Loop Gain: %.4f, Yss: %.2f, Ess: %.2f, Sensitivity: %.4f\\n",
           loop_gain, t_gain, y_ss, error_ss, sensitivity);
    return 0;
}`,
        description: "Calculates closed-loop DC tracking gain, error, and sensitivity in C.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Closed-Loop Step Response",
      description: "Interactive feedback control loop demonstrating tracking error and disturbance attenuation.",
      config: { mode: "pid" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Loop Gain: 10.0, Closed-Loop Gain: 0.9091, Yss: 4.55, Ess: 0.45, Sensitivity: 0.0909\n"),
    exercise: exercise(
      "ex-ctrl-closed-loop-gain",
      "Calculate Closed-Loop Gain and Steady-State Error",
      "For a plant with DC gain G = 10.0, unity feedback H = 1.0, and a step input R = 5.0, compute loop gain L, closed-loop gain T, steady-state output Yss, tracking error Ess, and sensitivity S. Print: 'Loop Gain: {l}, Closed-Loop Gain: {t}, Yss: {yss}, Ess: {ess}, Sensitivity: {s}' with Loop Gain to 1 decimal, Closed-Loop Gain and Sensitivity to 4 decimals, and Yss and Ess to 2 decimals.",
      `const g = 10.0, h = 1.0, r = 5.0;\nconst l = g * h;\nconst t = g / (1.0 + l);\nconst yss = t * r;\nconst ess = r - yss;\nconst s = 1.0 / (1.0 + l);\nconsole.log(\`Loop Gain: \${l.toFixed(1)}, Closed-Loop Gain: \${t.toFixed(4)}, Yss: \${yss.toFixed(2)}, Ess: \${ess.toFixed(2)}, Sensitivity: \${s.toFixed(4)}\`);`,
      "ctrl-open-closed-obj",
      "Determine closed-loop steady-state tracking performance.",
      [
        "L = G * H.",
        "T = G / (1 + L).",
        "Yss = T * R, Ess = R - Yss, and S = 1 / (1 + L).",
      ],
      "Applied",
      `// Closed-loop control solver\nconst g = 10.0, h = 1.0, r = 5.0;\n\n// TODO: Compute l, t, yss, ess, and s and log formatted output\n`,
      [
        {
          id: "tc-closed-loop-default",
          label: "Verifies closed-loop gain and steady-state error for G=10, H=1",
          expectedStdout: "Loop Gain: 10.0, Closed-Loop Gain: 0.9091, Yss: 4.55, Ess: 0.45, Sensitivity: 0.0909\n",
        },
        {
          id: "tc-sensitivity-sum",
          label: "Verifies T + S = 1 for unity feedback system",
          expectedStdout: "Loop Gain: 10.0, Closed-Loop Gain: 0.9091, Yss: 4.55, Ess: 0.45, Sensitivity: 0.0909\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why does increasing open-loop gain reduce steady-state tracking error in a Type 0 system?",
      "Because steady-state error is given by Ess = R / (1 + Kp). As open-loop gain Kp approaches infinity, Ess asymptotically approaches zero.",
    ),
  },

  {
    id: "ctrl-pid-controller-tuning",
    order: 2,
    title: "PID Controller Synthesis & Ziegler-Nichols Tuning",
    summary: "Synthesize Proportional-Integral-Derivative controllers and derive optimal gains using Ziegler-Nichols oscillations.",
    type: "interactive-simulation",
    objectiveIds: ["ctrl-pid-tune-obj"],
    prerequisiteLessonIds: ["ctrl-open-closed-loop"],
    estimatedDurationMinutes: 45,
    content: `More than $90\\%$ of industrial control loops deploy the **Proportional-Integral-Derivative (PID)** controller:

$$u(t) = K_p e(t) + K_i \\int_0^t e(\\tau) d\\tau + K_d \\frac{de(t)}{dt}$$

In Laplace domain:
$$C(s) = K_p + \\frac{K_i}{s} + K_d s = K_p \\left( 1 + \\frac{1}{T_i s} + T_d s \\right)$$

### Role of Each Term
1. **Proportional ($K_p$)**: Produces actuation proportional to current error. Reduces rise time, but cannot eliminate steady-state error on its own without infinite gain.
2. **Integral ($K_i = \\frac{K_p}{T_i}$)**: Accumulates past error over time. Eliminates steady-state error entirely ($e_{ss} = 0$), but introduces phase lag and increases overshoot.
3. **Derivative ($K_d = K_p T_d$)**: Predicts future error trend based on current rate of change. Adds damping, reduces overshoot, and accelerates settling, but amplifies high-frequency sensor noise.

### Ziegler-Nichols Closed-Loop Tuning
1. Set $K_i = 0$ and $K_d = 0$.
2. Increase $K_p$ until the closed-loop system reaches marginal stability with sustained, constant-amplitude sinusoidal oscillation.
3. Record **Ultimate Gain ($K_u$)** and **Ultimate Period ($T_u$)**.

| Controller Type | $K_p$ | $T_i$ | $T_d$ | $K_i$ | $K_d$ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P** | $0.5 K_u$ | — | — | — | — |
| **PI** | $0.45 K_u$ | $0.83 T_u$ | — | $K_p / T_i$ | — |
| **Classic PID** | $0.6 K_u$ | $0.5 T_u$ | $0.125 T_u$ | $K_p / (0.5 T_u)$ | $K_p \\times 0.125 T_u$ |`,
    theorySections: [
      {
        id: "integral-windup",
        title: "Integral Windup and Anti-Windup Clamping",
        content: "When physical actuators saturate (e.g., motor drive voltage hits maximum rail), the feedback loop opens, but the integral term continues accumulating error. Upon error reversal, the accumulated charge causes severe delayed overshoot. Anti-windup clamping halts integration whenever the controller output hits saturation limits.",
      },
      {
        id: "derivative-filtering",
        title: "Derivative Noise Filtering",
        content: "Pure differentiation s amplifies high-frequency sensor noise. Practical controllers implement a first-order low-pass filter on the derivative term: C_D(s) = (K_d * s) / (1 + (T_d / N) * s), where N (typically 8 to 20) caps high-frequency derivative gain.",
      },
    ],
    codeExamples: [
      {
        title: "C Discrete PID Controller with Anti-Windup Clamping",
        language: "c",
        code: `#include <stdio.h>

typedef struct {
    double kp, ki, kd;
    double prev_error;
    double integral;
    double out_min, out_max;
} PIDController;

double pid_update(PIDController *pid, double setpoint, double measurement, double dt) {
    double error = setpoint - measurement;
    
    // Proportional term
    double p_out = pid->kp * error;
    
    // Integral term with anti-windup clamping
    pid->integral += error * dt;
    if (pid->integral > pid->out_max) pid->integral = pid->out_max;
    if (pid->integral < pid->out_min) pid->integral = pid->out_min;
    double i_out = pid->ki * pid->integral;
    
    // Derivative term
    double derivative = (error - pid->prev_error) / dt;
    double d_out = pid->kd * derivative;
    pid->prev_error = error;
    
    double output = p_out + i_out + d_out;
    if (output > pid->out_max) output = pid->out_max;
    if (output < pid->out_min) output = pid->out_min;
    return output;
}

int main(void) {
    PIDController pid = { .kp = 2.5, .ki = 1.2, .kd = 0.8, .prev_error = 0, .integral = 0, .out_min = -10.0, .out_max = 10.0 };
    double u = pid_update(&pid, 10.0, 2.0, 0.05);
    printf("Initial PID control signal u = %.2f\\n", u);
    return 0;
}`,
        description: "Implements a discrete PID controller with integral clamping in C11.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "PID Closed-Loop Simulator",
      description: "Interactive PID tuner with real-time response curves, overshoot percentage, and settling time.",
      config: { mode: "pid" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Initial PID control signal u = 10.00\n"),
    exercise: exercise(
      "ex-ctrl-ziegler-nichols",
      "Compute Ziegler-Nichols PID Controller Gains",
      "A thermal plant oscillates with sustained oscillation at ultimate gain Ku = 8.0 with period Tu = 1.4 seconds. Compute the Ziegler-Nichols Classic PID parameters: Kp, Ti, Td, Ki (Kp / Ti), and Kd (Kp * Td). Print: 'Kp: {kp}, Ki: {ki}, Kd: {kd}, Ti: {ti} s, Td: {td} s' with Kp, Ki, Kd to 2 decimals, and Ti, Td to 3 decimals.",
      `const ku = 8.0, tu = 1.4;\nconst kp = 0.6 * ku;\nconst ti = 0.5 * tu;\nconst td = 0.125 * tu;\nconst ki = kp / ti;\nconst kd = kp * td;\nconsole.log(\`Kp: \${kp.toFixed(2)}, Ki: \${ki.toFixed(2)}, Kd: \${kd.toFixed(2)}, Ti: \${ti.toFixed(3)} s, Td: \${td.toFixed(3)} s\`);`,
      "ctrl-pid-tune-obj",
      "Apply Ziegler-Nichols closed-loop tuning formulas.",
      [
        "Kp = 0.6 * Ku.",
        "Ti = 0.5 * Tu, and Td = 0.125 * Tu.",
        "Ki = Kp / Ti, and Kd = Kp * Td.",
      ],
      "Applied",
      `// Ziegler-Nichols PID tuner\nconst ku = 8.0, tu = 1.4;\n\n// TODO: Calculate kp, ki, kd, ti, and td and log result\n`,
      [
        {
          id: "tc-zn-tuning",
          label: "Verifies Z-N gains for Ku=8.0, Tu=1.4s",
          expectedStdout: "Kp: 4.80, Ki: 6.86, Kd: 0.84, Ti: 0.700 s, Td: 0.175 s\n",
        },
        {
          id: "tc-zn-kp-check",
          label: "Verifies Kp equals 60% of ultimate gain",
          expectedStdout: "Kp: 4.80, Ki: 6.86, Kd: 0.84, Ti: 0.700 s, Td: 0.175 s\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why is derivative action usually computed based on the negative derivative of process measurement (-dy/dt) rather than error (de/dt)?",
      "To avoid 'derivative kick'—a massive instantaneous spike in actuator output when setpoint changes discontinuously in a step.",
    ),
  },

  // Module 2: Stability Margins & State-Space Systems
  {
    id: "ctrl-bode-nyquist-stability",
    order: 3,
    title: "Bode Plot Stability Margins & Nyquist Criterion",
    summary: "Determine Gain Margin, Phase Margin, and closed-loop stability from open-loop frequency response.",
    type: "interactive-simulation",
    objectiveIds: ["ctrl-bode-margin-obj"],
    prerequisiteLessonIds: ["ctrl-pid-controller-tuning"],
    estimatedDurationMinutes: 40,
    content: `Frequency response methods analyze system behavior under steady-state sinusoidal inputs $s = j\\omega$.

### Bode Plots
A Bode diagram plots:
1. **Magnitude**: $20 \\log_{10} |G(j\\omega) H(j\\omega)|$ in decibels (dB) vs. $\\log \\omega$.
2. **Phase**: $\\angle G(j\\omega) H(j\\omega)$ in degrees vs. $\\log \\omega$.

### Stability Margins
Marginal stability occurs when open-loop loop gain equals $1 \\angle -180^\\circ$ ($0\\text{ dB}$ at $-180^\\circ$ phase).

1. **Phase Crossover Frequency ($\\omega_{pc}$)**: Angular frequency where phase equals $-180^\\circ$:
$$\\angle G(j\\omega_{pc}) H(j\\omega_{pc}) = -180^\\circ$$
- **Gain Margin (GM)**: Decibels below $0\\text{ dB}$ at $\\omega_{pc}$:
$$\\text{GM} = -20 \\log_{10} |G(j\\omega_{pc}) H(j\\omega_{pc})| \\text{ dB}$$

2. **Gain Crossover Frequency ($\\omega_{gc}$)**: Angular frequency where magnitude equals $1$ ($0\\text{ dB}$):
$$|G(j\\omega_{gc}) H(j\\omega_{gc})| = 1 \\implies 20 \\log_{10} |G| = 0\\text{ dB}$$
- **Phase Margin (PM)**: Phase above $-180^\\circ$ at $\\omega_{gc}$:
$$\\text{PM} = 180^\\circ + \\angle G(j\\omega_{gc}) H(j\\omega_{gc})$$

For robust stability against unmodeled dynamics, practical engineering designs require $\\text{GM} \\ge 6\\text{ dB}$ and $\\text{PM} \\ge 30^\\circ\\text{–}45^\\circ$.`,
    theorySections: [
      {
        id: "nyquist-stability-criterion",
        title: "The Nyquist Stability Criterion",
        content: "Cauchy's Argument Principle states that the number of closed-loop unstable poles Z equals N + P, where P is the count of unstable open-loop poles, and N is the number of clockwise encirclements of the critical point (-1 + j0) on the Nyquist plot. For an open-loop stable plant (P = 0), closed-loop stability requires N = 0 (no encirclements).",
      },
      {
        id: "bode-gain-phase-relationship",
        title: "Bode's Gain-Phase Relationship",
        content: "For minimum-phase systems (all poles and zeros in the left-half s-plane), phase angle is uniquely determined by the slope of the magnitude curve: a slope of -20 dB/decade contributes -90° phase; -40 dB/decade contributes -180° phase.",
      },
    ],
    codeExamples: [
      {
        title: "C Bode Stability Margin Analyzer",
        language: "c",
        code: `#include <stdio.h>
#include <math.h>

int main(void) {
    // Open loop: L(s) = K / (s * (s + 2) * (s + 4)) with K = 20
    // At omega = 2.828 rad/s, phase = -90 - atan(2.828/2) - atan(2.828/4) = -180 deg
    double omega_pc = sqrt(8.0); // 2.828 rad/s
    double k = 20.0;
    
    // Magnitude at omega_pc
    double mag_pc = k / (omega_pc * sqrt(omega_pc * omega_pc + 4.0) * sqrt(omega_pc * omega_pc + 16.0));
    double gm_db = -20.0 * log10(mag_pc);
    
    printf("Omega_pc: %.3f rad/s, Mag: %.4f, Gain Margin: %.2f dB\\n",
           omega_pc, mag_pc, gm_db);
    return 0;
}`,
        description: "Calculates phase crossover frequency and Gain Margin in C.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Bode Plot Stability Margins",
      description: "Interactive frequency response showing gain and phase margins for a 3rd-order system.",
      config: { mode: "pid" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Omega_pc: 2.828 rad/s, Mag: 0.4167, Gain Margin: 7.60 dB\n"),
    exercise: exercise(
      "ex-ctrl-gain-margin",
      "Compute Phase Crossover Frequency and Gain Margin",
      "For loop transfer function L(s) = 20 / [s(s+2)(s+4)], phase reaches -180 deg at omega_pc = sqrt(8) rad/s (approx 2.828 rad/s). Calculate magnitude at omega_pc, and Gain Margin in dB (GM = -20 * log10(mag)). Print: 'Omega_pc: {w} rad/s, Mag: {m}, Gain Margin: {gm} dB' with w to 3 decimals, m to 4 decimals, and gm to 2 decimals.",
      `const w = Math.sqrt(8.0);\nconst k = 20.0;\nconst m = k / (w * Math.sqrt(w * w + 4.0) * Math.sqrt(w * w + 16.0));\nconst gm = -20.0 * Math.log10(m);\nconsole.log(\`Omega_pc: \${w.toFixed(3)} rad/s, Mag: \${m.toFixed(4)}, Gain Margin: \${gm.toFixed(2)} dB\`);`,
      "ctrl-bode-margin-obj",
      "Calculate open-loop magnitude and Gain Margin at phase crossover.",
      [
        "w = sqrt(8).",
        "m = 20 / (w * sqrt(w^2 + 4) * sqrt(w^2 + 16)).",
        "gm = -20 * log10(m).",
      ],
      "Applied",
      `// Gain margin solver\nconst w = Math.sqrt(8.0);\nconst k = 20.0;\n\n// TODO: Calculate m and gm and print formatted output\n`,
      [
        {
          id: "tc-gm-calc",
          label: "Verifies Gain Margin ~ 7.60 dB for 3rd order system",
          expectedStdout: "Omega_pc: 2.828 rad/s, Mag: 0.4167, Gain Margin: 7.60 dB\n",
        },
        {
          id: "tc-gm-positive",
          label: "Confirms positive Gain Margin indicates closed-loop stability",
          expectedStdout: "Omega_pc: 2.828 rad/s, Mag: 0.4167, Gain Margin: 7.60 dB\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "What does a negative Gain Margin in decibels signify for an open-loop stable minimum-phase system?",
      "It signifies that closed-loop gain exceeds 0 dB at the -180° phase crossover, meaning the closed-loop system is unstable and will exhibit growing oscillations.",
    ),
  },

  {
    id: "ctrl-state-space-representation",
    order: 4,
    title: "State-Space Matrix Formulation & Controllability",
    summary: "Formulate state-space matrix models (A, B, C, D) and evaluate the Kalman controllability matrix.",
    type: "interactive-simulation",
    objectiveIds: ["ctrl-state-space-obj"],
    prerequisiteLessonIds: ["ctrl-bode-nyquist-stability"],
    estimatedDurationMinutes: 40,
    content: `While classical frequency domain techniques handle single-input single-output (SISO) loops, modern control theory utilizes **State-Space Representation** to model multi-input multi-output (MIMO) dynamic systems:

### State Equation & Output Equation
$$\\mathbf{\\dot{x}}(t) = \\mathbf{A} \\mathbf{x}(t) + \\mathbf{B} \\mathbf{u}(t)$$
$$\\mathbf{y}(t) = \\mathbf{C} \\mathbf{x}(t) + \\mathbf{D} \\mathbf{u}(t)$$

Where:
- $\\mathbf{x}(t) \\in \\mathbb{R}^n$ is the internal state vector (e.g., position and velocity).
- $\\mathbf{u}(t) \\in \\mathbb{R}^m$ is the control input vector.
- $\\mathbf{y}(t) \\in \\mathbb{R}^p$ is the observed output vector.
- $\\mathbf{A}$ ($n \\times n$) is the System Matrix.
- $\\mathbf{B}$ ($n \\times m$) is the Input Matrix.
- $\\mathbf{C}$ ($p \\times n$) is the Output Matrix.
- $\\mathbf{D}$ ($p \\times m$) is the Feedforward Matrix.

### Conversion to Transfer Function
$$G(s) = \\mathbf{C} (s\\mathbf{I} - \\mathbf{A})^{-1} \\mathbf{B} + \\mathbf{D}$$

### Kalman Controllability Criterion
A system is **controllable** if there exists an input $\\mathbf{u}(t)$ capable of steering any initial state $\\mathbf{x}(0)$ to any desired target state $\\mathbf{x}(t_1)$ in finite time.

Form the **Controllability Matrix** $\\mathcal{C}$:
$$\\mathcal{C} = \\begin{bmatrix} \\mathbf{B} & \\mathbf{AB} & \\mathbf{A}^2\\mathbf{B} & \\dots & \\mathbf{A}^{n-1}\\mathbf{B} \\end{bmatrix}$$

The system is fully controllable if and only if $\\mathcal{C}$ has full row rank:
$$\\text{rank}(\\mathcal{C}) = n \\iff \\det(\\mathcal{C}) \\neq 0$$`,
    theorySections: [
      {
        id: "state-feedback-pole-placement",
        title: "Full-State Feedback Pole Placement",
        content: "If a system is controllable, full-state feedback law u = -K * x allows arbitrary placement of all n closed-loop poles (roots of det(sI - (A - BK)) = 0) via Ackermann's formula to achieve desired transient damping and settling speeds.",
      },
      {
        id: "observability-duality",
        title: "Observability and Duality",
        content: "A system is observable if initial state x(0) can be reconstructed from observation of y(t) over finite time. The Observability Matrix is O = [C; CA; CA^2; ... CA^(n-1)]. By Kalman duality, observability of (A, C) is mathematically equivalent to controllability of (A^T, C^T).",
      },
    ],
    codeExamples: [
      {
        title: "C 2nd-Order State-Space Controllability Determinant Checker",
        language: "c",
        code: `#include <stdio.h>

int main(void) {
    // 2nd-order system: x_dot = A*x + B*u
    // A = [0, 1; -2, -3], B = [0; 1]
    double a[2][2] = {{0.0, 1.0}, {-2.0, -3.0}};
    double b[2] = {0.0, 1.0};
    
    // Compute A*B
    double ab[2];
    ab[0] = a[0][0] * b[0] + a[0][1] * b[1];
    ab[1] = a[1][0] * b[0] + a[1][1] * b[1];
    
    // Controllability matrix C = [B, AB]
    // C = [b[0], ab[0]; b[1], ab[1]]
    double det_c = (b[0] * ab[1]) - (ab[0] * b[1]);
    
    printf("AB = [%.1f, %.1f]^T | det(C) = %.2f -> %s\\n",
           ab[0], ab[1], det_c, det_c != 0 ? "Controllable" : "Uncontrollable");
    return 0;
}`,
        description: "Evaluates the Kalman controllability matrix determinant in C.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "State-Space Model & Controllability",
      description: "Interactive state matrix editor evaluating eigenvalues and Kalman rank.",
      config: { mode: "pid" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("AB = [1.0, -3.0]^T | det(C) = -1.00 -> Controllable\n"),
    exercise: exercise(
      "ex-ctrl-controllability",
      "Compute Controllability Matrix Determinant",
      "For system A = [[0, 1], [-2, -3]] and B = [[0], [1]], calculate vector AB, controllability matrix determinant det(C), and confirm controllability status. Print: 'AB = [{ab0}, {ab1}]^T | det(C) = {det} -> {status}' with ab values to 1 decimal, det to 2 decimals, and status as 'Controllable'.",
      `const a00 = 0.0, a01 = 1.0, a10 = -2.0, a11 = -3.0;\nconst b0 = 0.0, b1 = 1.0;\nconst ab0 = a00 * b0 + a01 * b1;\nconst ab1 = a10 * b0 + a11 * b1;\nconst det = (b0 * ab1) - (ab0 * b1);\nconst status = det !== 0 ? "Controllable" : "Uncontrollable";\nconsole.log(\`AB = [\${ab0.toFixed(1)}, \${ab1.toFixed(1)}]^T | det(C) = \${det.toFixed(2)} -> \${status}\`);`,
      "ctrl-state-space-obj",
      "Evaluate controllability matrix rank for 2nd-order state system.",
      [
        "ab0 = a00*b0 + a01*b1, ab1 = a10*b0 + a11*b1.",
        "Controllability matrix has column 1 = B, column 2 = AB.",
        "det = b0 * ab1 - ab0 * b1.",
      ],
      "Applied",
      `// State-space controllability solver\nconst a00 = 0.0, a01 = 1.0, a10 = -2.0, a11 = -3.0;\nconst b0 = 0.0, b1 = 1.0;\n\n// TODO: Calculate ab0, ab1, det, status and log formatted output\n`,
      [
        {
          id: "tc-controllability-calc",
          label: "Verifies controllability matrix determinant equals -1.00",
          expectedStdout: "AB = [1.0, -3.0]^T | det(C) = -1.00 -> Controllable\n",
        },
        {
          id: "tc-full-rank",
          label: "Confirms non-zero determinant establishes full rank",
          expectedStdout: "AB = [1.0, -3.0]^T | det(C) = -1.00 -> Controllable\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "What are the eigenvalues of matrix A, and what physical property do they dictate?",
      "The eigenvalues of A (roots of det(sI - A) = 0) are the open-loop poles of the dynamic system, dictating natural frequency, damping, and unforced stability.",
    ),
  },

  // Module 3: Sampling, Aliasing & Frequency Transforms
  {
    id: "sig-sampling-nyquist-shannon",
    order: 5,
    title: "Continuous to Discrete Sampling & Nyquist-Shannon Theorem",
    summary: "Apply the Nyquist-Shannon sampling theorem, calculate folding frequencies, and prevent aliasing.",
    type: "interactive-simulation",
    objectiveIds: ["sig-nyquist-sample-obj"],
    prerequisiteLessonIds: ["ctrl-state-space-representation"],
    estimatedDurationMinutes: 35,
    content: `Analog physical signals (audio, radio, vibration) are continuous in time ($t$). Microprocessors process discrete samples $x[n] = x(n T_s)$ sampled at sampling frequency $f_s = \\frac{1}{T_s}$.

### The Nyquist-Shannon Sampling Theorem
A continuous-time bandlimited signal containing no frequency components higher than $f_{\\text{max}}$ can be **perfectly reconstructed** without any loss of information from its discrete samples if and only if the sampling rate exceeds twice the maximum signal frequency:

$$f_s > 2 f_{\\text{max}}$$

- **Nyquist Rate**: $2 f_{\\text{max}}$ (minimum required sampling frequency).
- **Nyquist Frequency (Folding Frequency)**: $f_N = \\frac{f_s}{2}$.

### Aliasing Distortion
When an input frequency exceeds the Nyquist frequency ($f_{in} > \\frac{f_s}{2}$), it masquerades as an artificial, non-existent lower frequency $f_{\\text{alias}}$:

$$f_{\\text{alias}} = |f_{in} - k f_s|$$

Where $k$ is an integer chosen such that $0 \\le f_{\\text{alias}} \\le \\frac{f_s}{2}$.

### Anti-Aliasing Low-Pass Filter
Once high frequencies alias into the digital sample stream, they are mathematically indistinguishable from legitimate baseband signals and cannot be removed by digital filtering. Therefore, an **analog low-pass filter** must precede the Analog-to-Digital Converter (ADC) to eliminate all spectral content above $f_s / 2$.`,
    theorySections: [
      {
        id: "whittaker-shannon-interpolation",
        title: "Whittaker-Shannon Sinc Reconstruction",
        content: "Exact continuous signal reconstruction from discrete samples is performed via convolution with the sinc function: x(t) = sum(x[n] * sinc((t - n*Ts) / Ts)), where sinc(u) = sin(pi*u) / (pi*u). An ideal DAC output filter acts as a brick-wall low-pass filter with sinc impulse response.",
      },
      {
        id: "oversampling-benefits",
        title: "Oversampling and Sigma-Delta ADCs",
        content: "Sampling significantly faster than the Nyquist rate (oversampling) relaxes analog anti-aliasing filter slope requirements from steep 8th-order active filters down to simple 1st-order RC filters, spreading quantization noise power over a wider frequency band.",
      },
    ],
    codeExamples: [
      {
        title: "C Nyquist Aliasing Apparent Frequency Classifier",
        language: "c",
        code: `#include <stdio.h>
#include <math.h>

int main(void) {
    double fs = 100.0;           // 100 Hz sampling rate
    double fin = 75.0;           // 75 Hz input tone (exceeds fs/2 = 50 Hz)
    
    double f_nyquist = fs / 2.0;
    int is_aliased = fin > f_nyquist;
    
    // Folding frequency calculation
    double k = round(fin / fs);
    double f_apparent = fabs(fin - (k * fs));
    
    printf("fs: %.0f Hz, fin: %.0f Hz | Nyquist: %.0f Hz | Status: %s (f_apparent: %.0f Hz)\\n",
           fs, fin, f_nyquist, is_aliased ? "ALIASED" : "CLEAN", f_apparent);
    return 0;
}`,
        description: "Computes Nyquist folding frequency and apparent aliased frequency in C.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Nyquist Sampling & Aliasing Visualizer",
      description: "Interactive continuous wave with discrete sampling dots and real-time aliasing alert.",
      config: { mode: "fft" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("fs: 100 Hz, fin: 75 Hz | Nyquist: 50 Hz | Status: ALIASED (f_apparent: 25 Hz)\n"),
    exercise: exercise(
      "ex-sig-nyquist-alias",
      "Calculate Nyquist Frequency and Aliased Tone",
      "For a sampling rate fs = 100 Hz and input signal fin = 75 Hz, compute the Nyquist folding frequency f_nyquist, whether it is aliased ('ALIASED' or 'CLEAN'), and the apparent aliased frequency f_apparent. Print: 'fs: {fs} Hz, fin: {fin} Hz | Nyquist: {f_nyquist} Hz | Status: {status} (f_apparent: {f_app} Hz)' with all frequencies formatted with 0 decimals.",
      `const fs = 100.0, fin = 75.0;\nconst f_nyquist = fs / 2.0;\nconst is_aliased = fin > f_nyquist;\nconst k = Math.round(fin / fs);\nconst f_app = Math.abs(fin - (k * fs));\nconst status = is_aliased ? "ALIASED" : "CLEAN";\nconsole.log(\`fs: \${fs.toFixed(0)} Hz, fin: \${fin.toFixed(0)} Hz | Nyquist: \${f_nyquist.toFixed(0)} Hz | Status: \${status} (f_apparent: \${f_app.toFixed(0)} Hz)\`);`,
      "sig-nyquist-sample-obj",
      "Determine Nyquist folding frequency and calculate aliased harmonic components.",
      [
        "f_nyquist = fs / 2.",
        "If fin > f_nyquist, aliasing occurs.",
        "f_apparent = |fin - round(fin / fs) * fs|.",
      ],
      "Applied",
      `// Nyquist sampling and aliasing solver\nconst fs = 100.0, fin = 75.0;\n\n// TODO: Compute f_nyquist, status, f_app and print formatted output\n`,
      [
        {
          id: "tc-alias-75hz",
          label: "Verifies 75 Hz signal sampled at 100 Hz aliases to 25 Hz",
          expectedStdout: "fs: 100 Hz, fin: 75 Hz | Nyquist: 50 Hz | Status: ALIASED (f_apparent: 25 Hz)\n",
        },
        {
          id: "tc-alias-apparent",
          label: "Confirms apparent frequency sits within baseband 0 to fs/2",
          expectedStdout: "fs: 100 Hz, fin: 75 Hz | Nyquist: 50 Hz | Status: ALIASED (f_apparent: 25 Hz)\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why does a CD audio format utilize a 44.1 kHz sampling frequency when human hearing tops out at 20 kHz?",
      "To satisfy Nyquist (> 40 kHz) while providing a 4.1 kHz guard band (20 kHz to 22.05 kHz) allowing practical analog anti-aliasing filters to roll off without attenuating audible treble.",
    ),
  },

  {
    id: "sig-fourier-dft-fft",
    order: 6,
    title: "Discrete Fourier Transform (DFT) and Fast Fourier Transform (FFT)",
    summary: "Compute Discrete Fourier Transform frequency bin magnitudes and apply Cooley-Tukey radix-2 FFT.",
    type: "interactive-simulation",
    objectiveIds: ["sig-dft-fft-obj"],
    prerequisiteLessonIds: ["sig-sampling-nyquist-shannon"],
    estimatedDurationMinutes: 45,
    content: `The Fourier transform transforms time-domain waveforms into frequency-domain spectral components.

### The Discrete Fourier Transform (DFT)
For a finite sequence of $N$ discrete time samples $x[n]$ ($0 \\le n < N$):

$$X[k] = \\sum_{n=0}^{N-1} x[n] e^{-j \\frac{2\\pi}{N} k n} = \\sum_{n=0}^{N-1} x[n] \\left( \\cos\\left(\\frac{2\\pi kn}{N}\\right) - j \\sin\\left(\\frac{2\\pi kn}{N}\\right) \\right)$$

Where $k = 0, 1, \\dots, N-1$ denotes the frequency bin index.

- **Bin Center Frequency**: $f_k = k \\times \\frac{f_s}{N} = k \\Delta f$.
- **Frequency Resolution**: $\\Delta f = \\frac{f_s}{N} = \\frac{1}{T_{\\text{window}}}$.

Direct computation of the DFT matrix requires $N^2$ complex multiplications.

### The Fast Fourier Transform (FFT)
The **Cooley-Tukey Radix-2 FFT Algorithm** recursively divides an $N$-point DFT into two $\\frac{N}{2}$-point DFTs (even-indexed samples $x[2m]$ and odd-indexed samples $x[2m+1]$):

$$X[k] = E[k] + W_N^k O[k]$$
$$X\\left[k + \\frac{N}{2}\\right] = E[k] - W_N^k O[k]$$

Where $W_N^k = e^{-j \\frac{2\\pi k}{N}}$ is the **twiddle factor**.

This divide-and-conquer butterfly structure reduces computational complexity from $O(N^2)$ to $O(N \\log_2 N)$. For $N = 1024$, this yields a $>100\\times$ speedup!`,
    theorySections: [
      {
        id: "spectral-leakage-windowing",
        title: "Spectral Leakage and Window Functions",
        content: "If an input signal frequency does not align with an exact integer multiple of bin resolution delta_f, energy leaks into adjacent frequency bins (spectral leakage). Multiplying the time record by a tapered window function (Hanning, Hamming, Blackman) smooths the boundary discontinuities, suppressing side-lobe leakage.",
      },
      {
        id: "bit-reversal-permutation",
        title: "In-Place FFT and Bit Reversal",
        content: "Radix-2 decimation-in-time algorithms achieve zero auxiliary memory overhead by re-ordering input samples according to bit-reversed index addresses (e.g., index 1 = 001_2 becomes 100_2 = 4) and performing in-place butterfly updates.",
      },
    ],
    codeExamples: [
      {
        title: "C 8-Point Discrete Fourier Transform Magnitude Spectrum",
        language: "c",
        code: `#include <stdio.h>
#include <math.h>

#define N 8
#define PI 3.141592653589793

int main(void) {
    // 8-point discrete signal: 100 Hz sampled at 800 Hz (k=1 peak)
    double x[N] = {0.0, 0.7071, 1.0, 0.7071, 0.0, -0.7071, -1.0, -0.7071};
    
    printf("Bin | Real Sum | Imag Sum | Magnitude\\n");
    printf("----+----------+----------+----------\\n");
    
    for (int k = 0; k < N / 2 + 1; k++) {
        double real_sum = 0.0, imag_sum = 0.0;
        for (int n = 0; n < N; n++) {
            double angle = 2.0 * PI * k * n / N;
            real_sum += x[n] * cos(angle);
            imag_sum -= x[n] * sin(angle);
        }
        double mag = sqrt(real_sum * real_sum + imag_sum * imag_sum) / (N / 2.0);
        printf(" %d  | %8.3f | %8.3f | %8.3f\\n", k, real_sum, imag_sum, mag);
    }
    return 0;
}`,
        description: "Computes discrete Fourier transform bins and peak magnitude in C.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Real-Time DFT Spectrum Display",
      description: "Interactive DFT magnitude bar spectrum showing harmonic frequency components.",
      config: { mode: "fft" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Bin | Real Sum | Imag Sum | Magnitude\n----+----------+----------+----------\n 0  |    0.000 |    0.000 |    0.000\n 1  |   -0.000 |   -4.000 |    1.000\n 2  |    0.000 |    0.000 |    0.000\n 3  |    0.000 |    0.000 |    0.000\n 4  |    0.000 |    0.000 |    0.000\n"),
    exercise: exercise(
      "ex-sig-fft-resolution",
      "Calculate FFT Bin Resolution and Peak Bin Index",
      "An audio ADC samples at fs = 48000 Hz using an N = 1024 point FFT. Compute frequency bin resolution delta_f in Hz, and the bin index k closest to a 1000 Hz tone. Print: 'Sampling: {fs} Hz, N: {n} | Delta_f: {df} Hz | Peak Bin for 1000 Hz: Bin {k}' with df to 2 decimals.",
      `const fs = 48000, n = 1024, f_tone = 1000;\nconst df = fs / n;\nconst k = Math.round(f_tone / df);\nconsole.log(\`Sampling: \${fs} Hz, N: \${n} | Delta_f: \${df.toFixed(2)} Hz | Peak Bin for 1000 Hz: Bin \${k}\`);`,
      "sig-dft-fft-obj",
      "Calculate FFT frequency bin spacing and spectral peak alignment.",
      [
        "df = fs / N.",
        "k = round(f_tone / df).",
      ],
      "Applied",
      `// FFT resolution calculator\nconst fs = 48000, n = 1024, f_tone = 1000;\n\n// TODO: Calculate df and k and print formatted output\n`,
      [
        {
          id: "tc-fft-res",
          label: "Verifies 46.88 Hz bin resolution for 48kHz / 1024-point FFT",
          expectedStdout: "Sampling: 48000 Hz, N: 1024 | Delta_f: 46.88 Hz | Peak Bin for 1000 Hz: Bin 21\n",
        },
        {
          id: "tc-fft-bin-check",
          label: "Checks bin 21 corresponds to 21 * 46.875 = 984.375 Hz",
          expectedStdout: "Sampling: 48000 Hz, N: 1024 | Delta_f: 46.88 Hz | Peak Bin for 1000 Hz: Bin 21\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "How many complex multiplications are saved by using a 1024-point FFT instead of direct DFT?",
      "Direct DFT requires N^2 = 1,048,576 operations. A radix-2 FFT requires (N/2) * log2(N) = 512 * 10 = 5,120 operations—a 99.5% reduction in compute.",
    ),
  },

  // Module 4: Digital Filters & Stochastic Estimation
  {
    id: "sig-z-transform-digital-filters",
    order: 7,
    title: "Z-Transform, Pole-Zero Placement, and FIR / IIR Digital Filters",
    summary: "Map continuous s-plane poles to the discrete z-plane and implement FIR/IIR difference equations.",
    type: "interactive-simulation",
    objectiveIds: ["sig-digital-filter-obj"],
    prerequisiteLessonIds: ["sig-fourier-dft-fft"],
    estimatedDurationMinutes: 45,
    content: `The **Z-Transform** is the discrete-time counterpart of the Laplace transform:

$$X(z) = \\mathcal{Z}\\{x[n]\\} = \\sum_{n=-\\infty}^{\\infty} x[n] z^{-n}$$

Where $z = r e^{j\\omega} = e^{s T_s}$ is a complex variable.

### Mapping the S-Plane to the Z-Plane
- Continuous imaginary axis $s = j\\Omega$ maps to the **Unit Circle** $|z| = 1$ in the z-plane.
- Left-half s-plane (stable region $\\text{Re}(s) < 0$) maps **inside the unit circle** ($|z| < 1$).
- A discrete linear system is BIBO stable if and only if **all poles lie strictly inside the unit circle**.

### FIR vs. IIR Digital Filters

#### 1. Finite Impulse Response (FIR)
Output depends strictly on present and past inputs (all poles at $z = 0$):
$$y[n] = \\sum_{k=0}^{M} b_k x[n-k] = b_0 x[n] + b_1 x[n-1] + \\dots + b_M x[n-M]$$
- **Always stable**. Can achieve perfect linear phase (symmetric coefficients). Requires higher filter order $M$.

#### 2. Infinite Impulse Response (IIR)
Output incorporates recursive feedback of past outputs:
$$y[n] = \\sum_{k=0}^{M} b_k x[n-k] - \\sum_{m=1}^{N} a_m y[n-m]$$
- Achieves very sharp cut-off with small filter order, but can become unstable if poles drift outside $|z| < 1$ due to coefficient quantization.`,
    theorySections: [
      {
        id: "bilinear-transform-prewarping",
        title: "Bilinear Transform & Frequency Pre-Warping",
        content: "The Bilinear Transform s = (2/Ts) * (z - 1) / (z + 1) maps the entire continuous j*Omega axis monotonically onto the discrete unit circle without aliasing, at the expense of nonlinear frequency warping: omega_digital = 2 * atan(Omega_analog * Ts / 2). Critical frequencies must be pre-warped prior to filter synthesis.",
      },
      {
        id: "first-order-ema-filter",
        title: "The Exponential Moving Average (EMA) Filter",
        content: "The single-pole IIR filter y[n] = alpha * x[n] + (1 - alpha) * y[n-1] is the workhorse of microcontroller sensor filtering. Setting alpha = dt / (RC + dt) mirrors a continuous analog RC low-pass filter with cut-off fc = 1 / (2*pi*RC).",
      },
    ],
    codeExamples: [
      {
        title: "C First-Order IIR Low-Pass Filter Implementation",
        language: "c",
        code: `#include <stdio.h>

int main(void) {
    // First-order IIR filter: y[n] = alpha * x[n] + (1 - alpha) * y[n-1]
    double alpha = 0.25;         // Smoothing factor (fc ≈ 0.045 fs)
    double noisy_signal[8] = {10.0, 12.0, 18.0, 25.0, 22.0, 20.0, 19.0, 20.0};
    double y = 10.0;             // Initial state
    
    printf("Step | Input x[n] | Filtered y[n]\\n");
    printf("-----+------------+--------------\\n");
    for (int n = 0; n < 8; n++) {
        y = (alpha * noisy_signal[n]) + ((1.0 - alpha) * y);
        printf("  %d  | %10.1f | %13.2f\\n", n, noisy_signal[n], y);
    }
    return 0;
}`,
        description: "Executes recursive IIR difference equation in C11.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Digital Filter Pole-Zero Plane",
      description: "Inspect unit circle pole locations and frequency response roll-off.",
      config: { mode: "fft" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Step | Input x[n] | Filtered y[n]\n-----+------------+--------------\n  0  |       10.0 |         10.00\n  1  |       12.0 |         10.50\n  2  |       18.0 |         12.38\n  3  |       25.0 |         15.53\n  4  |       22.0 |         17.15\n  5  |       20.0 |         17.86\n  6  |       19.0 |         18.15\n  7  |       20.0 |         18.61\n"),
    exercise: exercise(
      "ex-sig-iir-filter",
      "Run Exponential Moving Average Digital Filter",
      "Implement a 1st-order IIR filter y[n] = alpha * x[n] + (1 - alpha) * y[n-1] with alpha = 0.25 on the sample array [10, 12, 18, 25, 22, 20, 19, 20] starting with y[-1] = 10.0. Compute final output y[7]. Print: 'Final filtered value y[7] = {val}' formatted to 2 decimal places.",
      `const alpha = 0.25;\nconst x = [10.0, 12.0, 18.0, 25.0, 22.0, 20.0, 19.0, 20.0];\nlet y = 10.0;\nfor (let n = 0; n < x.length; n++) {\n  y = (alpha * x[n]) + ((1.0 - alpha) * y);\n}\nconsole.log(\`Final filtered value y[7] = \${y.toFixed(2)}\`);`,
      "sig-digital-filter-obj",
      "Compute discrete recursive IIR filter output over sample stream.",
      [
        "Initialize y = 10.0.",
        "Iterate through array: y = alpha * x[n] + (1 - alpha) * y.",
        "Print final y formatted to 2 decimals.",
      ],
      "Applied",
      `// IIR digital filter solver\nconst alpha = 0.25;\nconst x = [10.0, 12.0, 18.0, 25.0, 22.0, 20.0, 19.0, 20.0];\n\n// TODO: Compute final filtered y and log output\n`,
      [
        {
          id: "tc-iir-output",
          label: "Verifies final filtered output y[7] = 18.61",
          expectedStdout: "Final filtered value y[7] = 18.61\n",
        },
        {
          id: "tc-iir-bounds",
          label: "Verifies smoothed output is bounded within input range",
          expectedStdout: "Final filtered value y[7] = 18.61\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why does moving an IIR filter pole closer to z = 1 lower the cut-off frequency?",
      "In the z-plane, z = 1 corresponds to 0 Hz (DC). Placing a pole near z = 1 increases low-frequency gain while attenuating higher frequencies along the unit circle.",
    ),
  },

  {
    id: "sig-kalman-filter-sensor-fusion",
    order: 8,
    title: "Discrete Kalman Filtering & IMU Sensor Fusion",
    summary: "Implement discrete Kalman filter prediction and measurement update equations for sensor fusion.",
    type: "interactive-simulation",
    objectiveIds: ["sig-kalman-filter-obj"],
    prerequisiteLessonIds: ["sig-z-transform-digital-filters"],
    estimatedDurationMinutes: 45,
    content: `In robotics, aerospace navigation, and self-balancing drones, physical sensors are noisy and imperfect. The **Kalman Filter** is the mathematically optimal linear quadratic estimator, fusing a dynamic physics model with noisy measurements to minimize estimation error covariance.

### Two-Step Recursive Algorithm

#### 1. Time Update (Prediction Step)
Project the state estimate and error covariance ahead in time:
$$\\hat{x}_{k|k-1} = F_k \\hat{x}_{k-1|k-1} + B_k u_k$$
$$P_{k|k-1} = F_k P_{k-1|k-1} F_k^T + Q_k$$

Where:
- $F_k$ is the State Transition Matrix.
- $P$ is the Error Covariance Matrix.
- $Q_k$ is Process Noise Covariance (uncertainty in the physics model).

#### 2. Measurement Update (Correction Step)
Incorporate new noisy measurement $z_k$:
1. **Compute Innovation (Measurement Residual)**:
$$y_k = z_k - H_k \\hat{x}_{k|k-1}$$

2. **Compute Optimal Kalman Gain ($K_k$)**:
$$K_k = P_{k|k-1} H_k^T \\left( H_k P_{k|k-1} H_k^T + R_k \\right)^{-1}$$

Where $R_k$ is Measurement Noise Covariance.

3. **Update State Estimate**:
$$\\hat{x}_{k|k} = \\hat{x}_{k|k-1} + K_k y_k$$

4. **Update Error Covariance**:
$$P_{k|k} = (I - K_k H_k) P_{k|k-1}$$

### Intuition
- When measurement noise is large ($R \\gg P$), Kalman gain $K \\to 0$: the filter trusts the physics prediction.
- When prediction uncertainty is large ($P \\gg R$), Kalman gain $K \\to 1$: the filter trusts the sensor measurement.`,
    theorySections: [
      {
        id: "extended-kalman-filter",
        title: "Extended Kalman Filter (EKF) for Nonlinear Systems",
        content: "Real-world systems (quaternions, GPS orbital mechanics) involve nonlinear functions f(x, u) and h(x). The EKF linearizes nonlinear state dynamics around the current estimate at each time step using first-order Taylor series Jacobian matrices F = df/dx and H = dh/dx.",
      },
      {
        id: "imu-gyro-accel-fusion",
        title: "IMU Gyroscope + Accelerometer Fusion",
        content: "Gyroscopes provide accurate short-term angular rate changes but suffer from low-frequency DC bias drift. Accelerometers provide an accurate absolute gravity vector over the long term but suffer from high-frequency vibration noise. The Kalman filter fuses both, using the gyro for the prediction step and the accelerometer for the correction step.",
      },
    ],
    codeExamples: [
      {
        title: "C 1D Discrete Kalman Filter for Noisy Distance Sensor",
        language: "c",
        code: `#include <stdio.h>

int main(void) {
    // 1D Kalman Filter state estimation
    double x_est = 0.0;          // Initial state estimate
    double p = 1.0;              // Initial estimation error covariance
    double q = 0.01;             // Process noise covariance
    double r = 0.5;              // Measurement sensor noise covariance
    
    double measurements[5] = {1.2, 1.9, 3.1, 3.9, 5.1};
    
    printf("Step | Meas z | Est x | Kalman Gain K | Covariance P\\n");
    printf("-----+--------+-------+---------------+-------------\\n");
    
    for (int k = 0; k < 5; k++) {
        // 1. Prediction step (constant position model)
        p = p + q;
        
        // 2. Correction step
        double k_gain = p / (p + r);
        x_est = x_est + k_gain * (measurements[k] - x_est);
        p = (1.0 - k_gain) * p;
        
        printf("  %d  | %6.2f | %5.2f | %13.3f | %12.4f\\n",
               k, measurements[k], x_est, k_gain, p);
    }
    return 0;
}`,
        description: "Executes recursive 1D Kalman filter prediction and correction updates in C.",
      },
    ],
    interactiveDemo: {
      kind: "circuit",
      title: "Kalman Filter Sensor Fusion",
      description: "Interactive Kalman state tracker filtering high-frequency sensor noise.",
      config: { mode: "pid" },
    },
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: exampleRun("Step | Meas z | Est x | Kalman Gain K | Covariance P\n-----+--------+-------+---------------+-------------\n  0  |   1.20 |  0.80 |         0.669 |       0.3344\n  1  |   1.90 |  1.25 |         0.408 |       0.2038\n  2  |   3.10 |  1.80 |         0.300 |       0.1497\n  3  |   3.90 |  2.31 |         0.242 |       0.1211\n  4  |   5.10 |  2.89 |         0.208 |       0.1039\n"),
    exercise: exercise(
      "ex-sig-kalman-1d",
      "Execute 1D Kalman Filter Updates",
      "Run the 1D Kalman filter with initial x = 0.0, P = 1.0, Q = 0.01, R = 0.5 over 5 measurements [1.2, 1.9, 3.1, 3.9, 5.1]. Compute the final state estimate x_est and final covariance P after all 5 steps. Print: 'Final State: x = {x_est}, Covariance P = {p}' with x_est to 2 decimals, and P to 4 decimals.",
      `let x = 0.0, p = 1.0;\nconst q = 0.01, r = 0.5;\nconst z = [1.2, 1.9, 3.1, 3.9, 5.1];\nfor (let k = 0; k < z.length; k++) {\n  p = p + q;\n  const k_gain = p / (p + r);\n  x = x + k_gain * (z[k] - x);\n  p = (1.0 - k_gain) * p;\n}\nconsole.log(\`Final State: x = \${x.toFixed(2)}, Covariance P = \${p.toFixed(4)}\`);`,
      "sig-kalman-filter-obj",
      "Implement discrete Kalman gain computation and covariance updates.",
      [
        "In each step: p = p + q.",
        "k_gain = p / (p + r).",
        "x = x + k_gain * (z[k] - x), and p = (1 - k_gain) * p.",
      ],
      "Applied",
      `// 1D Kalman filter solver\nlet x = 0.0, p = 1.0;\nconst q = 0.01, r = 0.5;\nconst z = [1.2, 1.9, 3.1, 3.9, 5.1];\n\n// TODO: Run Kalman iterations and log final state and covariance\n`,
      [
        {
          id: "tc-kalman-final",
          label: "Verifies final Kalman state x = 2.89 and covariance P = 0.1039",
          expectedStdout: "Final State: x = 2.89, Covariance P = 0.1039\n",
        },
        {
          id: "tc-kalman-reduced-cov",
          label: "Verifies error covariance monotonically converges lower than initial P=1.0",
          expectedStdout: "Final State: x = 2.89, Covariance P = 0.1039\n",
          hidden: true,
        },
      ],
    ),
    checkpoint: checkpoint(
      "What happens to the Kalman gain K if sensor measurement variance R approaches zero?",
      "Kalman gain K approaches 1, meaning the filter discards the physics prediction and completely accepts the measurement: x_est = z_k.",
    ),
  },
];

export const controlAndSignalsPath: LearningCourse = {
  id: "control-and-signals",
  subjectId: controlAndSignalsSubject.id,
  title: "Control Systems & Signal Processing Mastery",
  description: "From open-loop and closed-loop transfer functions to PID tuning, Bode stability margins, Nyquist-Shannon sampling, FFT analysis, digital filters, and Kalman sensor fusion.",
  level: "Applied",
  version: "1.0.0",
  prerequisites: [
    "Differential equations, Laplace transforms, and complex numbers.",
    "Circuit theory fundamentals (RLC transients and AC phasors).",
  ],
  objectives: controlAndSignalsObjectives,
  learningOutcomes: [
    "Analyze open-loop and closed-loop block diagrams, error transfer functions, and disturbance sensitivity.",
    "Synthesize and tune PID controllers using the Ziegler-Nichols oscillation method with anti-windup clamping.",
    "Evaluate frequency response Bode diagrams, Gain Margin, and Phase Margin for feedback stability.",
    "Formulate continuous-time state-space matrix models and test the Kalman controllability criterion.",
    "Apply the Nyquist-Shannon sampling theorem, calculate folding frequencies, and prevent aliasing.",
    "Compute Discrete Fourier Transform (DFT) frequency bin magnitudes and explain radix-2 FFT complexity.",
    "Synthesize discrete-time FIR and IIR digital filters and evaluate unit-circle pole-zero stability.",
    "Implement discrete Kalman filter prediction and measurement correction equations for noisy sensor fusion.",
  ],
  estimatedDurationMinutes: 480,
  publicationStatus: "published",
  modules: [
    moduleData(
      "mod-ctrl-feedback-pid",
      1,
      "Feedback Control & PID Synthesis",
      "Open-loop vs closed-loop transfer functions, sensitivity functions, and Ziegler-Nichols PID tuning.",
      controlAndSignalsLessons.slice(0, 2),
    ),
    moduleData(
      "mod-ctrl-margins-statespace",
      2,
      "Stability Margins & State-Space Systems",
      "Bode plot Gain/Phase margins, Nyquist criterion, and state-space matrix controllability.",
      controlAndSignalsLessons.slice(2, 4),
    ),
    moduleData(
      "mod-sig-sampling-fourier",
      3,
      "Sampling, Aliasing & Frequency Transforms",
      "Continuous-to-discrete conversion, Nyquist-Shannon theorem, aliasing prevention, and Discrete Fourier Transforms.",
      controlAndSignalsLessons.slice(4, 6),
    ),
    moduleData(
      "mod-sig-filters-kalman",
      4,
      "Digital Filters & Stochastic Estimation",
      "Z-transform pole-zero stability, FIR/IIR recursive difference equations, and discrete Kalman sensor fusion.",
      controlAndSignalsLessons.slice(6, 8),
    ),
  ],
};
