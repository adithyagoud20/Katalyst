# KATALYST Hybrid Compiler & Simulation Execution Architecture

## Executive Summary

KATALYST is a learning-first engineering platform. Providing safe, fast, and accessible code execution across multiple languages (C/C++, Python, Java, JavaScript, HTML/CSS) and electronics/circuit simulation is essential to our curriculum. However, as a small team prioritizing privacy, security, and local-first reliability, KATALYST must avoid burdensome server infrastructure, unpredictable compute bills, and high-risk remote code execution vectors.

This document presents a comprehensive evaluation of browser-based WebAssembly runtimes, Cloudflare container/worker environments, and dedicated sandbox execution providers (such as Judge0 and Piston). We introduce a **Hybrid Execution Model** backed by a provider-neutral TypeScript interface (`src/lib/execution/`).

---

## 1. Supported Languages & Simulation Tools

| Technology | Target Use Case | Recommended Primary Runner | Fallback / Hybrid Option |
| :--- | :--- | :--- | :--- |
| **C / C11** | Core systems programming, algorithms, memory management | **Browser WebAssembly** (`clang` via Wasmer SDK) | Remote sandbox for advanced POSIX/sockets |
| **C++ / C++17** | Object-oriented systems, STL algorithms | **Browser WebAssembly** (`clang++` via Wasmer SDK) | Remote sandbox for multi-file cmake projects |
| **Python 3** | Scripting, data structures, scientific computing | **Browser WebAssembly** (Pyodide / MicroPython WASM) | Remote sandbox for native C extensions (`numpy`, `scipy`) |
| **Java** | Object-oriented patterns, data structures | **Remote Sandboxed MicroVM** (OpenJDK 21 via Piston/Judge0) | CheerpJ 3.0 (browser JVM WASM, ~20MB download) |
| **JavaScript** | Web scripting, algorithmic logic, ES2024 | **Browser Isolated Web Worker / Iframe** | Not needed (browser native) |
| **HTML / CSS** | UI components, layouts, visual DOM experiments | **Sandboxed Iframe** (`sandbox="allow-scripts"`) | Not needed (browser native) |
| **Circuit Simulation** | Analog circuits, digital logic, microcontrollers | **Browser WebAssembly** (Falstad engine, ngspice-wasm, Wokwi) | Server-side SPICE for multi-node simulations |

---

## 2. Detailed Technical Evaluation of Execution Options

### Option A: Browser-Based Execution (Client-Side WebAssembly & Web Workers)

- **How it works**: Code compiles and executes directly inside the user's browser sandbox using WebAssembly (Wasm) runtimes:
  - C/C++: Clang/LLVM compiled to WASI bytecode executed by `@wasmer/sdk/browser`.
  - Python: **Pyodide** (CPython 3.12 compiled to WebAssembly) or **MicroPython** (~300 KB).
  - JavaScript / HTML: Executed inside isolated Web Workers or restricted `<iframe sandbox="allow-scripts">`.
  - Circuit Simulation: **Falstad circuit engine** (JavaScript port) and **ngspice-wasm** (Berkeley SPICE compiled to Wasm). Microcontroller simulation using **Wokwi Web Components** (AVR / ESP32 Wasm core).
- **Security & Process Isolation**: Exceptional. Execution is confined to the browser's own operating-system sandbox. No user code ever touches KATALYST servers. Cross-Origin-Opener-Policy (`same-origin`) and Cross-Origin-Embedder-Policy (`require-corp`) enforce tight process isolation.
- **Latency & Cold Start**: Initial download: ~15 MB for Clang compiler package (cached in browser IndexedDB/CacheStorage for instant subsequent loads). Execution latency is sub-10ms once loaded.
- **Cost**: **$0.00**. Completely client-side compute; zero server infrastructure bills.
- **Offline Capability**: **100% offline-capable** once cached via service worker / browser cache.
- **Limitations**: Memory bound to browser tab limits (typically ~2 GB); cannot open raw network sockets; heavy Java runtimes require large downloads (~20 MB for CheerpJ).

### Option B: Cloudflare Containers / Workers Execution

