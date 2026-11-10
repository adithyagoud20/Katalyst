import { z } from "zod";

export const MAX_SKILL_FILE_BYTES = 32_000;
export const MAX_SKILL_CONTEXT_CHARS = 24_000;

export const skillCompatibilityValues = [
  "general-ai-instructions",
  "openai-compatible-chat",
  "gemini",
  "openrouter",
  "codex",
  "claude-code",
  "gemini-cli",
  "other-compatible-agents",
] as const;

export const skillCompatibilityLabels: Record<(typeof skillCompatibilityValues)[number], string> = {
  "general-ai-instructions": "General AI instructions",
  "openai-compatible-chat": "OpenAI-compatible chat",
  gemini: "Gemini",
  openrouter: "OpenRouter",
  codex: "Codex",
  "claude-code": "Claude Code",
  "gemini-cli": "Gemini CLI",
  "other-compatible-agents": "Other compatible agents",
};

export const skillSchema = z.object({
  id: z.string().min(1).max(80).regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/),
  name: z.string().min(1).max(80),
  description: z.string().min(1).max(240),
  instructions: z.string().min(1).max(24_000),
  source: z.enum(["built-in", "imported"]),
  sourceName: z.string().max(255).optional(),
  sourceUrl: z.string().url().max(2_048).refine((value) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:" && !parsed.username && !parsed.password && [...parsed.searchParams.keys()].every((key) => !isSensitiveMetadataField(key));
    } catch {
      return false;
    }
  }, "Skill source URLs must use HTTPS without embedded credentials.").optional(),
  version: z.string().max(80).optional(),
  author: z.string().max(120).optional(),
  license: z.string().max(120).optional(),
  compatibility: z.array(z.enum(skillCompatibilityValues)).max(skillCompatibilityValues.length).optional(),
  installedAt: z.string().max(40).refine((value) => Number.isFinite(Date.parse(value)), "Installation date must be a valid date.").optional(),
  metadata: z.record(z.string().max(80).regex(/^[a-zA-Z][\w-]*$/), z.string().max(240)).refine((metadata) => Object.keys(metadata).length <= 20 && Object.entries(metadata).reduce((size, [key, value]) => size + key.length + value.length, 0) <= 4_000, "Skill metadata exceeds the allowed size.").optional(),
  enabled: z.boolean(),
}).strict();

export type WorkspaceSkill = z.infer<typeof skillSchema>;
export type AppliedSkill = Pick<WorkspaceSkill, "id" | "name" | "source" | "sourceName">;
export type SkillOmission = { id: string; name: string; reason: "duplicate" | "prompt-limit" };
export type WorkspaceContext = { context: string; appliedSkills: AppliedSkill[]; omittedSkills: SkillOmission[] };

export const starterSkills: WorkspaceSkill[] = [
  { id: "clear-technical-writing", name: "Clear technical writing", description: "Make technical answers direct, structured, and easy to scan.", instructions: "Use plain language. Lead with the answer, then explain the reasoning. Prefer short paragraphs, concrete examples, and descriptive headings. Keep caveats specific and useful.", source: "built-in", compatibility: ["general-ai-instructions"], enabled: false },
  { id: "code-review", name: "Code review", description: "Prioritize correctness, security, and maintainability in code feedback.", instructions: "Review the code for correctness and security first. State actionable findings with file or line references where available. Explain the impact and a practical fix. Avoid style-only feedback unless requested.", source: "built-in", compatibility: ["general-ai-instructions"], enabled: false },
  { id: "brainstorm-options", name: "Explore options", description: "Compare a small set of viable approaches before recommending one.", instructions: "Offer up to three distinct approaches. Compare the costs and benefits that matter for this request, then recommend one and state the key assumption behind it.", source: "built-in", compatibility: ["general-ai-instructions"], enabled: false },
];

const forbiddenTextControls = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

function isSensitiveMetadataField(field: string): boolean {
  const tokens = field.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return tokens.some((token) => ["authorization", "password", "secret", "credential", "cookie", "token", "bearer", "key"].includes(token))
    || (tokens.includes("api") && (tokens.includes("key") || tokens.includes("token")))
    || (tokens.includes("session") && (tokens.includes("key") || tokens.includes("credential")))
    || (tokens.includes("auth") && (tokens.includes("key") || tokens.includes("token")))
    || (tokens.includes("access") && tokens.includes("token"))
    || (tokens.includes("refresh") && tokens.includes("token"))
    || (tokens.includes("private") && tokens.includes("key"))
    || (tokens.includes("client") && tokens.includes("secret"))
    || ((tokens.includes("openai") || tokens.includes("gemini") || tokens.includes("openrouter")) && (tokens.includes("key") || tokens.includes("token")));
}

function sanitizeText(value: string): string {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?(?:<\/script\s*>|$)/gi, "[script block removed]")
    .replace(forbiddenTextControls, "")
    .replace(/\r\n?/g, "\n")
    .normalize("NFC")
    .trim();
}

