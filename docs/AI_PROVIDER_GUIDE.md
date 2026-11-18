# AI provider guide

## Supported providers and model catalogs

KATALYST has adapters for Cloudflare Workers AI Chat Completions, OpenAI Responses, Google Gemini `generateContent`, OpenRouter Chat Completions, and local Ollama chat. Cloud adapters run server-side and use the existing key handling. Ollama connects from the local KATALYST server to a validated loopback service and uses no cloud key. The shared model metadata type lives in `src/lib/providers/catalog.ts`; provider-specific discovery and request formats remain in separate modules.

| Provider | Catalog behavior | Credential-access meaning |
| --- | --- | --- |
| Cloudflare Workers AI | Calls the account model search endpoint, follows up to ten pages of 100 entries, and preserves valid `@cf/...` identifiers. Entries whose task metadata identifies a non-generation task are excluded. When optional task metadata is absent, known embedding, image-generation, speech, and other non-chat families are excluded by model metadata hints. | “Listed for this account” means the configured token could list the model; generation permission, quota, and plan are still enforced on inference. |
| OpenAI | Uses the existing small built-in model list. | The list is supported by this adapter; account access is not preflighted. |
| Gemini | Calls Google's paginated `models.list` API with the selected API key. Keeps entries advertising `generateContent` with an output token limit, excludes known non-text, preview, and retired families, and marks a small curated stable set as recommended: `gemini-3.8-flash`, `gemini-3.5-flash-lite`, and `gemini-2.5-pro` when returned for that key. | “Listed for this key” means returned by the API using that key. Generation access can still vary. Gemini 2.5 Pro is restricted to existing projects with prior access. |
| OpenRouter | Calls the OpenRouter model catalog and requests models with text input and output. IDs are retained exactly, including provider namespaces. | The public catalog listing does not verify account access to a listed model. |
| Ollama | Calls the local `/api/tags` API and lists models already installed on the KATALYST host. Results are not cached. | Metadata is returned by the local server; it does not predict generation speed or guarantee hardware fit. |

