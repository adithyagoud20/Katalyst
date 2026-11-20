# KATALYST

KATALYST is a local-first technical learning studio for curious builders. It brings software, hardware, circuits, data, AI, and visual media into one connected experience of guided learning and interactive tools. The home screen shows a shared learning loop; each course opens the tools relevant to its subject. Cloudflare Workers AI is the default shared provider; OpenAI, Google Gemini, OpenRouter, and local Ollama remain available through isolated server-side adapters.

## What works today

- Secondary responsive engineering workspace with local projects and conversations.
- Learning Home with one animated multi-discipline pipeline, path discovery, My Learning, Practice Lab, Progress, and Kat's AI Tutor.
- A published catalog of 14 courses across programming, web and AI, systems, databases, algorithms, hardware, embedded devices, circuits, and visual media. Course details open alongside the course list so learners can inspect a path and start from the same place.
- A validated, provider-independent course catalog separates published course content from lesson presentation. Each complete C example shows its expected run, including sample input and sandbox-created files where relevant; draft entries remain out of learner navigation.
- A C/C++ playground connected to lessons: read examples and edit local drafts. Run is temporarily disabled while the browser compiler is being replaced.
- An integrated three-panel lesson workspace. Smaller screens switch between accessible Learn, Code, and Kat tabs without losing lesson state or the local editor draft; the app/provider header stays stable during nested editor and tutor scrolling and returns on an intentional upward scroll.
- Lesson content scrolls in the main page area without a floating duplicate breadcrumb; on wide screens the lesson, workbench, and Kat use a balanced three-column layout, and the Kat conversation scrolls independently above its composer.
- The shared C/C++ Run feature flag defaults off; enabling it requires a production-verified compiler.
- Local enrollment and explicit lesson completion, kept separate from conversations. Progress reflects recorded actions only; there are no invented scores or mastery claims.
- Four tutor styles—Concept teacher, Socratic tutor, Practical mentor, and Exam coach—routed through the selected provider. The learner's question stays primary; relevant lesson context is included when available, and enabled workspace skills can be applied with an explicit opt-in. Kat's trusted request metadata identifies the selected provider/model; each transient reply shows its request route. Kat has no browsing or execution tools and does not claim to have run code.
- Projects, chat, skill library, and provider settings remain available as secondary workspace tools.
- Cloudflare Workers AI OpenAI-compatible Chat Completions, OpenAI Responses, Gemini `generateContent`, OpenRouter Chat Completions, and Ollama `/api/chat` adapters.
- Provider selection, searchable model picker, reported free/paid filters, model details, and catalog refresh.
- Environment keys for local development and optional tab-session BYOK keys that clear on reload. Cloudflare also needs an account ID.
- Optional local Ollama model discovery and inference; KATALYST never downloads models and accepts only loopback URLs on port 11434.
- Conversation search, stop generation, retry, copy, edit/resend, and response regeneration.
- Assistant messages render headings, emphasis, nested lists, quotes, tables, safe links, inline code, and syntax-highlighted fenced code with a copy action. User messages keep their plain-text rendering.
- Provider/model metadata and token counts are shown only when returned by the provider; OpenRouter reported cost is shown only when included in its response.
- Project context and enabled skills are composed into requests as untrusted user context. Each message shows which skills were included and which enabled skills were skipped.
- Searchable skill library with Installed and Available tabs, metadata/details, enable/disable, Markdown import/export, and removal. Skill Issue discovery opens its public directory and uses reviewed Markdown import; KATALYST does not scrape or auto-install remote content.
- Versioned JSON export and restore for the whole workspace, individual projects, and conversations. Imports validate before writing, merge safely by default, and remap conflicting IDs instead of overwriting existing records.
- Appearance preferences with Light, Dark, and System themes plus comfortable/compact text density, stored separately in this browser.
- A high-contrast obsidian and graphite Dark theme, crisp Light theme, and one reusable geometric KATALYST mark in navigation and the application icon.
- CodeMirror, lesson examples, and assistant code blocks use a graphite code surface in both application themes, with code-specific contrast tokens; ordinary cards keep their selected theme surfaces.
- Desktop and tablet sidebar collapse retains labeled-by-tooltip primary and workspace-tool icons, the expand control, and a compact avatar. Phones keep the existing full navigation drawer.
- Kat's message list scrolls independently above its in-panel composer. The view follows new messages only while already near the bottom, and the composer grows for multiline input; Enter sends and Shift+Enter adds a line.
- Settings category navigation shows one category at a time, supports keyboard tab navigation, and preserves its selection while moving between app areas.
- Provider setup shows credential, authentication, catalog, and inference states separately. Saving a tab key and refreshing a catalog uses the current draft; refreshed catalogs never silently replace a model selection.
- Provider and model pickers dismiss on outside clicks and Escape. Cloudflare model discovery reports catalog and compatible counts separately, and its explicit **Test inference** action sends a real minimal request only when selected.
- The dedicated C Workbench gives the editor and terminal most of the viewport, resizes both panes, separates compiler diagnostics, stdout, and stderr, and keeps long output scrollable on narrow screens.
- Conversation actions to rename, pin, move, delete after confirmation, or export a credential-redacted Markdown transcript. Pinned chats have their own sidebar group; hosted share links are not available.
- A local Progress dashboard based on actual lesson and workspace data, with AI request counts and provider-reported token totals only. It does not estimate costs or reconstruct activity from before tracking was added.
- Guest-first access plus one `/login` page for email/password, Google sign-in, account creation, and password recovery. Terms and Privacy acceptance is required for sign-in and account creation. Guests continue using localStorage; signed-in users can explicitly migrate or merge supported data into an account snapshot. Settings shows account status and data controls, not a second login form.
- Account snapshots are server-validated, revisioned, and protected by database Row Level Security. Cross-device conflicts require an explicit restore or merge choice. Export and confirmed account deletion are available in Settings.
- Central shared AI Gateway routing all default Cloudflare Workers AI requests through an 11-step pipeline with atomic credit reservations, monthly calendar quotas (1,000 credits/mo), guest trials (50 credits), and permanent usage ledgers.
- Administrative control panel in Settings with server-verified admin authorization, global emergency kill switch, policy adjustments, and audited change logging.
- Admin-managed announcement banners and scheduled Home launch videos. Copy is rendered as text, links are URL-validated, schedules use the admin device's timezone, and video files stay on a public HTTPS host.
- Brevo (Sendinblue) transactional email integration for consent-aware welcome and quota notifications with non-blocking error handling.
- Integrated three-panel engineering IDE workspace layout (Theory, C Playground, Kat Tutor) with independent vertical scrollbars (`overflow-y: auto`), draggable and keyboard-accessible splitters (`role="separator"`), persisted layout state (`katalyst.workspace-layout.v1`), and mobile panel preservation without unmounting.
- Stabilized browser-based C11 compiler with robust stdin stream handling: CRLF normalization, trailing newline preservation, integer input using `scanf()`, multiple input lines, curriculum sample input pre-filling, and execution warnings before running stdin-expecting code with empty input.
- Provider-neutral execution architecture (`src/lib/execution/`) and hybrid execution roadmap for multi-language curricula (C/C++, Python, Java, JS, HTML/CSS) and electronics circuit simulation (Falstad, ngspice-wasm, Wokwi) in `docs/COMPILER_ARCHITECTURE.md`.
- Persistent Kat AI conversation memory under `katalyst.tutor.v1` supporting stable conversation IDs, multi-thread history navigation, per-thread teaching mode preservation, duplicate message prevention on retry, generation stop controls, and Supabase cloud account snapshot synchronization.
- Redesigned 8-category Settings navigation (`Account`, `Appearance`, `AI & Models`, `Usage & Credits`, `Learning`, `Workspace`, `Privacy & Security`, `Admin`) strictly isolating admin controls behind server-verified authorization and displaying live shared AI Gateway status, remaining credit meters, and BYOK zero-credit policies.
- Dedicated production deployment configuration guide (`docs/DEPLOYMENT.md`) specifying server-only secret configuration and security invariants.
- A Vercel-only MVP release checklist (`docs/MVP_RELEASE_CHECKLIST.md`) that separates shipped code from the external account, legal, provider, security, and launch-video steps still owned by the operator.

