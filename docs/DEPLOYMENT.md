# KATALYST Production Deployment & Configuration Guide

This guide details how to deploy KATALYST to production environments and configure production environment variables for the shared AI Gateway, authentication, database persistence, and compiler runtime.

---

## 1. Production Secrets vs. Local Development

> [!IMPORTANT]
> The local `.env.local` file is exclusively for local development and is ignored by Git. It does not automatically configure production environments. In production, administrators must configure environment variables directly within their hosting platform's administration dashboard (e.g., Vercel, Railway, Fly.io, or container orchestrator).

### Security Boundary Invariants
- **Never expose credentials in browser bundles**: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `SUPABASE_SERVICE_ROLE_KEY` must never be prefixed with `NEXT_PUBLIC_`.
- **API Isolation**: Server-side credentials are never returned in client API responses (`/api/status`, `/api/models`, `/api/chat`).
- **No Client-Side Gateway Bypass**: All shared Cloudflare Workers AI inferences must route through the server-side AI Gateway at `/api/chat`, where rate limits, credit quotas, kill switches, and token ledgers are strictly enforced.

---

## 2. Environment Variables Specification

### A. Shared Cloudflare AI Gateway (Required for Shared AI)
| Variable | Scope | Description |
| :--- | :--- | :--- |
| `CLOUDFLARE_ACCOUNT_ID` | Server-only | Cloudflare account ID used to construct server-side Workers AI API URLs (`https://api.cloudflare.com/client/v4/accounts/{id}/ai/run/...`). |
| `CLOUDFLARE_API_TOKEN` | Server-only | API token with `Workers AI - Read` and `Workers AI - Edit` permissions. Used exclusively by the server-side gateway. |

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
| `GEMINI_API_KEY` | Server-only | Server-default API key for Google Gemini BYOK inference. |
| `OPENROUTER_API_KEY` | Server-only | Server-default API key for OpenRouter BYOK inference. |

---

## 3. Platform Configuration Instructions

### Vercel Deployment
1. Import the repository into Vercel.
2. Navigate to **Project Settings → Environment Variables**.
3. Add the production keys:
   - `CLOUDFLARE_ACCOUNT_ID` (Environment: Production, Preview)
   - `CLOUDFLARE_API_TOKEN` (Environment: Production, Preview)
   - `NEXT_PUBLIC_SUPABASE_URL` (Environment: Production, Preview)
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Environment: Production, Preview)
   - `SUPABASE_SERVICE_ROLE_KEY` (Environment: Production, Preview)
   - `KATALYST_ADMIN_EMAILS` (Environment: Production, Preview)
   - `GUEST_SESSION_SECRET` (Environment: Production, Preview)
4. Trigger a deployment. Verify the build command runs `prebuild` (`node scripts/copy-wasmer-browser-runtime.mjs`).

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

## 4. Header & Runtime Requirements

### Cross-Origin Isolation (COOP & COEP)
The browser-based WebAssembly and Web Worker sandboxes (Wasmer C11 clang, Pyodide 3.12, and JavaScript isolated workers) require `SharedArrayBuffer` and clean process isolation in modern browsers. Next.js is preconfigured in `next.config.ts` to output:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

Ensure any reverse proxy (e.g. Nginx, Cloudflare CDN, AWS CloudFront) preserves these headers without stripping them.

### Production Health Check Endpoint (`/api/health`)
KATALYST exposes a lightweight, secret-free health check endpoint at `/api/health`:
```bash
curl -i https://your-domain.com/api/health
```
Expected response:
```json
{
  "ok": true,
  "status": "healthy",
  "coursesCount": 4,
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

## 5. Production Verification Checklist

1. **Verify Automated Health Check**:
   - Query `GET /api/health`.
   - Confirm HTTP 200, `status: "healthy"`, and `coursesCount: 4`.
   - Verify no secrets, tokens, or private credentials are included in the JSON payload.
2. **Verify 4-Course Catalog & Discovery**:
   - Navigate to Explore Learning Paths.
   - Confirm all 4 courses are displayed with correct lesson/module counts:
     - **C Programming Foundations**: 16 lessons, 6 modules.
     - **Python Programming Foundations**: 19 lessons, 7 modules.
     - **JavaScript & Algorithmic Systems**: 10 lessons, 4 modules.
     - **Digital Logic & Circuit Foundations**: 8 lessons, 3 modules.
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
   - Inspect network headers: verify no Cloudflare API tokens or account IDs are leaked in request payloads or responses.
6. **Verify Guest Trial & Quota Limits**:
   - In Settings → Usage & Credits, verify the 50 credit guest trial is displayed.
   - After quota exhaustion, verify the user is prompted to sign in with Google or provide BYOK keys.
7. **Verify Admin Authorization**:
   - Log in with an account matching `KATALYST_ADMIN_EMAILS`.
   - In Settings, verify the **Admin** tab appears with system kill-switch controls, policy limits, and user analytics.
   - Log in with a non-admin account or view as a guest; verify the **Admin** tab is completely absent.
