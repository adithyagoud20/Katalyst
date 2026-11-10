# Changelog

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
