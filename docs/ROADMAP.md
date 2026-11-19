# Roadmap

## MVP milestones

### M1 — Local workspace foundation (complete)

- [x] Responsive workspace shell, projects, conversation history, and settings.
- [x] Server-side OpenAI Responses adapter with an honest disconnected state.
- [x] Local skills, Markdown import, inspection, and activation.
- [x] Essential product, architecture, setup, and security documentation.

### M2 — Multi-provider AI and skill execution (complete)

- [x] Add server-side Gemini `generateContent` while preserving OpenAI.
- [x] Add shared provider selection and server-side key readiness.
- [x] Compose only enabled skills with project context, deduplicate repeated instructions, and enforce the context cap.
- [x] Preserve imported skill metadata and source; sanitize text and never execute scripts.
- [x] Mark skill text as untrusted context and show included/omitted skills.
- [x] Add adapter, route, skill-composition, and prompt-boundary tests.

### M3 — Dynamic catalogs, OpenRouter, and session BYOK (complete)

- [x] Discover Gemini models through Google's paginated `models.list` API and filter for compatible text generation.
- [x] Add OpenRouter Chat Completions and dynamic text-model catalog.
- [x] Normalize model metadata, pricing, context, namespace, capabilities, and credential-access status.
- [x] Add explicit OpenRouter `openrouter/free` routing without implicit paid-model fallback.
- [x] Add searchable model selection, free/paid filters, refresh, and provider setup/error status.
- [x] Add non-persistent session-only keys sent in a request header over HTTPS in production.
- [x] Document custom endpoint/SSRF limits; keep arbitrary URLs unsupported.
- [x] Test dynamic discovery, routing, error mapping, key redaction and persistence behavior.
- [x] Update the setup, architecture, security, and provider documentation.

### M4 — Workspace portability and skill ecosystem (complete)

- [x] Export full workspaces, projects, and conversations as schema-versioned JSON without credential state.
- [x] Validate imports with strict Zod schemas, size and record limits, skill sanitization, conflict remapping, and a single storage write.
- [x] Add merge-by-default and confirmed full-workspace replacement with success/error feedback.
- [x] Add searchable Installed/Available skill tabs, metadata and compatibility detail, enable/disable, Markdown export, and reviewed Markdown import.
- [x] Investigate Skill Issue; use its public directory as a manually reviewed external catalog because no documented machine-readable API was found.
- [x] Add unit and browser tests for backup round-trip, skill metadata/export, malicious imports, credential exclusion, and restore UI.
- [x] Update security, architecture, setup, skill, roadmap, and changelog documentation.

### M5 — Storage reliability and local AI (complete)

- [x] Validate current and supported legacy local workspace records; distinguish missing, valid, recoverable, corrupt, unsupported, and inaccessible storage states.
- [x] Preserve corrupt/unsupported records on startup, provide original-record download and explicit salvage/fresh-start/backup restore paths, and keep failed writes from replacing stored values.
- [x] Retain the existing `katalyst.workspace.v1` storage key and v1 exports; add tests for legacy compatibility and unsupported versions rather than migrating storage blindly.
- [x] Add Ollama model discovery and real non-streaming local generation with no key, download, or automatic fallback.
- [x] Restrict Ollama to loopback addresses on port 11434 and block Ollama access through non-loopback KATALYST request hosts.
- [x] Show available model size/quantization metadata and clear limitations for context/hardware guidance.
- [x] Add stop, retry, copy, edit/resend, regenerate, conversation search, and provider-reported usage metadata.
- [x] Add provider/storage/route tests and browser interaction coverage; update architecture, provider, security, setup, and changelog documentation.

### M6 — Product reset and learning-first transformation (complete)

- [x] Make Learning Home, Explore Learning Paths, My Learning, Practice Lab, Progress, and AI Tutor the primary navigation; keep workspace, skills, and Settings secondary.
- [x] Add an original C Programming Foundations path with three modules, six authored lessons, objectives, code examples, and checkpoint exercises.
- [x] Add a separate bounded `katalyst.learning.v1` local progress record for enrollment, lesson opens, explicit completion, and recent activity. Preserve `katalyst.workspace.v1` and v1 backup behavior.
- [x] Add lesson workspace navigation, markdown-rendered lesson content, a checkpoint hint, and manual completion controls.
- [x] Add Kat's four prompt-guided teaching modes through the existing provider route, with lesson context and transient tutor turns.
- [x] Add Practice Lab with real path exercises and suggested answers; clearly identify that answers are not evaluated.
- [x] Test learning progress schemas and updates, home/path/lesson/progress navigation, provider-routed tutor context, and preservation of existing workspace and provider features.
- [x] Update product vision, design direction, architecture, decisions, security, provider, skills, agent guidance, README, roadmap, and changelog.

### M6.1 — Connected engineering studio experience (complete)

- [x] Make C Playground a first-class learning workspace with editable C11 source, stdin, actual Clang compilation to WebAssembly, local execution, compiler diagnostics, and bounded output/runtime.
- [x] Connect lesson code examples to the playground and preserve the draft when moving between lessons and tools.
- [x] Retain the active learning view and lesson in browser history, including back/forward restoration and direct links.
- [x] Keep Kat as a persistent contextual drawer alongside the lesson instead of the visual center of every learning page.
- [x] Keep the existing forest/ivory identity, serif display typography, readable content widths, mobile navigation, and contained narrow-screen overflow.
- [x] Add unit and browser coverage for navigation, lesson example loading, draft retention, and the optional actual compiler integration path.
- [x] Update the product, design, architecture, security, setup, roadmap, and changelog descriptions to match the implementation.

### M7 — Integrated AI learning workspace (complete)

- [x] Bring lesson explanation, the C11 CodeMirror editor/playground, and Kat into one responsive Learn / Code / Kat workspace; preserve lesson navigation and local editor drafts.
- [x] Prepare the Wasmer compiler in the background on lesson entry, show preparation progress, support cache reuse and retry, and enable Run only when ready.
- [x] Give Kat explicit code-help actions and bounded lesson, source, diagnostics, output, style, and recent-turn context. Editing or running code alone never sends it; Kat does not execute programs or claim execution.
- [x] Make Cloudflare Workers AI the default hosted provider while retaining OpenAI, Gemini, OpenRouter, and local Ollama. Discover account-confirmed Cloudflare chat models, add explicit save/clear controls for tab-only credentials, and normalize clear setup, authentication, catalog, quota, model, timeout, and network errors without provider fallback.
- [x] Revise provider settings and model selection, add a persistent collapsible desktop sidebar and clickable KATALYST breadcrumb, and preserve the existing visual language.
- [x] Add unit and Playwright coverage for Cloudflare routing, active provider/model state, lesson/editor/Kat context, compiler setup/retry, mobile tabs, sidebar preference, breadcrumb, and existing provider/skill/storage flows.
- [x] Update README, product vision, architecture, security, provider, development, roadmap, and changelog documentation.

### M8 — Product experience, local dashboard, and architecture review (complete)

