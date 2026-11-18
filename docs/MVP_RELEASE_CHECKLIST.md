# KATALYST MVP release checklist

This is the release handoff for the current MVP. The app can use its Vercel `*.vercel.app` production address; a custom domain is intentionally out of scope. A passing build or automated test does not configure external services or replace legal, security, or operational review.

## In the repository

- Responsive learning workspace, 14 published courses, browser-local coding and simulator tools, guest progress JSON export, account access and deletion, public Privacy and Terms pages, sitemap, robots policy, social preview, and 404 page.
- Final K mark used throughout the UI, with rounded PNG variants for the browser, PWA, and desktop wrapper.
- Admin-only announcement and scheduled Home launch-video controls. Announcement text is rendered as text, action destinations are validated, and future scheduled content is omitted from the public endpoint.
- Site-content writes require an authenticated administrator and same-origin request, have a 16 KB streaming body cap, use strict schema validation, and are written through the server-only Supabase service role. RLS is enabled and direct browser roles have no table grants.
- The public endpoint returns only active content. The launch video is muted by default, has native controls, and can be dismissed.
- Provider secrets remain server-side unless a user deliberately supplies their own BYOK credential. Browser-local code and circuit execution remain educational tools, not a hardened multi-tenant execution service.
- Mobile lesson navigation keeps the app/provider header stable while the Code editor or Kat conversation scrolls; it reappears at the top or after an intentional upward scroll. Playwright covers short touch-scroll reversals in both panels.

## Operator actions before inviting users

### Vercel deployment

- [ ] Copy the production `*.vercel.app` address from Vercel and set `NEXT_PUBLIC_SITE_URL` to that exact HTTPS origin in Production. This keeps canonical URLs on Vercel even if a custom host is still attached. Enable Vercel system environment variables for the fallback and deployment-mode checks; do not point this setting at a preview URL.
- [ ] Configure the required environment variables in Vercel Production. Keep provider keys, the Supabase service-role key, `GUEST_SESSION_SECRET`, and email API keys server-only. Redeploy after changing environment variables.
- [ ] Check `/`, `/courses`, `/sitemap.xml`, `/robots.txt`, `/opengraph-image.png`, `/manifest.webmanifest`, and an unknown URL on the production host. Confirm metadata and sitemap use the production `.vercel.app` address.
- [x] Preview builds emit `noindex` metadata, disallow crawling in `robots.txt`, and return an empty XML sitemap. Also verify Vercel deployment protection before sharing preview links.

### Supabase, accounts, and admin access

- [x] Connected Supabase project `wcnoxasohsqscovomnms`: all eight repository migrations are recorded in order; 18/18 public tables have RLS enabled; stored function bodies match the migration sources; client/service-role grants and the new budget, guest-session, and account-action paths were checked.
- [ ] Run the repository pgTAP suite with `supabase test db` against a local or staging database. The Supabase CLI is not installed/configured in this checkout and pgTAP is not installed in the connected project; live verification used read-only catalog checks plus rollback-scoped SQL assertions instead.
- [ ] Repeat the migration and RLS/grant check for any separate staging or production project before deploying there.
- [ ] Set `KATALYST_ADMIN_EMAILS` to the smallest intended set of verified addresses. Test the Admin section with an admin, a normal account, and a guest.
- [ ] Configure the exact production `.vercel.app/auth/callback` redirect in Supabase. Set up intended email/password and Google providers, require email confirmation, configure sender/SMTP and password reset, set Supabase Auth rate limits, and enable CAPTCHA protection. For Turnstile, set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in Vercel and its matching secret in Supabase Auth; verify sign-in, account creation, and reset challenges on the production origin.
- [ ] Test account creation, sign-in, sign-out, reset, OAuth return, guest-data migration, export, and permanent deletion using disposable staging accounts.
- [ ] Supply the real legal operator, jurisdiction, and monitored support email through `NEXT_PUBLIC_LEGAL_ENTITY`, `NEXT_PUBLIC_LEGAL_JURISDICTION`, and `NEXT_PUBLIC_SUPPORT_EMAIL`. Have qualified counsel review Privacy, Terms, data retention/deletion, consent, minors/privacy obligations, AI-provider disclosures, and the operating jurisdiction. The app now records accepted Terms/Privacy version, timestamp, and auth method per account; this does not replace legal review or prove identity.
- [ ] Confirm the actual Supabase project region and Cloudflare AI processing/retention locations from the selected plans and current provider terms, then disclose the applicable regions. Decide the minimum-age/age-gate policy with counsel before inviting minors; these facts and decisions cannot be inferred from source code.

