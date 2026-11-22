# Changelog

## Unreleased — MVP operations, announcement scheduling, and launch media

- Stage 7: GATE & PSU Career Practice Track & Daily Engineering Challenge with 8 comprehensive technical interview lessons across EEE, ECE, CS, embedded systems, and electric machinery (two-port ABCD matrices & Fortescue symmetrical components, Z-transform ROC stability & CMOS propagation delay, Master Theorem & virtual memory page translation, volatile qualifiers & ISR reentrancy, induction motor slip-torque & transformer regulation, setup/hold slack & metastability, priority inversion & Priority Inheritance Protocol, and Shannon-Hartley channel capacity & formula speed drills) and a daily engineering habit challenge with client streak tracking under `katalyst.daily_challenge.v1`.
- Stage 6: Embedded Systems Capstones & Creative Engineering Tracks with 12 new project lessons (automated weather station & telemetry logger, smart home lighting & appliance relay controller, autonomous dual-sensor line follower with differential steering, digital combination keypad lock with brute-force lockout defenses, 4-way traffic junction state machine with yellow dilemma zones, ultrasonic obstacle-avoiding rover, piezoelectric 8-bit melody player, optical Morse transmitter, terminal snake in C, circuit bug hunt, 8-bit assembly emulator puzzle, and combinational logic maze) and the Creative Engineering Studio (Web Audio chiptune synthesizer requiring explicit user gesture, optical Morse code LED modulator, playable 2D terminal Snake, and 4-switch combinational logic vault).
- Stage 5: Control Systems, Signal Processing Mastery & DSA in C with 8 advanced control/DSP simulation lessons (open vs closed loop sensitivity, continuous/discrete PID synthesis with Ziegler-Nichols tuning, Bode gain/phase margins, state-space Kalman controllability, Nyquist-Shannon sampling & aliasing, Discrete Fourier Transform & Cooley-Tukey FFT, z-plane pole-zero stability & digital filters, and discrete Kalman filter sensor fusion) and 3 new engineering interactive studios (PID closed-loop step response simulator with real-time numerical Euler integration and disturbance injection, Nyquist-Shannon sampling & 32-bin DFT spectral visualizer with anti-aliasing filter, and interactive DSA studio featuring array binary search pointers, linked list traversal, BST insertion/search, and animated sorting metrics).
- Stage 4: Circuits EEE Core Course & Digital Design Studios with 10 new analog/network theory lessons (KVL/KCL 2-mesh analysis, Thevenin/Norton equivalents with Maximum Power Transfer, series RLC resonant ringing, AC complex phasors and power factor, bridge rectifiers, BJT Common-Emitter Q-points, operational amplifiers, second-order Sallen-Key Butterworth active filters, NE555 astable multivibrators, and 3-phase Star/Delta power distribution) and 4 interactive engineering studios (K-Map 2/3/4-variable solver with Gray code reduction, Finite State Machine Mealy/Moore designer, SAP-1 8-bit educational CPU simulator, and Analog Circuits & dual-trace Lissajous oscilloscope studio).
- Stage 3: Advanced Arduino & ESP32 Engine with hardware interrupts (INT0/INT1), Web Audio piezo tone synthesis, 50 Hz RC servo motor positioning, I2C Wire protocol and SSD1306 OLED frame decoding, 1024-byte virtual EEPROM, ESP32 dual-core FreeRTOS task and queue simulation, and mock MQTT telemetry publishing.
- Stage 2: Deepened all 14 foundational engineering courses from 123 to 186 lessons (+63 lessons, +51.2% content expansion) with complete theory sections, code examples in C, interactive simulation demos, progressive hints, and runnable test cases across systems programming, embedded AVR/ESP32, digital logic, data structures, and web architecture.

- Repositioned C++ course and compiler launcher below working tracks with clear "Coming soon" badging, and updated runtime status to "C++ compiler coming soon" while preserving lesson readability and sitemap routes.
- Completed Stage 0 content audit and plan (`docs/CONTENT_PLAN.md`): cataloged baseline 14 courses and 123 lessons, mapped out hardware interpreter and circuit simulator capability matrix, and established technical architecture for multi-track engineering expansion (advanced embedded, circuits/EEE core, DSA in C, control systems, and career practice).
- Implemented autonomous in-browser C compilation and execution using client-side WebAssembly (`binji/wasm-clang` + `wasm-ld` + in-memory MemFS with custom WASI preview-1 shim), enabled by default (`NEXT_PUBLIC_C_RUN_ENABLED` defaults to enabled). Runs with zero external server/API calls and zero `eval`/`new Function` under strict nonce Content Security Policy.
- Resolved CodeMirror single-letter focus loss across all workbench and lesson editors, ensuring uninterrupted typing.
- Kept Git repository clean and under 5 MB by untracking compiled binaries from Git and downloading pinned artifacts with SHA-256 integrity checks at prebuild time (`scripts/download-c-toolchain.mjs`).
- Unified studio routing by moving `/courses/[courseId]/[lessonSlug]` under persistent `StudioLayout`, eliminating app shell tearing, screen jumping, and state resets when navigating between learning paths and lessons.
- Fixed compiler panel hide/open toggle in default layout, properly expanding the lesson panel to full width when the compiler is hidden.
- Eliminated double scrollbars and layout shifts on lesson views with independent panel scroll ownership and suppressed account nudge banners on active lesson surfaces.
- Added prebuild toolchain automation via `scripts/download-c-toolchain.mjs` with SHA-256 integrity verification into gitignored `public/vendor/c-toolchain/`, keeping Git repository size under 5 MB.
- Configured immutable caching headers (`max-age=31536000, immutable`) and browser Cache API (`katalyst-c-toolchain-v1`) persistence, eliminating repeated network downloads on subsequent visits.
- Implemented lazy-loaded compiler and execution workers with download progress indication, offline error recovery, 5-minute idle worker shutdown, 32 MB user linear memory cap, 64 KB output buffer cap, 10-second runtime timeout, and immediate user abort via Stop button.
- Implemented an in-memory virtual filesystem supporting C standard file I/O (`fopen`, `fprintf`, `fclose`, `fread`) with clear learner notes.
- Added compiler diagnostic error and warning parsing with line numbers displayed in the editor UI and standard input (`stdin`) input box for C workbench and lessons.
- Added third-party notices, license attributions (Apache-2.0, LLVM Exception, MIT, Musl/WASI-libc), and toolchain provenance documentation (`docs/C_TOOLCHAIN_PROVENANCE.md`, `docs/THIRD_PARTY_LICENSES.md`, `NOTICE`). C++ remains disabled pending complete C++ curriculum matrix verification.