- **How it works**: Cloudflare Workers running lightweight WebAssembly modules or experimental Cloudflare Containers (ephemeral micro-instances at the edge).
- **Security**: Strong isolation between worker isolates; however, Cloudflare Workers do not provide a traditional Linux syscall layer (no `fork`, `exec`, or direct filesystem access), making compiling arbitrary GCC/Clang code difficult without custom Wasm runtimes.
- **Cost**: Cloudflare Workers Paid is $5/month for 10 million requests, but CPU time is capped at 30 seconds for standard Workers and 5 minutes for Workers AI / custom containers.
- **Cold Start**: 5ms for V8 isolates, but 1.5s–3s for container-based invocations.
- **Verdict**: Excellent for running pre-compiled micro-tasks or proxying requests, but unsuitable as a general-purpose compiler backend for C/C++/Java without significant custom container orchestration.

### Option C: Dedicated Sandboxed Execution Providers (Judge0, Piston, JDoodle, OneCompiler)

We evaluated both self-hosted open-source sandboxes and commercial execution APIs:

#### 1. Browser WebAssembly (Wasmer & Pyodide) — *Adopted Primary*
- **Architecture**: Zero-server client-side execution. C/C++ via `@wasmer/sdk/browser` (Clang/LLVM WASI binary); Python 3.12 via Pyodide WebAssembly micro-runtime.
- **Cost**: **$0.00**. No servers, no egress fees, zero marginal cost per learner code run.
- **Security**: Bound to browser sandbox; no user code touches KATALYST servers.
- **Offline**: 100% offline once runtime packages are cached in browser storage.

#### 2. Piston (Engine by Engineer Man)
- **Architecture**: Open-source Docker-based execution engine supporting 50+ languages. Ephemeral cgroups, read-only root filesystems, unprivileged execution users, strictly bounded CPU/memory/pids.
- **Public API**: Free public API available at `https://emkc.org/api/v2/piston`, but subject to strict rate limits (typically 5 requests per second) and no SLA.
- **Self-Hosting Cost**: Can be hosted on a small VPS (Hetzner, DigitalOcean, or Fly.io) for **$5 to $12 / month** (e.g. Hetzner CX22: 2 vCPU, 4GB RAM, 40GB SSD).
- **Latency**: 150ms – 400ms per run depending on network distance.
- **Pros**: Clean REST API, multi-file support, compile + run separation, zero runtime dependencies on client.
- **Cons**: Requires server maintenance, security monitoring against kernel container-breakout CVEs.

#### 3. Judge0 CE
- **Architecture**: Robust open-source online judge engine built on Linux `isolate` (sandboxing sandbox used in IOI competitions).
- **Hosted Cloud Plans**:
  - Free Tier via RapidAPI: 50 requests/day, strictly rate-limited.
  - Basic Tier: $10/month (10,000 submissions/month).
  - Pro Tier: $35/month (50,000 submissions/month).
- **Self-Hosting Cost**: Requires PostgreSQL, Redis, and Linux kernel with `isolate` enabled. Typical VPS cost: **$15 to $25 / month**.
- **Pros**: Exact memory and CPU cycle metering; battle-tested in competitive programming.
- **Cons**: High hosting complexity for a small team; paid tier quickly incurs costs as learner volume scales.

#### 4. JDoodle
- **Architecture**: Proprietary cloud execution API supporting 80+ programming languages.
- **Hosted Cloud Plans**:
  - Free Tier: 200 credits/day.
  - Paid Plans: $25 to $150+/month based on execution volume.
- **Pros**: Highly mature, zero infrastructure maintenance.
- **Cons**: Proprietary closed-source backend, vendor lock-in, recurring billable API costs.

#### 5. OneCompiler
- **Architecture**: Managed multi-language code execution API.
- **Hosted Cloud Plans**:
  - Free Tier: limited trials.
  - Commercial API: Pay-per-execution usage tiers.
- **Pros**: Fast edge distribution, straightforward JSON API.
- **Cons**: Commercial API key required, usage costs scale linearly with active learners.

---

## 3. Circuit Simulation Architecture (Electronics)

KATALYST aims to provide hands-on electronics engineering education alongside embedded C/C++:

1. **Analog & Digital Circuit Simulation: Falstad Engine (Browser-First)**
   - The open-source Falstad Circuit Simulator is written in Java and compiled to clean modern JavaScript/Canvas.
   - It performs real-time node-voltage and branch-current calculation (modified nodal analysis with LU decomposition).
   - Embedded cleanly into an interactive iframe or canvas component with zero server cost and zero setup time.
2. **SPICE Netlist Simulation: ngspice-wasm**
   - Berkeley SPICE / ngspice compiled to WebAssembly via Emscripten.
   - Accepts standard SPICE netlists (resistors, capacitors, inductors, transistors, op-amps).
   - Runs non-linear DC, AC small-signal, and transient simulations entirely in the browser.