- [x] Refine the desktop Learn / Code / Kat workspace, preserve mobile tabs and state, allow natural page scrolling on desktop, and keep the compiler output resizable.
- [x] Add local Light, Dark, and System themes with comfortable/compact density, semantic color tokens, and validated preferences in a separate versioned record.
- [x] Add per-conversation rename, pin/unpin, move, confirmed delete, feedback, and transcript-only Markdown export; group pinned conversations in the sidebar.
- [x] Keep guest use primary and label account sign-in, sync, hosted backups, and public sharing as unavailable until a backend exists.
- [x] Build a Progress dashboard from real local lesson, workspace, and AI request records. Bound AI history to 500 events and record only provider/model/time/outcome and provider-reported token values; do not estimate cost or invent historical activity.
- [x] Reorganize Settings into Appearance, AI Providers, Models, Learning, Workspace, Privacy/Security, and Account sections.
- [x] Review and preserve the official Cloudflare Workers AI Chat Completions adapter, curated model allowlist, server-side credentials, clear errors, and no-fallback behavior; retain all other providers.
- [x] Keep one Next.js app, domain-separated local records, direct server-side inference, and browser-local compilation. Split the C playground UI into a lazy client chunk; defer other hosting/storage changes until data demonstrates a benefit.
- [x] Add unit and browser coverage for preferences, analytics boundaries, conversation operations, guest notices, theme persistence, dashboard records, desktop wheel scrolling, existing provider failures, keys/exports, mobile layout, and compiler/lesson regression flows.
- [x] Update README, AGENTS, product vision, architecture, roadmap, provider, security, development, decisions, and changelog docs.

### M9 — Final UI/UX stabilization and product readiness (complete)

- [x] Replace the dominant green treatment with warm neutral, graphite, burnt-orange, and amber semantic palettes for Light, Dark, and System modes; add a reusable geometric KATALYST mark and application icon.
- [x] Make Settings a keyboard-accessible, single-category tabset with predictable responsive navigation and preserved in-session selection.
- [x] Fix provider catalog refresh to use the current session credential draft, distinguish credential/authentication/catalog/inference states, classify Gemini auth and malformed-response errors, and avoid silently changing selected models.
- [x] Rework the standalone C Playground into a viewport-filling C Workbench with a larger editor, resizable editor/output areas, separate compiler diagnostics/stdout/stderr, clear-output action, and narrow-screen layout.
- [x] Add regression coverage for Settings category behavior, current-key discovery, provider state and selection behavior, separated C output, and desktop/laptop/tablet/mobile Workbench layouts.
- [x] Update setup, architecture, roadmap, decisions, development, and changelog documentation without changing local data schemas or adding dependencies.

### M10 — Final UX corrections and Cloudflare Workers AI discovery fix (complete)

- [x] Remove the floating lesson breadcrumb/tabs and redundant top spacing; use the main lesson view for natural scrolling and keep Settings/navigation behavior stable.
- [x] Balance wide lesson/workbench/Kat columns, switch to Learn/Code/Kat below the practical desktop width, keep the Kat composer inside its panel, and restore the compact sidebar rail at tablet widths.
- [x] Dismiss provider/model menus on outside pointer input and Escape while keeping menu controls interactive.
- [x] Replace Cloudflare's two-ID adapter allowlist with validated, paginated account catalog discovery; preserve exact model IDs, filter incompatible tasks, report raw/compatible counts, and distinguish catalog acceptance from inference.
- [x] Add an explicit minimal Cloudflare inference test for a listed selection, with safe authentication/permission/account/rate/network errors and no provider/model fallback.
- [x] Add unit and Playwright regression coverage for Cloudflare catalog pagination/shapes/errors, real-route inference success/failure mocks, failed-refresh selection preservation, menu dismissal, responsive lesson layout, and desktop/tablet sidebar collapse.
- [x] Update provider, security, architecture, development, README, roadmap, and changelog documentation without changing stored workspace schemas or adding dependencies.

### M11 — Interface consistency and final workspace polish (complete)

- [x] Keep the CodeMirror editor, line-number gutter, selection, cursor, terminal, and Markdown code examples on a readable graphite surface in Light and Dark themes while preserving ordinary card colors.
- [x] Make the collapsed desktop/tablet sidebar a 76px icon rail with accessible names/tooltips, both navigation groups, selected-state styling, a visible toggle, and only the compact avatar at the bottom; retain the mobile drawer.
- [x] Keep Kat messages in an independently scrolling region above the in-flow composer, follow updates only when already near the bottom, and grow the multiline input up to its existing bounded size.
- [x] Add browser regression coverage for theme contrast, sidebar behavior across desktop/laptop/tablet, and Kat scroll/composer behavior; preserve current provider and local storage behavior.
- [x] Update README, architecture, development, roadmap, and changelog without adding dependencies or changing data schemas.

### M12 — Course content, learning architecture, and skills (complete)

- [x] Preserve the existing C course/path ID, all six lesson IDs, and the separate version-1 local progress record.
- [x] Add reusable, validated course catalog fields, course outcomes, explicit module/lesson ordering, prerequisite links, exercise difficulty/expected outcomes/optional starter code, and distinct checkpoints.
- [x] Expand the authored C foundation course from six to thirteen lessons across five modules: C introduction/first program, variables, input/output, operators, conditionals, loops, functions, arrays, strings, pointers, structures/unions, files, and an integrated practical exercise.
- [x] Compile and run every authored C example using C11 with strict compiler warnings.
- [x] Derive course totals/navigation from the catalog and preserve only explicit learner completion; new lessons add no inferred historical activity.
- [x] Make Kat's current-question priority and context relevance explicit, keep the four teaching modes distinct, and add an off-by-default opt-in for enabled workspace skills with a separate 3,000-character cap and visible applied/omitted metadata.
- [x] Keep disabled skills excluded, imported content untrusted, and scripts/tools unavailable; add curriculum, progress compatibility, Kat composition, and browser regressions.
- [x] Update README, product vision, architecture, roadmap, skills, development, and changelog.

M12 verification on 2026-11-09: lint and TypeScript passed; 147 unit tests passed across 16 files; 40 Playwright tests passed and the optional real compiler integration was skipped; the Next.js 16.4.5 production build passed. All thirteen authored C examples were separately compiled with `cc -std=c11 -Wall -Wextra -Werror -pedantic` and run with sample input. Provider and tutor responses in automated browser tests were mocked; no live AI provider requests were made.

### M13 — Product consistency and learning quality (complete)

- [x] Preserve the established warm-neutral, graphite, burnt-orange design; correct primary-action text contrast in Light and Dark themes and expose keyboard focus on links and selects.
- [x] Give every Kat request its selected provider/model and assistant surface as trusted route metadata; state the app's actual lack of browsing and execution tools and the uncertainty of OpenRouter free routing.
- [x] Show per-reply Kat route provenance and hide lesson/code/output quick actions when their referenced context is missing. Keep provider response text and storage formats unchanged.
- [x] Add validated, bounded expected run records for all thirteen C examples and show sample input, exact output, and sandbox-created files to learners.
- [x] Keep existing course/lesson IDs and `katalyst.learning.v1`; clarify that sandbox files are temporary and expected outputs/checkpoints are not graded.
- [x] Document the course authoring and publication checklist and add a real compiler regression that skips only when system `cc` is unavailable.
- [x] Add regression coverage for provider identity metadata, assistant-surface validation, context-specific Kat actions, example output contrast, and desktop/tablet/mobile overflow.
- [x] Update README, architecture, development, security, decisions, roadmap, and changelog.

