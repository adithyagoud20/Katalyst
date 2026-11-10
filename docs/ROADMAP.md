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

### Future planning (not started)

- Verify a configured Google/Supabase deployment before claiming live account functionality. Review rate limits and provider billing before exposing AI routes publicly.
- Add course content only through the M13 authoring checklist, preserving released IDs and validating runnable examples. Do not add graded mastery without explicit assessment semantics and evidence.
- Revisit IndexedDB after measuring browser quota pressure, and revisit streaming only with a provider-independent contract and cancellation tests.

## Current state

M6 through M14 are implemented. KATALYST opens on an authored C foundations path with local explicit lesson completion, an integrated lesson/editor/Kat workspace, and a local Progress dashboard. The visual system uses warm neutrals, graphite, and burnt-orange accents in Light, Dark, and System themes; editor and code-block surfaces stay graphite across themes. Settings renders one keyboard-accessible category at a time and reports provider credential, authentication, catalog, and inference states separately. The C11 workbench prepares its existing browser compiler on entry, opens runnable examples, separates output streams, and preserves local drafts. Cloudflare Workers AI is the default hosted provider; OpenAI, Gemini, OpenRouter, and Ollama remain selectable with no automatic fallback. Cloudflare discovery uses the current account catalog, and only its explicit test action makes an inference request from Settings. Kat receives selected route metadata, per-turn provider/model provenance, and bounded lesson/code context only when asked; it has no browser or execution tools, and context-specific actions require the relevant data. The thirteen authored C samples expose verified reference output, but lesson exercises/checkpoints remain ungraded. Assistant responses use the safe CommonMark/GFM renderer. Workspace backups remain schema version 1 and backward-compatible, with optional pinned state in conversation records; learning progress, appearance, AI activity, and playground drafts remain separate records. Optional Google accounts sync workspace, progress, and appearance snapshots after an explicit guest migration choice; conflicts are revision-checked and require an explicit resolution. Session BYOK remains transient and is not synced. Account export and confirmed deletion are available when Supabase is configured. Analytics are metadata-only and bounded to 500 AI requests. Conversation export is a redacted visible transcript, not a public share URL. Tutor modes are prompt guidance rather than deterministic behavior. Imported skills remain untrusted text and scripts are never run. Live Google OAuth requires external credentials and configuration and has not been verified in this checkout. See [Architecture](ARCHITECTURE.md#account-persistence), [Security](SECURITY.md#account-identity-and-cloud-data), [deployment/content recommendation](ARCHITECTURE.md#deployment-and-content-architecture), and [local storage recovery](ARCHITECTURE.md#local-storage-validation-and-recovery).

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

## Known limitations

- Google OAuth and database-backed account storage remain optional and require an operator-configured Supabase project. Live OAuth, cloud deployment, and user deletion are not verified by local automated tests.
- Provider inference routes do not yet provide account-specific rate limiting, usage quotas, or abuse controls. Do not expose an unrestricted public inference service with server keys.
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
