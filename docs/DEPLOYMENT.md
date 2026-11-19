# KATALYST Production Deployment & Configuration Guide

This guide details how to deploy KATALYST to production environments and configure production environment variables for the shared AI Gateway, authentication, database persistence, and compiler runtime.

---

## 1. Production Secrets vs. Local Development

> [!IMPORTANT]
> The local `.env.local` file is exclusively for local development and is ignored by Git. It does not automatically configure production environments. In production, administrators must configure environment variables directly within their hosting platform's administration dashboard (e.g., Vercel, Railway, Fly.io, or container orchestrator).

### Security Boundary Invariants
- **Never expose credentials in browser bundles**: `CLOUDFLARE_API_TOKEN`, `GEMINI_API_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` must never be prefixed with `NEXT_PUBLIC_`.
- **API Isolation**: Server-side credentials are never returned in client API responses (`/api/status`, `/api/models`, `/api/chat`).
- **No Client-Side Gateway Bypass**: Shared Cloudflare or Gemini inference routes through `/api/chat`, where rate limits, credit quotas, kill switches, and usage ledgers are enforced. The Gemini key selected for shared Kat is reserved for Kat and cannot serve as a Workspace fallback.

---

## 2. Environment Variables Specification

For this MVP, use the Vercel production `*.vercel.app` project alias; a custom domain is not required. Set `NEXT_PUBLIC_SITE_URL` to that exact HTTPS origin in Production. Vercel's `VERCEL_PROJECT_PRODUCTION_URL` can supply the project alias when no custom production host is attached; if a custom host remains connected, this app deliberately rejects it and the explicit `.vercel.app` setting is required. Set the operator contact fields before public launch. These values are public page content, not secrets.

### A. Shared Kat AI Gateway (Required for Shared AI)

For Cloudflare, set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in Vercel Project Settings → Environment Variables, then redeploy. Kat uses these owner credentials through the server API for every visitor; learners do not enter or receive the token. Never add the NEXT_PUBLIC_ prefix. The public status endpoint exposes only the provider name and whether it is configured.

To use the owner’s Gemini API key for shared Kat, set `KATALYST_SHARED_AI_PROVIDER=gemini`, `KATALYST_SHARED_AI_MODEL=gemini-3.5-flash-lite` (or another supported text model), and `GEMINI_API_KEY` in the Vercel server environment, then redeploy. Kat uses this key server-side for all learners. The key is not exposed to browsers and is not available as a Workspace fallback when Gemini is selected as the shared provider. Leave `KATALYST_SHARED_AI_PROVIDER` unset to keep Cloudflare as the shared provider. Never add `NEXT_PUBLIC_` to a credential. Enable shared AI in Admin only after the key and migrations are ready.

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `CLOUDFLARE_ACCOUNT_ID` | Server-only | Cloudflare account ID used to construct server-side Workers AI API URLs (`https://api.cloudflare.com/client/v4/accounts/{id}/ai/run/...`). |
| `CLOUDFLARE_API_TOKEN` | Server-only | API token with `Workers AI - Read` and `Workers AI - Edit` permissions. Used exclusively by the server-side gateway. |
| `KATALYST_SHARED_AI_PROVIDER` | Server-only | Optional shared Kat provider: `cloudflare` or `gemini`. Defaults to `cloudflare`. |
| `KATALYST_SHARED_AI_MODEL` | Server-only | Optional Gemini model ID used when the shared provider is `gemini`; defaults to `gemini-3.5-flash-lite`. |