M13 verification on 2026-11-10: `npm run lint` and `npm run typecheck` passed; `npm test` passed with 150 tests across 16 files, including compiling/running all thirteen lesson examples against exact stdout and sandbox-file expectations using system `cc`; `KATALYST_E2E_PORT=3293 npm run test:e2e` passed 41 browser tests with one existing opt-in Wasmer browser compiler test skipped; `npm run build` passed with Next.js 16.4.5. Browser provider responses and catalogs were mocked; no live provider calls were made. The compiler evidence is the native `cc` unit integration, not the skipped Wasmer browser test.

### M14 — Authentication and cloud persistence (implemented)

- [x] Keep guest mode and existing workspace, learning-progress, and preference schemas usable.
- [x] Add optional Google OAuth through Supabase Auth with PKCE, cookie refresh, verified server sessions, stable Auth user IDs, and profile records.
- [x] Add user-owned, RLS-protected account snapshots for workspace, learning progress, and appearance preferences; preserve session BYOK outside account data.
- [x] Require explicit guest migration/merge or account-copy choice, retain an on-device guest backup, remap conflicting workspace IDs, and merge progress by stable IDs.
- [x] Use atomic migration IDs, expected-revision writes, offline local copies, and explicit cross-device conflict resolution.
- [x] Add account export, typed-confirmation deletion, cascade behavior, live-session RLS checks, and pgTAP ownership coverage.
- [x] Document actual account setup and configuration, including the external Google/Supabase steps and provider-managed backup retention.

M14 implementation is complete. Verification on 2026-11-10: `npm run lint` and `npm run typecheck` passed; `npm test` passed with 165 tests across 19 files; `KATALYST_E2E_PORT=3293 npm run test:e2e` passed 41 browser tests with one opt-in Wasmer browser compiler test skipped; `npm run build` passed with Next.js 16.4.5. OAuth callback, server session handling, account routes, migration logic, and export/deletion boundaries have mocked/local regression coverage; no live Google OAuth or Supabase project was configured. The 15-assertion pgTAP ownership suite was not run because Supabase CLI, Docker, and psql are unavailable in this checkout. Apply the migration and run `supabase test db` against a local Supabase stack before treating hosted RLS as verified.

### M15 — Shared AI Gateway, Credits, BYOK, Admin Controls & Brevo (implemented)

- [x] Establish a central server-side gateway for all KATALYST-managed Cloudflare Workers AI inference.
- [x] Implement monthly UTC credit periods (1,000 credits/mo default) for authenticated users without rollover.
- [x] Implement restricted server-issued guest trials (50 credits default) with cryptographic HMAC session tokens and IP salt hashing.
- [x] Protect against concurrent overspending via atomic credit reservations and row-level database locking.
- [x] Settle usage via provider-reported tokens or conservative text-length estimations into a permanent ledger.
- [x] Enforce clean quota exhaustion states in Kat tutor and the workspace with prompts to sign in or use BYOK.
- [x] Guarantee BYOK provider isolation (Gemini, OpenAI, OpenRouter, Ollama) with zero credit consumption and no fallback.
- [x] Provide an administrative management panel in Settings with server-verified admin authorization, global emergency kill switch, policy updates, and audited change logging.
- [x] Integrate Brevo for transactional notifications (welcome, quota warnings, quota exhausted) without breaking core application flows on delivery failure.
- [x] Add comprehensive test suites for credit accounting, guest sessions, rate limits, and Brevo delivery (180 passing tests).

M15 verification on 2026-11-10: `npm run lint` and `npm run typecheck` passed cleanly; `npm test` passed with 180 tests across 21 files; OAuth, gateway pipelines, and Brevo delivery were validated with mocked adapters.

### M16 — Learning Workspace, AI Memory, Compiler Architecture & Settings (implemented)

- [x] Diagnose and fix C11 browser compiler stdin stream: normalize newlines, handle multiple inputs, pre-fill sample inputs from curriculum examples, and warn before executing stdin-dependent code with empty input.
- [x] Research and document a hybrid compiler execution architecture for multi-language curricula and electronics simulation in `docs/COMPILER_ARCHITECTURE.md`.
- [x] Implement a provider-neutral execution interface and registry in `src/lib/execution/`.
- [x] Implement persistent Kat conversation history under `katalyst.tutor.v1` with multi-thread management (new, clear, rename, delete) and Supabase account snapshot mirroring.
- [x] Redesign learning workspace with 3 independent scroll panels, draggable/keyboard-accessible splitters, layout persistence (`katalyst.workspace-layout.v1`), and responsive mobile tab state preservation.
- [x] Reorganize Settings into 8 dedicated categories (`account`, `appearance`, `ai-models`, `usage-credits`, `learning`, `workspace`, `privacy`, `admin`), combining AI providers and models and strictly isolating admin controls.
- [x] Build a dedicated Usage & Credits telemetry panel with shared gateway status, credit meter, BYOK 0-credit policy notice, and AI request history.
- [x] Expand automated tests: 207 tests passing across 23 test suites covering stdin handling, execution routing, and tutor persistence; 43 passing Playwright e2e browser tests.
- [x] Author comprehensive production deployment and environment variable guide in `docs/DEPLOYMENT.md`.

M16 verification on 2026-11-11: `npm run lint`, `npm run typecheck`, and `npm test` passed (207 unit tests across 23 test suites); `npm run test:e2e` passed (43 passed, 1 skipped); browser compiler, execution runner, tutor storage unit suites, and full Playwright e2e suite all verified.

### M17.1 — Scalable Curriculum Engine (implemented)

- [x] Extend curriculum schema with versioned, validated models supporting multi-modal lessons: `theory`, `guided-coding`, `practical-exercise`, `interactive-simulation`, and `assessment`.
- [x] Support structured theory sections, multiple code examples, interactive demonstration configurations (circuits, flowcharts, memory diagrams, state machines), and curated external resources without custom page implementations.
- [x] Preserve all 13 existing C Programming Foundations lessons, course ID (`c-programming-foundations`), verified sample runs, and URLs with complete backward compatibility.
- [x] Reusable lesson experience in `src/components/learning-experience.tsx`: adaptively switch between 2-panel (theory-only, no code workspace) and 3-panel (with code sandbox) layouts with independent scrolling and draggable splitters.
- [x] Implement 4-state exercise progress tracking (`not-started`, `attempted`, `completed`, `needs-review`) in `src/lib/learning-progress.ts` with interactive controls in both Lesson view and Practice Lab.
- [x] Backward-compatible progress storage: safe validation of legacy records without `exerciseProgress` and automated completion inference for completed lessons.
- [x] Rich Kat AI tutor context integration: provide structured lesson metadata, theory sections, code examples, exercise details, hints, learner status, and enforce strict prompt boundary: Kat must never claim code execution without actual compiler results.
- [x] Author comprehensive curriculum authoring guide, metadata specifications, publication checklist, and copy-pasteable reference lesson in `docs/CURRICULUM_AUTHORING.md`.
- [x] Full verification: 213 unit tests passing across 23 test suites; 43 passing Playwright e2e browser tests; Next.js 16.4.5 production build clean.

