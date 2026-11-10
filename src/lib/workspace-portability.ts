import { z } from "zod";
import { providerIds, type ProviderId } from "@/lib/providers/catalog";
import { sanitizeImportedSkill, skillSchema, type WorkspaceSkill } from "@/lib/skills";

export const BACKUP_SCHEMA_VERSION = 1;
export const MAX_BACKUP_BYTES = 8_000_000;
export const MAX_BACKUP_PROJECTS = 100;
export const MAX_BACKUP_CHATS_PER_PROJECT = 500;
export const MAX_BACKUP_MESSAGES_PER_CHAT = 1_000;

export type WorkspaceMessage = {
  role: "user" | "assistant";
  content: string;
  provider?: ProviderId;
  model?: string;
  requestStatus?: "complete";
  usage?: { inputTokens?: number; outputTokens?: number; costUsd?: number };
  appliedSkills?: { id: string; name: string; source: "built-in" | "imported"; sourceName?: string }[];
  omittedSkills?: { id: string; name: string; reason: "duplicate" | "prompt-limit" }[];
};
export type WorkspaceChat = { id: string; title: string; messages: WorkspaceMessage[]; updatedAt: number; pinned?: boolean };
export type WorkspaceProject = { id: string; name: string; instructions: string; chats: WorkspaceChat[] };
export type WorkspaceData = {
  projects: WorkspaceProject[];
  skills: WorkspaceSkill[];
  provider: ProviderId;
  models: Record<ProviderId, string>;
  ollamaBaseUrl?: string;
  activeChatId: string | null;
};

const appliedSkillSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(80),
  source: z.enum(["built-in", "imported"]),
  sourceName: z.string().max(255).optional(),
}).strict();
const omittedSkillSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(80),
  reason: z.enum(["duplicate", "prompt-limit"]),
}).strict();
export const workspaceMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(200_000),
  provider: z.enum(providerIds).optional(),
  model: z.string().max(240).optional(),
  requestStatus: z.literal("complete").optional(),
  usage: z.object({
    inputTokens: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),
    outputTokens: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),
    costUsd: z.number().finite().nonnegative().optional(),
  }).strict().optional(),
  appliedSkills: z.array(appliedSkillSchema).max(50).optional(),
  omittedSkills: z.array(omittedSkillSchema).max(50).optional(),
}).strict();
export const workspaceChatSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().max(200),
  messages: z.array(workspaceMessageSchema).max(MAX_BACKUP_MESSAGES_PER_CHAT),
  updatedAt: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  pinned: z.boolean().optional(),
}).strict();
export const workspaceProjectSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(120),
  instructions: z.string().max(4_000),
  chats: z.array(workspaceChatSchema).max(MAX_BACKUP_CHATS_PER_PROJECT),
}).strict();
const workspaceBaseSchema = z.object({
  projects: z.array(workspaceProjectSchema).max(MAX_BACKUP_PROJECTS),
  skills: z.array(skillSchema).max(50),
  provider: z.enum(providerIds),
  models: z.object({
    cloudflare: z.string().max(240).optional(),
    openai: z.string().max(240),
    gemini: z.string().max(240),
    openrouter: z.string().max(240),
    ollama: z.string().max(240).optional(),
  }).strict(),
  ollamaBaseUrl: z.string().max(300).optional(),
  activeChatId: z.string().max(100).nullable(),
}).strict();
export const workspaceSchema = workspaceBaseSchema.transform((workspace) => ({
  ...workspace,
  models: { ...workspace.models, cloudflare: workspace.models.cloudflare ?? "", ollama: workspace.models.ollama ?? "" },
}));

