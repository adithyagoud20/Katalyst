# Development

## Local setup

Use Node.js 20.9+ and npm. Run `npm install`, copy `.env.example` to `.env.local`, configure a provider key if needed, then run `npm run dev`. Guest mode needs no Supabase project. Optional Google accounts need the setup below.

## Conventions

- Keep provider calls and provider-specific error mapping in `src/lib/providers/`.
- Validate HTTP and imported-file data at the boundary.
- Keep UI components small and semantic, with keyboard and mobile support.
- Preserve guest-first local storage and require an explicit choice before a guest copy becomes account data.
- Preserve separate storage boundaries for workspace, learning progress, appearance preferences, AI activity, and playground drafts. Do not add these new records to version 1 backups implicitly.
- Keep activity analytics metadata-only. Add no prompt, response, credential, or estimated-cost fields.
- Keep account copy accurate: sign-in, account snapshots, export, and deletion are available only after Supabase is configured. There are no public share links.
- Never use a client-supplied user ID to authorize account reads, writes, export, or deletion. Verify sessions with `auth.getUser()`, rely on the authenticated JWT and RLS, and bind the snapshot save RPC to `auth.uid()` plus a live `session_id`.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and use it only for the confirmed Auth-user deletion route. Snapshot reads and writes use the user's session and RLS.
- Treat installed skills and imported skill files as untrusted instructions.
- Update `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, and `CHANGELOG.md` as relevant when behavior changes.
- Use the semantic color tokens in `src/app/globals.css` for shared surfaces, text, borders, and accents; preserve Light, Dark, and System parity.
- Keep provider states distinct: configured credentials, successful authentication, catalog discovery, and inference are separate facts.
- Keep session key drafts in page memory and pass the current value explicitly to model discovery; do not persist keys or silently select a replacement model after refresh.
- Keep catalog discovery separate from inference. Cloudflare's explicit test action must be user-triggered and use a currently listed model; never call it on page load or refresh.
- Preserve the lesson's main-page scroll, bounded Kat conversation scroll, reachable in-flow composer, near-bottom-only auto-follow, and compact sidebar rail at desktop/tablet sizes. Keep phone navigation as a labeled overlay drawer. Keep picker outside-pointer and Escape dismissal covered in Playwright.
- Keep code surfaces graphite in both Light and Dark appearance themes by using `--surface-code` and `--code-*` tokens; do not apply the code surface tokens to normal content cards.
- Keep C output channels separate in the view while preserving the merged activity context expected by existing lessons and tutor requests.

## Authoring a course or lesson

Add authored material to `src/lib/learning-curriculum.ts`, not to a presentation component or a model response. Register the subject and course in `learningCatalog`; keep course, module, lesson, objective, and exercise IDs unique and stable after release. Lesson IDs must be unique across the catalog because lesson hash routes are unqualified. Set consecutive `order` values, connect lesson objectives to course objectives, and list only prerequisites that occur earlier in the same course. Provide course outcomes, a difficulty, publication status, and an estimated duration only after it is measured (`null` means no estimate is published). Learner UI and progress calculations consume `publishedLearningCourses`; draft courses stay authored and validated but are hidden until marked `published`.

Each lesson includes a short summary, objective IDs, prerequisite lesson IDs, an explanation, one exercise with a difficulty and expected outcome, and a distinct checkpoint with a self-check explanation. For a complete runnable example, add an `exampleRun` with representative `sampleInput` when needed, exact `expectedOutput`, and any expected files created in the sandbox. Example file paths must be relative; expected contents are bounded. These are reference results, not automatic execution or grading. Optional exercise starter code is shown as text in Practice Lab and is never executed automatically.

Before publishing a course, review its subject/course metadata, course outcomes and prerequisites, measured duration or `null`, module and lesson ordering, unique stable IDs, objective links, and earlier-only prerequisites. Review each explanation for consistent terms and agreement with its code; for runnable samples compile with `cc -std=c11 -Wall -Wextra -Werror -pedantic`, run representative input, and check exact output and sandbox files. Check that exercises reinforce a listed objective, difficulty rises sensibly, expected outcomes are observable without implying a grade, and checkpoints remain self-checks. Set `publicationStatus: "published"` only after this content review. There is no CMS or publish button: course data is authored in `src/lib/learning-curriculum.ts`, schemas validate shape and references when the catalog loads, and the test suite validates the current C examples. Hosts without `cc` skip the compiler regression; authors should still perform the documented compiler run before publication.

Learning progress remains in the separate `katalyst.learning.v1` record. It derives totals from published courses, preserves matching completion IDs, and records completion only after the learner selects **Mark lesson complete**. Opening, reading, answering a checkpoint, running code, or asking Kat does not mark a lesson complete. Kat receives selected course/lesson context when present but should answer the actual question first. Optional skill use is explicitly toggled, enabled-only, bounded, and untrusted.

## Optional Supabase account setup

1. Create a Supabase project. Under Authentication, configure Google as an OAuth provider. Add the Supabase project's Auth callback URL to the Google OAuth client's allowed redirect URIs.
2. Add the KATALYST callback to Supabase's Auth redirect URL allowlist: `http://127.0.0.1:3000/auth/callback` for the default local server, and the exact production origin's `/auth/callback` for a deployment.
3. Apply `supabase/migrations/20261110000000_account_persistence.sql` in the Supabase SQL editor or with the Supabase CLI. This creates the profile and account snapshot tables, enables RLS, creates the session-check helper and revision/migration RPC, and adds cascading account deletion.
4. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. The service role key is needed only for permanent account deletion. Restart Next.js.
5. Open Settings → Account and sign in with Google. On a device with local data, choose **Move guest data**, **Merge this device**, or **Use account copy**. The original device copy is stored under `katalyst.guest-backup.v1`; sign-out restores that copy. No provider BYOK values are part of either snapshot.