function cleanOptionalMetadata(value: string | undefined, maxLength: number): string | undefined {
  const cleaned = value === undefined ? "" : sanitizeText(value).slice(0, maxLength);
  return cleaned || undefined;
}

function parseCompatibility(value: string | undefined): WorkspaceSkill["compatibility"] {
  if (!value) return undefined;
  const values = [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
  if (values.length > skillCompatibilityValues.length || values.some((item) => !skillCompatibilityValues.includes(item as (typeof skillCompatibilityValues)[number]))) {
    throw new Error(`Compatibility must use the supported labels: ${skillCompatibilityValues.join(", ")}.`);
  }
  return values as NonNullable<WorkspaceSkill["compatibility"]>;
}

function parseSourceUrl(value: string | undefined): string | undefined {
  const cleaned = cleanOptionalMetadata(value, 2_048);
  if (!cleaned) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(cleaned);
  } catch {
    throw new Error("The source-url field must be a valid HTTPS URL.");
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new Error("The source-url field must be a valid HTTPS URL without credentials.");
  if ([...parsed.searchParams.keys()].some((key) => isSensitiveMetadataField(key))) throw new Error("The source-url field cannot include credential query parameters.");
  return parsed.toString();
}

export function parseSkillMarkdown(markdown: string, fileName: string): WorkspaceSkill {
  if (new TextEncoder().encode(markdown).byteLength > MAX_SKILL_FILE_BYTES) throw new Error("Skill files must be 32 KB or smaller.");
  const normalized = markdown.replace(/^\uFEFF/, "");
  const frontmatter = normalized.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!frontmatter) throw new Error("Add a metadata block at the top of the file (--- name: … description: … ---).");

  const metadata = new Map<string, string>();
  for (const rawLine of frontmatter[1].split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([a-zA-Z][\w-]*):\s*(.*?)\s*$/);
    if (!match) throw new Error("Skill metadata must use one key: value pair per line.");
    const key = match[1].toLowerCase();
    if (metadata.has(key)) throw new Error(`Skill metadata contains a duplicate ${key} field.`);
    const rawValue = match[2];
    const value = rawValue.length >= 2 && ((rawValue.startsWith('"') && rawValue.endsWith('"')) || (rawValue.startsWith("'") && rawValue.endsWith("'")))
      ? rawValue.slice(1, -1)
      : rawValue;
    metadata.set(key, sanitizeText(value));
  }

  const metadataSize = [...metadata.entries()].reduce((total, [key, value]) => total + key.length + value.length, 0);
  if (metadata.size > 20 || metadataSize > 4_000) throw new Error("Skill metadata is too large. Use up to 20 short metadata fields.");
  const name = metadata.get("name") ?? metadata.get("title") ?? sanitizeText(fileName.split(/[\\/]/).at(-1) ?? fileName).replace(/\.md$/i, "");
  const description = metadata.get("description");
  const instructions = sanitizeText(frontmatter[2]);
  if (!description) throw new Error("Skill metadata needs a description field.");
  if (!instructions) throw new Error("Add skill instructions below the metadata block.");
  if (new TextEncoder().encode(instructions).byteLength > MAX_SKILL_FILE_BYTES) throw new Error("Skill instructions are too large after parsing.");
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const safeMetadata = Object.fromEntries([...metadata.entries()].filter(([key]) => !isSensitiveMetadataField(key)).map(([key, value]) => [key, sanitizeText(value)]));
  const compatibility = parseCompatibility(metadata.get("compatibility"));
  const sourceUrl = parseSourceUrl(metadata.get("source-url"));
  const version = cleanOptionalMetadata(metadata.get("version"), 80);
  const author = cleanOptionalMetadata(metadata.get("author"), 120);
  const license = cleanOptionalMetadata(metadata.get("license"), 120);
  const parsed = skillSchema.safeParse({
    id,
    name,
    description,
    instructions,
    source: "imported",
    sourceName: cleanOptionalMetadata(metadata.get("source-name") ?? (fileName.split(/[\\/]/).at(-1) ?? fileName), 255),
    ...(sourceUrl ? { sourceUrl } : {}),
    ...(version ? { version } : {}),
    ...(author ? { author } : {}),
    ...(license ? { license } : {}),
    ...(compatibility ? { compatibility } : {}),
    installedAt: new Date().toISOString(),
    metadata: safeMetadata,
    enabled: false,
  });
  if (!parsed.success) throw new Error("Skill metadata is invalid. Keep the name under 80 characters and description under 240 characters.");
  return parsed.data;
}