const backupHeaderSchema = z.object({
  format: z.enum(["katalyst-workspace", "katalyst-project", "katalyst-conversation"]),
  schemaVersion: z.number().int(),
  exportedAt: z.string().datetime(),
});
const workspaceBackupSchema = z.object({
  format: z.literal("katalyst-workspace"),
  schemaVersion: z.literal(BACKUP_SCHEMA_VERSION),
  exportedAt: z.string().datetime(),
  workspace: workspaceSchema,
}).strict();
const projectBackupSchema = z.object({
  format: z.literal("katalyst-project"),
  schemaVersion: z.literal(BACKUP_SCHEMA_VERSION),
  exportedAt: z.string().datetime(),
  project: workspaceProjectSchema,
  skills: z.array(skillSchema).max(50),
}).strict();
const conversationBackupSchema = z.object({
  format: z.literal("katalyst-conversation"),
  schemaVersion: z.literal(BACKUP_SCHEMA_VERSION),
  exportedAt: z.string().datetime(),
  project: z.object({ id: z.string().min(1).max(100), name: z.string().min(1).max(120), instructions: z.string().max(4_000) }).strict(),
  conversation: workspaceChatSchema,
  skills: z.array(skillSchema).max(50),
}).strict();

export type ParsedBackup =
  | { format: "katalyst-workspace"; schemaVersion: 1; exportedAt: string; workspace: WorkspaceData }
  | { format: "katalyst-project"; schemaVersion: 1; exportedAt: string; project: WorkspaceProject; skills: WorkspaceSkill[] }
  | { format: "katalyst-conversation"; schemaVersion: 1; exportedAt: string; project: Pick<WorkspaceProject, "id" | "name" | "instructions">; conversation: WorkspaceChat; skills: WorkspaceSkill[] };

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function formatIssues(issues: z.ZodIssue[]): string {
  const first = issues[0];
  if (!first) return "The backup does not match a supported KATALYST format.";
  const path = first.path.length ? ` (${first.path.join(" → ")})` : "";
  return `The backup contains invalid or missing data${path}: ${first.message}`;
}

function assertUniqueWorkspace(workspace: WorkspaceData): void {
  const projectIds = new Set<string>();
  const chatIds = new Set<string>();
  const skillIds = new Set<string>();
  for (const project of workspace.projects) {
    if (projectIds.has(project.id)) throw new Error(`The backup contains duplicate project ID “${project.id}”.`);
    projectIds.add(project.id);
    for (const chat of project.chats) {
      if (chatIds.has(chat.id)) throw new Error(`The backup contains duplicate conversation ID “${chat.id}”.`);
      chatIds.add(chat.id);
    }
  }
  if (workspace.activeChatId && !chatIds.has(workspace.activeChatId)) throw new Error(`The backup references missing active conversation “${workspace.activeChatId}”.`);
  for (const skill of workspace.skills) {
    if (skillIds.has(skill.id)) throw new Error(`The backup contains duplicate skill ID “${skill.id}”.`);
    skillIds.add(skill.id);
  }
}

function sanitizeSkills(skills: WorkspaceSkill[]): WorkspaceSkill[] {
  return skills.map((skill) => sanitizeImportedSkill(skill));
}

function validateWorkspace(value: unknown): WorkspaceData {
  const parsed = workspaceSchema.safeParse(value);
  if (!parsed.success) throw new Error(formatIssues(parsed.error.issues));
  const workspace = { ...parsed.data, skills: sanitizeSkills(parsed.data.skills) };
  assertUniqueWorkspace(workspace);
  return workspace;
}

