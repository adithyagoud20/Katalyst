# Decisions

## Local-first storage for M1

**Context:** A useful first workspace should start without a database, account, or paid hosting service.

**Decision:** Keep project, conversation, skill, and model state in browser `localStorage` for now.

**Consequences:** Setup is small and works offline except for inference. Data is per browser and is not encrypted or synced. Storage migration and export need a later milestone.

## Add providers only after verifying their adapters

**Context:** Multi-provider support is a product goal, but unverified adapters would make keys and errors hard to reason about.

**Decision:** Start M1 with OpenAI Responses API behind `ModelProvider`, using server-side `fetch` and `OPENAI_API_KEY`. M2 adds Gemini only after verifying its official `generateContent` API and model IDs, with the same server-side adapter contract.

**Consequences:** OpenAI and Gemini are enabled. No provider SDK dependency is required. Other adapters must be verified and tested before appearing as enabled UI choices.

## No fake inference

**Context:** A setup screen must remain honest when credentials are missing.

**Decision:** Return a useful configuration error and never substitute a canned response.

**Consequences:** Chat needs an OpenAI API key for an actual answer. Users may still inspect the local workspace and skill library.

## Small Markdown skill import

**Context:** Skills from different agents can have scripts, references, and different formats.

**Decision:** Import one Markdown file with `name`, `description`, and instruction body; store the body locally and send only enabled text.

**Consequences:** The format is intentionally partial. No scripts execute, and compatibility is not universal.

## Apache-2.0 for KATALYST

**Context:** The user selected a permissive open-source license with an explicit patent grant.

**Decision:** License KATALYST source under Apache-2.0. Third-party coding-agent skills are not covered by this license and remain excluded from Git.

**Consequences:** Preserve the license notice when redistributing KATALYST. Review each future dependency, asset, or bundled skill separately.

## Learning product before generic chat (M6)

**Context:** The original workspace centered on provider choice, projects, and conversation history, while the product goal is an engineering learning platform.

**Decision:** Make Learning Home, learning paths, My Learning, Practice Lab, Progress, and Kat the primary navigation. Keep projects, generic chat, skill library, and provider controls available as secondary workspace tools.

**Consequences:** The existing workspace shell and provider adapters remain in use. A single original C foundations path is shown until more real curriculum exists; empty subject catalogs and fabricated progress are not used.

## Separate learner progress from workspace conversations (M6)

**Context:** Lesson completion should be durable without depending on chat history, and M5 protects an existing workspace record and strict v1 backups.

**Decision:** Store explicit enrollments, last opened lesson, lesson completion timestamps, and a short activity list in a separately validated `katalyst.learning.v1` localStorage record. Leave `katalyst.workspace.v1` and backup schema version 1 unchanged.

**Consequences:** Local learner progress currently does not travel in workspace backups or sync across browsers. Completion means the learner manually marked a lesson complete; it is not an assessment or mastery claim. Invalid or unsupported progress records are not automatically overwritten.

## Reuse the provider boundary for Kat (M6)

**Context:** The tutor needs provider choice and lesson context without adding another AI framework or persistence format.

**Decision:** Send Kat requests to the existing bounded `/api/chat` route with the selected provider/model and untrusted lesson reference context. Keep tutor turns in page memory and make the four tutor modes learner-facing guidance in the request.

**Consequences:** Provider adapters stay provider-independent. Tutor style is model-guided, not deterministic. Skills are not silently added to tutor context, tutor turns are not stored in projects, and no provider tools or streaming are introduced. M6.1 later added a separate browser-local C playground; it is not part of Kat's tool set.

## Connect C lessons to a bounded browser playground (M6.1)

**Context:** The authored C lessons include code, but students need a practical way to test predictions and inspect compiler feedback without turning KATALYST into a general-purpose remote code service.

**Decision:** Carry lesson examples into a dedicated C11 editor, compile them to WebAssembly with a pinned browser Clang package, and run the output in a network-disabled Wasmer browser sandbox. Bound source, stdin, output, compile time, and run time; store drafts locally and keep them out of provider requests and workspace backups.

**Consequences:** First use needs internet to fetch a large compiler package and browser cross-origin isolation. This is a focused WebAssembly learning environment, not a native C compiler or a hardened multi-tenant code service. Imported scripts remain inert, and the playground does not add tools to Kat.

## Add local product preferences and evidence-based activity (M8)

**Context:** Learners need readable theme options, useful local progress, and conversation controls without requiring registration or creating fictitious analytics.