- Migrated app navigation to route-based URLs with a dedicated `/my-learning` route, legacy hash redirects, and route loading states. Split compact course summaries and a lesson-outline index from the full curriculum, made course pages load their own course source, server-rendered lesson reading content, and lazy-loaded lesson tools and heavy studio editors/simulators. Course counts now come from curriculum data; continued SEO work is tracked in M23.
- Consolidated provider, model, Kat AI, credit, and request-history controls under Settings.
- Stabilized mobile Kat scrolling and lesson navigation; hid route metadata from chat and added direct creator attribution for Kat.
- Improved light-theme syntax contrast and mobile touch targets.
- Completed the M23 public-page SEO metadata, canonical/Open Graph/Twitter tags, sitemap, robots rules, JSON-LD, noindex metadata, route loading boundaries, and custom 404 pages. Public course and lesson routes now share the nonce root layout and are dynamic; the static public CSP and SRI experiment were removed. `generateStaticParams` remains for route validation. Revisit static caching if Next.js SRI gains support for its inline App Router scripts.
- Retired the shared Wasmer/Clang C/C++ runtime after production compilation remained stuck: C timed out at 300 seconds, and C++ timed out at 300.27 seconds cold and remained stuck for 372.2 seconds warm. Removed the iframe runner and route, SDK dependency/assets/copy script, runner helpers, Wasmer CSP access, and runtime mocks. `/lab-runner/c` is now a normal 404; the archive state is tagged `c-runtime-archive` at commit `509c0a9`.
- Kept C/C++ lesson content, CodeMirror editors, local drafts/storage keys, and the build-time `NEXT_PUBLIC_C_RUN_ENABLED` flag. Both Run buttons remain disabled with the friendly upgrade message; setting the flag alone cannot restore the retired runtime.
- Replaced the isolated-runner test suite with checks that the runner route is missing, response policies deny framing and never grant `'unsafe-eval'`, and nonce script policies remain in place. The protocol test filename remains, but it now tests the retired-route CSP contract.
- Dropped the c2wasm experiment: only 30% of tested curriculum programs compiled and ran, core C features were unsupported, the repository's MIT claim had no accompanying LICENSE file, and compiler failures lacked useful diagnostics. No lessons were adapted. TraceCC was also declined for its AGPL-3.0-only license, approximately 85 MB payload, pre-release API, and separate-sandbox requirement.
- Declined the TraceCC spike before work began because it is AGPL-3.0-only, has an approximately 85 MB compiler payload and a pre-release API, and needs a separate execution sandbox. Kept the hosted API comparison as a future plan and added a pre-enablement privacy, terms, rate-limit, global-cap, server-secret, runtime/output, and kill-switch checklist to `docs/C_EXECUTION_OPTIONS.md`.
- Marked exercise language independently from lesson-example language. Arduino, ESP32, and breadboard examples remain C reference material, while their 18 exercise starters are JavaScript and now open/verify in the JavaScript worker/editor without requiring the general C compiler.
- Replaced the HTML/CSS starter's CSP-blocked inline `onclick` with a native `<details>/<summary>` interaction; no CSP directive changed.
- 2026-11-20 C timing probe (temporary 300-second timeout, not shipped): cold setup downloaded 110,713,421 bytes in 10.3 seconds; compilation timed out at 300.4 seconds with no output. The warm attempt had not completed after 320 seconds.
- 2026-11-20 C++ production probe (temporary 300-second command timeout and instrumentation, not shipped): cold toolchain resolve/download/instantiate took 9.74 seconds, sandbox creation took 7 ms, then Clang compile/link timed out at 300.27 seconds (exit 137). A warm attempt hit the cached toolchain immediately and created the sandbox in under 1 ms, but compilation remained stuck for 372.2 seconds without a completion or timeout response.

- Fixed mobile lesson scrolling by ignoring nested Code/Kat panel scroll events, fitting the lesson to the dynamic viewport, and hiding provider/model controls from the compact lesson header.
- Made shared Kat use server-side Cloudflare or Gemini credentials with admin-only setup guidance; visitors do not need or receive the owner's credentials.
- Separated guest session status rate limits from inference limits, secured the session cookie, made shared credit mutations fail closed without atomic database RPCs, and reserved the shared Gemini key for Kat.
- Paged the admin usage ledger, improved code contrast and mobile touch targets, contained the narrow-screen HTML preview, and removed Wasmer registry CSP access when the C/C++ runtime was retired.

- Added Course, WebSite, and FAQ structured data plus course-specific sharing metadata for search and answer engines.
- Replaced exposed credential examples in the provider guide with placeholders.
- Added administrator-managed text announcement banners and scheduled Home launch-video events, backed by a service-role-only Supabase table and authenticated, origin-checked, size-bounded writes.
- Added active-window filtering, safe text rendering, HTTPS URL validation, dismissible muted playback, audit logging, and browser E2E coverage.
- Replaced stale custom-host references with Vercel production project-alias handling and made the optional desktop package require its explicit production `.vercel.app` origin at build time.
- Regenerated rounded browser, PWA, desktop, and social-preview image assets from the final supplied KATALYST PNG; corrected missing icon/preview assets.
- Added the Vercel-only [MVP release checklist](docs/MVP_RELEASE_CHECKLIST.md) for production setup, user-owned launch steps, legal/security review, and known limitations.
- Stabilized the mobile app header during nested Code and Kat scrolling: short touch-scroll reversals no longer repeatedly expand and collapse the provider header, while scrolling back to the top or making a deliberate upward gesture still reveals it.
- Added mobile browser regression coverage for scroll momentum/reversal behavior in both the CodeMirror editor and Kat conversation, and documented the final mobile verification in the MVP release handoff.

## 0.29.0 — Mobile scrolling and launch readiness

- Fixed mobile learning headers to collapse while the content pane scrolls and return when the learner scrolls back to the top.
- Gave dedicated Arduino, ESP32, breadboard, and digital logic lab surfaces their own touch-friendly vertical scroll area in the full-screen IDE.
- Let lesson reading content use the available workspace width when both the compiler and Kat panels are closed.
- Added mobile scroll and board-runtime E2E coverage, a wide lesson regression check, and dimensions validation for the social preview image.
- Made deployment legal identity, jurisdiction, and monitored support contact configurable and visible as an incomplete launch gate when missing.
- Added a launch checklist that separates implemented app behavior from external domain, legal, authentication, backup, monitoring, abuse-prevention, billing, and search-console setup.

## 0.28.0 — MVP interface, account, and security refinement

- Replaced multiple logo choices with one reusable KATALYST mark in the shell, public pages, and SVG app icon.
- Reframed the Home graphic as one animated learning pipeline across software, hardware, circuits, systems, data, AI, and visual media.
- Removed the bottom sidebar sign-in control, added a dismissible top sign-in prompt for configured guest deployments, and kept all authentication forms on `/login`.
- Simplified Account settings to account state and data controls; retained email/password, Google OAuth, password recovery, and required Terms and Privacy acceptance on the shared login page.
- Added the public Terms, Privacy, account deletion, sitemap, robots, social preview, and not-found surfaces, with legal copy that states the current data boundaries and operator contact requirement.
- Refined responsive topbar behavior to keep provider and model selectors readable without overlapping on mobile.
- Updated design, security, product, account setup, and deployment documentation to match the current multi-discipline catalog and server-side credential boundaries.

## 0.27.0 — Milestone M21: Server-Side Curriculum, SQL & HTML/CSS Runtimes, 5 New Courses, Built-In Skills & UI Polish

- **Server-Side Curriculum Architecture & Manifest Split**:
  - Split curriculum data into lightweight client manifests (`LearningLessonSummary`, `LearningCourseSummary` in `src/data/curriculum/manifests.ts`) and full server-side lesson details (`LearningLessonDetail` in `src/data/curriculum/`).
  - Built on-demand `/api/curriculum/lesson` endpoint delivering rich markdown, theory deep-dives, code examples, exercises, and test cases with Zod validation, HTTP caching (`Cache-Control: public, max-age=3600, stale-while-revalidate=86400`), and non-shifting loading skeletons.
- **SQLite WebAssembly (`sql.js`) Local Runner**:
  - Implemented `SqlWasmRunner` in `src/lib/execution/sql-runner.ts` using official SQLite WebAssembly binaries (`public/vendor/sqljs/`).
  - Supports deterministic schema setup execution via `stdin`, formatted ASCII tabular output, syntax/constraint diagnostics, and automated test case evaluation.
- **HTML5 & CSS3 Live Sandboxed Preview**:
  - Implemented live client-side sandbox iframe (`sandbox="allow-scripts"`) in CodeWorkspace and unified Playground.
  - Features real-time rendering, Desktop / Mobile (375px) responsive viewport toggles, and manual refresh controls.