Conversation, project, skill, provider selection, local Ollama address, model selection, and pinned state retain the existing `katalyst.workspace.v1` local format. Appearance preferences use `katalyst.preferences.v1`; bounded AI request metadata uses `katalyst.ai-activity.v1`; lesson activity remains in `katalyst.learning.v1`. Kat tutor conversations are persisted locally in `katalyst.tutor.v1`. When signed in and after an explicit migration choice, workspace, progress, appearance, and tutor snapshots are synchronized through the Next.js server into a Supabase account row. AI analytics stay local. Session BYOK keys and provider server credentials are never included in account snapshots. Browser storage remains available as a local working copy and guest backup; it is not encrypted by KATALYST. Cloud requests are sent to the selected provider and may incur charges under its terms; Ollama inference runs on the KATALYST host.

Course and lesson records are validated when the authored catalog loads. Practice exercises show a suggested answer but do not grade responses. Checkpoints have their own optional explanations, and lesson completion is manually recorded; neither represents topic mastery. Browser-based programming and circuit tools have subject-specific limits documented on their product surfaces. First use of the C playground downloads the pinned compiler package (110,713,421 bytes, about 106 MiB) and requires internet access. Browser isolation headers are configured by the app. Editing, compiling, and running stay local; when the learner asks Kat for code help, bounded source, diagnostics, and output can be included in the selected provider request.