**Decision:** Preserve the existing workspace record and add separate bounded `katalyst.preferences.v1` and `katalyst.ai-activity.v1` records. Derive learning, AI, and workspace dashboards from events and records the browser actually has. Keep AI activity to provider/model/time/outcome and token usage explicitly returned by that provider. Keep conversation action logic as data transformations and export only a credential-redacted visible transcript.

**Consequences:** Theme, preferences, and AI activity are not in the existing workspace backup. AI history begins with this release, can roll off after 500 requests, and stays in this browser. Public links, accounts, synchronization, cloud backups, and server-side analytics remain future backend work.

## Keep M8 deployment architecture in one Next.js application

**Context:** M8 evaluates separating learning content, workspace state, inference, and the browser compiler while keeping development and hosting lightweight.

**Decision:** Keep one Next.js application and API boundary. Retain curriculum as provider-independent structured data, localStorage for local-only app records, direct server-side provider adapters, and browser-local WebAssembly execution. Split the C playground UI into a separate client chunk. Do not add Cloudflare Pages/Workers/R2 or a database without measured delivery or scale requirements.

**Consequences:** The single small authored path stays bundled as local static data, while the code editor and compiler are loaded on demand. Larger future catalogs should trigger a route/static-asset measurement and a data-only content layout before adding hosting services. Cloudflare Workers AI remains only one selectable inference provider.

## Stabilize the product shell without changing storage (M9)

**Context:** The final pre-MVP UI pass needs a distinctive engineering-learning identity, predictable Settings navigation, and a usable dedicated C Workbench while preserving the current architecture and browser data.

**Decision:** Apply warm neutral, graphite, burnt-orange, and amber semantic tokens in the existing stylesheet; use one reusable geometric brand mark; render a single keyboard-navigable Settings category at a time; and retain session credentials only in page memory. Provider state is reported separately for credentials, authentication, catalog discovery, and inference. Catalog refresh never silently changes a selected model. Keep the existing Wasmer implementation and expose compiler diagnostics, stdout, and stderr as distinct output channels.

**Consequences:** The selected Settings category is transient React state, not a new preference or backup field. Current session keys clear on reload. Dynamic models that disappear must be explicitly reselected. The Workbench remains a bounded C11 WebAssembly tool; M9 adds no remote compiler, provider fallback, storage schema, dependency, or service.

## Keep Kat identity and course reference output explicit (M13)

**Context:** Kat shares the provider route with the workspace, while its tutor context and model selection can change between transient turns. Course code samples need results that are visible and reproducible without implying grading.

**Decision:** Carry a schema-limited `workspace` or `kat` assistant surface to the server adapter and include the selected provider and exact model route in trusted request metadata. Treat OpenRouter's free route as dynamic and leave its underlying model unidentified. Show provider/model provenance on each Kat response and expose context-specific quick actions only when their lesson, source, diagnostics, or output data exists. Add bounded sample input, exact expected output, and sandbox-file records to `LearningExampleRun`; retain the existing course and lesson IDs and keep these records in static curriculum data.

**Consequences:** Provider identity is not confused with KATALYST or the Kat persona, and prior tutor turns remain attributed to their original route. Model output remains unchanged in page state; presentation and provenance do not claim that a model's response was independently verified. Lesson example output is an authored reference, not automatic execution or grading. The new curriculum field does not alter `katalyst.learning.v1` or workspace backups.

## Add optional accounts with Supabase and preserve guest-first storage (M14)

**Context:** M14 adds cross-device account storage while the application already has strict local workspace, learning-progress, and preference records that must remain backward-compatible and recoverable.

**Decision:** Keep the existing Next.js app and local storage formats. Add Supabase Auth with Google OAuth/PKCE, cookie refresh through Next.js `proxy.ts`, Postgres profile/snapshot tables, RLS, verified server account routes, and one revisioned JSON snapshot per user. A user must explicitly migrate/merge guest data or choose the existing account copy. Use a per-device guest backup, revision compare-and-save, and an atomic migration ID ledger to preserve data across conflicts and uncertain retries. Keep personal BYOK keys transient and out of account records.

**Consequences:** Account persistence is optional; guest development remains available without Supabase configuration. Projects, chats, and messages inherit the owner of their aggregate snapshot row. The server validates the established workspace/progress/preference schemas and the database scopes writes to the live authenticated session. Conflict resolution is explicit. Auth deletion cascades active rows, but Supabase managed backups follow the project plan and retention settings. The service-role key is server-only and used only to delete a verified Auth user. Live OAuth still requires configured Google and Supabase projects.