3. **Microcontroller Simulation: Wokwi Web Components**
   - Wokwi provides open-source web components (`<wokwi-led>`, `<wokwi-resistor>`, `<wokwi-pushbutton>`, `<wokwi-lcd1602>`) and an embedded AVR/ESP32 WebAssembly simulator.
   - Students can write C code, compile to AVR hex/ELF via browser-wasm or local compiler, and simulate firmware controlling breadboard hardware right inside KATALYST.

---

## 4. Multi-Dimensional Comparison Matrix

| Evaluation Dimension | Browser WebAssembly (Wasmer / Pyodide / Falstad) | Self-Hosted Piston Sandbox (VPS / Fly.io) | Hosted Provider (Judge0 RapidAPI) | Cloudflare Containers |
| :--- | :--- | :--- | :--- | :--- |
| **Process Isolation** | **Highest** (Browser OS sandbox) | High (Linux cgroups / seccomp) | High (Linux `isolate`) | High (V8 isolate / gVisor) |
| **Server Cost** | **$0.00 / mo** | **$5–$12 / mo** (Fixed VPS) | **$10–$35 / mo** (Scales with runs) | **$5–$15 / mo** |
| **Execution Latency** | Sub-10ms (cached) | 150ms – 400ms (network + run) | 250ms – 600ms (RapidAPI overhead) | 200ms – 500ms |
| **Cold Start** | ~2–4s first download only | < 50ms | < 100ms | 1.5s – 3s |
| **Offline Support** | **Full (100% offline)** | None (requires internet) | None (requires internet) | None (requires internet) |
| **Maintenance Burden** | **Zero** | Low-Medium (Docker / OS updates) | Zero (hosted) | Medium |
| **Memory Limits** | Up to tab limit (~2 GB) | 128 MB – 512 MB per container | Configurable (default 128 MB) | 128 MB |
| **Supported Curricula** | C/C++, Python, JS, Circuits | All 50+ languages including Java | All 50+ languages including Java | Specialized runtimes |

---

## 5. Strategic Recommendation: The KATALYST Hybrid Model

### Guiding Principles:
1. **Never send to a server what can be computed locally.**
2. **Zero marginal cost for standard learner code runs.**
3. **No untrusted code execution on the Next.js application server.**
4. **Provider-neutral execution contracts.**

### Phase 1 (M16 — Immediate): Browser-First Foundation
- Keep and stabilize the Wasmer C11 WebAssembly runner for C programming lessons.
- Implement the provider-neutral execution interface (`src/lib/execution/types.ts` and `src/lib/execution/runner.ts`).
- Support JavaScript and HTML/CSS playgrounds using native isolated browser iframes and Web Workers.
- Prepare circuit simulation components using Falstad / ngspice-wasm canvas integrations.

### Phase 2 (Future Milestone): Remote MicroVM Runner for Heavy Runtimes
- When introducing the Java curriculum (which requires an OpenJDK compiler and JVM runtime exceeding reasonable browser download sizes), deploy a dedicated sandboxed micro-instance (e.g. Piston on Hetzner or Fly.io) isolated in its own VPC.
- The `ExecutionRegistry` will automatically route C/C++, Python, and JS to `browser-wasm`, while transparently delegating Java requests to `remote-sandbox`.
- Remote executions will be rate-limited and credit-metered via KATALYST's AI Gateway & credits architecture to prevent resource exhaustion and abuse.

---

## 6. Provider-Neutral Interface Specification

The abstraction in `src/lib/execution/` provides:

```typescript
export type ExecutionLanguage = "c" | "cpp" | "python" | "java" | "javascript" | "html" | "circuit";
export type ExecutionTarget = "auto" | "browser-wasm" | "remote-sandbox";

export interface ExecutionRequest {
  language: ExecutionLanguage;
  files: ExecutionFile[];
  entrypoint?: string;
  stdin?: string;
  limits?: Partial<ExecutionLimits>;
  preferredTarget?: ExecutionTarget;
  signal?: AbortSignal;
  onProgress?: (stage: ExecutionStage, message: string) => void;
}

export interface ExecutionResult {
  ok: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  diagnostics?: string;
  executionTimeMs: number;
  runner: "browser-wasm" | "remote-sandbox";
  stage: ExecutionStage;
  error?: string;
}
```

This ensures zero vendor lock-in and seamless toggling between browser-based WebAssembly and remote sandbox execution as KATALYST evolves.

---

## 7. Code Editor Evaluation: CodeMirror 6 vs Monaco Editor