Workspace backups use strict JSON schema version 1 and are downloaded to a location you choose; KATALYST does not sync or upload them. They include projects, conversations, skills, provider/model preferences, and the optional local Ollama address, but no server or session credentials. Recognizable credential patterns are redacted from exported text; review backups before sharing because arbitrary prose may contain secrets the app cannot reliably identify. Merge is the default restore mode. Full workspace replacement requires confirmation. Files and local records are limited to 8 MB and the browser may impose a lower localStorage quota. See [backup format and import behavior](docs/ARCHITECTURE.md#workspace-portability).

Individual conversation export is a separate Markdown transcript containing only the conversation title and visible user/assistant messages. It does not include project instructions, skill definitions, provider settings, or hidden workspace metadata. Common credential patterns in transcript text are redacted, but review a file before sharing because arbitrary secrets cannot be reliably recognized. This download is not a hosted share link.

The C playground component is loaded as a separate client chunk when the lesson/playground experience is opened; the large compiler package remains downloaded and cached by the browser on demand. See [the architecture recommendation](docs/ARCHITECTURE.md#deployment-and-content-architecture) for the current static-content and hosting boundaries.

## Stack

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Zod, `react-markdown` with GFM, `rehype-highlight`, Supabase SSR/Auth clients for optional accounts, Wasmer JavaScript SDK for the currently disabled browser-local C/C++ compiler, Vitest, and Playwright. Provider adapters make server-side requests so keys do not enter client bundles. No paid dependency is required for basic guest-mode development.

## Prerequisites

- Node.js 20.9 or later (Node 22 LTS recommended).
- npm 9 or later.
- A provider API key for cloud model responses (OpenAI uses its built-in catalog; OpenRouter's free-router choice can be displayed without a key but still requires a key to generate), or an Ollama installation on the same host.
- Supabase configuration is optional for guest development. Email/password and Google sign-in, account sync, and account controls require a Supabase project with the included SQL migrations applied and the desired Auth methods enabled.

## Install and run

```sh
npm install
cp .env.example .env.local
# Set one or more provider API keys in .env.local.
# On Vercel, set NEXT_PUBLIC_SITE_URL to the production https://<project>.vercel.app origin.
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). The default development and production start scripts bind KATALYST to loopback only. Restart the development server after changing `.env.local`. Settings can also accept session-only credentials for the current page; select **Save for this tab** before a key is used and **Clear session key** to remove it. **Save & refresh models** sends the current key draft to the selected provider's catalog endpoint. Cloudflare's separate **Test inference** action sends a real short prompt to the currently selected, listed model and may consume account quota. Production session credentials require HTTPS and are sent to the KATALYST server for provider calls; they are not written to browser storage or persisted server-side. A successful catalog response confirms discovery only; it does not prove inference will succeed. Vercel's production project alias is used for canonical metadata and sitemaps; a custom domain is not required for this MVP.

### Local Ollama

Install Ollama on the same machine that runs KATALYST, start its local server, install a model yourself using Ollama, then choose Ollama and refresh its model list in Settings. KATALYST makes no model downloads and does not accept remote Ollama URLs. It supports `http://localhost:11434`, `http://127.0.0.1:11434`, or `http://[::1]:11434`. Default KATALYST commands bind to `127.0.0.1`, keeping local inference routes off network interfaces. Do not override the host to expose KATALYST or Ollama publicly, bind Ollama to a public interface, or expose port 11434 to the internet. See the [Ollama API guide](https://docs.ollama.com/api) and [local chat endpoint](https://docs.ollama.com/api/chat).

| Variable | Required | Purpose |
| --- | --- | --- |
| `AI_PROVIDER` | No | Initial provider: `cloudflare`, `openai`, `gemini`, `openrouter`, or `ollama`. Defaults to `cloudflare`; a saved browser provider choice takes priority after initialization. |
| `AI_MODEL` | No | Optional initial model hint from OpenAI's built-in catalog. Dynamic providers choose from discovered models. |
| `OPENAI_API_KEY` | For OpenAI inference | Server-only OpenAI API credential. Never use a `NEXT_PUBLIC_` prefix. |
| `GEMINI_API_KEY` | For Gemini discovery/inference | Server-only Google AI API credential. Never use a `NEXT_PUBLIC_` prefix. |
| `OPENROUTER_API_KEY` | For OpenRouter discovery/inference | Server-only OpenRouter API credential. Never use a `NEXT_PUBLIC_` prefix. |
| `CLOUDFLARE_ACCOUNT_ID` | For Cloudflare discovery/inference | Cloudflare account ID used in server-side Workers AI API URLs. |
| `CLOUDFLARE_API_TOKEN` | For Cloudflare discovery/inference | Server-only Cloudflare API token. Custom tokens need Workers AI - Read and Workers AI - Edit permissions. Never use a `NEXT_PUBLIC_` prefix. |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional accounts | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Optional accounts | Supabase publishable key; RLS is required because this value is public. |
| `SUPABASE_SERVICE_ROLE_KEY` | Account deletion | Server-only key used only by the confirmed account deletion route and admin operations. Never use a `NEXT_PUBLIC_` prefix. |
| `KATALYST_ADMIN_EMAILS` | Admin access | Comma-separated list of bootstrap administrator email addresses. |
| `BREVO_API_KEY` | Optional email | Server-only Brevo API key for transactional welcome and quota alerts. |
| `BREVO_SENDER_EMAIL` | Optional email | Transactional sender email address (default: `noreply@katalyst.learn`). |
| `BREVO_SENDER_NAME` | Optional email | Transactional sender display name (default: `KATALYST`). |
| `GUEST_SESSION_SECRET` | Guest trial signing | Secret for signing guest HMAC cookies (falls back to service key if omitted). |

Ollama uses no API key or environment variable. Its base URL is saved as local workspace configuration and validated server-side for each request.

### Optional accounts

1. Create a Supabase project and enable the desired Auth methods, such as email/password and Google under **Authentication → Sign In / Providers**.
2. For Google OAuth, add the Supabase Auth callback URL shown by the project to the Google OAuth client's authorized redirect URIs.
3. Add the local KATALYST callback (`http://127.0.0.1:3000/auth/callback`) to Supabase's redirect URL allowlist. For production, allow only the deployed site's `/auth/callback` URL.
4. Apply all ordered files in `supabase/migrations/` using the Supabase SQL editor or Supabase CLI, including account persistence, AI request limits, and admin-managed site content.
5. Set the Supabase URL, publishable key, and server-only service role key in `.env.local`, then restart KATALYST.
6. Open `/login` to sign in or create an account. Terms and Privacy acceptance is required. Choose whether to move/merge guest data or use the existing account copy from Settings → Account. The guest copy remains on this device and sign-out restores it.

The service role key is required only for permanent Auth-user deletion. Keep it server-side and rotate it if it is exposed. Account sync uses the user session, an explicit compare-and-save revision, and RLS. Live email/password configuration, Google OAuth, and project-specific redirect settings must be verified in the configured Supabase project; repository tests do not claim external setup is live.

See [AI provider configuration](docs/AI_PROVIDER_GUIDE.md) for dynamic discovery behavior, pricing caveats, session keys, and limitations. See [Security](docs/SECURITY.md) before exposing an instance to other users.

Cloudflare model discovery is account-scoped and Settings can also hold an account ID and API token in the current tab. KATALYST presents the text-generation candidates returned by the account's live model catalog, preserving their `@cf/...` IDs and excluding entries identified as non-chat tasks. Catalog diagnostics distinguish an empty upstream catalog from entries excluded by the compatibility filter. The default hosted provider does not imply that credentials exist or that requests are free: Cloudflare setup and quota limits are described in the [provider guide](docs/AI_PROVIDER_GUIDE.md#cloudflare-workers-ai-default-hosted-provider).

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Automated provider tests mock network responses and do not need live credentials or make billable provider calls. Playwright setup is described in [Development](docs/DEVELOPMENT.md).

Before public release, complete the [MVP release checklist](docs/MVP_RELEASE_CHECKLIST.md). Vercel project settings, legal operator identity, email delivery, Supabase settings and backups, WAF/monitoring, Search Console, and provider billing alerts require external setup; a green local build does not verify them. The current MVP does not require a custom domain.

The standard Playwright suite does not require a live compiler download. To run the actual C/C++ compiler and interactive stdin integration check, use `RUN_C_PLAYGROUND_INTEGRATION=1 npm run test:e2e -- --grep 'live stdin in the browser sandbox'`. The first run can take several minutes while the pinned package is fetched; subsequent runs use the browser's Wasmer package cache.

## Contributing

Read [AGENTS.md](AGENTS.md), [Development](docs/DEVELOPMENT.md), and [Security](docs/SECURITY.md) before contributing. Keep provider-specific logic in isolated adapters, never log keys or prompt contents, and do not add user-supplied provider URLs without a robust SSRF boundary. Do not commit API keys, provider responses, or user data. Contributions are welcome under Apache-2.0; third-party skills remain under their own terms.

## Project docs

- [Product vision](docs/PRODUCT_VISION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Compiler architecture](docs/COMPILER_ARCHITECTURE.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [MVP release checklist](docs/MVP_RELEASE_CHECKLIST.md)
- [Launch readiness index](docs/LAUNCH_READINESS.md)
- [Design direction](docs/DESIGN.md)
- [Roadmap](docs/ROADMAP.md)
- [AI provider guide](docs/AI_PROVIDER_GUIDE.md)
- [Skills inventory](docs/SKILLS.md)
- [Security](docs/SECURITY.md)
- [Development](docs/DEVELOPMENT.md)
- [Decisions](docs/DECISIONS.md)
- [Changelog](CHANGELOG.md)
- [License](LICENSE)