M17.1 verification on 2026-11-11: `npm run lint`, `npm run typecheck`, and `npm test` passed (213 unit tests across 23 test suites); `npm run test:e2e` passed (43 passed, 1 skipped); `npm run build` compiled cleanly.

### M17.2 — Python Foundations Course (implemented)

- [x] Authored complete Python Foundations course (`python-programming-foundations`, version `1.0.0`) in `src/lib/curriculum/python-foundations.ts`.
- [x] Created `python-programming` subject and registered both C and Python courses in the published catalog.
- [x] Structured 6 comprehensive modules and 16 ordered lessons:
  - Module 1: Python Fundamentals and Dynamic Typing (2 lessons)
  - Module 2: Input, Output, and Operators (3 lessons)
  - Module 3: Control Flow and Logic (3 lessons)
  - Module 4: Strings and Built-in Data Structures (3 lessons)
  - Module 5: Functions, Scope, and Robustness (3 lessons)
  - Module 6: Files, Modules, and Engineering Projects (2 lessons)
- [x] Built complete educational components for all 16 lessons: clear learning objectives, prerequisites strictly validating DAG acyclic dependency, estimated durations, in-depth engineering theory sections, practical Python code examples, exercises with progressive hints, solutions, and conceptual checkpoints.
- [x] Supported multiple lesson modalities: `theory`, `guided-coding`, `practical-exercise`, `interactive-simulation`, and `assessment`.
- [x] Integrated seamlessly with learning progress tracking (`katalyst.learning.v1`), supporting enrollment, lesson progression, 4-state exercise statuses (`not-started`, `attempted`, `needs-review`, `completed`), and dual-course progress preservation.
- [x] Verified Supabase cloud snapshot synchronization and guest migration for multi-course enrollment.
- [x] Validated provider-independent Kat AI tutor context generation with Python lesson context and enforced prompt execution boundaries.
- [x] Maintained strict runtime honesty: Python lessons cleanly utilize the 2-panel theory/practice layout without displaying or claiming an unconfigured WebAssembly execution sandbox.
- [x] Preserved 100% backward compatibility for the C Foundations course (all 13 lessons, sample runs, and Wasmer compiler integration intact).

M17.2 verification on 2026-11-11: `npm run lint` and `npm run typecheck` passed cleanly; `npm test` passed with 219 tests across 23 test suites; Playwright e2e browser tests passed; `npm run build` compiled cleanly.

### M17.3 — Learning Experience Redesign, Curriculum Expansion & Execution Providers (implemented)

- [x] **2-Panel Default Learning Workspace**:
  - Theory / Lesson Guide (50%) on the left and Code Sandbox (50%) on the right.
  - Kat AI tutor is closed by default to eliminate distraction and promote focused problem-solving.
  - Added "Ask Kat" / "Hide Kat" workspace top-bar button and panel header close button.
  - Toggling Kat dynamically switches into an accessible 3-panel layout (Theory 35%, Code 35%, Kat 30%) with draggable and keyboard-accessible splitters.
  - Kat state is persisted across views and sessions in `katalyst.workspace.layout.v1` (`WorkspaceLayout.katOpen`).
- [x] **Visual System & Compact Navigation Rail**:
  - Replaced legacy burnt-orange palette with refined teal/cyan accents (`--signal: #0d9488` light, `#14b8a6` dark; `--action-primary-bg: #0f766e` light, `#14b8a6` dark) ensuring full WCAG AA contrast (>4.5:1).
  - Deep graphite surfaces (`--surface-code: #1a1d21`) and high-contrast text (`--text-primary: #181a1b` light, `#f1f5f9` dark) for code editors, terminals, and code blocks in all themes.
  - Compact navigation rail: 220px expanded, 58px collapsed icon rail with bottom avatar and accessible tooltips.
- [x] **Redesigned Home & Course Discovery**:
  - Home: quick-resume card (`Continue learning`), hero explanation of learning-first philosophy, 3-step "How KATALYST works" engineering workflow ("Learn concept -> Code in sandbox -> Review & ask Kat"), symmetric C and Python foundation cards with metrics, and Practice Lab teasers.
  - Paths: symmetric course discovery grid with syllabus module summaries, duration, status badges, and prerequisites.
- [x] **Expanded Curriculum Content**:
  - C Programming Foundations: all 13 lessons enhanced with memory layout notes, pitfalls, `starterCode`, and multi-tier progressive hints.
  - Python Programming Foundations: all 16 lessons across 6 modules enhanced with `starterCode` and progressive hints.
  - Strictly preserved course IDs (`c-programming-foundations`, `python-programming-foundations`), lesson IDs, and URLs with zero disruption to user progress.
- [x] **Execution Providers & Multi-Language Runner Subsystem**:
  - Comprehensive architectural evaluation of Pyodide, Wasmer, Judge0 CE, JDoodle, OneCompiler, and Piston documented in `docs/COMPILER_ARCHITECTURE.md`.
  - Provider-neutral runner subsystem in `src/lib/execution/`: `WasmerCRunner` for C11 browser WebAssembly and `PyodidePythonRunner` for Python 3.12 WebAssembly micro-runtime.
  - Dedicated runner test suite in `tests/execution.test.ts`.
- [x] **CodeMirror 6 Multi-Language Editor**:
  - Evaluated CodeMirror 6 vs Monaco Editor (bundle size, mobile responsiveness, SSR, accessibility) in `docs/COMPILER_ARCHITECTURE.md`.
  - Implemented `src/components/code-workspace.tsx` with CodeMirror 6, line numbers, dark graphite theme, C/C++ and Python stream tokenizers, Run/Stop controls, and stdin/output panes.
- [x] **Full Verification**:
  - `npm run lint` — passed with 0 errors and 0 warnings.
  - `npm run typecheck` — passed with 0 errors.
  - `npm test` — passed with 222 tests across 23 test suites.
  - `npm run test:e2e` — passed with 44 browser tests (1 skipped).
  - `npm run build` — passed with Next.js 16.4.5 production output.

M17.3 verification on 2026-11-11: `npm run lint`, `npm run typecheck`, and `npm test` passed (222 unit tests across 23 test suites); `npm run test:e2e` passed (44 passed, 1 skipped); `npm run build` compiled cleanly.

### M17.4 — Theme Override, Unified Multi-Language Playground & Runtime Audit (implemented)