function redactSecretText(text: string): string {
  return text
    .replace(/\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{30,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{20,})\b/g, "[REDACTED CREDENTIAL]")
    .replace(/(\bBearer\s+)[A-Za-z0-9._~+/-]+=*/gi, "$1[REDACTED]")
    .replace(/([?&](?:api[_-]?)?(?:key|token|secret|password)=)[^&#\s]+/gi, "$1[REDACTED]")
    .replace(/((?:api[_ -]?key|api[_ -]?token|access[_ -]?token|authorization|password|secret|credential|session[_ -]?key)\s*(?::|=|\bis\b)\s*)(?:"[^"]*"|'[^']*'|[^\r\n,;]+)/gi, "$1[REDACTED]");
}

function isCredentialField(field: string): boolean {
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

function redactExportValues<T>(value: T): T {
  if (typeof value === "string") return redactSecretText(value) as T;
  if (Array.isArray(value)) return value.map((item) => redactExportValues(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !isCredentialField(key)).map(([key, item]) => [key, redactExportValues(item)])) as T;
  }
  return value;
}

function serializeBackup(value: unknown): string {
  const json = JSON.stringify(redactExportValues(value), null, 2);
  if (byteLength(json) > MAX_BACKUP_BYTES) throw new Error("This export exceeds the 8 MB backup limit.");
  return json;
}

function timestamp(value?: Date): string {
  return (value ?? new Date()).toISOString();
}

export function exportWorkspaceBackup(workspace: WorkspaceData, now?: Date): string {
  const safeWorkspace = validateWorkspace(workspace);
  const parsed = workspaceBackupSchema.safeParse({ format: "katalyst-workspace", schemaVersion: BACKUP_SCHEMA_VERSION, exportedAt: timestamp(now), workspace: safeWorkspace });
  if (!parsed.success) throw new Error(formatIssues(parsed.error.issues));
  return serializeBackup(parsed.data);
}

export function exportProjectBackup(project: WorkspaceProject, skills: WorkspaceSkill[], now?: Date): string {
  const parsed = projectBackupSchema.safeParse({ format: "katalyst-project", schemaVersion: BACKUP_SCHEMA_VERSION, exportedAt: timestamp(now), project, skills });
  if (!parsed.success) throw new Error(formatIssues(parsed.error.issues));
  const safeSkills = sanitizeSkills(parsed.data.skills);
  const chatIds = new Set<string>();
  for (const chat of parsed.data.project.chats) {
    if (chatIds.has(chat.id)) throw new Error(`The project contains duplicate conversation ID “${chat.id}”.`);
    chatIds.add(chat.id);
  }
  if (new Set(safeSkills.map((skill) => skill.id)).size !== safeSkills.length) throw new Error("The project export contains duplicate skill IDs.");
  return serializeBackup({ ...parsed.data, skills: safeSkills });
}

export function exportConversationBackup(project: WorkspaceProject, conversation: WorkspaceChat, skills: WorkspaceSkill[], now?: Date): string {
  if (!project.chats.some((chat) => chat.id === conversation.id)) throw new Error("Choose a conversation that belongs to this project.");
  const parsed = conversationBackupSchema.safeParse({ format: "katalyst-conversation", schemaVersion: BACKUP_SCHEMA_VERSION, exportedAt: timestamp(now), project: { id: project.id, name: project.name, instructions: project.instructions }, conversation, skills });
  if (!parsed.success) throw new Error(formatIssues(parsed.error.issues));
  const safeSkills = sanitizeSkills(parsed.data.skills);
  if (new Set(safeSkills.map((skill) => skill.id)).size !== safeSkills.length) throw new Error("The conversation export contains duplicate skill IDs.");
  return serializeBackup({ ...parsed.data, skills: safeSkills });
}

export function exportShareableConversation(conversation: WorkspaceChat): string {
  const title = redactSecretText(conversation.title).replace(/[\r\n]+/g, " ").trim() || "Conversation";
  const transcript = conversation.messages.map((message) => {
    const role = message.role === "user" ? "You" : "Katalyst";
    return `## ${role}\n\n${redactSecretText(message.content).trim()}`;
  }).join("\n\n");
  return `# ${title}\n\n${transcript}${transcript ? "\n" : ""}`;
}

export function parseBackup(raw: string): ParsedBackup {
  if (byteLength(raw) > MAX_BACKUP_BYTES) throw new Error("Backup files must be 8 MB or smaller.");
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  const header = backupHeaderSchema.safeParse(value);
  if (!header.success) throw new Error("This is not a supported KATALYST backup file.");
  if (header.data.schemaVersion !== BACKUP_SCHEMA_VERSION) throw new Error(`Backup schema version ${header.data.schemaVersion} is not supported. This KATALYST version supports version ${BACKUP_SCHEMA_VERSION}.`);

  if (header.data.format === "katalyst-workspace") {
    const result = workspaceBackupSchema.safeParse(value);
    if (!result.success) throw new Error(formatIssues(result.error.issues));
    const workspace = validateWorkspace(result.data.workspace);
    return { ...result.data, workspace };
  }
  if (header.data.format === "katalyst-project") {
    const result = projectBackupSchema.safeParse(value);
    if (!result.success) throw new Error(formatIssues(result.error.issues));
    const project = result.data.project;
    const chatIds = new Set<string>();
    for (const chat of project.chats) {
      if (chatIds.has(chat.id)) throw new Error(`The backup contains duplicate conversation ID “${chat.id}”.`);
      chatIds.add(chat.id);
    }
    const skills = sanitizeSkills(result.data.skills);
    if (new Set(skills.map((skill) => skill.id)).size !== skills.length) throw new Error("The backup contains duplicate skill IDs.");
    return { ...result.data, project, skills };
  }
  const result = conversationBackupSchema.safeParse(value);
  if (!result.success) throw new Error(formatIssues(result.error.issues));
  const skills = sanitizeSkills(result.data.skills);
  if (new Set(skills.map((skill) => skill.id)).size !== skills.length) throw new Error("The backup contains duplicate skill IDs.");
  return { ...result.data, skills };
}

export type ImportMode = "merge" | "replace";
export type ImportResult = { workspace: WorkspaceData; projectsAdded: number; conversationsAdded: number; skillsAdded: number; remappedIds: number };

function randomId(createId: () => string): string {
  const id = createId();
  if (!id || id.length > 100) throw new Error("Could not create a safe ID for an imported record.");
  return id;
}

function unusedId(used: Set<string>, createId: () => string): string {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const id = randomId(createId);
    if (!used.has(id)) return id;
  }
  throw new Error("Could not resolve an ID conflict safely. No workspace data was changed.");
}

function remapMessageSkillIds(message: WorkspaceMessage, map: Map<string, string>): WorkspaceMessage {
  return {
    ...message,
    ...(message.appliedSkills ? { appliedSkills: message.appliedSkills.map((skill) => ({ ...skill, id: map.get(skill.id) ?? skill.id })) } : {}),
    ...(message.omittedSkills ? { omittedSkills: message.omittedSkills.map((skill) => ({ ...skill, id: map.get(skill.id) ?? skill.id })) } : {}),
  };
}

function mergeSkills(existing: WorkspaceSkill[], incoming: WorkspaceSkill[], createId: () => string): { skills: WorkspaceSkill[]; idMap: Map<string, string>; added: number; remapped: number } {
  const skills = [...existing];
  const idMap = new Map<string, string>();
  const usedIds = new Set(skills.map((skill) => skill.id));
  let added = 0;
  let remapped = 0;
  for (const item of incoming) {
    const match = skills.find((skill) => skill.id === item.id);
    if (match && match.name === item.name && match.instructions === item.instructions) {
      idMap.set(item.id, match.id);
      continue;
    }
    let id = item.id;
    if (match || usedIds.has(id)) {
      id = unusedId(usedIds, createId);
      remapped += 1;
    }
    idMap.set(item.id, id);
    skills.push({ ...item, id });
    usedIds.add(id);
    added += 1;
  }
  if (skills.length > 50) throw new Error("This import would exceed the 50-skill browser library limit.");
  return { skills, idMap, added, remapped };
}

function uniqueIds(workspace: WorkspaceData): { projects: Set<string>; chats: Set<string> } {
  return {
    projects: new Set(workspace.projects.map((project) => project.id)),
    chats: new Set(workspace.projects.flatMap((project) => project.chats.map((chat) => chat.id))),
  };
}

function remapProject(project: WorkspaceProject, existing: WorkspaceData, skillMap: Map<string, string>, createId: () => string): { project: WorkspaceProject; remapped: number } {
  const ids = uniqueIds(existing);
  let remapped = 0;
  let projectId = project.id;
  if (ids.projects.has(projectId)) {
    projectId = unusedId(ids.projects, createId);
    remapped += 1;
  }
  ids.projects.add(projectId);
  const chats = project.chats.map((chat) => {
    let id = chat.id;
    if (ids.chats.has(id)) {
      id = unusedId(ids.chats, createId);
      remapped += 1;
    }
    ids.chats.add(id);
    return { ...chat, id, messages: chat.messages.map((message) => remapMessageSkillIds(message, skillMap)) };
  });
  return { project: { ...project, id: projectId, chats }, remapped };
}

export function applyBackup(existing: WorkspaceData, backup: ParsedBackup, mode: ImportMode = "merge", createId = () => crypto.randomUUID()): ImportResult {
  if (backup.format === "katalyst-workspace" && mode === "replace") {
    const workspace = validateWorkspace(backup.workspace);
    return { workspace, projectsAdded: workspace.projects.length, conversationsAdded: workspace.projects.reduce((sum, project) => sum + project.chats.length, 0), skillsAdded: workspace.skills.length, remappedIds: 0 };
  }
  const current = validateWorkspace(existing);

  let skillsResult = { skills: [...current.skills], idMap: new Map<string, string>(), added: 0, remapped: 0 };
  let incomingProjects: WorkspaceProject[] = [];
  let conversationTarget: { project: Pick<WorkspaceProject, "id" | "name" | "instructions">; conversation: WorkspaceChat } | undefined;
  if (backup.format === "katalyst-workspace") {
    skillsResult = mergeSkills(current.skills, backup.workspace.skills, createId);
    incomingProjects = backup.workspace.projects;
  } else if (backup.format === "katalyst-project") {
    skillsResult = mergeSkills(current.skills, backup.skills, createId);
    incomingProjects = [backup.project];
  } else {
    skillsResult = mergeSkills(current.skills, backup.skills, createId);
    conversationTarget = { project: backup.project, conversation: backup.conversation };
  }

  const projects = [...current.projects];
  const mappedProjects: WorkspaceProject[] = [];
  let remappedIds = skillsResult.remapped;
  let conversationsAdded = 0;
  for (const project of incomingProjects) {
    const mapped = remapProject(project, { ...current, projects: [...projects, ...mappedProjects] }, skillsResult.idMap, createId);
    mappedProjects.push(mapped.project);
    remappedIds += mapped.remapped;
    conversationsAdded += mapped.project.chats.length;
  }

  if (conversationTarget) {
    const target = projects.find((project) => project.id === conversationTarget?.project.id);
    const conversation = conversationTarget.conversation;
    const remappedMessages = conversation.messages.map((message) => remapMessageSkillIds(message, skillsResult.idMap));
    const chatIds = uniqueIds({ ...current, projects: [...projects, ...mappedProjects] }).chats;
    let chatId = conversation.id;
    if (chatIds.has(chatId)) {
      chatId = unusedId(chatIds, createId);
      remappedIds += 1;
    }
    const restored = { ...conversation, id: chatId, messages: remappedMessages };
    if (target) {
      const index = projects.findIndex((project) => project.id === target.id);
      projects[index] = { ...target, chats: [restored, ...target.chats] };
    } else {
      projects.unshift({ ...conversationTarget.project, chats: [restored] });
    }
    conversationsAdded = 1;
  }

  const next: WorkspaceData = {
    ...current,
    skills: skillsResult.skills,
    projects: [...mappedProjects, ...projects],
    activeChatId: current.activeChatId,
  };
  if (next.projects.length > MAX_BACKUP_PROJECTS) throw new Error("This import would exceed the 100-project browser workspace limit.");
  const validated = validateWorkspace(next);
  return { workspace: validated, projectsAdded: mappedProjects.length + (conversationTarget && !current.projects.some((project) => project.id === conversationTarget?.project.id) ? 1 : 0), conversationsAdded, skillsAdded: skillsResult.added, remappedIds };
}

export function commitBackupImport(raw: string, existing: WorkspaceData, mode: ImportMode, write: (serializedWorkspace: string) => void, createId?: () => string): ImportResult {
  const backup = parseBackup(raw);
  const result = applyBackup(existing, backup, mode, createId);
  const serialized = JSON.stringify(result.workspace);
  if (byteLength(serialized) > MAX_BACKUP_BYTES) throw new Error("The restored workspace exceeds the 8 MB browser data limit. Existing data was left unchanged.");
  try {
    write(serialized);
  } catch {
    throw new Error("The browser could not save this import, likely because storage is full or unavailable. Existing data was left unchanged.");
  }
  return result;
}
