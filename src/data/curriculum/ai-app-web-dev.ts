import type {
  ExerciseTestCase,
  LearningCheckpoint,
  LearningCourse,
  LearningDifficulty,
  LearningExercise,
  LearningLesson,
  LearningModule,
  LearningObjective,
  LearningSubject,
} from "@/lib/learning-curriculum";

export const aiAppWebDevSubject: LearningSubject = {
  id: "ai-engineering",
  title: "AI Engineering & Full-Stack Systems",
  description: "Scaffold, architect, and ship production-grade full-stack web applications using generative AI tools, free-tier cloud backends, and Next.js.",
};

export const aiAppWebDevObjectives: LearningObjective[] = [
  { id: "ai-workflow-specs", title: "Scaffold modular React and Next.js applications using precise architectural specifications." },
  { id: "ai-prompt-debug", title: "Apply prompt constraints, automated diff reviews, and iterative error debugging loops." },
  { id: "ai-free-routing", title: "Route requests across Gemini, Cloudflare, and OpenRouter free tiers via secure server-side environment secrets." },
  { id: "ai-route-handlers", title: "Build type-safe Next.js Route Handlers with Zod request validation and structured streaming error handling." },
  { id: "ai-supabase-auth-rls", title: "Configure Supabase Google OAuth authentication, relational PostgreSQL tables, and Row Level Security (RLS)." },
  { id: "ai-deploy-checklist", title: "Deploy production web apps to Vercel/Cloudflare with COOP/COEP isolation, secret management, and zero compute costs." },
];

function exercise(
  id: string,
  title: string,
  prompt: string,
  solution: string,
  objectiveId: string,
  expectedOutcome: string,
  hints: string[],
  difficulty: LearningDifficulty = "Beginner",
  starterCode?: string,
  testCases?: ExerciseTestCase[],
): LearningExercise {
  return {
    id,
    title,
    prompt,
    solution,
    objectiveId,
    expectedOutcome,
    hints,
    hint: hints[0],
    difficulty,
    ...(starterCode ? { starterCode } : {}),
    ...(testCases ? { testCases } : {}),
  };
}

function checkpoint(prompt: string, answer: string): LearningCheckpoint {
  return { prompt, answer };
}

function moduleData(
  id: string,
  order: number,
  title: string,
  summary: string,
  lessons: LearningLesson[],
): LearningModule {
  return { id, order, title, summary, lessons };
}