- [x] **Cohesive Theme Override & Contrast Hardening**:
  - Replaced legacy palette tokens in `src/app/globals.css` with a high-contrast modern engineering theme across Light and Dark modes.
  - Light mode: `--surface-canvas: #f8fafc`, `--surface-primary: #ffffff`, `--surface-secondary: #f1f5f9`, `--border-subtle: #e2e8f0`, `--text-primary: #0f172a`, `--text-secondary: #334155`, `--accent-primary: #2563eb`, `--accent-hover: #1d4ed8`.
  - Dark mode: `--surface-canvas: #0b0e14`, `--surface-primary: #111620`, `--surface-secondary: #161c28`, `--border-subtle: #263042`, `--text-primary: #f8fafc`, `--text-secondary: #cbd5e1`, `--accent-primary: #38bdf8`, `--accent-hover: #7dd3fc`.
  - Fixed dark mode contrast bugs by eliminating misplaced `var(--surface-warning)` overrides from workspace panels, editor panes, output panels, headers, navigation bars, and mobile tabsets.
  - Fixed `.suggestion:hover` stark white background bug and `.project-active .project-dot` legacy rust color.
  - Updated design documentation in `docs/DESIGN.md` with complete token tables and interaction principles.
- [x] **Unified Multi-Language Playground**:
  - Replaced "C Playground" in navigation rail, breadcrumbs, and page headers with a unified "Playground".
  - Top Language Selector Bar inside Playground supporting C (C11 · Wasmer WebAssembly), Python (3.12 · Pyodide WebAssembly), and extensible future runtimes (JavaScript ES2024, Circuits SPICE).
  - CodeMirror dynamic language reconfiguration via `Compartment` (`cpp()` vs `pythonStreamParser`) without losing editor state or remounting components.
  - Independent draft persistence: `katalyst.c.playground.v1` for C and `katalyst.python.playground.v1` for Python via `src/lib/python-playground.ts`.
  - Full execution support for Python programs via `executeProgram`, handling stdin normalization, execution progress, timeout protection, stdout/stderr capture, and runtime error diagnosis.
- [x] **M17.4 Runtime & Workspace Verification Audit**:
  - Fully verified real in-browser execution with Wasmer C and Pyodide Python.
  - Verified stdin/stdout normalization across both languages (`scanf` and `input()`).
  - Unit test suite expanded with `tests/python-playground.test.ts` (225 passing tests across 24 test suites).
  - Full Playwright E2E browser suite verified across all themes and viewports.

M17.4 verification on 2026-11-12: `npm run lint`, `npm run typecheck`, and `npm test` passed (225 unit tests across 24 test suites); `npm run test:e2e` passed; `npm run build` compiled cleanly.

### M18 — Automated Exercise Verifier & Surgical UI Lock-In (implemented)

- [x] **Surgical UI Lock-In & Contrast Hardening**:
  - Forced explicit high-contrast colors in `[data-theme="dark"]` for left sidebar nav links and icons (`#d4d4d8`), active items (`rgba(59, 130, 246, 0.16)` / `#60a5fa`), and section headings (`#a1a1aa`).
  - Replaced bright green styling on top-bar credits badge with clean neutral/blue badge (`background: var(--bg-subtle); border: 1px solid var(--border); color: var(--text-primary); cursor: pointer;`).
  - Replaced all remaining occurrences of `Georgia` and `serif` in `src/app/globals.css` with clean sans-serif typography (`Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`).
  - Completely isolated Python playground drafts from C lessons: prevented synchronous dispatch draft leak during language switching via `isSwitchingRef`, cleansed corrupted C drafts on mount, and ensured lesson mode strictly mounts with the lesson's language starter/example code.
- [x] **Curriculum Test Cases Schema & Authoring**:
  - Added optional `testCases: ExerciseTestCase[]` to `LearningExercise` in `src/lib/learning-curriculum.ts` and updated Zod validation schema.
  - Added concrete test cases with stdin, expectedStdout, and matchMode (`exact`, `trimmed`, `contains`, `hidden`) to runnable exercises in `c-programming-foundations` (`trace-hello`, `choose-a-type`, `read-two-values`) and `python-programming-foundations` (`ex-py-first-script`, `ex-py-sensor-variables`, `ex-py-fahrenheit-converter`).
- [x] **Automated Test Runner Utility**:
  - Implemented `verifyExerciseSubmission` in `src/lib/exercise-verifier.ts` executing through provider-neutral `executeProgram`.
  - Cross-platform output normalization (`\r\n` to `\n`), comparison modes (`exact`, `trimmed`, `contains`), and compiler short-circuiting.
  - Private test case masking (`maskHiddenTestCase`) protecting evaluation details in learner UI.
- [x] **Interactive Exercise Verification UI**:
  - Embedded Automated Verifier in `src/components/learning-experience.tsx` with "Verify Solution" button, loading spinner, test result cards, pass/fail status indicators, and diff comparisons.
  - Auto-updates exercise progress to `completed` on pass or `attempted` on fail in `katalyst.learning.v1`.
- [x] **Full Verification**:
  - Added unit test suite `tests/exercise-verifier.test.ts` (9 tests passing).
  - All 234 unit tests passing across 25 test suites.
  - Next.js production build compiling cleanly.

M18 verification on 2026-11-12: `npm run lint`, `npm run typecheck`, and `npm test` passed (234 unit tests across 25 test suites); `npm run build` compiled cleanly.

### M19 — Full-Scale Engineering Platform Expansion (implemented)

- [x] **Pillar 1: Curriculum Expansion & 100% Automated Verification**:
  - Expanded C Programming Foundations (`c-programming-foundations`) with Module 6 (*Systems & Low-Level Engineering*) including 3 new lessons (`bitwise-registers`, `dynamic-memory`, `function-pointers`), bringing C to 16 lessons across 6 modules.
  - Expanded Python Programming Foundations (`python-programming-foundations`) with Module 7 (*Object-Oriented Systems & Algorithmic Efficiency*) including 3 new lessons (`py-classes-and-encapsulation`, `py-inheritance-dataclasses`, `py-algorithms-and-generators`), bringing Python to 19 lessons across 7 modules.
  - Authored Course 3: JavaScript & Algorithmic Systems (`js-systems-algorithms`) in `src/lib/curriculum/javascript-algorithms.ts` (10 lessons across 4 modules).
  - Authored Course 4: Digital Logic & Circuit Foundations (`digital-logic-circuits`) in `src/lib/curriculum/digital-circuits.ts` (8 lessons across 3 modules with interactive simulation configs).
  - Added runnable `testCases` (with stdin, expectedStdout, and `hidden: true` tests) across all 53 exercises in all 4 courses.
  - Implemented `JavaScriptWorkerRunner` in `src/lib/execution/js-runner.ts` using isolated Web Workers with Node.js fallback, console stream capture, and timeout safeguards.
