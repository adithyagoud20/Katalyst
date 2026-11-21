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
  { id: "ai-structured-zod", title: "Extract structured, strictly typed JSON responses from LLM endpoints using Zod schema validation." },
  { id: "ai-vector-search", title: "Compute cosine similarity over high-dimensional vector embeddings for in-browser semantic retrieval." },
  { id: "ai-resilient-fallbacks", title: "Implement exponential backoff retry and multi-provider failover routing for production AI availability." },
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
   - For multi-threaded WebAssembly (like Pyodide with SharedArrayBuffer), configure:
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

  {
    id: "ai-structured-outputs-zod",
    order: 7,
    title: "Structured JSON Extraction & Zod Validation",
    summary: "Force models to emit valid JSON conforming to strict schemas and validate payloads using Zod.",
    type: "guided-coding",
    objectiveIds: ["ai-structured-zod"],
    prerequisiteLessonIds: ["ai-production-deployment-checklist"],
    estimatedDurationMinutes: 30,
    content: `LLMs naturally produce unstructured conversational text. For production software pipelines, code must consume strictly validated structured JSON objects.

### Structured Output Workflow
1. Provide the model with a strict JSON schema and \`response_format: { type: "json_object" }\`.
2. Strip markdown fences (\`\`\`json ... \`\`\`) defensively.
3. Validate and parse the object with a **Zod** schema.
4. If validation fails, return an actionable schema error or retry with the parse error injected.

~~~javascript
const z = require("zod");

const SensorSchema = z.object({
  stationId: z.string().min(1),
  temperature: z.number().min(-50).max(100),
  status: z.enum(["OK", "ALERT"]),
});
~~~`,
    theorySections: [
      {
        id: "ai-zod-safeparse",
        title: "safeParse vs. parse",
        content: "Always use schema.safeParse(data) rather than schema.parse(data) in web servers so validation errors can be returned cleanly as HTTP 400 responses without crashing the request loop.",
      },
    ],
    codeExamples: [
      {
        title: "Validating AI JSON Payloads",
        language: "javascript",
        code: `function sanitizeAndParse(rawText) {
  const cleaned = rawText.replace(/^\\s*\`\`\`json\\s*|\\s*\`\`\`\\s*$/g, "").trim();
  return JSON.parse(cleaned);
}
console.log(sanitizeAndParse('{\\"score\\": 95}').score);`,
        description: "Defensively cleaning AI output strings before parsing.",
      },
    ],
    resources: [
      {
        title: "Zod Schema Validation",
        url: "https://zod.dev/",
        description: "TypeScript-first schema validation with static type inference.",
        type: "documentation",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: {
      sampleInput: "",
      expectedOutput: "95\n",
    },
    exercise: exercise(
      "ex-ai-validate-json",
      "Validate AI Output with Manual Schema Checks",
      "Implement a function `validateTelemetryPayload(jsonStr)`: parse the string, check that `station` is a non-empty string, `temp` is a number between -50 and 100, and `online` is a boolean. If valid, return `{ valid: true, data: { station, temp, online } }`, else `{ valid: false, error: 'Invalid schema' }`. Test with valid payload `{\"station\": \"ST-01\", \"temp\": 24.5, \"online\": true}` and print: `Status: ${result.valid}, Station: ${result.data.station}`.",
      `function validateTelemetryPayload(jsonStr) {\n  try {\n    const obj = JSON.parse(jsonStr);\n    if (typeof obj.station !== "string" || obj.station.length === 0) return { valid: false, error: "Invalid schema" };\n    if (typeof obj.temp !== "number" || obj.temp < -50 || obj.temp > 100) return { valid: false, error: "Invalid schema" };\n    if (typeof obj.online !== "boolean") return { valid: false, error: "Invalid schema" };\n    return { valid: true, data: obj };\n  } catch (e) {\n    return { valid: false, error: "Invalid JSON" };\n  }\n}\n\nconst raw = '{"station": "ST-01", "temp": 24.5, "online": true}';\nconst res = validateTelemetryPayload(raw);\nconsole.log(\`Status: \${res.valid}, Station: \${res.data.station}\`);`,
      "ai-structured-zod",
      "Validate AI response schemas defensively.",
      [
        "Parse the JSON string with try/catch.",
        "Verify property types for station, temp, and online.",
        "Print 'Status: true, Station: ST-01'.",
      ],
      "Developing",
      `function validateTelemetryPayload(jsonStr) {\n  // Implement validation\n}\n\nconst raw = '{"station": "ST-01", "temp": 24.5, "online": true}';\n// Validate and print Status and Station\n`,
      [
        {
          id: "tc-ai-val-1",
          label: "Validates schema successfully and extracts station",
          stdin: "",
          expectedStdout: "Status: true, Station: ST-01",
          matchMode: "trimmed",
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why must raw model JSON output be parsed inside a try/catch block?",
      "Models occasionally truncate tokens at max length, prepend conversational text, or emit malformed commas, which triggers a syntax error in JSON.parse.",
    ),
  },

  {
    id: "ai-client-vector-search",
    order: 8,
    title: "Client-Side Vector Embeddings & Cosine Similarity",
    summary: "Implement in-browser semantic retrieval using normalized dot products over vector embeddings.",
    type: "practical-exercise",
    objectiveIds: ["ai-vector-search"],
    prerequisiteLessonIds: ["ai-structured-outputs-zod"],
    estimatedDurationMinutes: 35,
    content: `Vector embeddings represent text as dense numerical arrays (e.g. 384 or 1536 floating-point values) where semantically similar concepts reside close to each other in vector space.

### Cosine Similarity Formula
For two normalized vectors $\\mathbf{A}$ and $\\mathbf{B}$:
$$\\text{similarity}(\\mathbf{A}, \\mathbf{B}) = \\frac{\\mathbf{A} \\cdot \\mathbf{B}}{\\|\\mathbf{A}\\| \\|\\mathbf{B}\\|} = \\frac{\\sum_{i} A_i B_i}{\\sqrt{\\sum_i A_i^2} \\sqrt{\\sum_i B_i^2}}$$
When vectors are pre-normalized to unit length ($\\|\\mathbf{A}\\| = 1$), cosine similarity simplifies to a simple dot product ($\sum_i A_i B_i$).

In local-first and browser-based AI studios, small embedding models run entirely in the browser using WebAssembly and WebGL/WebGPU.`,
    theorySections: [
      {
        id: "ai-embedding-distance-metrics",
        title: "Cosine vs. Euclidean vs. Dot Product",
        content: "Cosine similarity measures the angle between vectors regardless of magnitude, making it ideal for text comparison where document length variations should not skew similarity scores.",
      },
    ],
    codeExamples: [
      {
        title: "Cosine Similarity Function",
        language: "javascript",
        code: `function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
console.log("Self similarity:", cosineSimilarity([1, 0], [1, 0]));`,
        description: "Calculating geometric similarity between two numeric arrays.",
      },
    ],
    resources: [
      {
        title: "Vector Embeddings Guide",
        url: "https://en.wikipedia.org/wiki/Cosine_similarity",
        description: "Mathematical formulation of cosine distance in information retrieval.",
        type: "reference",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: {
      sampleInput: "",
      expectedOutput: "Self similarity: 1\n",
    },
    exercise: exercise(
      "ex-ai-vector-search",
      "Rank documents by cosine similarity against a query vector",
      "Implement a function `findBestMatch(queryVec, docVecs)`: calculate cosine similarity between queryVec and each doc vector in docVecs (an array of { id: string, vec: number[] }), and return the id of the highest scoring document. Test with query `[1, 0, 0]` and docs `[{ id: 'doc-A', vec: [0.8, 0.2, 0] }, { id: 'doc-B', vec: [0.1, 0.9, 0] }]`. Print 'Best Match: ' followed by the matched document id.",
      `function findBestMatch(queryVec, docVecs) {\n  function cosSim(a, b) {\n    let dot = 0, na = 0, nb = 0;\n    for (let i = 0; i < a.length; i++) {\n      dot += a[i] * b[i];\n      na += a[i] * a[i];\n      nb += b[i] * b[i];\n    }\n    return dot / (Math.sqrt(na) * Math.sqrt(nb));\n  }\n  let bestId = null;\n  let maxScore = -Infinity;\n  for (const doc of docVecs) {\n    const score = cosSim(queryVec, doc.vec);\n    if (score > maxScore) {\n      maxScore = score;\n      bestId = doc.id;\n    }\n  }\n  return bestId;\n}\n\nconst query = [1, 0, 0];\nconst docs = [{ id: "doc-A", vec: [0.8, 0.2, 0] }, { id: "doc-B", vec: [0.1, 0.9, 0] }];\nconsole.log(\`Best Match: \${findBestMatch(query, docs)}\`);`,
      "ai-vector-search",
      "Rank vector embeddings using geometric cosine similarity.",
      [
        "Implement cosine similarity function with dot product and norms.",
        "Iterate through documents and track the maximum score.",
        "Print 'Best Match: doc-A'.",
      ],
      "Developing",
      `function findBestMatch(queryVec, docVecs) {\n  // Implement similarity search\n}\n\nconst query = [1, 0, 0];\nconst docs = [{ id: "doc-A", vec: [0.8, 0.2, 0] }, { id: "doc-B", vec: [0.1, 0.9, 0] }];\n// Call and print Best Match\n`,
      [
        {
          id: "tc-ai-vec-1",
          label: "Identifies doc-A as closest vector match",
          stdin: "",
          expectedStdout: "Best Match: doc-A",
          matchMode: "trimmed",
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why is cosine similarity preferred over Euclidean distance for text embeddings?",
      "Cosine similarity evaluates orientation rather than magnitude, ensuring long and short texts with equivalent meaning remain closely clustered.",
    ),
  },

  {
    id: "ai-resilient-streaming-fallbacks",
    order: 9,
    title: "Resilient AI Streaming & Provider Failover Architecture",
    summary: "Build fault-tolerant AI gateways with timeout aborts, exponential backoff, and multi-provider failover.",
    type: "assessment",
    objectiveIds: ["ai-resilient-fallbacks"],
    prerequisiteLessonIds: ["ai-client-vector-search"],
    estimatedDurationMinutes: 40,
    content: `### Provider Outages and Failover Routing
Public LLM APIs experience rate-limit throttles (HTTP 429), regional outages (HTTP 503), and unpredictable token generation stalls. A production AI application must route requests across redundant providers with automated failover:

1. **Timeout AbortController**: Terminate requests that stall for longer than a specified latency budget (e.g. 8 seconds).
2. **Provider Cascade**: Attempt Primary Provider (e.g. Gemini Free) $\\to$ Fallback 1 (Cloudflare Workers AI) $\\to$ Fallback 2 (OpenRouter).
3. **Graceful Degradation**: If all cloud endpoints fail, notify the learner with a non-destructive offline status message rather than a blank screen.`,
    theorySections: [
      {
        id: "ai-circuit-breaker",
        title: "Circuit Breakers in AI Gateways",
        content: "If a model provider fails repeatedly within a sliding window, a circuit breaker temporarily trips into an OPEN state, directing immediate traffic to backup providers without wasting time on timeouts.",
      },
    ],
    codeExamples: [
      {
        title: "Multi-Provider Failover Loop",
        language: "javascript",
        code: `async function queryWithFailover(providers, prompt) {
  for (const p of providers) {
    try {
      return await p.call(prompt);
    } catch (err) {
      console.warn("Provider failed, switching to backup:", p.name);
    }
  }
  throw new Error("All AI providers exhausted");
}`,
        description: "Cascade routing across redundant inference backends.",
      },
    ],
    resources: [
      {
        title: "Timeout and AbortController",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/AbortController",
        description: "Controlling request lifetimes and canceling dead connections.",
        type: "documentation",
      },
    ],
    execution: { language: "javascript", target: "browser-wasm" },
    exampleRun: {
      sampleInput: "",
      expectedOutput: "All AI providers exhausted\n",
    },
    exercise: exercise(
      "ex-ai-failover-router",
      "Implement a multi-provider fallback executor",
      "Implement an async function `executeWithFailover(providers, prompt)`: iterate through array `providers` (each an object `{ name: string, run: async (prompt) => string }`). If a provider succeeds, return `{ provider: p.name, result: text }`. If it throws, log and continue to the next provider. If all fail, return `{ provider: 'none', result: 'Offline fallback response' }`. Test with provider 1 throwing error and provider 2 returning 'Hello from backup'. Print: `Source: ${res.provider}, Message: ${res.result}`.",
      `async function executeWithFailover(providers, prompt) {\n  for (const p of providers) {\n    try {\n      const text = await p.run(prompt);\n      return { provider: p.name, result: text };\n    } catch (e) {}\n  }\n  return { provider: "none", result: "Offline fallback response" };\n}\n\nasync function main() {\n  const providers = [\n    { name: "Primary-AI", run: async () => { throw new Error("Rate limit 429"); } },\n    { name: "Backup-AI", run: async () => "Hello from backup" }\n  ];\n  const res = await executeWithFailover(providers, "test");\n  console.log(\`Source: \${res.provider}, Message: \${res.result}\`);\n}\nmain();`,
      "ai-resilient-fallbacks",
      "Build resilient multi-provider failover routing.",
      [
        "Wrap provider.run in try/catch.",
        "Return upon first successful provider response.",
        "Print 'Source: Backup-AI, Message: Hello from backup'.",
      ],
      "Applied",
      `async function executeWithFailover(providers, prompt) {\n  // Implement failover cascade\n}\n\n// Run test and print Source and Message\n`,
      [
        {
          id: "tc-ai-failover-1",
          label: "Recovers using Backup-AI after Primary-AI failure",
          stdin: "",
          expectedStdout: "Source: Backup-AI, Message: Hello from backup",
          matchMode: "trimmed",
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why should AI client applications implement AbortController timeouts on fetch requests?",
      "Model inference endpoints can stall indefinitely under severe server load; AbortController aborts dead TCP sockets within a fixed latency budget so failovers can trigger.",
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
  moduleData(
    "ai-module-production-systems",
    4,
    "Production AI Systems Engineering",
    "Structured JSON extraction with Zod schemas, client-side vector search with cosine similarity, and resilient streaming fallbacks.",
    aiAppWebDevLessons.slice(6),
  ),
];

export const aiAppWebDevCourse: LearningCourse = {
  id: "ai-app-web-dev",
  subjectId: "ai-engineering",
  title: "AI-Powered App & Web Development",
  description: "Learn to build, architect, and deploy production-grade full-stack web applications using generative AI tools, free-tier cloud backends, vector embeddings, and Next.js.",
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
    "Extract strictly validated JSON with Zod and implement client-side vector embeddings search.",
    "Architect resilient multi-provider failover routing with timeout abort controllers."
  ],
  estimatedDurationMinutes: 260,
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