### B. Supabase Authentication & Cloud Persistence (Required for Accounts)
| Variable | Scope | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public (Client + Server) | Supabase project URL (e.g. `https://xyzcompany.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public (Client + Server) | Supabase publishable anonymous key. RLS enforces user isolation. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Administrative secret used exclusively by confirmed user deletion and system maintenance routes. Never expose to client bundles. |

### C. Administration & Guest Security
| Variable | Scope | Description |
| :--- | :--- | :--- |
| `KATALYST_ADMIN_EMAILS` | Server-only | Comma-separated list of bootstrap administrator email addresses (e.g. `admin@katalyst.learn,lead@katalyst.learn`). Authorizes access to admin AI Gateway controls. |
| `GUEST_SESSION_SECRET` | Server-only | 32+ character cryptographically secure secret used to generate HMAC-SHA256 signatures for guest trial cookies (`katalyst_guest_token`). |
| `KATALYST_TRUSTED_CLIENT_IP_HEADER` | Server-only, optional | For production hosts other than Vercel, set to `cf-connecting-ip`, `x-real-ip`, or `x-forwarded-for` only when your reverse proxy overwrites that header. Guest AI fails closed if a trusted client IP is unavailable, so its shared-network burst limit cannot be bypassed. Vercel uses its edge-owned `x-vercel-forwarded-for` header automatically. |

### D. Optional Transactional Email (Brevo / Sendinblue)
| Variable | Scope | Description |
| :--- | :--- | :--- |
| `BREVO_API_KEY` | Server-only | API key for sending welcome emails and quota alerts via Brevo. |
| `BREVO_SENDER_EMAIL` | Server-only | Verified sender email address (default: `noreply@katalyst.learn`). |
| `BREVO_SENDER_NAME` | Server-only | Verified sender display name (default: `KATALYST`). |

### E. Optional Fallback BYOK Defaults (Server-side)
| Variable | Scope | Description |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` | Server-only | Server-default API key for OpenAI BYOK inference. |
| `GEMINI_API_KEY` | Server-only | Google Gemini key. Can power shared Kat when `KATALYST_SHARED_AI_PROVIDER=gemini`; shared-provider use is restricted to Kat. |
| `OPENROUTER_API_KEY` | Server-only | Server-default API key for OpenRouter BYOK inference. |

### F. Public Canonical Origin and Operator Contact
| Variable | Scope | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SITE_URL` | Public build-time value | Recommended exact `https://<project>.vercel.app` canonical origin. Required if Vercel's selected production alias is a custom domain. Do not include a path or custom host for the current MVP. |
| `NEXT_PUBLIC_LEGAL_ENTITY` | Public build-time value | Legal name of the deployment operator, confirmed by the operator and qualified reviewer. |
| `NEXT_PUBLIC_LEGAL_JURISDICTION` | Public build-time value | Operator's applicable legal jurisdiction, confirmed by the operator and qualified reviewer. |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Public build-time value | Monitored support and privacy contact shown on the Privacy and Terms pages. Configure a real inbox first. |

---

## 3. Compiler Runtime Requirements

C and C++ run locally in the browser. On a browser profile's first use, Wasmer downloads the pinned Clang package (about 106 MiB) from `registry.wasmer.io`; later uses can read it from the browser cache. The app CSP allowlists registry.wasmer.io for package metadata and cdn.wasmer.io for the compiler download. Production hosts and reverse proxies must preserve `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`, and the first-use network must allow HTTPS requests to the Wasmer registry. The guest program itself still runs with network access disabled. If package setup fails, the Code tab shows a specific retryable setup message.

## 4. Platform Configuration Instructions

### Supabase database migrations

Apply the complete ordered migration set before enabling shared AI, including 20261116000000_ai_request_rate_limits.sql, 20261118010000_ai_global_daily_budget.sql, and 20261118020000_guest_session_hardening.sql. Shared AI stays disabled when system configuration cannot be loaded, and credit mutations fail closed if their atomic RPCs are missing.

Apply the ordered migrations to the target Supabase project before deploying code that depends on them:
```bash
supabase link --project-ref <your-project-ref>
supabase db push
```
The AI gateway migrations create the atomic credit ledger and shared request-rate limiter. In particular, `20261116000000_ai_request_rate_limits.sql` must be applied before AI chat is enabled; when Supabase is configured but its rate-limit RPC is unavailable, AI requests fail closed with a temporary service error. Run `supabase test db` against a staging project after migration changes.

### Vercel Deployment
1. Import the repository into Vercel.
2. Navigate to **Project Settings → Environment Variables**.
3. Add the production keys:
   - `CLOUDFLARE_ACCOUNT_ID` (when using shared Cloudflare AI)
   - `CLOUDFLARE_API_TOKEN` (when using shared Cloudflare AI)
   - `KATALYST_SHARED_AI_PROVIDER=gemini`, `KATALYST_SHARED_AI_MODEL`, and `GEMINI_API_KEY` (when using shared Gemini Kat)
   - `NEXT_PUBLIC_SUPABASE_URL` (Environment: Production, Preview)
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Environment: Production, Preview)
   - `SUPABASE_SERVICE_ROLE_KEY` (Environment: Production, Preview)
   - `KATALYST_ADMIN_EMAILS` (Environment: Production, Preview)
   - `GUEST_SESSION_SECRET` (Environment: Production, Preview)
   - Enable Vercel system environment variables and set `NEXT_PUBLIC_SITE_URL` to the exact production `.vercel.app` origin. `VERCEL_PROJECT_PRODUCTION_URL` is a fallback only when Vercel selects its project alias rather than a custom production host.
   - `NEXT_PUBLIC_LEGAL_ENTITY`, `NEXT_PUBLIC_LEGAL_JURISDICTION`, and `NEXT_PUBLIC_SUPPORT_EMAIL` (Production only, after operator/legal review)
4. Trigger a deployment. Verify the build command runs `prebuild` (`node scripts/copy-wasmer-browser-runtime.mjs`). The site-origin resolver fails the production build if it cannot determine a `.vercel.app` project alias.

### Docker / Standalone Node.js Deployment
When building and running in a container or standalone Linux server:
```bash
# 1. Build the production application
npm run build

# 2. Run with production environment variables passed via container runtime or systemd
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e CLOUDFLARE_ACCOUNT_ID="your-cf-account-id" \
  -e CLOUDFLARE_API_TOKEN="your-cf-api-token" \
  -e NEXT_PUBLIC_SUPABASE_URL="https://your-proj.supabase.co" \
  -e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-anon-key" \
  -e SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
  -e KATALYST_ADMIN_EMAILS="admin@example.com" \
  -e GUEST_SESSION_SECRET="generate-with-openssl-rand-hex-32" \
  katalyst:latest
```