export const aiAppWebDevLessons: LearningLesson[] = [
  // Module 1: AI-Assisted Architecture & Engineering Workflow
  {
    id: "ai-workflow-specs",
    order: 1,
    title: "AI-Assisted Engineering Workflow & Scaffolding",
    summary: "Structure clean, modular Next.js applications using generative AI specs, architectural framing, and avoiding spaghetti code.",
    type: "guided-coding",
    objectiveIds: ["ai-workflow-specs"],
    prerequisiteLessonIds: [],
    estimatedDurationMinutes: 25,
    content: `Generative AI coding agents are force multipliers for software engineers, but without rigid specifications and modular boundaries, AI generation easily devolves into monolithic, unmaintainable code.

### The Specification-First Engineering Loop
Before generating a single line of code, author a concise architectural specification:
1. **Module Boundaries**: Define clear separation of concerns (e.g. \`src/lib/providers\` for API adapters, \`src/components/\` for UI, \`src/app/api/\` for HTTP endpoints).
2. **Data Contracts**: Define TypeScript interfaces and Zod schemas for all external inputs and internal state transitions.
3. **Execution Constraints**: Establish strict architectural rules (e.g., zero client-side credential exposure, pure function state updates).

### The Scaffolding Directive Pattern
When prompting an AI assistant to scaffold a new feature, provide:
\`\`\`markdown
## Task: Implement User Profile Card
- Input props: { userId: string, initialProfile: ProfileRecord }
- Constraints: Use Tailwind CSS with CSS variables, semantic HTML5, zero external libraries.
- Error handling: Render graceful fallback avatar if avatarUrl fails to load.
\`\`\``,
    theorySections: [
      {
        id: "spec-driven-development",
        title: "Why Spec-Driven Development Beats Chat-and-Pray",
        content: `When engineers provide ambiguous prompts like *"make a dashboard"*, models guess conventions, invent conflicting dependencies, and duplicate state logic.

By prescribing:
- **Exact File Locations**: \`src/components/profile-card.tsx\`
- **Exported Function Names**: \`export function ProfileCard({ user }: ProfileProps)\`
- **TypeScript Types**: \`interface ProfileProps { user: { id: string; name: string } }\`

The generated output integrates directly into existing build pipelines without manual surgery.`,
      },
      {
        id: "avoiding-monoliths",
        title: "Enforcing Single-Responsibility Code Generation",
        content: `AI models have a natural tendency to collapse database calls, validation, business logic, and UI rendering into a single giant component.

Always instruct the model:
- Keep React components purely presentational or state-driven.
- Extract API calls into dedicated utility functions in \`src/lib/\`.
- Extract input validation into standalone Zod schemas in \`src/lib/types.ts\`.`,
      },
    ],
    codeExamples: [
      {
        title: "Modular Scaffolding Contract in TypeScript",
        language: "javascript",
        code: `// src/lib/project-config.js
export function createProjectManifest(name, techStack) {
  if (!name || typeof name !== "string") {
    throw new Error("Project name must be a non-empty string");
  }
  return {
    projectName: name.trim().toLowerCase().replace(/\\s+/g, "-"),
    framework: techStack.framework || "Next.js 16 (App Router)",
    styling: techStack.styling || "Tailwind CSS v4",
    stateManagement: "Local-first React Hooks",
    createdAt: new Date().toISOString(),
    isProductionReady: false
  };
}

const manifest = createProjectManifest("Engineering Platform", {});
console.log("Scaffolded Project:", JSON.stringify(manifest, null, 2));`,
        description: "Pure factory function scaffolding a structured, validated project manifest.",
      },
    ],
    exercise: exercise(
      "ex-ai-scaffold-manifest",
      "Scaffold a Validated Application Manifest",
      "Write a function `buildAppConfig(appName, environment, providers)` that takes an app name, environment string ('dev' | 'staging' | 'prod'), and an array of AI provider names. Return an object `{ appName: string, env: string, activeProviders: string[], secureMode: boolean }`. If environment is 'prod', `secureMode` must be true; otherwise false. Print the JSON string.",
      `function buildAppConfig(appName, environment, providers) {
  const isProd = environment === "prod";
  const config = {
    appName: appName.trim(),
    env: environment,
    activeProviders: Array.isArray(providers) ? providers : [],
    secureMode: isProd
  };
  return config;
}

const config = buildAppConfig("Katalyst Web", "prod", ["gemini", "cloudflare"]);
console.log(JSON.stringify(config));`,
      "ai-workflow-specs",
      "Generate a valid application manifest respecting production security constraints.",
      [
        "Check if environment === 'prod' to set secureMode.",
        "Ensure activeProviders is an array.",
        "Print the JSON serialized output with console.log.",
      ],
      "Beginner",
      `function buildAppConfig(appName, environment, providers) {
  // Implement application manifest builder
  return null;
}

const config = buildAppConfig("Katalyst Web", "prod", ["gemini", "cloudflare"]);
console.log(JSON.stringify(config));`,
      [
        {
          id: "tc-ai-manifest-prod",
          label: "Production environment sets secureMode: true",
          stdin: "",
          expectedStdout: '{"appName":"Katalyst Web","env":"prod","activeProviders":["gemini","cloudflare"],"secureMode":true}',
          matchMode: "exact",
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why must AI-generated code be reviewed against strict TypeScript boundaries before merging?",
      "Generative models can synthesize plausible code with subtle type hallucinations or unstated dependencies. Enforcing strict TypeScript validation and clear module contracts ensures breaking changes are caught immediately at compile time.",
    ),
  },

  // Lesson 2: Prompting for Architecture & Debugging
  {
    id: "ai-prompting-architecture-debugging",
    order: 2,
    title: "Prompting for Architecture, Constraints, and Debugging",
    summary: "Master precision context framing, constraint enforcement, Git diff reviews, and automated error diagnostics.",
    type: "guided-coding",
    objectiveIds: ["ai-prompt-debug"],
    prerequisiteLessonIds: ["ai-workflow-specs"],
    estimatedDurationMinutes: 25,
    content: `When code fails to compile or runtime exceptions occur, effective engineers do not paste thousands of lines into an LLM and ask *"why is this broken?"*. They isolate the minimal failure context.

### The Four-Part Error Diagnostic Frame
1. **The Exact Failure**: Copy the exact compiler or runtime stack trace:
   \`TypeError: Cannot read properties of undefined (reading 'map') at line 42\`
2. **The Minimal Relevant Code**: Provide only the surrounding 10–20 lines of the responsible function.
3. **The Current State Input**: What data payload was passed into the function when it crashed?
4. **The Target Requirement**: What should happen instead (e.g., graceful fallback to empty array \`[]\`).

### Automated Diff Reviewing
Instruct the model to emit minimal contiguous unified diffs rather than entire file rewrites. This minimizes hallucinated regressions and keeps Git histories clean.`,
    theorySections: [
      {
        id: "context-isolation",
        title: "Context Window Hygiene and Noise Reduction",
        content: `Flooding an LLM with unrelated helper files dilutes its attention mechanism. Focus the context strictly on:
- The active component definition.
- The interface types of imported objects.
- The runtime assertion failure.`,
      },
      {
        id: "iterative-debugging",
        title: "The Hypothesis-Verification Debug Loop",
        content: `1. Formulate a specific hypothesis (e.g. *the API returned null instead of an empty array*).
2. Prompt the model to verify whether nullish coalescing (\`data?.items ?? []\`) resolves the failure.
3. Run automated tests immediately to confirm the fix.`,
      },
    ],
    codeExamples: [
      {
        title: "Defensive Sanitizer and Fallback Handler",
        language: "javascript",
        code: `// src/lib/diagnostic-sanitizer.js
export function safeNormalizeResponse(payload) {
  if (!payload || typeof payload !== "object") {
    return { success: false, data: [], error: "Malformed payload" };
  }
  
  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  const cleaned = rawItems.filter(item => item && typeof item.title === "string");
  
  return {
    success: true,
    data: cleaned,
    count: cleaned.length
  };
}

const result = safeNormalizeResponse({ items: [{ title: "First Note" }, null, { title: "Second Note" }] });
console.log("Sanitized Count:", result.count);`,
        description: "Defensive parsing preventing null pointer exceptions during API consumption.",
      },
    ],
    exercise: exercise(
      "ex-ai-diagnostic-cleaner",
      "Build a Safe Error Diagnostic Parser",
      "Write a function `parseCompilerError(rawError)` that parses a single-line GCC/Clang diagnostic string in the format `file.c:line:col: severity: message`. Return an object `{ file: string, line: number, severity: string, message: string }`. If the string does not match, return null. Print the parsed result of `\"main.c:14:5: error: expected ';' before 'return'\"` as JSON.",
      `function parseCompilerError(rawError) {
  if (typeof rawError !== "string") return null;
  const match = rawError.match(/^([^:]+):(\\d+):(\\d+):\\s+([a-zA-Z]+):\\s+(.+)$/);
  if (!match) return null;
  return {
    file: match[1],
    line: parseInt(match[2], 10),
    severity: match[4],
    message: match[5]
  };
}

const parsed = parseCompilerError("main.c:14:5: error: expected ';' before 'return'");
console.log(JSON.stringify(parsed));`,
      "ai-prompt-debug",
      "Extract structured diagnostic metadata from raw compiler error logs.",
      [
        "Use regular expression capture groups for file, line, col, severity, and message.",
        "Convert the line number to an integer with parseInt.",
        "Print the output as a JSON string.",
      ],
      "Developing",
      `function parseCompilerError(rawError) {
  // Parse compiler diagnostic string
  return null;
}

const parsed = parseCompilerError("main.c:14:5: error: expected ';' before 'return'");
console.log(JSON.stringify(parsed));`,
      [
        {
          id: "tc-ai-parse-err",
          label: "Extracts file, line, severity, and message",
          stdin: "",
          expectedStdout: '{"file":"main.c","line":14,"severity":"error","message":"expected \';\' before \'return\'"}',
          matchMode: "exact",
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why should you request targeted diffs from coding assistants rather than full file replacements?",
      "Full file replacements often introduce subtle regressions, accidentally remove existing edge-case handlers, or reset uncommitted edits. Targeted diffs make every modification transparent and easy to verify.",
    ),
  },

  // Module 2: Free Cloud Models, API Routing & Security
  {
    id: "ai-free-api-keys-model-routing",
    order: 3,
    title: "Free Model APIs, Routing & Environment Secret Security",
    summary: "Integrate Gemini API, Cloudflare Workers AI, and OpenRouter free tiers securely via server-side environment variables.",
    type: "guided-coding",
    objectiveIds: ["ai-free-routing"],
    prerequisiteLessonIds: ["ai-prompting-architecture-debugging"],
    estimatedDurationMinutes: 30,
    content: `Modern full-stack engineering lets you build enterprise-grade AI products with **$0 in compute costs** by utilizing official free developer tiers:
- **Google Gemini API**: Free tier provides generous RPM limits on \`gemini-2.0-flash\` and \`gemini-1.5-flash\` for multimodal inference.
- **Cloudflare Workers AI**: 10,000 free neural network neurons per day at global edge locations.
- **OpenRouter Free Routing**: Model endpoints prefixed with \`openrouter/free\` providing access to open-weight LLMs like Llama 3 and Mistral.

### Non-Negotiable Rule: Server-Side Secret Isolation
Never prefix secret API keys with \`NEXT_PUBLIC_\`.
- \`NEXT_PUBLIC_API_KEY\` will be bundled into client-side JavaScript, visible to anyone who opens browser DevTools!
- Keep secrets in \`.env.local\` as \`GEMINI_API_KEY\`, \`CLOUDFLARE_API_TOKEN\`, etc.
- Access secrets **exclusively** inside server components, Next.js Route Handlers (\`src/app/api/\`), or server actions.`,
    theorySections: [
      {
        id: "free-tier-catalogs",
        title: "Comparing Developer Free Tiers",
        content: `| Provider | Free Quota | Best Use Case | Auth Format |
| :--- | :--- | :--- | :--- |
| **Gemini API** | 15 RPM / 1M TPM | Fast reasoning, vision, multi-turn chat | Bearer token / Query key |
| **Cloudflare Workers AI** | 10k neurons/day | Edge execution, low latency embeddings | Account ID + Bearer token |
| **OpenRouter** | 20 RPM on free models | Open-source experimentation (Llama 3) | Bearer token |`,
      },
      {
        id: "defense-in-depth",
        title: "SSRF and Egress Protection",
        content: `When routing AI requests, always use fixed, allowlisted provider hostnames (\`generativelanguage.googleapis.com\`, \`api.cloudflare.com\`). Never allow clients to pass arbitrary custom endpoint URLs, as this creates a severe Server-Side Request Forgery (SSRF) vulnerability.`,
      },
    ],
    codeExamples: [
      {
        title: "Provider Key Redaction and Header Validation",
        language: "javascript",
        code: `// src/lib/env-security.js
export function resolveProviderCredentials(env) {
  const geminiKey = env.GEMINI_API_KEY;
  const cfToken = env.CLOUDFLARE_API_TOKEN;
  
  return {
    geminiConfigured: Boolean(geminiKey && geminiKey.length > 10),
    cloudflareConfigured: Boolean(cfToken && cfToken.length > 10),
    maskedGeminiKey: geminiKey ? \`\${geminiKey.slice(0, 4)}...\${geminiKey.slice(-4)}\` : "none"
  };
}

const status = resolveProviderCredentials({ GEMINI_API_KEY: "AIzaSyD1234567890abcdefXYZ" });
console.log("Provider Status:", JSON.stringify(status));`,
        description: "Checking credential readiness and masking secrets for safe telemetry.",
      },
    ],
    exercise: exercise(
      "ex-ai-key-redactor",
      "Redact Secret Tokens in Telemetry",
      "Write a function `redactSecret(token)` that takes a string. If the string is shorter than 8 characters, return '***'. Otherwise, return the first 3 characters, followed by '...', followed by the last 3 characters. Example: 'sk-ant-api03-12345678' -> 'sk-...678'. Print the redacted version of 'AIzaSyD-Free-Gemini-Key-99'.",
      `function redactSecret(token) {
  if (!token || typeof token !== "string" || token.length < 8) {
    return "***";
  }
  return \`\${token.slice(0, 3)}...\${token.slice(-3)}\`;
}

console.log(redactSecret("AIzaSyD-Free-Gemini-Key-99"));`,
      "ai-free-routing",
      "Mask sensitive credentials before logging or analytics recording.",
      [
        "Check string length < 8.",
        "Use slice(0, 3) and slice(-3) with template literals.",
        "Output the result with console.log.",
      ],
      "Beginner",
      `function redactSecret(token) {
  // Redact token securely
  return "";
}

console.log(redactSecret("AIzaSyD-Free-Gemini-Key-99"));`,
      [
        {
          id: "tc-ai-redact-key",
          label: "Redacts secret with head and tail characters",
          stdin: "",
          expectedStdout: "AIz...-99",
          matchMode: "exact",
        },
      ],
    ),
    checkpoint: checkpoint(
      "What happens if an API key is stored in NEXT_PUBLIC_GEMINI_KEY instead of GEMINI_API_KEY?",
      "Next.js automatically embeds any variable prefixed with NEXT_PUBLIC_ into the compiled client-side JavaScript bundles. Any visitor can extract it from browser DevTools, exhaust your quotas, or impersonate your account.",
    ),
  },

  // Lesson 4: Connecting Frontend to AI & Database APIs with Zod
  {
    id: "ai-frontend-backend-api-routes",
    order: 4,
    title: "Connecting Frontend UI to AI Route Handlers with Zod",
    summary: "Build type-safe Next.js App Router Route Handlers with Zod payload validation, streaming responses, and error boundaries.",
    type: "guided-coding",
    objectiveIds: ["ai-route-handlers"],
    prerequisiteLessonIds: ["ai-free-api-keys-model-routing"],
    estimatedDurationMinutes: 30,
    content: `Modern full-stack React architecture routes all external API traffic through Next.js Route Handlers (\`src/app/api/.../route.ts\`).

### Why Never Call AI APIs Directly from the Browser:
1. **Secret Leakage**: Browsers cannot hide API keys.
2. **CORS Restrictions**: Many APIs reject browser client origins for security.
3. **Data Validation**: The server must validate and sanitize user prompt sizes before spending compute quota.

### The Type-Safe Request Flow:
\`\`\`
Browser Client (React UI)
    ↓ POST /api/chat { prompt: "Explain closures", model: "gemini-2.0-flash" }
Next.js Route Handler (Server)
    ↓ 1. Validate payload with Zod Schema
    ↓ 2. Check rate limit & append server-side API secret
    ↓ 3. Fetch upstream provider (Google / Cloudflare / OpenRouter)
Upstream AI Model
\`\`\``,
    theorySections: [
      {
        id: "zod-validation-pattern",
        title: "Input Validation with Zod Schemas",
        content: `Never trust client input. Attackers can send 10-megabyte payloads to trigger Out-Of-Memory exceptions or prompt injection.

Always validate:
\`\`\`typescript
const requestSchema = z.object({
  prompt: z.string().trim().min(1).max(4000),
  temperature: z.number().min(0).max(1.0).default(0.7),
});
\`\`\``,
      },
      {
        id: "http-error-mapping",
        title: "Standardized HTTP Status Codes",
        content: `- \`400 Bad Request\`: Schema validation failure.
- \`401 Unauthorized\`: Missing or invalid session authentication.
- \`429 Too Many Requests\`: Upstream rate limit exceeded.
- \`502 Bad Gateway\`: Upstream AI provider returned a network fault.`,
      },
    ],
    codeExamples: [
      {
        title: "Next.js Route Handler Validation Pattern",
        language: "javascript",
        code: `// Schema validation mock
function validateChatPayload(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Missing JSON body" };
  }
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (prompt.length < 1 || prompt.length > 2000) {
    return { ok: false, error: "Prompt must be between 1 and 2000 characters" };
  }
  return { ok: true, data: { prompt, temperature: body.temperature ?? 0.7 } };
}

const valid = validateChatPayload({ prompt: "What is an event loop?" });
console.log("Validation Result:", JSON.stringify(valid));`,
        description: "Pure request validation pattern matching Next.js Route Handler logic.",
      },
    ],
    exercise: exercise(
      "ex-ai-payload-validator",
      "Validate API Chat Payload",
      "Write a function `validateRequest(body)` that checks if `body.message` is a non-empty string under 500 characters and `body.history` is an array. If valid, return `{ valid: true, message: body.message.trim(), historyCount: body.history.length }`. If invalid, return `{ valid: false, error: 'Invalid payload' }`. Test with `{ message: ' Hello Kat! ', history: [1, 2] }` and print as JSON.",
      `function validateRequest(body) {
  if (
    !body ||
    typeof body !== "object" ||
    typeof body.message !== "string" ||
    body.message.trim().length === 0 ||
    body.message.length > 500 ||
    !Array.isArray(body.history)
  ) {
    return { valid: false, error: "Invalid payload" };
  }
  return {
    valid: true,
    message: body.message.trim(),
    historyCount: body.history.length
  };
}

const res = validateRequest({ message: " Hello Kat! ", history: [1, 2] });
console.log(JSON.stringify(res));`,
      "ai-route-handlers",
      "Enforce rigid payload schemas before processing AI inference requests.",
      [
        "Verify body is object, message is non-empty string, and history is an Array.",
        "Trim whitespace from message.",
        "Print output as JSON string.",
      ],
      "Developing",
      `function validateRequest(body) {
  // Validate request payload
  return null;
}

const res = validateRequest({ message: " Hello Kat! ", history: [1, 2] });
console.log(JSON.stringify(res));`,
      [
        {
          id: "tc-ai-valid-payload",
          label: "Validates string and array length accurately",
          stdin: "",
          expectedStdout: '{"valid:true,"message":"Hello Kat!","historyCount":2}',
          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why must input validation happen on the server even if client-side validation is already in place?",
      "Client-side validation is easily bypassed using curl, Postman, or automated scripts. Server-side validation guarantees that malicious or corrupted requests cannot reach downstream databases or billable model APIs.",
    ),
  },

  // Module 3: Full-Stack Persistence & Production Shipping
  {
    id: "ai-supabase-auth-postgres-rls",
    order: 5,
    title: "Supabase Authentication, PostgreSQL Schemas & RLS",
    summary: "Configure user authentication, relational PostgreSQL tables, and strict Row Level Security policies for multi-tenant data.",
    type: "guided-coding",
    objectiveIds: ["ai-supabase-auth-rls"],
    prerequisiteLessonIds: ["ai-frontend-backend-api-routes"],
    estimatedDurationMinutes: 30,
    content: `When building AI applications with user memory, conversation histories, and saved documents, you need a scalable relational database with bulletproof authorization.

### Why Supabase + PostgreSQL:
- **Built-in Auth**: Supports Google OAuth, magic links, and GitHub sign-in with standard JWT sessions.
- **PostgreSQL Power**: Full relational integrity, ACID transactions, and JSONB document support.
- **Row Level Security (RLS)**: Database-enforced authorization rules that prevent users from ever reading or modifying another user's records.

### Row Level Security (RLS) in Action:
Even if a developer accidentally forgets a \`WHERE user_id = ...\` clause in their code, an RLS-enabled table strictly prevents data leakage:
\`\`\`sql
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own notes"
ON user_notes FOR ALL
USING (auth.uid() = user_id);
\`\`\``,
    theorySections: [
      {
        id: "rls-security-boundary",
        title: "How Row Level Security Protects Multi-Tenant Data",
        content: `Traditional web apps enforce permissions in application code (\`if (doc.ownerId !== user.id) throw 403\`). This is fragile—a single bug in any route exposes all records.

Row Level Security moves permission evaluation directly into the PostgreSQL engine. Every SQL query is automatically rewritten to include \`WHERE auth.uid() = user_id\`.`,
      },
      {
        id: "guest-to-user-migration",
        title: "Guest-to-Authenticated Account Migration",
        content: `Local-first platforms like KATALYST allow learners to start immediately as guests with \`localStorage\`. When the user signs in with Google, an atomic migration script transfers guest IDs to the authenticated \`user_id\` without data loss.`,
      },
    ],
    codeExamples: [
      {
        title: "PostgreSQL Schema with RLS and Foreign Keys",
        language: "sql",
        code: `-- Create notes table linked to auth.users
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own conversations only
CREATE POLICY "Users can manage own conversations"
ON public.conversations
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);`,
        description: "Production SQL schema with foreign key cascade and complete RLS policy.",
      },
    ],
    exercise: exercise(
      "ex-ai-rls-policy",
      "Author an RLS Policy Statement",
      "Write a SQL statement that creates a policy named `allow_owner_all` on table `chat_messages` for all operations (`FOR ALL`), ensuring the authenticated user (`auth.uid()`) matches `user_id` in the `USING` clause.",
      `CREATE POLICY "allow_owner_all"
ON chat_messages
FOR ALL
USING (auth.uid() = user_id);`,
      "ai-supabase-auth-rls",
      "Declare declarative database-level access control rules.",
      [
        "Use CREATE POLICY policy_name ON table_name FOR ALL USING (...).",
        "Compare auth.uid() = user_id.",
      ],
      "Developing",
      `-- Write RLS policy
CREATE POLICY "allow_owner_all" ...`,
      [
        {
          id: "tc-ai-rls",
          label: "Defines RLS policy with auth.uid()",
          stdin: "",
          expectedStdout: 'CREATE POLICY "allow_owner_all" ON chat_messages FOR ALL USING (auth.uid() = user_id);',
          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "What is the danger of disabling Row Level Security on a database table in production?",
      "If RLS is disabled, any authenticated user query that lacks an explicit user_id filter will return all users' private records across the entire application.",
    ),
  },

  // Lesson 6: Production Deployment Checklist
  {
    id: "ai-production-deployment-checklist",
    order: 6,
    title: "Production Deployment, CORS, and Zero-Cost Edge Hosting",
    summary: "Prepare applications for production on Vercel and Cloudflare with security headers, secrets management, and health checks.",
    type: "guided-coding",
    objectiveIds: ["ai-deploy-checklist"],
    prerequisiteLessonIds: ["ai-supabase-auth-postgres-rls"],
    estimatedDurationMinutes: 25,
    content: `Shipping an application to production requires verifying security boundaries, HTTP headers, build performance, and operational health.

### The Production Pre-Flight Checklist:
1. **Secrets Audit**:
   - Ensure \`.env.local\` is in \`.gitignore\`.
   - Ensure zero production credentials exist in client bundles or public repositories.
2. **Security Headers (COOP / COEP)**:
   - For multi-threaded WebAssembly (like Wasmer C11 or Pyodide with SharedArrayBuffer), configure:
     - \`Cross-Origin-Opener-Policy: same-origin\`
     - \`Cross-Origin-Embedder-Policy: require-corp\`
3. **Health Check Endpoint**:
   - Provide an unauthenticated \`GET /api/health\` endpoint that reports service availability without exposing private tokens.
4. **Zero-Cost Production Hosting**:
   - Deploy Next.js frontend to **Vercel** (Free Hobby tier).
   - Deploy edge database to **Supabase** (Free 500MB tier).
   - Route model inference through **Gemini** & **Cloudflare Workers AI** (Free tiers).`,
    theorySections: [
      {
        id: "coop-coep-isolation",
        title: "Cross-Origin Isolation and SharedArrayBuffer",
        content: `Modern WebAssembly runtimes require high-resolution timers and \`SharedArrayBuffer\`. Following the Spectre and Meltdown vulnerabilities, browsers require servers to send explicit \`COOP\` and \`COEP\` HTTP headers to enable these features.`,
      },
      {
        id: "health-endpoints",
        title: "Designing Safe Health Check Endpoints",
        content: `A health check route must return boolean flags (\`{ ok: true, databaseConnected: true }\`) rather than detailed connection strings, internal server IPs, or stack traces.`,
      },
    ],
    codeExamples: [
      {
        title: "Production Health Check Route Handler",
        language: "javascript",
        code: `// src/app/api/health/route.js mock
export function generateHealthResponse(services) {
  const isHealthy = Object.values(services).every(Boolean);
  return {
    status: isHealthy ? 200 : 503,
    body: {
      ok: isHealthy,
      timestamp: new Date().toISOString(),
      services: {
        database: Boolean(services.database),
        aiGateway: Boolean(services.aiGateway)
      }
    }
  };
}

const report = generateHealthResponse({ database: true, aiGateway: true });
console.log("Health Status:", JSON.stringify(report.body));`,
        description: "Safe health response generation without secret leakage.",
      },
    ],
    exercise: exercise(
      "ex-ai-health-check",
      "Format a Health Check Payload",
      "Write a function `createHealthCheck(isDbOk, isAiOk)` that returns `{ ok: boolean, status: string, checks: { db: boolean, ai: boolean } }`. If both are true, `ok` is true and `status` is 'healthy'. Otherwise, `ok` is false and `status` is 'degraded'. Test with `true, true` and print the output as JSON.",
      `function createHealthCheck(isDbOk, isAiOk) {
  const healthy = Boolean(isDbOk && isAiOk);
  return {
    ok: healthy,
    status: healthy ? "healthy" : "degraded",
    checks: {
      db: Boolean(isDbOk),
      ai: Boolean(isAiOk)
    }
  };
}

console.log(JSON.stringify(createHealthCheck(true, true)));`,
      "ai-deploy-checklist",
      "Build a sanitized production health check payload.",
      [
        "Check if both services are true.",
        "Set status to 'healthy' or 'degraded'.",
        "Print JSON string with console.log.",
      ],
      "Beginner",
      `function createHealthCheck(isDbOk, isAiOk) {
  // Format health check payload
  return null;
}

console.log(JSON.stringify(createHealthCheck(true, true)));`,
      [
        {
          id: "tc-ai-health-healthy",
          label: "Returns healthy status when all services are ok",
          stdin: "",
          expectedStdout: '{"ok":true,"status":"healthy","checks":{"db":true,"ai":true}}',
          matchMode: "exact",
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why should you never deploy an AI application to production without a dedicated /api/health endpoint?",
      "Uptime monitoring tools, load balancers, and container orchestrators rely on lightweight health endpoints to detect cold-start failures, database disconnections, and edge routing faults before routing real traffic to degraded instances.",
    ),
  },
];

export const aiAppWebDevModules: LearningModule[] = [
  moduleData(
    "ai-module-workflow",
    1,
    "AI-Assisted Architecture & Engineering Workflow",
    "Master prompt constraints, architectural specifications, and structured debugging loops.",
    aiAppWebDevLessons.slice(0, 2),
  ),
  moduleData(
    "ai-module-apis-routing",
    2,
    "Free Cloud Models, API Routing & Security",
    "Integrate Gemini, Cloudflare, and OpenRouter free tiers securely via Next.js Route Handlers.",
    aiAppWebDevLessons.slice(2, 4),
  ),
  moduleData(
    "ai-module-persistence-deploy",
    3,
    "Full-Stack Persistence & Production Shipping",
    "Configure Supabase PostgreSQL with Row Level Security, COOP/COEP headers, and edge deployment.",
    aiAppWebDevLessons.slice(4, 6),
  ),
];

export const aiAppWebDevCourse: LearningCourse = {
  id: "ai-app-web-dev",
  subjectId: "ai-engineering",
  title: "AI-Powered App & Web Development",
  description: "Learn to build, architect, and deploy production-grade full-stack web applications using generative AI tools, free-tier cloud backends, and Next.js.",
  level: "Applied",
  version: "1.0.0",
  prerequisites: ["Fundamental HTML, CSS & JavaScript concepts", "Basic terminal and Git familiarity"],
  objectives: aiAppWebDevObjectives,
  learningOutcomes: [
    "Scaffold modular React and Next.js applications using precise architectural specifications.",
    "Debug complex runtime issues using structured prompt constraints and Git diff reviews.",
    "Route AI inference through Gemini, Cloudflare, and OpenRouter free tiers without client-side key leakage.",
    "Build type-safe Next.js Route Handlers with Zod request validation.",
    "Configure Supabase Google OAuth and write bulletproof PostgreSQL Row Level Security (RLS) policies.",
    "Deploy production applications with security headers and automated health checks.",
  ],
  estimatedDurationMinutes: 165,
  publicationStatus: "published",
  modules: aiAppWebDevModules,
};

export const aiAppWebDevCourseSummary = {
  id: aiAppWebDevCourse.id,
  subjectId: aiAppWebDevCourse.subjectId,
  title: aiAppWebDevCourse.title,
  description: aiAppWebDevCourse.description,
  level: aiAppWebDevCourse.level,
  version: aiAppWebDevCourse.version,
  prerequisites: aiAppWebDevCourse.prerequisites,
  objectives: aiAppWebDevCourse.objectives,
  learningOutcomes: aiAppWebDevCourse.learningOutcomes,
  estimatedDurationMinutes: aiAppWebDevCourse.estimatedDurationMinutes,
  publicationStatus: aiAppWebDevCourse.publicationStatus,
  modules: aiAppWebDevCourse.modules.map((m) => ({
    id: m.id,
    order: m.order,
    title: m.title,
    summary: m.summary,
    lessons: m.lessons.map((l) => ({
      id: l.id,
      order: l.order,
      title: l.title,
      summary: l.summary,
      type: l.type,
      objectiveIds: l.objectiveIds,
      prerequisiteLessonIds: l.prerequisiteLessonIds,
      estimatedDurationMinutes: l.estimatedDurationMinutes,
      exercise: {
        id: l.exercise.id,
        title: l.exercise.title,
        difficulty: l.exercise.difficulty,
        expectedOutcome: l.exercise.expectedOutcome,
        prompt: l.exercise.prompt,
        objectiveId: l.exercise.objectiveId,
        starterCode: l.exercise.starterCode,
      },
      checkpoint: l.checkpoint,
    })),
  })),
};