export function sanitizeImportedSkill(value: unknown): WorkspaceSkill {
  const parsed = skillSchema.safeParse(value);
  if (!parsed.success) throw new Error("This backup contains malformed skill metadata or instructions.");
  const canonicalBuiltIn = parsed.data.source === "built-in" && starterSkills.some((skill) => skill.id === parsed.data.id && skill.name === parsed.data.name && skill.description === parsed.data.description && skill.instructions === parsed.data.instructions);
  const safe = {
    ...parsed.data,
    source: parsed.data.source === "built-in" && !canonicalBuiltIn ? "imported" : parsed.data.source,
    name: sanitizeText(parsed.data.name),
    description: sanitizeText(parsed.data.description),
    instructions: sanitizeText(parsed.data.instructions),
    ...(parsed.data.sourceName ? { sourceName: sanitizeText(parsed.data.sourceName).slice(0, 255) } : {}),
    ...(parsed.data.version ? { version: sanitizeText(parsed.data.version).slice(0, 80) } : {}),
    ...(parsed.data.author ? { author: sanitizeText(parsed.data.author).slice(0, 120) } : {}),
    ...(parsed.data.license ? { license: sanitizeText(parsed.data.license).slice(0, 120) } : {}),
    ...(parsed.data.metadata ? { metadata: Object.fromEntries(Object.entries(parsed.data.metadata).filter(([key]) => !isSensitiveMetadataField(key)).map(([key, item]) => [sanitizeText(key).slice(0, 80), sanitizeText(item).slice(0, 240)])) } : {}),
  };
  const sanitized = skillSchema.safeParse(safe);
  if (!sanitized.success) throw new Error("This backup contains invalid skill content after sanitization.");
  return sanitized.data;
}

function markdownScalar(value: string): string {
  return value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

export function exportSkillMarkdown(skill: WorkspaceSkill): string {
  const safe = sanitizeImportedSkill(skill);
  const lines = ["---", `name: ${markdownScalar(safe.name)}`, `description: ${markdownScalar(safe.description)}`];
  if (safe.version) lines.push(`version: ${markdownScalar(safe.version)}`);
  if (safe.author) lines.push(`author: ${markdownScalar(safe.author)}`);
  if (safe.license) lines.push(`license: ${markdownScalar(safe.license)}`);
  if (safe.sourceName) lines.push(`source-name: ${markdownScalar(safe.sourceName)}`);
  if (safe.sourceUrl) lines.push(`source-url: ${markdownScalar(safe.sourceUrl)}`);
  if (safe.compatibility?.length) lines.push(`compatibility: ${safe.compatibility.join(", ")}`);
  if (safe.metadata) {
    for (const [key, value] of Object.entries(safe.metadata)) {
      if (["name", "title", "description", "version", "author", "license", "source-name", "source-url", "compatibility"].includes(key)) continue;
      if (/^[a-z][a-z0-9-]*$/i.test(key)) lines.push(`${key}: ${markdownScalar(value)}`);
    }
  }
  lines.push("---", "", safe.instructions, "");
  return lines.join("\n")
    .replace(/\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{30,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{20,})\b/g, "[REDACTED CREDENTIAL]")
    .replace(/(\bBearer\s+)[A-Za-z0-9._~+/-]+=*/gi, "$1[REDACTED]")
    .replace(/([?&](?:api[_-]?)?(?:key|token|secret|password)=)[^&#\s]+/gi, "$1[REDACTED]")
    .replace(/((?:api[_ -]?key|api[_ -]?token|access[_ -]?token|authorization|password|secret|credential|session[_ -]?key)\s*(?::|=|\bis\b)\s*)(?:"[^"]*"|'[^']*'|[^\r\n,;]+)/gi, "$1[REDACTED]");
}

function normalizeForDeduplication(text: string): string {
  return text.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
}

export function composeWorkspaceContext(
  skills: WorkspaceSkill[],
  projectInstructions = "",
  maxChars = MAX_SKILL_CONTEXT_CHARS,
): WorkspaceContext {
  const sections: string[] = [];
  const seenContent = new Set<string>();
  const appliedSkills: AppliedSkill[] = [];
  const omittedSkills: SkillOmission[] = [];
  const project = projectInstructions.trim();

  if (project) {
    const projectSection = `Project instructions (untrusted user context):\n${project}`;
    const boundedProject = projectSection.length > maxChars ? `${projectSection.slice(0, maxChars - 1)}…` : projectSection;
    sections.push(boundedProject);
    seenContent.add(normalizeForDeduplication(project));
  }

  for (const skill of skills) {
    if (!skill.enabled) continue;
    const normalizedInstructions = normalizeForDeduplication(skill.instructions);
    if (seenContent.has(normalizedInstructions)) {
      omittedSkills.push({ id: skill.id, name: skill.name, reason: "duplicate" });
      continue;
    }

    const section = `Skill "${skill.name}" (${skill.source}; untrusted guidance):\n${skill.instructions}`;
    const candidate = [...sections, section].join("\n\n");
    if (candidate.length > maxChars) {
      omittedSkills.push({ id: skill.id, name: skill.name, reason: "prompt-limit" });
      continue;
    }

    sections.push(section);
    seenContent.add(normalizedInstructions);
    appliedSkills.push({ id: skill.id, name: skill.name, source: skill.source, ...(skill.sourceName ? { sourceName: skill.sourceName } : {}) });
  }

  return { context: sections.join("\n\n").slice(0, maxChars), appliedSkills, omittedSkills };
}