### Announcement and launch video

- [ ] In **Settings → Admin → Public announcement & launch video**, create the banner text and choose its start/end time. Times are entered in the administrator's device timezone. The feature is a first-party announcement surface; it does not include an ad network or ad tracking.
- [ ] Host the launch video yourself at a public HTTPS MP4/WebM URL. The host must send `Access-Control-Allow-Origin` for the KATALYST origin (or `*` for a public asset) so the app's `crossorigin="anonymous"` video can load under `COEP: require-corp`. Do not upload it through the admin form.
- [ ] Schedule the event window in the same admin panel and test before the start, during the window, after dismissal, and after the end on desktop and mobile. The video opens only on Home, starts muted, uses native controls, and can be dismissed.
- [ ] After the event, disable it or let its schedule expire. The app only returns active event data, and public responses are briefly cacheable.

### Security, reliability, and launch operations

- [ ] Rotate any real credential that appeared in a browser request, screenshot, terminal log, Git history, or shared document. The app cannot revoke provider keys for you.
- [ ] Confirm `.env.local` is ignored and is not tracked. Store production secrets in Vercel's encrypted environment settings. Keep the Supabase publishable key public only with verified RLS policies.
- [ ] Enable appropriate Vercel/edge abuse controls, monitor `/api/health`, review error logs without collecting prompt/credential values, and set Cloudflare/provider billing alerts. Application quotas are not an upstream spend cap or a full bot defense.
- [ ] Review Cloudflare AI, Supabase Auth/database/API, and hosting log settings so request-body, prompt, credential, and retention behavior matches the Privacy notice. KATALYST does not control provider or platform logging policies.
- [ ] Choose the Supabase backup/retention plan and complete a restore drill. Assign an owner for support, security reports, privacy requests, deletion failures, and provider incidents.
- [ ] Verify the large first-use WebAssembly compiler download and COOP/COEP isolation on the production host. Test C/C++ stdin, Python, SQL, browser preview, circuits, and board simulators on real devices and browsers. Hardware boards are simulations, not physical I/O.
- [ ] On a real phone, switch between Learn, Code, and Kat, scroll each panel, and confirm the app/provider header stays hidden through normal touch momentum and returns when scrolling back to the top or intentionally upward.
- [ ] Submit the production sitemap in search consoles only after verifying public URLs and legal identity. Search ranking, backlinks, and console indexing continue after launch.
- [ ] Do not advertise payments or subscriptions: checkout and payment operations are not implemented.

## Automated release verification

Run from the application root and retain the command output with the release record:

```sh
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm audit --omit=dev --audit-level=high
npm run build
```

The production dependency audit excludes build/test tooling. Run `npm audit --audit-level=high` separately to inspect development dependencies as well; record any upstream advisories that do not yet have a patched release.

The normal browser suite uses mocked compiler runtimes for repeatability. The optional live C compiler test downloads the pinned package on first use and needs network access:

```sh
RUN_C_PLAYGROUND_INTEGRATION=1 npm run test:e2e -- --grep 'compiles and runs a C program'
```

The mobile lesson regression also scrolls the CodeMirror editor and Kat conversation through small alternating scroll deltas to catch header flicker.