Gemini model results are not hardcoded. Google documents `GET https://generativelanguage.googleapis.com/v1beta/models`, page tokens, model limits, and supported generation methods in its [Models API reference](https://ai.google.dev/api/models). Generation calls use the official [`models.generateContent` API](https://ai.google.dev/api/generate-content).

Only models that advertise `generateContent` and a usable output limit are eligible. Preview/latest/experimental IDs and model names that identify embedding, image, audio, video, live, transcription, speech, or other non-chat tasks are excluded. The recommended set is applied only to live catalog entries, so a documented name is never added to the picker when the selected key does not return it. Google currently recommends Gemini 3.8 Flash for new projects; the stable Gemini 2.5 Pro endpoint remains listed only for projects with existing access. Check the [current model list](https://ai.google.dev/gemini-api/docs/models) and [deprecation guide](https://ai.google.dev/gemini-api/docs/deprecations) when choosing models.

## Shared AI Gateway and Quota Policies (M15)

In M15, Cloudflare Workers AI operates as KATALYST's default managed provider. Learners do not need an API key to ask Kat questions.

### Quota and Credit Architecture
- **AI Credits**: Public usage unit is AI credits rather than raw tokens. Base credit weight is configurable per model in `ai_model_config`.
- **Monthly User Allowance**: Authenticated learners receive a monthly quota (default 1,000 credits). Quota periods follow the UTC calendar month (first day of month 00:00 UTC to first day of next month 00:00 UTC) and reset cleanly without rollover.
- **Guest Trial**: Unregistered learners receive a restricted 50-credit trial. When exhausted, the interface prompts the learner to sign in or create an account to receive the account allowance. Email/password and Google sign-in share the `/login` page when enabled by the operator. Trials are tracked server-side and protected by salted IP hashing to deter storage-clearing abuse.
- **BYOK Isolation**: When a user selects a Bring-Your-Own-Key provider (Gemini, OpenAI, OpenRouter, or local Ollama), or enters a personal session Cloudflare key, requests bypass the credit gateway and consume zero shared KATALYST credits. There is no automatic fallback between shared and BYOK tiers.
- **Emergency Kill Switch & Admin Controls**: Administrators can pause shared AI inference globally, adjust credit weights, change the designated shared model, and monitor live consumption in Settings → Admin.

## Cloudflare Workers AI default hosted provider

Cloudflare is the initial hosted provider when no valid `AI_PROVIDER` is set. A valid provider already saved in this browser remains selected, so the default does not overwrite a learner's explicit choice. Cloudflare is an ordinary provider selection: missing or invalid configuration is surfaced and KATALYST never falls back to another provider.

The server sends `POST https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1/chat/completions` with bearer-token authentication, the selected model's exact catalog ID, and OpenAI-compatible `messages`. Discovery calls the documented `GET /accounts/{account_id}/ai/models/search` endpoint with pagination, `hide_experimental=true`, and `include_deprecated=false`. It validates the Cloudflare response envelope and task metadata rather than applying a hardcoded model allowlist. The compatibility filter accepts a valid catalog ID when task metadata is text generation, and also accepts entries with missing optional task metadata unless their name/description identifies a known non-chat family. The picker therefore reflects the current account catalog, and model availability can change. If the catalog is empty, Settings says so; if it contains entries but none pass compatibility checks, Settings reports the raw and compatible counts and a separate diagnostic. The exact `@cf/...` model ID is passed through unchanged to the official [OpenAI-compatible Chat Completions endpoint](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/). See Cloudflare's [model catalog](https://developers.cloudflare.com/workers-ai/models/) and [account model search API](https://developers.cloudflare.com/api/resources/ai/subresources/models/methods/list/).

Configure server environment values in `.env.local`:

```dotenv
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-workers-ai-token
AI_PROVIDER=cloudflare
```

Alternatively, enter the account ID and token in Settings for a tab-only session. The account ID is sent in `x-katalyst-cloudflare-account-id`; the token uses the common `x-katalyst-provider-key` header. Both stay out of localStorage and chat data. For a custom Cloudflare token, the official [REST API setup guide](https://developers.cloudflare.com/workers-ai/get-started/rest-api/) documents Workers AI Read and Workers AI Edit permissions; its generated Workers AI token template can be used instead. **Save & refresh models** performs catalog discovery only. It reports authentication, permission, account/API, rate-limit, timeout, network, and malformed-response errors without returning upstream payload details. **Test inference** is separate, user-triggered, and sends a minimal request to the currently selected catalog model; it may use Workers AI quota. KATALYST does not run inference automatically on page load or catalog refresh, and a successful catalog response is not reported as a successful model connection.

As checked against Cloudflare's official documentation on 2026-11-09, the free allocation is 10,000 Neurons per day, resetting at 00:00 UTC. Workers Paid bills usage above that allocation at $0.011 per 1,000 Neurons; usage that exceeds limits can fail, and some models require paid billing. These values and per-model costs can change. KATALYST does not promise free or unlimited inference and does not auto-select a different provider. Review Cloudflare's [pricing and quota documentation](https://developers.cloudflare.com/workers-ai/platform/pricing/) before using the service.

OpenRouter catalog results include names, architecture modalities, context length, pricing, and supported parameters. KATALYST converts reported USD prompt and completion prices from per-token values into per-million-token display values when both values are valid. Missing or malformed prices remain unknown. See OpenRouter's [models API reference](https://openrouter.ai/docs/api/api-reference/models/get-models) and [Chat Completions reference](https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request).

The OpenRouter **Free model routing** choice uses the official `openrouter/free` ID. OpenRouter selects a currently available free text model for that request. It is a distinct model selection and is never used as an automatic fallback from another model. The router's target may change. Free model variants and zero prices do not promise unlimited usage: rate limits, provider restrictions, temporary availability, and account funding requirements can apply. See the [official free router page](https://openrouter.ai/openrouter/free/apps) and [free model collection](https://openrouter.ai/collections/free-models).

The model picker can search names, IDs, namespaces, and descriptions; filter reported free or paid prices; and refresh dynamic catalogs. It renders at most 150 matches at once; search to narrow larger catalogs. Unknown prices are shown as unknown and appear only under “All prices.” Context limits and adapter-known capabilities are displayed when present. Ollama reports approximate download size, parameter size, family, and quantization when available; its current list API does not provide context limits. A catalog record means discovered and compatible with KATALYST's text workflow; it does not prove generation access for every account.

Settings separates **AI Providers** from **Models**. Provider cards report setup/configuration state and expose key visibility and explicit save/clear controls; model selection shows the active provider and selected model. Environment-key presence means a request can be attempted, not that the connection has been verified. Catalog discovery or inference is needed to confirm live access. The provider/model choice remains explicit after request failures; KATALYST never switches providers or models automatically.

Cloudflare and Gemini discovery each follow at most ten API pages and reject catalogs larger than 3 MB per response (Cloudflare requests 100 records per page). Dynamic cloud catalog results are cached in server memory for five minutes, scoped by provider and a SHA-256 digest of the credential; Cloudflare cache entries also include the account ID in their digest. At most 32 cache entries are kept. Refresh bypasses the cache. Raw keys are not used as cache keys or returned in model responses. Environment credentials or session-only values are needed to discover dynamic catalogs (Cloudflare requires both token and account ID). Failed refreshes keep the last successful catalog and selected model; only a successful catalog that no longer contains that selection asks the user to choose again. OpenRouter's documented free router remains visible without a key; its model call still requires an OpenRouter key. Ollama model discovery is uncached so newly installed or removed local models appear after refresh.

## Configure credentials

### Production deployment setup

> [!IMPORTANT]
> The local `.env.local` file is exclusively for local development and is ignored by Git. It does not configure production. For production deployments (e.g. Vercel, Railway, Fly.io, or Docker), administrators must configure `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` directly in the host platform's environment variable dashboard.
>
> See the complete [Production Deployment Guide](DEPLOYMENT.md) for step-by-step instructions across major cloud hosting providers.

### Developer environment keys (Local development only)

For local development, copy `.env.example` to `.env.local`, configure any of the keys below, and restart the server:

```dotenv
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
OPENAI_API_KEY=...
GEMINI_API_KEY=...
OPENROUTER_API_KEY=...
```

`AI_PROVIDER` may choose the initial provider (`cloudflare`, `openai`, `gemini`, `openrouter`, or `ollama`); it defaults to `cloudflare` when absent or invalid. A provider choice already saved in this browser takes precedence. `AI_MODEL` is an optional initial model hint for OpenAI's built-in catalog. Cloudflare, Gemini, OpenRouter, and Ollama model choices are discovered and then saved per browser; unsupported model IDs are not accepted merely because they appear in an environment variable. Settings shows whether environment credentials are present. **Save & refresh models** calls the actual catalog endpoint for discovery; Cloudflare's separate **Test inference** action makes a real minimal generation request only after an explicit click and a listed model selection. Environment-key presence alone is not a successful connection check, and KATALYST does not make billable inference calls automatically on page load or refresh.

### Local Ollama

Ollama must run on the same machine as the KATALYST server. Install Ollama from its [official site](https://ollama.com/download), start its server, then install a model yourself using the Ollama app or CLI. KATALYST only lists models from `GET /api/tags` and generates via `POST /api/chat`; it does not download, update, or delete models. See the official [Ollama API docs](https://docs.ollama.com/api), [chat endpoint](https://docs.ollama.com/api/chat), and [model list endpoint](https://docs.ollama.com/api/tags).

The saved address accepts only `http://localhost:11434`, `http://127.0.0.1:11434`, and `http://[::1]:11434`. It rejects remote hosts, LAN addresses, custom ports, URL credentials, paths, query strings, and redirects. KATALYST also blocks Ollama requests when the incoming KATALYST host is not loopback or, when an `Origin` is supplied, it does not exactly match the request origin. The default `dev` and `start` commands bind KATALYST to `127.0.0.1`. Keep both KATALYST and Ollama local; do not override the host or bind Ollama to `0.0.0.0` to expose either service to network users.

### User session keys (BYOK)

Settings also accepts an optional key for each cloud provider. After entering it, select **Save for this tab** to make it active; **Clear session key** removes the active value and the field draft. The key stays in component memory for the current page session and is cleared by a reload or tab close. KATALYST does not save it to localStorage, IndexedDB, chat messages, URLs, analytics, or server-side storage. It is sent from the browser to this KATALYST server in the `x-katalyst-provider-key` request header for catalog discovery and chat, then used for the upstream provider request. The KATALYST server necessarily receives the key while servicing those requests. Ollama uses no API key.

Session keys are accepted over HTTPS, with loopback HTTP allowed for local development. Use HTTPS in production. A saved session key takes precedence over that provider's environment key for requests made with it. Clearing the session key returns to the environment key, if present. This is per-tab, transient BYOK; it does not provide authenticated user isolation. Persistent multi-user BYOK would require authentication, user-scoped credential isolation, protected credential storage, and operational controls that this application does not implement.

Never use a `NEXT_PUBLIC_` prefix for provider credentials. KATALYST does not return keys from `/api/status` or `/api/models` and does not log credentials.

## Kat, the learning tutor

Kat uses the same provider and model selected in KATALYST Settings and the existing server-side `/api/chat` route. A tutor request uses the same request-size limits, server-side credentials, provider error handling, and Ollama loopback restrictions as a workspace chat. Opening Kat from a lesson includes that path, module, lesson explanation, objective, and exercise as user-level reference context. Tutor context is capped at 20,000 characters; tutor history is trimmed to 23,000 characters and 20 messages before the request. The context is not provider policy, and it cannot grant tools or request secrets.

Concept teacher, Socratic tutor, Practical mentor, and Exam coach are prompt-guided response styles. They are not a deterministic teaching engine or a guarantee of a particular answer format. Tutor turns stay in page memory and are not added to workspace conversations or localStorage. No model is used for lesson completion or progress calculations. Kat is not streamed; the current provider contract returns complete responses.

## Request behavior

- Cloudflare: `POST https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1/chat/completions`, bearer authentication, exact model ID returned by account discovery, and normalized chat-completion text/usage.
- OpenAI: `POST https://api.openai.com/v1/responses`, bearer authentication, `store: false`, and a 1,200-token output cap.
- Gemini: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`, `x-goog-api-key` authentication, normalized `contents` history and `systemInstruction`, and a 1,200-token output cap.
- OpenRouter: `POST https://openrouter.ai/api/v1/chat/completions`, bearer authentication, exact selected model ID, non-streaming response, and a 1,200-token output cap.
- Ollama: `POST http://localhost:11434/api/chat`, `stream: false`, and a 1,200-token output cap. Model listing uses `/api/tags`.
- OpenAI, Gemini, and OpenRouter calls time out after 45 seconds; Cloudflare chat calls time out after 60 seconds. Cloud model catalog calls time out after 20 seconds. Ollama discovery uses an 8-second timeout and generation uses a 120-second timeout. Redirects are rejected. Responses are normalized to text and optional reported usage.
- The chat route allows at most 20 messages, 8,000 characters per message, 24,000 characters of workspace context, 44,000 aggregate message/context characters, and a 192 KB request body.
- Provider IDs and selected models are checked server-side. Dynamic Cloudflare, Gemini, and OpenRouter choices must still appear in the current catalog when a chat is sent. Ollama choices must appear in its current local tag list. An inaccessible model is reported; KATALYST does not switch to another model.

## Assistant Markdown display

Each adapter returns provider text without rewriting Markdown. The shared assistant-message view renders CommonMark and GitHub Flavored Markdown for OpenAI, Gemini, OpenRouter, and Ollama responses. It supports headings, emphasis, nested lists, blockquotes, tables, links, inline code, and fenced code blocks. Highlighted blocks include a language label when the response specifies one, a copy button, and horizontal scrolling on narrow layouts. The existing user-message view remains plain text. Rendering is based on the current message string and carries no incremental parser state; provider streaming is still not implemented.

Raw HTML in a response is ignored. Links are rendered only for HTTP(S), `mailto:`, and in-page fragment destinations; external HTTP(S) links open with `noopener noreferrer`. Markdown images are omitted. The highlighter includes 37 common language grammars; code in other languages still displays and copies without token coloring. See the [`rehype-highlight` language notes](https://github.com/rehypejs/rehype-highlight#what-is-this) and [Security](SECURITY.md#assistant-response-rendering) for the rendering boundary.

## Usage reporting and conversation actions

The UI shows provider and exact model for successful responses. Token counts appear only when returned by the provider: OpenAI `input_tokens`/`output_tokens`, Gemini `usageMetadata.promptTokenCount`/`candidatesTokenCount`, OpenRouter `usage.prompt_tokens`/`completion_tokens`, and Ollama `prompt_eval_count`/`eval_count`. OpenRouter cost appears only from a valid `usage.cost` value. KATALYST does not estimate cloud cost. Ollama token counts are labeled local usage and are not represented as a cloud charge.

Conversation search scans local titles and message text. Each message can be copied. A user turn can be edited and resent, which discards later turns. The last assistant response can be regenerated. Failed or stopped requests can be retried with the same provider, model, and skill context. Stop aborts the browser request and provider fetch. Generation is currently non-streaming because the adapter contract returns a complete normalized result; cancellation does not guarantee an upstream service stops work already in progress.

OpenAI's `store: false` is a request setting, not a statement about every provider's retention policy. Review each provider's current processing, retention, billing, and API terms before sending sensitive information.

The Progress dashboard summarizes local AI activity from `katalyst.ai-activity.v1` (at most 500 recent requests): request counts, provider/model counts, seven-day activity, and input/output token totals only when returned by a provider. Started, completed, failed, and stopped attempts are counted as request events. Records contain provider, model, time, outcome, and provider-reported token values only; prompts, answers, credentials, and estimated costs are excluded. This analytics record stays in the browser and is not synchronized or included in workspace backups. It begins with real events recorded after this feature exists and does not fabricate history.

## Skills and project context

Project instructions and enabled skills are combined under a 24,000-character cap. The app deduplicates repeated instruction text after whitespace and case normalization, skips disabled skills, and omits enabled skills that do not fit. The request places this content in the latest user message as JSON-encoded untrusted context; fixed trusted provider instructions remain separate. The user message in the local conversation shows which skills were included and which were skipped. This composition is provider-independent, though the selected provider receives the resulting context. See [Skills](SKILLS.md) and [Security](SECURITY.md).

## Errors and limitations

- Missing cloud key: setup guidance names the expected environment variable and offers session-only key entry. Ollama needs no API key and instead reports a local connection error when its server is unavailable.
- Invalid credentials or permissions, rate limits, unavailable models, credits, timeouts, and network failures are mapped to provider-specific messages.
- Gemini's generation support is inferred from `supportedGenerationMethods` plus known non-text model-name exclusions; the Gemini API can evolve and provider-side access remains authoritative.
- OpenRouter prices and free labels reflect the current catalog response, not a usage guarantee. Catalog prices and free routing availability can change.
- No streaming output, tool/function execution, live account-level validation, model auto-fallback, or persistent user credential store is implemented.
- Cloud custom OpenAI-compatible endpoints are not implemented. Ollama is limited to loopback addresses; arbitrary remote destinations need DNS resolution and IP pinning against private/link-local/metadata ranges plus redirect and egress enforcement, which this application does not have.
- KATALYST remains a local single-operator workspace. It has no sign-in, abuse controls, shared quota protection, or user-scoped server-key isolation.

## Verification

Automated tests mock provider network calls. They cover response normalization, dynamic model discovery and pagination, pricing, provider routing, authentication and model errors, session-key transport and redaction, and UI key persistence behavior. They do not call providers or verify live account access. The verification record below lists the commands run for this version.

### M4 verification record — 2026-11-08

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed, 50 tests across 5 files.
- `npm run test:e2e` — passed, 7 browser tests.
- `npm run build` — passed.
- No live Gemini or OpenRouter requests were made; account access and current live catalog results remain unverified.

### M5 verification record — 2026-11-08

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed, 81 tests across 7 files.
- `npm run test:e2e` — passed, 13 browser tests, including Ollama selection/request flow, corrupt-storage preservation, conversation editing/regeneration/search/retry, and backup restore.
- `npm run build` — passed with Next.js 16.4.5 production output.
- Provider and Ollama network calls were mocked. Live cloud access and a live local Ollama server were not tested.

### Chat Markdown rendering verification — 2026-11-09

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed, 85 tests across 8 files.
- Playwright browser suite — passed, 17 tests, including OpenAI/Gemini/OpenRouter/Ollama Markdown responses, copy-code actions, and narrow-screen overflow checks.
- `npm run build` — passed with Next.js 16.4.5 production output.
- Provider responses were mocked; no live provider inference was used.

### M7 integrated learning workspace verification — 2026-11-09

- `npm run lint` and `npm run typecheck` — passed.
- `npm test` — passed, 116 tests across 12 files.
- `npm run test:e2e` — passed, 26 browser tests; the compiler integration test is skipped by default.
- `RUN_C_PLAYGROUND_INTEGRATION=1 npm run test:e2e -- --grep 'compiles and runs a C program'` — passed in Chromium from an integrated lesson. The real C11 program read stdin and printed the expected output; first compiler initialization took about five minutes in this fresh browser context.
- `npm run build` — passed with Next.js 16.4.5 production output.
- Provider calls and model catalogs in browser tests were mocked. No live provider inference or account authentication was verified.

### M8 product experience verification — 2026-11-09

- Lint and TypeScript checks passed; all 130 unit tests passed.
- Playwright passed 30 browser tests, covering Cloudflare/model failure handling, other provider flows, session-key non-persistence/export redaction, conversation actions, themes, guest mode, local AI activity, mobile layout, desktop scrolling, and compiler/lesson regression flows. The existing optional real compiler integration test was skipped.
- Production build passed. Provider network behavior and catalog access were mocked; no live provider inference or account-level Cloudflare access was verified.
