# C execution options

Status: design only. C and C++ execution are disabled by the shared `NEXT_PUBLIC_C_RUN_ENABLED=false` flag after production compile attempts failed. This document contains no hosted integration code.

## Hosted execution APIs

| Service | Published price and limits | Latency and terms | Data and operational concerns |
| --- | --- | --- | --- |
| **[JDoodle Compiler API](https://www.jdoodle.com/compiler-api)** | Free: 20 runs/day. Starter: US$10/month for 1,000/day; Growth: US$20 for 2,000/day; higher tiers are listed on its [credits page](https://www.jdoodle.com/docs/api/credits). One run costs one credit; exhausted quotas return HTTP 429 without queuing. | REST returns one result; WebSocket streams output and supports interactive stdin. No public p95 latency or ordinary-plan SLA was found; the [Terms](https://www.jdoodle.com/terms) disclaim timely/uninterrupted service and prohibit significant load testing. Confirm in writing that the public KATALYST use is covered by the API subscription. | Send only source, stdin, language/version, and resource limits. The provider returns stdout, stderr, status, and resource use. Keep its secret server-side as its [backend guide](https://www.jdoodle.com/docs/for-builders/run-code-from-your-backend) requires, disable internet access, cap source/input/output and runtime, enforce per-session/IP limits plus a global daily stop, and use a fixed monthly plan as the billing ceiling. Its public privacy page did not establish source-code retention; obtain a retention answer before sending user code. |
| **[Sphere Engine Compilers](https://sphere-engine.com/pricing)** | 14-day trial, no card; ongoing commercial plans are quoted to the use case. Per-minute and monthly submission limits are agreed individually. | Its [FAQ](https://docs.sphere-engine.com/docs/sphere-engine-faq) describes a typical run as a few seconds and queues submissions when capacity is busy; documented C execution limits range from 1–15 seconds. [Terms](https://sphere-engine.com/terms) place user-submission/personal-data compliance responsibility on the customer. | The FAQ says source and data streams are stored for one month. API tokens must remain in the backend. Require an explicit quote and review the one-month retention and data-processing terms before considering it. |
| **[Judge0 Shared Cloud](https://judge0.com/)** | Pro: €27/month for 2,000 submissions/day; Ultra: €54 for 5,000/day; Mega: €107 for 10,000/day. Listed overage is €0.001/submission. | Submission is asynchronous and queue-based (submit, receive token, poll for result) per its [API docs](https://ce.judge0.com/). No public p95 latency was found. The published per-submission overage means the application must enforce a hard daily ceiling itself. | Send source and stdin to Judge0 and receive compile output/stdout/stderr/status. Keep credentials on the server, use bounded polling and strict per-session/IP limits, and stop globally at the included daily allowance to prevent overage. Confirm cloud-specific retention and terms before use. |

Hosted execution means learner source code and standard input leave the browser and are processed by the selected provider. Do not send account data, Kat history, lesson progress, or credentials. A server route should authenticate the app session, validate language and size, pin compiler versions, apply a per-user and global quota, disable code network access, and return a clear quota/service error. Do not put any provider key in client JavaScript.

## In-browser compiler decision

TraceCC was considered as a one-day, scratch-only feasibility spike and declined before any work began. The reasons are its AGPL-3.0-only license, roughly 85 MB compiler/sysroot/PCH payload, pre-release API, and the need to build a separate WASI execution sandbox. No TraceCC source, assets, or integration code were added.

The hosted API comparison remains the plan for a future decision. No provider has been selected and no integration is authorized.

## Before enabling hosted C execution

- [ ] Update the privacy policy and terms to disclose the provider, the source code and stdin sent, retention, subprocessors, and user choices.
- [ ] Enforce per-user and per-IP run limits on the server.
- [ ] Enforce a global daily cap with a closed-by-default behavior when exhausted.
- [ ] Keep provider credentials in server-only environment variables; never expose them to browser code.
- [ ] Bound source, stdin, runtime, memory, and output; disable network access from submitted programs.
- [ ] Add an operator-controlled kill switch that immediately disables hosted runs.

## Runtime cleanup inventory

Both C and C++ are now disabled by the shared flag. The production C++ attempt also failed: a cold compile timed out at 300 seconds after the toolchain setup completed, and a warm attempt remained stuck in compilation for more than 372 seconds. The temporary timeout and timing instrumentation were not shipped.

### Proposed cleanup list (not approved; no files deleted)

| Proposed action | Exact path or scope |
| --- | --- |
| Delete the C/C++ Wasmer runner implementation | `public/lab-runner/c/runner.js` |
| Delete its standalone document route | `src/app/lab-runner/c/route.ts` |
| Delete the SDK asset copy script | `scripts/copy-wasmer-browser-runtime.mjs` |
| Delete the execution adapter | `src/lib/execution/c-runner.ts` and its registration in `src/lib/execution/runner.ts` |
| Delete runner configuration and message/security helpers | `src/lib/c-lab-runner-config.ts`, `src/lib/c-lab-runner-protocol.ts`, and `src/lib/c-lab-runner-security.ts` |
| Remove the Wasmer package dependency and copy hooks | Remove `@wasmer/sdk` from `package.json` and `package-lock.json`, and remove the copy-script invocation from `package.json` `predev`/`prebuild` scripts |
| Remove runner-specific response headers and asset rewrite | In `next.config.ts`, remove the runner exception from the app-wide X-Frame-Options DENY rule, CORS/CORP headers for `/lab-runner/c/runner.js`, `/lab-runner/c/wasmer/:path*`, and `/vendor/wasmer-sdk/:path*`, plus the `/lab-runner/c/wasmer/:path*` rewrite |
| Remove runner-only parent/asset CSP code | Runner import/branch and runner-origin `frame-src` addition in `src/proxy.ts`; runner-policy assertions in `tests/proxy-csp.test.ts`. Remove only `registry.wasmer.io` and `cdn.wasmer.io` if confirmed Wasmer-only; preserve `cdn.jsdelivr.net`, general `wasm-unsafe-eval`, `worker-src blob:`, and `blob:`/`data:` previews for Python, SQL, JavaScript, and HTML labs |
| Remove generated local SDK assets | `public/vendor/wasmer-sdk/` (gitignored output created by the copy script; not tracked) |
| Remove runtime-only test setups | Wasmer mocks in `e2e/m19-features.spec.ts`, `e2e/m21-platform.spec.ts`, `e2e/m22-updates.spec.ts`, and `e2e/workspace.spec.ts`; C++ real-run test in `e2e/workspace.spec.ts`; Wasmer registration and C++ execution cases in `tests/execution.test.ts`; remove `NEXT_PUBLIC_C_RUN_ENABLED=true` from the E2E `webServer` command in `playwright.config.ts` if no enabled-runtime tests remain |

The feature flag, disabled-state UI, and "C run is being upgraded, lesson is readable." message in `src/components/c-playground.tsx` are retained. The isolated-runner security suite `e2e/c-runner-security.spec.ts` and protocol-boundary tests in `tests/c-lab-runner-protocol.test.ts` are also retained per the explicit requirement. Those tests currently require the route and policy helpers above; deleting those files would make the retained tests invalid. The cleanup therefore needs a replacement security-test target or an explicit decision to keep the inert route/policy test harness. No cleanup is performed until the approved list resolves this dependency.

There is no c2wasm or TraceCC source or generated binary in the repository.