## Latest local verification — 2026-11-18

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed, 333 tests across 38 files.
- `npm run test:e2e -- --workers=1` — passed, 76 tests; 1 opt-in live C/C++ compiler integration test was skipped because its download flag was not enabled.
- Targeted guest-progress export and Markdown injection checks — passed; the progress download contains the validated version-1 learning record, and raw `<script>`/`<img onerror>` response markup is omitted and does not execute.
- `npm audit --omit=dev --audit-level=high` — passed, 0 production dependency vulnerabilities.
- `npm audit --audit-level=high` — 16 high advisories remain in development tooling through `picomatch`; the current [GHSA-fc5q-39xc-vjpf advisory](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) lists no patched version. Do not force a breaking downgrade to silence it.
- `npm run build` — passed in an isolated working-tree copy so the active local development server's `.next` output was not disturbed.
- Browser bundle check — scanned 34 generated static assets against 5 configured server-only secret values; no exact values were found.
- Local production-server header check — returned HTTP 200 with nonce CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, Referrer-Policy, and Permissions-Policy. No browser source-map files were emitted.
- Connected Supabase database verification — all eight local migration versions are now tracked in order; all 18 public tables have RLS enabled; the 14 stored function bodies match the repository migration sources; and client/service-role permissions were checked.
- Rollback-scoped live SQL assertions — passed for guest session initialization, global budget reserve/release/settle, account deletion rate limiting, required table privileges, and server-only AI credit RPCs. The assertions ran inside a transaction and rolled back.
- Log review — 2,260 prior PostgreSQL `42702` ambiguous-column errors came from PostgREST guest-session RPC calls before the guest-session hardening migration. No PostgreSQL ERROR entries were observed in the checked log window after that migration.
- Supabase pgTAP files — not run: the connected project does not have pgTAP installed, and the Supabase CLI is unavailable in this checkout. Run them against local Supabase or staging before another deployment.
- Supabase advisors — health clear. Remaining items are three authenticated SECURITY DEFINER RPC notices (`has_active_auth_session`, `is_app_admin`, and owner-scoped `save_account_snapshot`), 12 RLS-without-policy informational notices for tables with no browser grants, disabled leaked-password protection, five unindexed foreign keys, and three currently unused indexes. See [Supabase's password protection guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

These checks validate the local repository build and mocked browser flows plus the connected Supabase schema. The deployment host, live compiler download, real mobile devices, a separate staging project, provider billing, and legal operator details still require the operator checks above.

## Known MVP limits

- Legal operator identity, jurisdiction, support contact, and counsel review are deployment-specific operator tasks and have not been guessed or filled with invented details.
- Shared Kat AI uses an admin-selected Cloudflare model and server credentials. Per-user credits, rate limits, and an app-wide daily credit ceiling are enforced by the app, but they are not a hard upstream Cloudflare billing cap or complete bot defense.
- Guest credit balances are keyed by signed browser cookies. A separate HMAC-hashed trusted-IP burst limiter allows up to 120 guest requests per minute across a shared network; it does not combine guest balances. Clearing cookies can start a fresh guest identity, so the global daily shared-use cap remains an important aggregate limit.
- Google OAuth and email account sign-in require current-version consent; the accepted version, timestamp, and method are persisted in Supabase after successful auth. Missing consent blocks the OAuth callback.
- Optional Turnstile challenges protect email sign-in, account creation, and password reset when the public site key and Supabase secret are configured. Until configured, Supabase's own Auth rate limits remain the baseline; Google OAuth uses provider/Supabase controls.
- The launch-video file is hosted externally; KATALYST stores only its public URL and does not transcode or privately stream it.
- User-entered BYOK keys are visible to that user in their own browser tools while active and are sent to KATALYST's API for the requested provider operation.
- Browser execution is constrained for learning but is not a substitute for a hardened hosted compiler service.
- No payment flow, advertising network, visitor analytics vendor, or production error-monitoring vendor is integrated.