---

## 5. Header & Runtime Requirements

### Cross-Origin Isolation (COOP & COEP)
The browser-based WebAssembly and Web Worker sandboxes (Wasmer C11 clang, Pyodide 3.12, and JavaScript isolated workers) require `SharedArrayBuffer` and clean process isolation in modern browsers. The first C/C++ setup also downloads the pinned ~106 MiB compiler package from `registry.wasmer.io`; that download is cached in the browser after it succeeds, so first use requires an accessible network connection. Next.js is preconfigured in `next.config.ts` to output:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

Ensure any reverse proxy (e.g. Nginx, Cloudflare CDN, AWS CloudFront) preserves these headers without stripping them.

### Production Health Check Endpoint (`/api/health`)
KATALYST exposes a lightweight, secret-free health check endpoint at `/api/health`:
```bash
curl -i https://your-project.vercel.app/api/health
```
Expected response:
```json
{
  "ok": true,
  "status": "healthy",
  "coursesCount": 14,
  "services": {
    "cloudflareConfigured": true,
    "supabaseConfigured": true
  }
}
```
Use this endpoint with uptime monitoring tools (e.g. Better Uptime, Datadog, Pingdom, or AWS Route 53 health checks).

### HTTPS Requirement
In production, session-only BYOK keys and secure HTTP-only cookies (`SameSite=Lax`, `HttpOnly`, `Secure`) require an HTTPS connection. Unencrypted HTTP is permitted only on loopback addresses (`127.0.0.1` and `localhost`) for local development.

---

## 6. Production Verification Checklist

1. **Verify Automated Health Check**:
   - Query `GET /api/health`.
   - Confirm HTTP 200, `status: "healthy"`, and `coursesCount: 14` for the current published catalog. The endpoint derives this count from the runtime catalog.
   - Verify no secrets, tokens, or private credentials are included in the JSON payload.
2. **Verify Published Course Catalog & Discovery**:
   - Navigate to Explore Learning Paths.
   - Confirm all 14 published courses appear and that each selected course shows its own description, outcomes, modules, and lessons.
   - Click into each course and confirm overview, modules, and lessons render without runtime errors.
3. **Verify Execution Runtimes & Automated Verifiers**:
   - **C**: Open a C lesson, run code, and verify WebAssembly compilation and stdout output.
   - **Python**: Open a Python lesson, run code, and confirm Pyodide WebAssembly execution and output.
   - **JavaScript**: Open a JavaScript lesson, run code, and verify Web Worker execution and console capture.
   - **Automated Verifier**: Click **Verify Solution** on any exercise; confirm test cases evaluate, pass/fail status updates, and XP is awarded.
4. **Verify Interactive Simulators & Error Boundaries**:
   - Open a Digital Logic lesson; verify logic gates toggle and truth tables update.
   - Open a Low-Level Systems lesson; verify Stack & Heap Memory Visualizer steps forward and resets.
   - Confirm simulators are wrapped in `SimulatorErrorBoundary` so any client-side exception does not crash the lesson reading panel.
5. **Verify Shared Cloudflare AI & Guest Trial**:
   - Open KATALYST in an incognito window without signing in.
   - Send a prompt to Kat. Confirm inference succeeds using the guest trial allocation.
   - In shared platform mode, inspect network headers and responses: neither the server Cloudflare API token nor server Cloudflare account ID should reach the browser. If separately testing explicit BYOK, the user's own Cloudflare token and account ID are intentionally sent to KATALYST's server for that operation and are visible to that user in their browser tools.
6. **Verify Guest Trial & Quota Limits**:
   - In Settings → Usage & Credits, verify the 50 credit guest trial is displayed.
   - After quota exhaustion, verify the user is prompted to sign in or create an account, or provide a BYOK key.
7. **Verify Admin Authorization**:
   - Log in with an account matching `KATALYST_ADMIN_EMAILS`.
   - In Settings, verify the **Admin** tab appears with system kill-switch controls, policy limits, and user analytics.
   - Log in with a non-admin account or view as a guest; verify the **Admin** tab is completely absent.

## 7. Public Launch Operations

The code repository cannot complete production ownership, account, or vendor setup. Use the [MVP release checklist](MVP_RELEASE_CHECKLIST.md) as the operator release gate for legal operator details, privacy review, Auth email/OAuth configuration, backups and restore drills, support contact, WAF/monitoring, provider billing alerts, and Search Console. Payments are not implemented; do not present paid plans as available.

The configured Vercel project origin drives canonical URLs, the XML sitemap, robots sitemap declaration, and social metadata. Verify rendered production metadata against the production `.vercel.app` URL; preview deployments must not be promoted or submitted for indexing. App-level AI quotas are not a hard upstream billing cap. BYOK keys entered by a user are visible to that user in browser developer tools, while environment credentials must remain server-only.