Account sync stores one strict JSON snapshot per Auth user row: workspace (including projects, chats, messages, skills, and provider/model preferences), version-1 learning progress, and version-1 appearance preferences. Account schema and size validation run in the route before the database RPC. Saves use a revision compare-and-swap. A stale revision returns a conflict; the UI preserves both copies and asks the user to restore or merge. Guest migration IDs and snapshot commits are recorded atomically in Postgres, so interrupted retries do not duplicate the migration. The local mirror is written in the original three versioned keys.

To run database ownership tests, install/configure the Supabase CLI and local Supabase stack, then run `supabase test db`. This repository includes a pgTAP test at `supabase/tests/account_ownership.test.sql`; it is not executed by `npm test` and needs a Supabase database. Route and schema tests run under Vitest without a Supabase project. Live Google OAuth requires real Google/Supabase project configuration and is not proved by mocked route tests.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Run Playwright tests with `npm run test:e2e` after browser installation (`npx playwright install chromium`). Provider requests and catalog discovery in the automated tests use mocks and need no API credentials; the Playwright server starts with cloud provider environment credentials cleared. If port 3000 is already in use, select a free port with `KATALYST_E2E_PORT=3010 npm run test:e2e`. The default browser suite skips the C toolchain download; to verify a real compile and run in Chromium, use `RUN_C_PLAYGROUND_INTEGRATION=1 npm run test:e2e -- --grep 'compiles and runs a C program'`. The first compiler package download can take several minutes and requires internet access. Later runs use the SDK's browser cache.

The C playground is split into a client chunk and the compiler package is fetched on demand. Use `npm run build` output to compare route first-load JavaScript and lazy chunks when changing large client components. The app currently ships one compact local curriculum path; measure before moving course content to remote hosting.

## Troubleshooting

- If the selected provider reports setup required, set its server credential in `.env.local` and restart Next.js: Cloudflare requires both `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`; OpenAI, Gemini, and OpenRouter use their respective `*_API_KEY`. Ollama requires a local service instead of a key.
- If a model is rejected, select an ID enabled for the API account and check current provider access.
- If Account settings reports the service as unavailable, check the Supabase URL/publishable key, apply the database migration, verify RLS is enabled, and inspect the Google redirect allowlist. Deletion also requires the server-only service role key.
- If guest migration cannot back up local data, browser storage may be full. Export the local workspace backup and make room before retrying; KATALYST will not replace the guest records without first saving the on-device copy.
- If TypeScript cannot find generated Next.js types, run `npm run dev` once or `npx next typegen`.
- Project and chat data live in this browser's local storage. Clearing site data removes it.
- The browser C compiler needs cross-origin isolation. Use `npm run dev` or `npm run build && npm start` so the configured COOP/COEP headers are present; a reverse proxy must preserve them. First use downloads the compiler package, so wait for its progress message or stop the run if the download is not appropriate for the current connection.

## Contributions

Create a focused change, explain any dependency or architectural decision, include tests for boundary behavior, and report all checks run. Do not commit secrets, local environment files, generated `.next` content, or provider data.