- **Unified Multi-Language Playground Switcher**:
  - Upgraded Playground to support 6 runtimes: `C (C11)`, `Python (3.12)`, `JavaScript (ES2024)`, `SQL (WASM)`, `HTML & CSS (Live Preview)`, `Digital Circuits (Interactive)`.
  - Preserves isolated local drafts per language (`katalyst.<lang>.playground.v1`).
- **5 New Full-Depth Engineering Courses (38 Lessons, 91 Total Lessons)**:
  - Expanded catalog to 9 comprehensive courses with zero stubs or placeholders:
    - `sql-databases`: Relational Foundations, Aggregations & Joins, CTEs & ACID Transactions (8 lessons).
    - `html-css-web`: Semantic HTML5, Accessible Forms, Flexbox, Grid, Custom Properties, Motion (8 lessons).
    - `dsa-mastery`: Big-O, Two Pointers, Sliding Windows, Monotonic Stacks, Trees, Graphs, DP (10 lessons).
    - `prompt-engineering`: Tokenization, Temperature/Top-P, Few-Shot ICL, JSON Schemas, ReAct, RAG (6 lessons).
    - `photo-editing-media`: Pixel Buffers, HSL Luminance, Histograms, Contrast Curves, Convolutions, Blending (6 lessons).
- **Interactive Image & Color Lab Visualizer**:
  - Authored `src/components/simulators/image-lab-visualizer.tsx` with procedural test patterns, real-time RGB histogram analysis, Tone Adjustments, and 3x3 spatial convolution kernels (Sharpen, Blur, Edge Detection, Emboss).
- **Built-in Engineering Skills Expansion**:
  - Added 8 specialized engineering skills in `src/lib/skills.ts`: Socratic Code Reviewer, C Memory & Pointer Auditor, SQL Query & Index Optimizer, DSA Complexity & Edge-Case Coach, Frontend Semantic & Accessibility Reviewer, Prompt Architecture Refiner, Digital Circuit & Logic Simplifier, Exam & Interview Drill Master.
- **Explore Category Filter Pills**:
  - Added category filter pills (`All`, `Systems`, `Web`, `Algorithms`, `Databases`, `AI & Media`, `Hardware`) to the Explore learning paths interface.

## 0.26.0 — Milestone M20: M19 E2E Verification, Runtime Hardening & MVP Deployment Readiness

- **Playwright E2E Coverage for M19 Platform Features (`e2e/m19-features.spec.ts`)**:
  - Authored a dedicated, fast Playwright E2E test suite with 5 comprehensive browser tests:
    - **4-Course Catalog Discovery**: Verifies all 4 courses (C, Python, JavaScript, Digital Circuits) render in Explore with accurate lesson/module counts and language tags (`PYTHON 3.12`, `JAVASCRIPT (ES2024)`, `DIGITAL LOGIC`, `C11`).
    - **JavaScript Web Worker Execution & Automated Verification**: Verifies CodeWorkspace in JavaScript lessons, code execution in isolated browser Web Workers, and solution grading with automated test case evaluation and XP awards.
    - **Interactive Simulators**: Tests Circuit Simulator logic gate selection, switch toggling (`0`/`1`), LED output calculation, truth table highlighting, and Memory Visualizer multi-step memory lifecycle navigation and reset.
    - **Inline Compiler Diagnostics & Kat Error Bridge**: Tests syntax/runtime error capture, inline diagnostic card rendering, and one-click "Ask Kat to Explain Error" bridging error context directly into Kat AI tutor's pre-populated prompt.
    - **Challenge Hub Multi-Course Filters**: Tests filtering by language (`All Courses`, `JavaScript`, `Circuits`, `Python`, `C`) and difficulty levels.
- **Simulator & Workspace Error Boundary (`src/components/simulators/simulator-error-boundary.tsx`)**:
  - Implemented React `SimulatorErrorBoundary` to safely isolate `MemoryVisualizer` and `CircuitSimulator` runtime exceptions.
  - Displays accessible fallback alerts with error diagnostics and an interactive **Reset Simulator** action, preventing simulator state faults from crashing lesson reading panels or the workbench.
  - Defensively guarded process, sandbox, and client teardown in `src/components/c-playground.tsx` against unmounted client instances.
- **Legacy Progress Migration Safety (`src/lib/learning-progress.ts`)**:
  - Added schema tolerance for older `katalyst.learning.v1` local storage records that lack `verifiedExerciseIds`, defaulting cleanly to `[]`.
  - Accurately computes engineering XP and rank progression from legacy `completedLessons` and explicit `exerciseProgress` records without schema rejection or data corruption.
  - Added automated migration unit test in `tests/learning-progress.test.ts`.
- **Production Health Check Endpoint (`src/app/api/health/route.ts`)**:
  - Implemented lightweight `GET /api/health` route returning `{ ok: true, status: "healthy", coursesCount: 4, services: { cloudflareConfigured: boolean, supabaseConfigured: boolean } }`.
  - Verifies zero credential leakage or secret disclosure in response payloads, tested in `tests/health-route.test.ts`.
- **MVP Deployment Readiness (`docs/DEPLOYMENT.md`)**:
  - Documented automated health check integration, multi-language WebAssembly / Web Worker cross-origin isolation (COOP/COEP) constraints, and comprehensive 4-course verification runbooks.

## 0.25.0 — Milestone M19: Full-Scale Engineering Platform Expansion

- **Four-Course Engineering Curriculum (53 Lessons, 20 Modules)**:
  - Scaled KATALYST catalog to 4 complete courses across systems programming, scripting, algorithms, and hardware fundamentals:
    - `c-programming-foundations`: Added Module 6 (*Systems & Low-Level Engineering*) with 3 new lessons (`bitwise-registers`, `dynamic-memory`, `function-pointers`), bringing C Foundations to 16 lessons across 6 modules.
    - `python-programming-foundations`: Added Module 7 (*Object-Oriented Systems & Algorithmic Efficiency*) with 3 new lessons (`py-classes-and-encapsulation`, `py-inheritance-dataclasses`, `py-algorithms-and-generators`), bringing Python Foundations to 19 lessons across 7 modules.
    - `js-systems-algorithms`: Authored new course (Course 3) in `src/lib/curriculum/javascript-algorithms.ts` with 10 lessons across 4 modules exploring V8 memory layout, event loop queues, promise chains, prototypal inheritance, and algorithm efficiency.
    - `digital-logic-circuits`: Authored new course (Course 4) in `src/lib/curriculum/digital-circuits.ts` with 8 lessons across 3 modules covering Boolean algebra, logic gates, combinational half/full adders, and analog RC / Ohm's Law circuits.
- **100% Automated Test Case Verification**:
  - Authored runnable test cases with `stdin`, `expectedStdout`, and hidden edge tests (`hidden: true`) across all 53 exercises in all 4 courses.
  - Test cases validated via `verifyExerciseSubmission` with carriage return normalization, matching modes, and compilation short-circuiting.
- **JavaScript Isolated Web Worker Runner**:
  - Implemented `JavaScriptWorkerRunner` in `src/lib/execution/js-runner.ts` using ephemeral Web Workers with Node.js fallback for unit test isolation.
  - Intercepts all console stream methods (`log`, `info`, `warn`, `error`) and integrates seamlessly into `ExecutionRegistry` for single-language and multi-test grading.
  - Added unit test suite in `tests/js-runner.test.ts` (6 tests).