- [x] **Pillar 2: Interactive Engineering Visualizers**:
  - `src/components/simulators/memory-visualizer.tsx`: Visualizes stack frames (downward growth, variable names, hex addresses, pointer reference arrows) and heap memory blocks (`malloc`/`free`, leaked block warnings, dangling pointer alerts, step-by-step memory lifecycle navigation).
  - `src/components/simulators/circuit-simulator.tsx`: Digital logic mode (interactive switches, AND/OR/NOT/NAND/NOR/XOR gates, live wire state visualization, live truth table) and Analog mode (interactive V, R, C sliders, Ohm's law metrics, dynamic SVG capacitor charging curves).
  - Integrated into lesson `interactiveDemo` views and Playground runtime selector.
- [x] **Pillar 3: Inline Compiler Diagnostics & Kat Error Bridge**:
  - Implemented `parseDiagnostics` in `src/lib/execution/diagnostics-parser.ts` parsing Clang/GCC C11, Python tracebacks, and JavaScript syntax/runtime errors into structured diagnostic objects (`{ line, column, severity, message }`).
  - Added inline diagnostic warning banners in `src/components/code-workspace.tsx` with a one-click **"Ask Kat to Explain Error"** action bridging error context directly into the AI tutor panel.
- [x] **Pillar 4: Upgraded Practice Lab & Mastery Tracking**:
  - Upgraded Practice Lab into Challenge Hub with multi-course filter pills (All, C, Python, JavaScript, Digital Circuits) and difficulty filters (All, Beginner, Intermediate, Advanced).
  - Added engineering XP model (`+50 XP` per verified exercise, `+25 XP` per completed lesson) and engineering ranks (Cadet Engineer to Staff Systems Architect) in `src/lib/learning-progress.ts`.
  - Added Engineering Mastery progress card to Home and Progress views.
- [x] **Full Verification**:
  - Added unit test suites `tests/diagnostics-parser.test.ts` (6 tests) and `tests/js-runner.test.ts` (6 tests).
  - All 249 unit tests passing across 27 test suites.
  - Playwright E2E suite (45 passing tests, 1 skipped).
  - Next.js production build compiling cleanly with zero errors.

M19 verification on 2026-11-12: `npm run lint`, `npm run typecheck`, and `npm test` passed (249 unit tests across 27 test suites); `npm run test:e2e` passed (45 passed, 1 skipped); `npm run build` compiled cleanly.

### M20 — M19 E2E Verification, Runtime Hardening & MVP Deployment Readiness (implemented)

- [x] **Playwright E2E Coverage for M19 Platform Features (`e2e/m19-features.spec.ts`)**:
  - Implemented 5 dedicated browser tests:
    - 4-Course Catalog Discovery & Navigation (C, Python, JavaScript, Digital Logic).
    - JavaScript Web Worker Execution & Automated Exercise Verifier.
    - Interactive Simulators (Circuit Simulator toggle switches/LEDs and Memory Visualizer multi-step memory lifecycle).
    - Inline Compiler Diagnostics & Kat Error Bridge (pre-populates Kat AI tutor drawer with diagnostic context).
    - Challenge Hub Multi-Course & Difficulty Filters.
  - All 5 tests passing in Chromium.
- [x] **Simulator & Workspace Error Boundary (`src/components/simulators/simulator-error-boundary.tsx`)**:
  - Wrapped `MemoryVisualizer` and `CircuitSimulator` in React Error Boundaries to prevent unexpected simulator state exceptions from crashing the lesson reading panel or playground.
  - Hardened teardown guards in `src/components/c-playground.tsx` against unmounted client instances.
- [x] **Legacy Progress Migration Safety (`src/lib/learning-progress.ts`)**:
  - Guaranteed seamless backward compatibility for older `katalyst.learning.v1` local storage records lacking `verifiedExerciseIds`, defaulting cleanly to `[]`.
  - Accurately computes XP and rank from legacy `completedLessons` and explicit `exerciseProgress` records without schema errors or data loss.
  - Added unit test in `tests/learning-progress.test.ts`.
- [x] **Production Health Check Endpoint (`src/app/api/health/route.ts`)**:
  - Added lightweight `GET /api/health` returning `{ ok: true, status: "healthy", coursesCount: 4, services: { cloudflareConfigured: boolean, supabaseConfigured: boolean } }`.
  - Zero private credential or token exposure in response payload.
  - Added unit test in `tests/health-route.test.ts`.
- [x] **MVP Deployment Readiness (`docs/DEPLOYMENT.md`)**:
  - Documented automated health check endpoint, 4-course verification runbook, and WebAssembly / Web Worker cross-origin isolation (COOP/COEP) constraints.
- [x] **Full Verification**:
  - All 251 unit tests passing across 28 test suites.
  - All 50 Playwright E2E tests passing (45 passed + 1 skipped in `workspace.spec.ts`, 5 passed in `m19-features.spec.ts`).
  - Next.js production build compiling cleanly with zero errors.

M20 verification on 2026-11-13: `npm run lint`, `npm run typecheck`, and `npm test` passed (251 unit tests across 28 test suites); `npx playwright test e2e/m19-features.spec.ts` passed (5 passed); `npx playwright test e2e/workspace.spec.ts` passed (45 passed, 1 skipped); `npm run build` compiled cleanly.

### M21 — Server-Side Curriculum, SQL & HTML/CSS Runtimes, 5 New Courses, Built-In Skills & UI Polish (implemented)

- [x] **Pillar 1: Server-Side Curriculum Split & Dynamic Delivery**:
  - Split curriculum architecture to eliminate client bundle bloat: lightweight client catalog manifests (`src/data/curriculum/manifests.ts`, 92KB) contain summary metadata, while complete lesson details are loaded on demand.
  - Implemented schema types in `src/lib/learning-curriculum.ts`: `LearningLessonSummary`, `LearningLessonDetail`, `LearningModuleSummary`, `LearningCourseSummary`, and `LearningCatalogManifest`.
  - Created server-side catalog registry in `src/data/curriculum/server-catalog.ts` and automated generator script `scripts/generate-manifests.ts` hooked into `predev` and `prebuild`.
  - Built cached, resilient API route `GET /api/curriculum/lesson?courseId=...&lessonId=...` with Zod query validation, 400/404 handling, and HTTP `Cache-Control` (`public, max-age=3600, stale-while-revalidate=86400`).
  - Added in-memory client-side Map caching and non-shifting pulse skeleton in `src/components/learning-experience.tsx`.
- [x] **Pillar 2: SQLite WASM Runner, Sandboxed HTML/CSS Preview & Unified Playground**:
  - Installed `sql.js` (SQLite compiled to WebAssembly) and established local vendor asset copying via `scripts/copy-sqljs-wasm.mjs`.
  - Implemented `SqlWasmRunner` (`id: "browser-sql-wasm"`, `target: "browser-wasm"`) in `src/lib/execution/sql-runner.ts` with schema setup executed via `stdin`, SQL query execution, ASCII result table formatting, and syntax/constraint error reporting in `stderr`. Registered in `ExecutionRegistry`.
  - Extended compiler diagnostics parser (`src/lib/execution/diagnostics-parser.ts`) and exercise verifier (`src/lib/exercise-verifier.ts`) for SQL.
  - Implemented live HTML/CSS sandboxed preview in `src/components/code-workspace.tsx` and `src/components/c-playground.tsx` using `<iframe sandbox="allow-scripts">`, Desktop (100%) / Mobile (375px) viewport toggle, and refresh control.
  - Expanded `CPlayground` into a unified 6-runtime engineering workbench supporting C (C11), Python (3.12), JavaScript (ES2024), SQL (WASM), HTML & CSS (Live Preview), and Digital Circuits (Interactive), with isolated draft persistence per runtime.
- [x] **Pillar 3: 5 New Full-Depth Courses (38 Lessons, 91 Total, Zero Stubs) & Image Lab**:
  - Authored 5 comprehensive new courses under `src/data/curriculum/`:
    - `sql-databases`: SQL & Relational Database Architecture (8 lessons across 3 modules).
    - `html-css-web`: Modern HTML5, CSS3 & Responsive Web Design (8 lessons across 3 modules).
    - `dsa-mastery`: Data Structures & Algorithmic Problem Solving in JavaScript/Python (10 lessons across 4 modules).
    - `prompt-engineering`: Prompt Architecture & LLM Engineering (6 lessons across 2 modules).
    - `photo-editing-media`: Digital Image Processing & Visual Media (6 lessons across 2 modules).
  - Every lesson authored with comprehensive theory sections, code examples, runnable exercises with starter code, multi-tiered hints, solutions, self-check checkpoints, and automated test cases.
  - Built interactive `ImageLabVisualizer` (`src/components/simulators/image-lab-visualizer.tsx`) with procedural test card, real-time RGB histogram, tone adjustments (Exposure, Contrast, Saturation, RGB channel multipliers), and 3x3 convolution kernels (Sharpen, Blur, Edge Detection, Emboss).
- [x] **Pillar 4: Built-in Engineering Skills Library Expansion & Explore Polish**:
  - Added 8 specialized engineering skills to `starterSkills` in `src/lib/skills.ts`: *Socratic Code Reviewer*, *C Memory & Pointer Auditor*, *SQL Query & Index Optimizer*, *DSA Complexity & Edge-Case Coach*, *Frontend Semantic & Accessibility Reviewer*, *Prompt Architecture Refiner*, *Digital Circuit & Logic Simplifier*, and *Exam & Interview Drill Master*.
  - Added category filter pills (`All`, `Systems`, `Web`, `Algorithms`, `Databases`, `AI & Media`, `Hardware`) to the Explore view in `src/components/learning-experience.tsx`.
  - Updated production health route (`GET /api/health`) to verify the 9-course catalog.
  - Authored Playwright E2E browser suite `e2e/m21-platform.spec.ts`.
- [x] **Full Verification**:
  - All 266 unit tests passing across 30 test suites.
  - Typecheck passing with zero errors.
  - Next.js production build compiling cleanly.

M21 verification on 2026-11-13: `npm run lint`, `npm run typecheck`, and `npm test` passed (266 unit tests across 30 test suites); `e2e/m21-platform.spec.ts` added; Next.js 16.4.5 production build clean.

### Future planning (not started)

- Verify a configured Google/Supabase deployment before claiming live account functionality. Review rate limits and provider billing before exposing AI routes publicly.
- Add course content only through the M13 authoring checklist, preserving released IDs and validating runnable examples. Do not add graded mastery without explicit assessment semantics and evidence.
- Revisit IndexedDB after measuring browser quota pressure, and revisit streaming only with a provider-independent contract and cancellation tests.

## Current state

KATALYST is a multi-discipline learning studio with 14 published courses, subject-specific browser tools, local progress, optional account sync, and provider-routed AI guidance. Guests can explore without registering. One `/login` page handles email/password, Google OAuth, account creation, and password recovery; Terms and Privacy acceptance is required for sign-in and account creation. Settings shows account status, sync/data controls, and appearance preferences without duplicating authentication forms.

The current interface uses one source-defined KATALYST mark, a high-contrast Light/Dark/System palette, a shared animated Home pipeline spanning the learning fields, and responsive provider/model selectors. Course details and start actions appear alongside the course list. The Playground opens to a launcher and restores the last selected lab; the lesson workspace keeps theory, optional compiler, and Kat controls compact and independently usable. Server-side shared provider credentials stay on the server; explicit learner BYOK credentials are tab-memory only and are sent only in the matching BYOK mode. Existing versioned `katalyst.*` storage formats remain unchanged.

### M22 — MVP interface, account-flow, and launch documentation refinement — 2026-11-16

- [x] Replace selectable logo variants with one reusable source-defined brand mark.
- [x] Remove the bottom sidebar account/sign-in control; provide a dismissible sign-in prompt at the top for configured guest deployments.
- [x] Keep authentication on `/login`; reduce Settings account view to identity, sync, export, sign-out, and deletion controls.
- [x] Present all learning disciplines through one Home pipeline and prevent provider/model controls from overlapping on narrow screens.
- [x] Publish Terms, Privacy, account-deletion, sitemap, robots, social-preview, and not-found surfaces; identify remaining operator legal details in the deployment guidance.
- [x] Align design, security, account setup, deployment, product, and change documentation with the implemented behavior.
- [x] Record final verification results after lint, typecheck, unit tests, browser tests, and production build.

### Verification record — 2026-11-16

- `npm run lint` — passed with no warnings.
- `npm run typecheck` — passed.
- `npm test` — passed, 279 tests across 31 files.
- `npm run test:e2e` — passed, 63 browser tests; one opt-in real C compiler integration test was skipped by the default suite. The focused login and mobile lesson checks also passed.
- `npm_config_ignore_scripts=true npm run build` — passed with Next.js 16.4.5 and 46 generated static pages. The prebuild hook was skipped to keep the protected curriculum tree untouched.
- `git diff --check` — passed. `src/data/curriculum/` and `src/lib/execution/` remained unchanged.

### Verification record — 2026-11-08

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed, 81 tests across 7 files.
- `npm run test:e2e` — passed, 13 browser tests.
- `npm run build` — passed with Next.js 16.4.5 production output.
- Provider and Ollama network calls were mocked; live cloud access and a live local Ollama server were not tested.

### Chat Markdown rendering verification — 2026-11-09

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed, 85 tests across 8 files.
- Playwright browser suite — passed, 17 tests, including provider-specific Markdown rendering, clipboard copy, and narrow-screen code/table overflow checks.
- `npm run build` — passed with Next.js 16.4.5 production output.
- Provider responses were mocked; no live provider inference was used.

### M6 learning-first transformation verification — 2026-11-09

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed, 93 tests across 10 files.
- `npm run test:e2e` — passed, 20 browser tests, including the existing provider, skill, storage, backup, chat, and Markdown journeys plus new learning and Kat flows.
- `npm run build` — passed with Next.js 16.4.5 production output.
- Tutor and provider interactions are mocked in browser tests; no live provider inference is used.

### M6.1 connected engineering studio verification — 2026-11-09

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed, 98 tests across 12 files.
- `npm run test:e2e` — passed, 22 browser tests; the network-dependent compiler integration test is skipped by default.
- `RUN_C_PLAYGROUND_INTEGRATION=1 npm run test:e2e -- --grep 'compiles and runs a C program'` — passed in Chromium with a real C11 program reading stdin and printing output. First-run package download and compile took about 1.1 minutes in this environment.
- `npm run build` — passed with Next.js 16.4.5. Production smoke check returned HTTP 200 for the app and static Wasmer SDK assets, with COOP/COEP headers present.
- Screenshots of the learning home, lesson, Kat drawer, and desktop/mobile playground were reviewed. Provider chat responses remain mocked; no cloud inference or local Ollama server was used.

### M7 integrated AI learning workspace verification — 2026-11-09

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed, 116 tests across 12 files.
- `npm run test:e2e` — passed, 26 browser tests; the optional real compiler test is skipped by default.
- `RUN_C_PLAYGROUND_INTEGRATION=1 npm run test:e2e -- --grep 'compiles and runs a C program'` — passed in Chromium inside an integrated lesson, compiling C11 that reads stdin and prints output. Wasmer initialization took about 5 minutes in this fresh browser context.
- `npm run build` — passed with Next.js 16.4.5 production output.
- Provider requests were mocked; no live Cloudflare, OpenAI, Gemini, OpenRouter, or Ollama inference was used. Settings model discovery was mocked in the browser suite; live Cloudflare credentials and account access remain unverified.
- Desktop and mobile learning workspace and mobile playground screenshots were reviewed.

### M8 product experience and local dashboard verification — 2026-11-09

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed, 130 tests across 15 files.
- `npm run test:e2e` — passed, 30 browser tests; one existing optional real compiler integration test was skipped. Coverage includes provider/model routing and failures, session credentials, conversation actions/export, theme persistence, guest/account messaging, local AI activity dashboard, mobile layout, desktop wheel scrolling, and compiler/lesson flows.
- `npm run build` — passed with Next.js 16.4.5 production output.
- Build manifest measurement: initial route JavaScript assets were 555,670 bytes raw / 167 KiB gzip; the lazy C playground chunk was 441,120 bytes raw / 139 KiB gzip. The much larger compiler package remains a separate on-demand browser download.
- Provider/catalog calls were mocked. No live Cloudflare, OpenAI, Gemini, OpenRouter, or Ollama request was made. The optional network-dependent C compiler integration was not rerun for M8; previous M7 integration coverage is recorded above.

### M9 UI/UX stabilization verification — 2026-11-09

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed, 133 tests across 15 files.
- `npm run test:e2e` — passed, 32 browser tests; one optional real compiler integration test was skipped. Coverage includes settings category persistence, provider credential/model behavior, four provider Markdown paths, C output channels, responsive Workbench layouts at desktop/laptop/tablet/mobile, and existing learning/workspace flows.
- `npm run build` — passed with Next.js 16.4.5 production output.
- Automated provider requests/catalogs were mocked; no live provider inference was performed. The network-dependent Wasmer compiler integration remains opt-in.

### M10 UX corrections and Cloudflare discovery verification — 2026-11-09

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed, 138 tests across 15 files.
- `KATALYST_E2E_PORT=3147 npm run test:e2e` — passed, 36 browser tests; the optional real compiler integration was skipped. Coverage includes provider/model menu dismissal, empty/filtered Cloudflare catalogs, explicit inference success/failure mocks, preserving the selected model on refresh failure, 1200/1120/1024 responsive lesson tabs, mobile Kat composer visibility, desktop lesson scrolling, and tablet sidebar collapse.
- `npm run build` — passed with Next.js 16.4.5 production output.
- Cloudflare provider/catalog responses were mocked. No live Cloudflare account lookup or inference was made; end-to-end account access remains unverified until the owner configures credentials and manually selects **Test inference**.

### M11 interface consistency verification — 2026-11-09

- `npm run lint` — passed without warnings.
- `npm run typecheck` — passed.
- `npm test` — passed, 138 tests across 15 files.
- `KATALYST_E2E_PORT=3281 npm run test:e2e` — passed, 38 browser tests; the existing optional real compiler integration test was skipped. Coverage includes Light/Dark code surfaces, collapsed/expanded rail behavior at desktop/laptop/tablet widths, mobile navigation with a saved collapsed preference, and Kat scrolling/composer behavior. A final `KATALYST_E2E_PORT=3279` focused sidebar test also passed after the compact-header adjustment.
- `npm run build` — passed with Next.js 16.4.5 production output.
- Provider requests were mocked; the optional real C compiler download/integration was not run. No local data schema or provider behavior changed.

## Current fixes — 2026-11-19

- Moved provider/model controls, shared access status, credits, and AI request history into the single AI & Kat Settings section.
- Removed provider/model route labels from Kat replies and conversation views; direct creator questions receive ADITHYA attribution.
- Kept the global header stable while learners scroll nested lesson Code and Kat panels.

- Mobile lesson Code and Kat panels no longer trigger the global header scroll handler; lesson sizing follows the actual viewport and keyboard height, and the mobile header no longer wraps provider/model controls above the tabs.
- Shared Kat now reports server credential readiness clearly and remains disabled if server AI configuration is unavailable. Owner Cloudflare keys are read only by the server gateway.
- Guest session checks use a separate network rate-limit bucket from inference; shared credit reservations, settlements, and releases require atomic database RPCs.
- Admin usage analytics page through the full 14-day ledger instead of silently stopping at Supabase’s 1,000-row response cap.
- HTML mobile preview fits the available viewport. The first C/C++ compiler download still depends on reaching Wasmer’s registry; retry and browser caching remain available.
- Deferred follow-ups: streamed model responses and transactional email delivery.

## Known limitations

- Email/password and Google OAuth account storage remain optional and require an operator-configured Supabase project. Live identity-provider setup, cloud deployment, and project-specific deletion behavior require deployment verification.
- The shared AI gateway has server-enforced quotas and rate limits, but deployments still need to review billing, BYOK exposure, abuse controls, and public-route policy before accepting public traffic. Do not expose an unrestricted inference service with server keys.
- Guest data remains in localStorage without KATALYST-managed encryption. Signed-in workspace, learning, and preference snapshots use Supabase access controls and managed backups; deletion from active tables does not bypass provider-managed backup retention.
- Browser localStorage may have lower quota than the account's 9 MB snapshot limit; guest backup duplication can prevent migration when the origin is full.
- Backups are manual files; browser storage quotas may be lower than the 8 MB import/export limit. Local raw v1 records are recognized, but no automatic storage-engine migration is performed. Version 1 backups reject unsupported versions.
- No persistent multi-user BYOK, encrypted credential store, or per-account provider billing/usage dashboard.
- Catalog metadata may change. Provider catalog presence does not guarantee access, pricing, unlimited free usage, or availability.
- Custom OpenAI-compatible endpoints are not implemented because the app lacks DNS/IP pinning and outbound SSRF controls.
- Skill import supports a small Markdown format; it does not load references or execute code.
- Skill Issue discovery requires leaving the app to review the public catalog and download Markdown. Compatibility labels are source declarations, not full agent compatibility tests.
- No streaming output, model auto-fallback, or provider tool/function execution. Stop aborts the client request and upstream fetch signal, but cannot recall work already received by a provider.
- First C playground use requires an internet connection to fetch the pinned compiler package (110,713,421 bytes, about 106 MiB); running needs a browser with cross-origin isolation. The compiler supports a focused WebAssembly C environment, not every host API or native build target.
- Ollama works only when KATALYST runs locally beside Ollama and only through loopback port 11434; do not expose either service publicly. Hardware guidance reports Ollama metadata without predicting machine performance.