A critical part of M17.3 was evaluating modern web-based code editor solutions to replace basic `<textarea>` implementations while maintaining KATALYST's speed, accessibility, and mobile-friendly design.

### Evaluation Matrix

| Criterion | CodeMirror 6 (Adopted) | Monaco Editor (VS Code core) |
| :--- | :--- | :--- |
| **Bundle Size (Gzipped)** | **~50 KB – 120 KB** (Modular extensions) | **~2 MB – 4.5 MB** (Heavy web workers) |
| **Initial Initialization Latency** | **Sub-10ms** | 150ms – 500ms (worker spinning) |
| **Mobile / Touch Usability** | **Exceptional** (Engineered for mobile touch, virtual keyboards, native selections) | Poor (Designed primarily for desktop mouse/keyboard) |
| **Next.js App Router / SSR Compatibility** | **Seamless** with client boundary (`use client`) | Complex web worker bundling, dynamic import requirements, window-dependent setup |
| **Custom Styling & Theming** | Fully CSS custom properties driven (`--surface-code`, `--code-foreground`) | Requires Monaco theme JSON registry |
| **Accessibility (WCAG 2.1)** | ARIA-compliant, screen-reader friendly contenteditable model | Substantial accessibility complexity inside iframes/workers |
| **Multi-Language Syntax Highlighting** | Stream parsers and Lezer grammars for C, C++, Python, JS, HTML | Built-in Monarch / TextMate grammars |
| **Memory Footprint** | Extremely low (~2MB heap per instance) | High (~35MB–60MB heap per instance) |

### Decision & Justification: CodeMirror 6
1. **Lightweight & Modular**: KATALYST is designed as a responsive, fast-loading engineering platform. Adding Monaco's ~4MB footprint degrades initial load time, particularly for learners on mobile devices or constrained networks. CodeMirror 6 loads in under 100KB with language support.
2. **First-Class Mobile Experience**: CodeMirror 6 was written from the ground up to support modern mobile operating systems, virtual soft keyboards, and touch interactions. Monaco frequently suffers from cursor misalignments and viewport scroll lockups on iOS Safari and mobile Chrome.
3. **Clean Architecture**: Implemented cleanly in `src/components/code-workspace.tsx` using `EditorView`, `EditorState`, `lineNumbers`, custom KATALYST dark theme tokens, and dynamic stream-parser highlighting for C, C++, and Python.

---

## 8. Milestone M19 Execution Enhancements

### 8.1 JavaScript Isolated Web Worker Runner (`JavaScriptWorkerRunner`)
- Location: `src/lib/execution/js-runner.ts`.
- Architecture: Executes modern JavaScript (ES2024) in an ephemeral, isolated Web Worker (or Node.js `node:vm` in unit testing environments).
- Captures `console.log`, `console.info`, `console.warn`, `console.error` and maps them cleanly into `stdout` and `stderr`.
- Enforces strict timeout limits (default 5,000ms) with `worker.terminate()` to neutralize infinite loops.
- Auto-evaluates return expressions or test assertions for exercise verification.

### 8.2 Compiler Diagnostics & Error Bridge (`parseDiagnostics`)
- Location: `src/lib/execution/diagnostics-parser.ts`.
- Extracts structured diagnostic items (`{ line, column, severity, message }`) from:
  - Clang/GCC C11 compiler error strings (`file:line:col: severity: msg`).
  - Python runtime tracebacks and `SyntaxError` stack traces (`File "...", line N, in ...`).
  - JavaScript syntax and runtime errors (`Error: ... at line N:col`).
- Integrated into `src/components/code-workspace.tsx` to surface an inline error banner with a 1-click **"Ask Kat to Explain Error"** action that pipes the diagnostic and snippet into Kat AI tutor context.

### 8.3 Interactive Hardware & Systems Simulators
- `MemoryVisualizer` (`src/components/simulators/memory-visualizer.tsx`): Real-time interactive model of stack frames, downward stack growth, byte sizes, 16-bit hex addresses, heap dynamic memory (`malloc`/`free`), pointer reference arrows, and leak warnings.
- `CircuitSimulator` (`src/components/simulators/circuit-simulator.tsx`):
  - Digital Mode: Interactive logic gates (AND, OR, NOT, NAND, NOR, XOR), dynamic toggle inputs, live wire state visualization (high/low logic levels), and real-time truth table evaluation.
  - Analog Mode: RC circuit capacitor charging/discharging curves, Ohm's law ($V=IR$), interactive sliders for resistance, capacitance, and supply voltage, with live power and current readouts.