- **Interactive Engineering Simulators**:
  - `src/components/simulators/memory-visualizer.tsx`: Stack frame visualizer showing downward stack growth, byte sizes, 16-bit hex addresses, heap blocks with `malloc`/`free`, leaked block warnings, dangling pointer alerts, and step navigation.
  - `src/components/simulators/circuit-simulator.tsx`: Digital logic mode (interactive gate inputs, live wire voltages, live truth tables) and Analog mode (RC capacitor charging curves, Ohm's Law sliders, real-time power and current calculations).
  - Integrated into lesson interactive demos and Playground runtime tab.
- **Compiler Diagnostics & Kat Error Bridge**:
  - Implemented `parseDiagnostics` in `src/lib/execution/diagnostics-parser.ts` to parse Clang, Python, and JavaScript compiler/runtime errors into structured diagnostic objects (`{ line, column, severity, message }`).
  - Added inline diagnostic warning banners in `src/components/code-workspace.tsx` with a one-click **"Ask Kat to Explain Error"** action bridging error context directly into the AI tutor panel.
  - Added unit test suite in `tests/diagnostics-parser.test.ts` (6 tests).
- **Mastery Lab & Engineering XP / Rank System**:
  - Added multi-course filter pills (All, C, Python, JavaScript, Digital Circuits) and difficulty filters (All, Beginner, Intermediate, Advanced) to Practice Lab.
  - Added engineering XP model (`+50 XP` per verified exercise, `+25 XP` per completed lesson) and engineering ranks (Cadet Engineer to Staff Systems Architect) computed via `getEngineeringMastery` in `src/lib/learning-progress.ts`.
  - Added Engineering Mastery progress card to Home and Progress views.

## 0.24.0 — Automated Exercise Verifier & Surgical UI Lock-In (M18)

- **Automated Exercise Verifier**:
  - Implemented `verifyExerciseSubmission` in `src/lib/exercise-verifier.ts` to evaluate user code solutions against authored test cases using `executeProgram`.
  - Normalizes carriage returns (`\r\n` to `\n`) and supports `exact`, `trimmed`, and `contains` matching modes.
  - Automatically short-circuits subsequent tests upon compilation errors to save execution time and report compilation diagnostics immediately.
  - Added `maskHiddenTestCase` to sanitize test details in the learner UI when `hidden: true`, masking evaluation inputs, outputs, and internal traces while reporting status.
  - Added dedicated unit test suite in `tests/exercise-verifier.test.ts` (9 tests covering normalization, matching modes, masking, execution flow, and compiler short-circuiting).
- **Curriculum Test Cases**:
  - Added optional `testCases` array to `LearningExercise` in `src/lib/learning-curriculum.ts` and updated Zod validation schema (`exerciseTestCaseSchema`, `exerciseSchema`).
  - Authored runnable test cases in `c-programming-foundations`:
    - `trace-hello` (output greeting & newline verification)
    - `choose-a-type` (double voltage formatting)
    - `read-two-values` (scanf integer reading with stdin inputs 5, 42, and hidden -7)
  - Authored runnable test cases in `python-programming-foundations`:
    - `ex-py-first-script` (print separator formatting)
    - `ex-py-sensor-variables` (multi-variable sequencing)
    - `ex-py-fahrenheit-converter` (Celsius string conversion to Fahrenheit)
- **Interactive Exercise Verifier UI**:
  - Embedded the Automated Verifier card in `src/components/learning-experience.tsx` within the lesson exercise section.
  - Added "Verify Solution" button with loading spinner, execution timer, summary pass/fail banners, and side-by-side expected vs actual stdout comparisons for visible tests.
  - Auto-updates learner progress in `katalyst.learning.v1` to `completed` when all test cases pass, or `attempted` when any test fails.
- **Surgical UI Lock-In (Bug Fixes 1–3)**:
  - **Fix 1 (Dark Mode Sidebar & Credits Badge)**: Explicit high-contrast colors in `[data-theme="dark"]` for left sidebar links/icons (`#d4d4d8`), active items (`rgba(59, 130, 246, 0.16)` / `#60a5fa`), and section headings (`#a1a1aa`). Replaced bright green styling on top-bar credits badge with clean neutral/blue badge.
  - **Fix 2 (Eliminate Georgia/Serif)**: Replaced all legacy `Georgia` and `serif` occurrences in `src/app/globals.css` with clean sans-serif typography (`Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`).
  - **Fix 3 (Isolate Python Drafts from C Lessons)**: Prevented synchronous dispatch draft leaks during language switching via `isSwitchingRef`, cleansed corrupted C drafts starting with Python syntax on mount, and ensured lesson mode strictly mounts with the lesson's language starter/example code.

## 0.23.0 — Dark Mode Text Visibility & Precision Blue Theme Polish

- **Complete Dark Mode Text Visibility & Readability**:
  - Diagnosed and resolved low-contrast text in Dark and System Dark modes caused by misallocated accent text variables on headings, copy, and controls.
  - Replaced misplaced `var(--text-accent)` across breadcrumbs, model dropdowns, welcome area, view headings, skill catalog details, lesson pagination, and Kat AI tutor panels with semantic tokens (`--text-primary`, `--text-secondary`, `--text-muted`, and `--accent-text`).
  - Added synchronous pre-hydration theme script in `src/app/layout.tsx` to read `katalyst.preferences.v1` and resolve `system` preferences before first render via `window.matchMedia("(prefers-color-scheme: dark)")`, eliminating dark/light theme flashes.
  - Updated real-time matchMedia listener in `src/components/workspace.tsx` to keep `document.documentElement.dataset.theme` synchronized when the OS color scheme changes.
- **Elimination of Legacy Green / Teal Colors**:
  - Removed all teal, forest green, and emerald colors (`#0f766e`, `#14b8a6`, `#0d9488`, `#2dd4bf`, `#183d37`, `#202d2b`, `#134e4a`, `#ccfbf1`, `#f0fdfa`, `#5eead4`, `#112a28`, etc.) from action buttons, active navigation states, links, badges, borders, and icons.
  - Implemented the modern Neutral Slate + Precision Blue design system:
    - Light Mode: `--accent-primary: #2563eb`, `--accent-hover: #1d4ed8`, `--action-primary-bg: #2563eb`, `--action-primary-text: #ffffff` (5.21:1 contrast).
    - Dark Mode: `--accent-primary: #3b82f6`, `--accent-hover: #60a5fa`, `--action-primary-bg: #3b82f6`, `--action-primary-text: #090c10` (5.18:1 contrast).
    - Retained dark graphite code surfaces (`#1a1d21` light, `#121519` dark) for code editors, terminals, and code blocks.
- **E2E Dark Mode & Contrast Verification**:
  - Updated `e2e/workspace.spec.ts` with Precision Blue primary action button assertions.
  - Added new E2E test verifying dark mode background darkness, heading legibility, and zero legacy teal/green colors across Settings, Learning Home, Explore Paths, Lesson Workspace, and Playground.

## 0.22.0 — Theme Override, Unified Multi-Language Playground & Runtime Audit (M17.4)

- **Theme Palette Override & Contrast Hardening**:
  - Replaced legacy palette tokens across `src/app/globals.css` with a high-contrast modern engineering theme for Light and Dark modes.
  - Light mode: `--surface-canvas: #f8fafc`, `--surface-primary: #ffffff`, `--surface-secondary: #f1f5f9`, `--border-subtle: #e2e8f0`, `--text-primary: #0f172a`, `--text-secondary: #334155`, `--accent-primary: #2563eb`, `--accent-hover: #1d4ed8`.
  - Dark mode: `--surface-canvas: #0b0e14`, `--surface-primary: #111620`, `--surface-secondary: #161c28`, `--border-subtle: #263042`, `--text-primary: #f8fafc`, `--text-secondary: #cbd5e1`, `--accent-primary: #38bdf8`, `--accent-hover: #7dd3fc`.
  - Fixed dark mode panel backgrounds: removed misplaced `var(--surface-warning)` overrides from `.learning-workspace-header`, `.learning-workspace-panel`, `.learning-panel`, `.learning-kat-panel`, `.workspace-course-nav`, `.c-editor-pane`, `.c-output-pane`, `.lesson-topline`, `.path-curriculum`, `.tutor-composer`, `.lesson-checkpoint`, `.home-path-feature`, `.learning-empty-state`, `.lesson-tutor-intro`, and `.learning-workspace-mobile-tabs`.
  - Corrected `.suggestion:hover` background from harsh white to `var(--surface-secondary)`, and `.project-active .project-dot` from `#db6947` to `var(--accent-primary)`.
- **Unified Multi-Language Playground**:
  - Replaced "C Playground" in sidebar navigation, breadcrumbs, and headers with a unified "Playground".
  - Implemented top Language Selector Bar inside the playground with active runtimes: C (C11 · Wasmer WebAssembly) and Python (3.12 · Pyodide WebAssembly), alongside coming-soon badges for JavaScript (ES2024) and Circuits (SPICE).
  - Dynamic CodeMirror 6 language reconfiguration via `Compartment` (`cpp()` vs `pythonStreamParser`) with preserved editor focus and no full-component remounts.
  - Domain-separated draft storage: `katalyst.c.playground.v1` for C and `katalyst.python.playground.v1` for Python with independent limits and record validation in `src/lib/python-playground.ts`.
  - Full execution support for Python programs via `executeProgram`, handling stdin normalization, execution progress, timeout protection, stdout/stderr capture, and runtime error diagnosis.
- **M17.4 Runtime & Workspace Verification Audit**:
  - Fully verified real in-browser execution with Wasmer C and Pyodide Python.
  - Verified stdin/stdout normalization across both languages (`scanf` and `input()`).
  - Updated design documentation in `docs/DESIGN.md` with complete token tables and interaction principles.

## 0.21.0 — Learning Experience Redesign, Curriculum Expansion & Execution Providers (M17.3)

- **Default 2-Panel Learning Workspace**: Restructured the desktop learning workspace into a clean, distraction-free 2-panel default layout: Theory content (50%) on the left and interactive Code Sandbox (50%) on the right.
- **Optional Kat AI Tutor**: Kat AI tutor is closed by default to cultivate independent problem-solving. Added a top-bar "Ask Kat" / "Hide Kat" toggle and an accessible close button in the Kat header, expanding smoothly into a 3-panel layout (Theory 35%, Code 35%, Kat 30%) with draggable splitters. Panel state and layout widths are persisted in `katalyst.workspace.layout.v1` (`WorkspaceLayout.katOpen`).
- **Visual Design Overhaul**:
  - Replaced legacy burnt-orange palette with refined, accessible teal/cyan design tokens (`--signal: #0d9488` light, `#14b8a6` dark; `--action-primary-bg: #0f766e` light, `#14b8a6` dark) guaranteeing full WCAG AA contrast (>4.5:1).
  - High-contrast typography with deep graphite surfaces (`--surface-code: #1a1d21`) and high-contrast text (`--text-primary: #181a1b` light, `#f1f5f9` dark) across code editors, terminals, and code blocks in all appearance themes.
  - Compact navigation rail: 220px expanded, 58px collapsed icon rail with bottom avatar and accessible tooltips.
- **Redesigned Home & Discovery Experiences**:
  - Redesigned Home page with a quick-resume card (`Continue learning`), hero explanation of KATALYST's learning-first philosophy, 3-step "How KATALYST works" workflow ("Learn concept -> Code in sandbox -> Review & ask Kat"), symmetric C and Python foundation cards with metrics, and Practice Lab teasers.
  - Redesigned Course Discovery (`paths`) with symmetric C and Python cards, syllabus module listings, duration, status badges, outcomes, and prerequisites.
- **Curriculum Content Expansion**:
  - C Programming Foundations: enhanced all 13 lessons with memory layout notes, pitfalls, starter code, and multi-tier progressive hints.
  - Python Programming Foundations: enhanced all 16 lessons across 6 modules with starter code and progressive hints.
  - Preserved course IDs (`c-programming-foundations`, `python-programming-foundations`), lesson IDs, and URLs with complete backward compatibility.
- **Multi-Language Runner Subsystem (`src/lib/execution/`)**:
  - Authored a comprehensive technical evaluation of execution providers (Pyodide, Wasmer, Judge0 CE, JDoodle, OneCompiler, Piston) and code editors (Monaco vs CodeMirror 6) in `docs/COMPILER_ARCHITECTURE.md`.
  - Implemented provider-neutral runner subsystem in `src/lib/execution/` with working `WasmerCRunner` for C11 browser WebAssembly and `PyodidePythonRunner` for Python 3.12 WebAssembly micro-runtime.
- **CodeMirror 6 Multi-Language Editor**:
  - Built `src/components/code-workspace.tsx` with CodeMirror 6, dark graphite theme, line numbers, C/C++ and Python stream tokenizers, Run/Stop controls, and stdin/terminal panes.
- **Automated Verification**:
  - `npm run lint` — passed with 0 errors and 0 warnings.
  - `npm run typecheck` — passed with 0 errors.
  - `npm test` — passed with 222 tests across 23 test suites.
  - `npm run test:e2e` — passed with 44 browser tests (1 skipped).
  - `npm run build` — passed with Next.js 16.4.5 production output.

## 0.20.0 — Python Foundations Course (M17.2)

- Delivered the first complete Python programming course (`python-programming-foundations`, v1.0.0) authored using the scalable curriculum engine established in M17.1.
- Registered the new `python-programming` subject in `src/lib/learning-curriculum.ts`, expanding the published catalog from 1 course (13 lessons) to 2 courses (29 lessons).
- Authored 16 full lessons across 6 comprehensive modules covering interpreter mechanics, dynamic typing, input/output, arithmetic/logical operators, control flow, loops, strings, lists, tuples, dictionaries, sets, functions, LEGB scope rules, exceptions, context-managed file I/O, and an engineering data analyzer capstone project.
- Incorporated diverse instructional modalities (`theory`, `guided-coding`, `practical-exercise`, `interactive-simulation`, `assessment`) with theory sections, runnable Python code examples, progressive hints, starter code, solutions, and conceptual checkpoints.
- Validated prerequisite DAG relationships across all 16 lessons, ensuring strictly acyclic sequential dependencies.
- Maintained honest runtime boundaries: Python lessons operate cleanly in the 2-panel theory/practice layout with Kat tutor without misleading learners with an unconfigured execution environment.
- Supported seamless dual-enrollment in `src/lib/learning-progress.ts` and Supabase cloud snapshots, preserving existing C course progress without collisions or regressions.
- Enriched Kat AI tutor context generation with Python curriculum metadata, maintaining strict prompt boundaries against simulated code execution.
- Expanded automated testing with 219 unit tests passing across 23 test suites and full Playwright e2e browser test suite passing.

## 0.19.0 — Scalable Curriculum Engine (M17.1)

- Extended curriculum schema in `src/lib/learning-curriculum.ts` with validated Zod schemas supporting diverse instructional modalities: `theory`, `guided-coding`, `practical-exercise`, `interactive-simulation`, and `assessment`.
- Added support for modular theory sections, code examples, interactive system demonstrations (circuits, flowcharts, memory diagrams, state machines), external resources/references, and execution configuration targets.
- Preserved the existing C Programming Foundations course (`c-programming-foundations`) with 5 modules, all 13 lesson IDs, verified sample runs, and URLs with complete backward compatibility.
- Adapted `src/components/learning-experience.tsx` to handle lesson modalities dynamically: automatically switches between 2-panel (Theory + Kat Tutor, collapsing empty code tabs) and 3-panel (with Code sandbox) layouts with independent vertical scrolling and draggable/keyboard splitters.
- Introduced 4-state exercise progress tracking (`not-started`, `attempted`, `completed`, `needs-review`) in `src/lib/learning-progress.ts` with interactive controls in both Lesson view and Practice Lab.
- Ensured full backward compatibility for learning progress storage: legacy `katalyst.learning.v1` records without `exerciseProgress` parse cleanly, and completed lessons automatically infer completion for their exercises unless explicitly overridden.
- Enriched Kat AI tutor context generation with structured lesson metadata, theory sections, code examples, exercise details, hints, and learner progress status, enforcing the strict prompt boundary: Kat must never claim code execution without verified runtime output.
- Authored comprehensive curriculum authoring guide in `docs/CURRICULUM_AUTHORING.md` covering metadata specs, validation rules, publication checklists, and a copy-pasteable reference lesson.
- Expanded automated test coverage: 213 unit tests passing across 23 test suites; 43 passing Playwright e2e browser tests; clean production build with Next.js 16.4.5.

- Diagnosed and fixed the Wasmer browser-based C11 compiler input stream: implemented `programExpectsStdin` pattern matching and `normalizeStdin` line-buffer normalization (CRLF conversion, trailing newline preservation), prefilled lesson sample input directly into stdin when opening curriculum examples, and added execution confirmation when stdin-expecting programs lack input.
- Designed a hybrid compiler execution architecture for multi-language curricula (C/C++, Python, Java, JavaScript, HTML/CSS) and electronics simulation (Falstad, Wokwi, ngspice); published detailed trade-offs, security, and cost assessments in `docs/COMPILER_ARCHITECTURE.md`, and built the provider-neutral execution interface in `src/lib/execution/`.
- Implemented persistent Kat tutor conversation memory under `katalyst.tutor.v1` (`src/lib/tutor-storage.ts`), supporting up to 50 named threads with up to 100 messages, thread creation, clearing, renaming, deletion, teaching mode preservation, duplicate turn prevention on retry, generation stop controls, and Supabase account snapshot synchronization.
- Redesigned the learning workspace into three independently scrolling panels (Theory, Code, Kat Tutor) with independent vertical scrollbars (`overflow-y: auto`, `min-height: 0`), draggable and keyboard-accessible splitters (`role="separator"`, `aria-orientation="vertical"`), persisted layout state (`katalyst.workspace-layout.v1`), and mobile tab preservation without component unmounting.
- Reorganized Settings into 8 dedicated categories (`account`, `appearance`, `ai-models`, `usage-credits`, `learning`, `workspace`, `privacy`, `admin`), combining AI providers and models and strictly isolating admin controls behind server-verified authorization.
- Added a dedicated Usage & Credits panel displaying real-time shared Cloudflare Workers AI gateway status, active model, visual credit allowance meter, BYOK zero-credit notice, and recent AI request telemetry with provider filtering.
- Published a dedicated production deployment guide (`docs/DEPLOYMENT.md`) explaining host platform secret configuration, security invariants, and verification steps.
- Expanded test coverage across all new subsystems: 207 unit tests passing across 23 test suites (testing integer input using `scanf()`, multiple inputs, multiple lines, CRLF, EOF, compilation errors, runtime errors, infinite loop timeouts, output limits, and tutor mode isolation) and 43 passing Playwright e2e browser tests.

## 0.17.0 — Shared AI Gateway, Credits, BYOK, Admin Controls & Brevo (M15)

- Established a central server-side AI Gateway routing all shared Cloudflare Workers AI inference through a strict 11-step pipeline: identity verification, rate limiting, kill-switch checks, model lock, input bounds, atomic credit reservation, settlement, and permanent usage logging.
- Introduced AI Credit accounting: authenticated users receive a monthly credit allowance (default 1,000 credits) resetting automatically at UTC calendar month boundaries without rollover. Model credit weights scale deductions proportionately based on actual provider-reported tokens or conservative text-length estimations.
- Added restricted server-issued guest trials (default 50 credits) backed by HMAC-SHA256 signed tamper-resistant session cookies and privacy-conscious IP salt hashing to prevent abuse or trial resets through browser storage deletion.
- Enforced clean quota exhaustion states in Kat tutor and the workspace, providing structured prompts to sign in with Google or switch to Bring-Your-Own-Key (BYOK) providers.
- Maintained complete isolation for BYOK providers (Gemini, OpenAI, OpenRouter, and local Ollama): BYOK inference consumes zero KATALYST shared credits and never automatically falls back to Cloudflare or vice versa.
- Implemented an administrative control suite in Settings with server-verified admin authorization, an emergency global AI kill switch, live usage telemetry, policy adjustments, and audited change logging.
- Integrated Brevo (Sendinblue) transactional email client with consent-aware, non-blocking workflows for welcome messages, credit warnings, and quota exhaustion notifications.
- Added comprehensive unit test coverage for credit calculations, UTC periods, guest session cryptography, sliding-window rate limits, and Brevo delivery failure resilience (180 tests passing).


## 0.16.0 — Optional accounts and cloud persistence (M14)

- Added Google OAuth through Supabase Auth with PKCE, cookie session refresh in Next.js 16 `proxy.ts`, verified server-side account routes, and stable Auth user IDs/profile records.
- Added a Supabase Postgres account snapshot and migration ledger with RLS, live-session ownership checks, an atomic revision compare-and-save, and idempotent guest migration markers.
- Preserved guest-first local storage and added explicit move, merge, account-copy, sign-out, and cross-device conflict choices. Device guest copies remain separate and are restored on sign-out/deletion.
- Synced workspace/projects/conversations/messages, learning progress, and appearance preferences after explicit choice. Session BYOK keys, AI activity, playground drafts, and Kat tutor turns remain outside account snapshots.
- Added private account export and typed-confirmation deletion. Permanent Auth deletion uses the server-only service key and cascades active account data; managed database backup retention remains controlled by the Supabase project plan.
- Added account schema, merge, authorization route tests and a pgTAP RLS/ownership test. Updated account setup, migration, conflict, export, deletion, retention, and security documentation.
- Verified on 2026-11-10: lint and typecheck passed; 165 unit tests passed across 19 files; 41 Playwright tests passed and the existing opt-in Wasmer browser compiler test was skipped; the Next.js 16.4.5 production build passed. OAuth and account API tests use mocked Supabase clients. No live Google OAuth or Supabase project was configured, and the 15-assertion pgTAP suite could not run because Supabase CLI, Docker, and psql are unavailable. See the M14 roadmap verification record for the limits of that evidence.

## 0.15.0 — Product consistency and learning quality

- Added per-request KATALYST/Kat surface and selected provider/model metadata to the shared provider prompt contract; explicitly documented the unknown upstream model behind OpenRouter free routing and the unavailable web/execution capabilities.
- Added provider/model route provenance to each transient Kat response and limited quick actions to lesson, source, diagnostics, or output context that is actually available.
- Corrected primary-action text contrast in Light and Dark themes and added visible keyboard focus treatment to links and selects.
- Added validated bounded expected-run records and learner-visible sample input, expected output, and sandbox file results for all thirteen published C examples. Clarified that these results are not graded and generated files stay in the temporary browser sandbox.
- Added system-compiler regression coverage for all authored C examples and browser coverage for route metadata, tutor actions, theme contrast, and narrow layouts.
- Documented the course authoring/publication review, M13 behavior, limitations, and staged M14 planning.
- Verified on 2026-11-10: lint and typecheck passed; 150 unit tests passed across 16 files, including native compilation/output checks for all thirteen C lessons; 41 Playwright tests passed and one opt-in Wasmer browser compiler test was skipped; the Next.js 16.4.5 production build passed. Provider responses and catalogs were mocked; no live provider requests were made.

## 0.14.0 — Course content, learning architecture, and skills

- Replaced the six-lesson presentation-bound course shape with validated `LearningSubject`, `LearningCourse`, `LearningModule`, `LearningLesson`, `LearningObjective`, `LearningExercise`, and `LearningCheckpoint` catalog data while preserving the `c-programming-foundations` course ID, all six original lesson IDs, and the separate `katalyst.learning.v1` record.
- Expanded C Programming Foundations to five ordered modules and thirteen lessons. Existing lessons remain in order; new coverage includes input/output, operators, strings, pointers, structures/unions, file handling, and an integrated program. Introduction and first program are taught together to avoid duplicating the existing first lesson.
- Added strict catalog validation for unique IDs, published course availability, module/lesson order, subject/objective/prerequisite references, field bounds, and matching Markdown fences. Learner pages derive from published courses; draft catalog entries remain hidden.
- Kept course content separate from lesson presentation, added exercise difficulty/expected outcomes/optional starter code and separate checkpoints, and made the C editor conditional on a C course subject.
- Preserved old completion records and manual completion semantics. New lesson totals are derived from the current catalog without inventing completion history.
- Refined Kat's four prompt-guided modes and question-first lesson context; added an unchecked-by-default option for enabled workspace skills, a separate 3,000-character context cap, and per-request applied/omitted skill visibility. Disabled skills remain excluded and imported instructions remain untrusted text without script or tool execution.
- Updated curriculum, progress, Kat, responsive course, and browser coverage plus README, product vision, architecture, roadmap, skills, and development documentation.
- Verified on 2026-11-09: lint and typecheck passed; 147 unit tests passed across 16 files; 40 Playwright tests passed and the optional real compiler integration was skipped; the Next.js 16.4.5 production build passed. All thirteen authored C examples were compiled with strict C11 warnings and run with sample input. Tutor/provider browser responses were mocked; no live inference was performed.

## 0.13.0 — Interface consistency and final workspace polish

- Kept CodeMirror, C Playground code, lesson code examples, terminal output, and assistant code blocks on dark graphite surfaces in both Light and Dark themes, with higher-contrast code foreground, comments, gutters, cursor, and selection tokens. Normal cards and editor controls retain their regular theme surfaces.
- Made the collapsed desktop/tablet sidebar a 76px icon rail with accessible names, native title tooltips, both navigation groups, a visible toggle, selected-item styling, and only the compact avatar at the bottom. Removed the tablet rule that expanded it and restored clipped labels; phone navigation remains an overlay drawer.
- Made Kat's conversation a bounded independent scroll region above its in-flow composer. New content follows only while the reader is already near the bottom; the textarea grows for multiline input up to 130px, Enter sends, and Shift+Enter inserts a newline.
- Added browser coverage for editor and lesson-code colors in Light/Dark, rail visibility and keyboard use at desktop/laptop/tablet widths, and Kat's long responses, scroll preservation, composer flow, and multiline sizing. No provider adapter, dependency, local data schema, or user data was changed.
- Verified on 2026-11-09: lint and typecheck passed; 138 unit tests passed across 15 files; 38 Playwright tests passed with the existing optional C compiler integration skipped, followed by a passing focused collapsed-rail browser rerun; the Next.js 16.4.5 production build passed. Provider calls in browser tests were mocked; the real compiler download/integration was not run.

## 0.12.0 — Final UX corrections and Cloudflare Workers AI discovery fix

- Removed the sticky lesson breadcrumb/tabs, restored a single main lesson scroll area, balanced the wide lesson/workbench/Kat columns, and kept the Kat composer in its panel beneath an independently scrolling conversation.
- Fixed the tablet sidebar collapse rail and added outside-pointer/Escape dismissal for provider and model menus while preserving interactions inside each menu.
- Fixed Cloudflare's zero-compatible-model result: discovery previously retained only two hardcoded IDs, handled task metadata as a string, and could prefer a non-catalog internal ID. It now paginates the account catalog, parses its response/task shapes, preserves returned `@cf/...` IDs, and diagnoses raw versus compatible counts.
- Split Cloudflare catalog refresh from user-triggered **Test inference**; inference uses only a currently listed model and reports real success/failure without switching providers or models.
- Added mocked discovery, error, inference, picker, sidebar, layout, and failed-refresh regression coverage. Playwright can use `KATALYST_E2E_PORT` and starts with provider credentials cleared.
- Verified on 2026-11-09: lint and typecheck passed; 138 unit tests passed across 15 files; 36 Playwright tests passed and the optional real compiler integration was skipped; the Next.js 16.4.5 production build passed. All provider catalog and inference responses were mocked; no live Cloudflare account request or inference was made.

## 0.11.0 — Final UI/UX stabilization and product readiness

- Replaced the dominant green treatment with warm neutral, graphite, burnt-orange, and amber theme tokens for Light, Dark, and System modes; added a reusable geometric KATALYST brand mark and SVG app icon.
- Rebuilt Settings as a keyboard-accessible single-category tabset with responsive navigation and in-session category preservation.
- Fixed provider catalog refresh to send the current credential draft, report credential/authentication/catalog/inference outcomes separately, preserve clear Gemini auth and malformed-response errors, and require explicit model selection after catalog changes.
- Reworked the standalone C Playground into a larger viewport-filling C Workbench with resizable editor/output panes and distinct compiler diagnostics, stdout, and stderr channels.
- Added regression coverage for settings categories, provider and model state, Gemini errors, output clearing, and Workbench layout at desktop, laptop, tablet, and mobile widths.
- Verified on 2026-11-09: lint and typecheck passed; 133 unit tests passed across 15 files; 32 Playwright tests passed and the optional real compiler integration was skipped; the Next.js 16.4.5 production build passed. Provider requests/catalogs were mocked; no live provider inference was used.

## 0.10.0 — Product experience and local Progress dashboard

- Added Light, Dark, and System themes, comfortable/compact reading density, semantic color tokens, and validated local appearance preferences.
- Improved the integrated Learn / Code / Kat workspace scroll behavior, retained mobile tabs and state, made the compiler output resizable, and lazy-loaded the C playground component.
- Added per-conversation rename, pin/unpin, move, confirmed delete, action feedback, and a credential-redacted transcript-only Markdown download. Pinned conversations have a dedicated sidebar section; public sharing is not available.
- Rebuilt Progress around actual local lesson events, workspace records, and bounded AI request activity. Request counts include failed/stopped attempts; token counts are shown only when providers report them. No costs or historical events are fabricated.
- Organized Settings into Appearance, AI Providers, Models, Learning, Workspace, Privacy/Security, and Account. Guest access stays available; the account entry clearly explains that registration and synchronization are not implemented.
- Preserved Cloudflare Workers AI as the default hosted provider and kept all existing provider adapters, credentials, curated model selection, and no-fallback behavior.
- Reviewed the one-app architecture and split local curriculum, workspace, inference, and browser compiler concerns without adding databases or paid hosting services.
- Added unit and Playwright coverage for preference/analytics storage, actions/export, guest messaging, theme persistence, dashboard activity, wheel scrolling, and existing provider/compiler flows.
- Updated README, AGENTS, product vision, architecture, roadmap, provider, security, development, and decisions documentation.
- Verified on 2026-11-09: lint, typecheck, 130 unit tests, 30 browser tests (one optional compiler integration test skipped), and production build passed. The production route assets measured 555,670 bytes raw / 167 KiB gzip; the lazy playground chunk measured 441,120 bytes raw / 139 KiB gzip. Provider calls and catalogs were mocked; no live provider inference was used.

## 0.9.0 — Integrated AI learning workspace

- Integrated lesson content, the editable C11 CodeMirror playground, and Kat into a responsive Learn / Code / Kat workspace, with mobile tabs that preserve lesson state and drafts.
- Prepared the Wasmer compiler on lesson entry with progress, cache reuse, retry, and Run gating.
- Added explicit Kat code-help actions with bounded lesson, current source, diagnostics, output, tutor style, and recent-turn context. Editing, compiling, and running alone do not send code; Kat does not execute programs or claim it ran them.
- Made Cloudflare Workers AI the default hosted provider while retaining OpenAI, Gemini, OpenRouter, and Ollama. Added account-scoped model discovery, tab-only credentials with explicit save/clear controls, provider status, and normalized setup/catalog/authentication/quota/model/timeout/network errors without fallback.
- Refined provider settings and model selection, added a persistent collapsible desktop navigation and clickable KATALYST breadcrumb, and kept the existing visual system.
- Added Cloudflare adapter and route tests plus browser coverage for integrated Kat context, compiler preparation/retry, responsive tabs, and navigation persistence.
- Verified on 2026-11-09: lint, typecheck, 116 unit tests, 26 browser tests, the optional real Chromium C11 compile/run from an integrated lesson, and the Next.js 16.4.5 production build passed. The real compiler initialization took about five minutes in this fresh browser context. Cloud provider calls and discovery were mocked; no live provider inference or account access was tested.

## 0.8.0 — Connected engineering studio experience

- Added a first-class C11 playground connected to the authored lessons. Lesson examples load into a persistent local editor, accept stdin, compile to WebAssembly, show compiler diagnostics, and run in a browser-local Wasmer sandbox.
- Added bounded source, stdin, output, compilation, and run limits plus explicit first-use compiler download progress, stop, network-disabled guest execution, and versioned local draft storage.
- Added lesson-scoped URL/hash navigation with browser back/forward restoration and a persistent contextual Kat drawer.
- Refined design documentation around the learning home, lesson, and experiment flow while retaining the deep-green and warm-ivory visual identity and responsive layouts.
- Added unit and browser checks for URL restoration, example handoff, and draft persistence; separated the network-dependent compiler integration check from the default browser suite.
- Updated setup, architecture, security, roadmap, product, and design documentation. Verified on 2026-11-09: lint, typecheck, 98 unit tests, 22 default browser tests, a separate real Chromium C compile/run, and production build passed; the 106 MiB compiler download is skipped by the default browser suite.

## 0.7.0 — Learning-first product foundation

- Reframed KATALYST around engineering learning and made Learning Home, learning paths, My Learning, Practice Lab, Progress, and AI Tutor primary navigation.
- Added original C Programming Foundations curriculum with three modules, six complete lessons, objectives, practical code examples, and self-check exercises.
- Added separate validated local enrollment and manual lesson-completion storage without modifying existing workspace records or version 1 backups.
- Added the lesson workspace, previous/next lesson navigation, checkpoint hints, and an explicit completion action.
- Added Kat with Concept teacher, Socratic tutor, Practical mentor, and Exam coach modes. Lesson context is sent through the existing selected provider; tutor turns remain transient.
- Added Practice Lab suggested answers and clear boundaries: no browser code execution, answer grading, automatic completion, or mastery scoring.
- Reorganized the workspace so projects, chat, skills, and provider infrastructure remain available as secondary tools.
- Updated the product vision and design direction, architecture, provider, skill, security, roadmap, README, and contributor guidance.
- Verified on 2026-11-09: lint, typecheck, 93 unit tests, 20 browser tests, and production build passed. Provider and tutor requests were mocked; no live inference was used.

## 0.6.0 — Chat Markdown rendering

- Rendered assistant messages as CommonMark and GFM without changing stored message text or provider adapters; user messages retain their plain-text view.
- Added headings, emphasis, nested lists, blockquotes, tables, safe links, inline code, and language-aware highlighting for fenced code blocks.
- Added accessible copy-code controls, whitespace-preserving horizontal code scrolling, responsive table scrolling, and renderer security rules that ignore raw HTML and omit images.
- Added component tests, provider-normalization checks, and browser coverage for Markdown responses through OpenAI, Gemini, OpenRouter, and Ollama.
- Updated architecture, provider, security, roadmap, and setup documentation.
- Verified on 2026-11-09: lint, typecheck, 85 unit tests, 17 browser tests, and production build passed. Provider responses were mocked; no live inference was used.

## 0.5.0 — Storage reliability and local AI

- Added validated startup reads for the current raw workspace record and compatible earlier v1 records, with explicit corrupt/unsupported/unavailable recovery states and no automatic overwrite after failed initialization.
- Added validated salvage, original-record download, confirmed fresh-workspace recovery, bounded writes, and unchanged v1 backup compatibility. Deferred IndexedDB migration until a dual-read and rollback strategy is designed.
- Added optional Ollama discovery and non-streaming local text generation for models already installed on the KATALYST host. No API key, model download, automatic fallback, or remote custom URL is used.
- Restricted Ollama URLs to loopback on port 11434 and blocked local inference requests to non-loopback KATALYST hosts.
- Added approximate installed model-size and quantization metadata with context and hardware limitations.
- Added request cancellation, retry, assistant regeneration, user-message edit/resend, message copy, and local conversation search.
- Added provider-reported token usage and OpenRouter-reported cost without estimating missing values; Ollama usage is labeled local, with no cloud charge.
- Added storage compatibility/recovery, Ollama discovery/generation/security, usage, and browser conversation tests.
- Verified on 2026-11-08: lint, typecheck, 81 unit tests, 13 browser tests, and production build passed. Provider network calls were mocked; no live local Ollama service or cloud API was used.

## 0.4.0 — Workspace portability and skill ecosystem

- Added strict version 1 JSON backups for full workspaces, projects, and conversations, with provider/model preferences and skill data but no credential state.
- Added Zod validation, size/record limits, skill sanitization, credential redaction, default safe merge, ID remapping, and confirmed full-workspace replacement.
- Added searchable Installed/Available skill views, source/license/compatibility metadata, enable/disable controls, and Markdown skill export.
- Added Skill Issue link-out discovery with explicit source/license review and manual Markdown import; no undocumented API, scraper, or remote auto-install is used.
- Added portability, schema, malicious skill, credential exclusion, transaction, and browser interaction coverage.
- Updated the backup, skill, migration, and local-only limitations in project documentation.
- Verified on 2026-11-08: lint, typecheck, 64 unit tests, 9 browser tests, and the production build passed. No live provider calls were made.

## 0.3.0 — Dynamic models, OpenRouter, and session BYOK

- Added key-scoped, paginated Gemini model discovery using Google's official models API.
- Added OpenRouter Chat Completions and dynamic text-model catalog with reported prices, context limits, capabilities, and exact provider-qualified IDs.
- Added the verified `openrouter/free` routing choice, with no automatic paid-model fallback.
- Added searchable model selection, free/paid filters, refresh controls, model metadata, and provider-specific setup errors.
- Added optional per-tab API keys sent to the server in a request header; keys clear on reload and are not persisted.
- Kept OpenAI's existing adapter/catalog working and documented why arbitrary custom endpoints are not accepted.
- Added tests for discovery, pagination, pricing, errors, adapter routing, session key transport, secret redaction, and persistence behavior.
- Updated provider, security, architecture, roadmap, and setup documentation.

## 0.2.0 — Multi-provider AI and skill execution

- Added a server-side Google Gemini `generateContent` adapter while preserving the OpenAI Responses adapter.
- Added provider/model selection, a shared supported-model catalog, server-only key readiness, and provider-specific setup guidance.
- Routed enabled skill and project instructions as bounded, deduplicated untrusted user context; displayed applied and omitted skills with each prompt.
- Preserved imported Markdown metadata and source filenames, sanitized control characters and script blocks, and kept script execution disabled.
- Added provider, route, skill-composition, and prompt-boundary tests; refreshed setup, architecture, security, roadmap, and provider docs.

## 0.1.0 — Initial foundation

- Created the KATALYST Next.js workspace shell with local projects and conversations.
- Added server-side OpenAI Responses API integration with explicit key and provider errors.
- Added local built-in skills, Markdown import and inspection, activation, and request application.
- Added model settings, project instructions, and product/security documentation.
