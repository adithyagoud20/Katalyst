import { z } from "zod";
import { getDefaultModel, isProviderId, isSupportedModel, type ProviderId } from "./providers/catalog";
import { sanitizeImportedSkill, type WorkspaceSkill } from "./skills";
import {
  workspaceChatSchema,
  workspaceProjectSchema,
  workspaceSchema,
  MAX_BACKUP_CHATS_PER_PROJECT,
  MAX_BACKUP_PROJECTS,
  type WorkspaceData,
  type WorkspaceProject,
} from "./workspace-portability";

export const LOCAL_WORKSPACE_SCHEMA_VERSION = 1;
export const MAX_LOCAL_WORKSPACE_BYTES = 8_000_000;

export type StorageReadResult =
  | { kind: "missing"; workspace: null }
  | { kind: "valid"; workspace: WorkspaceData }
  | { kind: "recoverable"; workspace: WorkspaceData; issues: string[] }
  | { kind: "corrupt"; workspace: null; issue: string }
  | { kind: "unsupported"; workspace: null; issue: string };

const projectHeaderSchema = z.object({ id: z.string().min(1).max(100), name: z.string().min(1).max(120), instructions: z.string().max(4_000) }).strict();
const MAX_LOCAL_SKILLS = 50;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function addUniqueProjects(value: unknown, issues: string[]): WorkspaceProject[] {
  if (!Array.isArray(value)) {
    issues.push("The saved project list is missing or malformed.");
    return [];
  }
  const projects: WorkspaceProject[] = [];
  const projectIds = new Set<string>();
  const chatIds = new Set<string>();
  for (const candidate of value) {
    if (projects.length >= MAX_BACKUP_PROJECTS) {
      issues.push(`Only the first ${MAX_BACKUP_PROJECTS} valid projects were recovered.`);
      break;
    }
    if (!isRecord(candidate)) {
      issues.push("A malformed project was skipped.");
      continue;
    }
    const header = projectHeaderSchema.safeParse({ id: candidate.id, name: candidate.name, instructions: candidate.instructions });
    if (!header.success || !Array.isArray(candidate.chats)) {
      issues.push("A project with invalid details was skipped.");
      continue;
    }
    if (projectIds.has(header.data.id)) {
      issues.push(`Duplicate project “${header.data.name}” was skipped.`);
      continue;
    }
    projectIds.add(header.data.id);
    const chats = [];
    for (const candidateChat of candidate.chats) {
      if (chats.length >= MAX_BACKUP_CHATS_PER_PROJECT) {
        issues.push(`Only the first ${MAX_BACKUP_CHATS_PER_PROJECT} conversations in “${header.data.name}” were recovered.`);
        break;
      }
      const parsedChat = workspaceChatSchema.safeParse(candidateChat);
      if (!parsedChat.success) {
        issues.push(`An invalid conversation in “${header.data.name}” was skipped.`);
        continue;
      }
      if (chatIds.has(parsedChat.data.id)) {
        issues.push(`Duplicate conversation “${parsedChat.data.title}” was skipped.`);
        continue;
      }
      chatIds.add(parsedChat.data.id);
      chats.push(parsedChat.data);
    }
    const project = workspaceProjectSchema.safeParse({ ...header.data, chats });
    if (project.success) projects.push(project.data);
    else issues.push(`Project “${header.data.name}” could not be recovered.`);
  }
  return projects;
}

function sanitizeSkills(value: unknown, issues: string[]): WorkspaceSkill[] {
  if (!Array.isArray(value)) {
    issues.push("The saved skill list is missing or malformed.");
    return [];
  }
  if (value.length > MAX_LOCAL_SKILLS) issues.push(`Only the first ${MAX_LOCAL_SKILLS} skills were recovered.`);
  const seen = new Set<string>();
  return value.slice(0, MAX_LOCAL_SKILLS).flatMap((candidate) => {
    try {
      const skill = sanitizeImportedSkill(candidate);
      if (seen.has(skill.id)) {
        issues.push(`Duplicate skill “${skill.name}” was skipped.`);
        return [];
      }
      seen.add(skill.id);
      return [skill];
    } catch {
      issues.push("An invalid skill was skipped. The original record is available to download.");
      return [];
    }
  });
}

function normalizedWorkspace(value: Record<string, unknown>, projects: WorkspaceProject[], skills: WorkspaceSkill[], issues: string[]): WorkspaceData {
  const provider: ProviderId = isProviderId(value.provider) ? value.provider : "openai";
  if (value.provider !== provider) issues.push("The selected provider was unsupported and has been reset to OpenAI.");
  const models = isRecord(value.models) ? value.models : {};
  const oldModel = typeof value.model === "string" && value.model.length <= 240 ? value.model : undefined;
  const readModel = (id: ProviderId): string => {
    const candidate = models[id] ?? (provider === id ? oldModel : undefined);
    if (typeof candidate !== "string" || candidate.length > 240) return getDefaultModel(id);
    if (id === "openai" && candidate && !isSupportedModel(id, candidate)) {
      issues.push("An unsupported OpenAI model selection was reset to the default.");
      return getDefaultModel(id);
    }
    return candidate;
  };
  const allChatIds = new Set(projects.flatMap((project) => project.chats.map((chat) => chat.id)));
  const requestedActiveChatId = typeof value.activeChatId === "string" ? value.activeChatId : null;
  const activeChatId = requestedActiveChatId && allChatIds.has(requestedActiveChatId) ? requestedActiveChatId : null;
  if (requestedActiveChatId && !activeChatId) issues.push("The selected conversation was missing and has been cleared.");
  return {
    projects,
    skills,
    provider,
    models: {
      cloudflare: readModel("cloudflare"),
      openai: readModel("openai"),
      gemini: readModel("gemini"),
      openrouter: readModel("openrouter"),
      ollama: readModel("ollama"),
    },
    ...(typeof value.ollamaBaseUrl === "string" && value.ollamaBaseUrl.length <= 300 ? { ollamaBaseUrl: value.ollamaBaseUrl } : {}),
    activeChatId,
  };
}

function fullyValid(rawWorkspace: unknown): WorkspaceData | null {
  const parsed = workspaceSchema.safeParse(rawWorkspace);
  if (!parsed.success) return null;
  if (parsed.data.models.openai && !isSupportedModel("openai", parsed.data.models.openai)) return null;
  const projectIds = new Set<string>();
  const chatIds = new Set<string>();
  const skillIds = new Set<string>();
  for (const project of parsed.data.projects) {
    if (projectIds.has(project.id)) return null;
    projectIds.add(project.id);
    for (const chat of project.chats) {
      if (chatIds.has(chat.id)) return null;
      chatIds.add(chat.id);
    }
  }
  for (const skill of parsed.data.skills) {
    if (skillIds.has(skill.id)) return null;
    skillIds.add(skill.id);
  }
  if (parsed.data.activeChatId && !chatIds.has(parsed.data.activeChatId)) return null;
  return parsed.data;
}

export function readLocalWorkspace(raw: string | null): StorageReadResult {
  if (raw === null) return { kind: "missing", workspace: null };
  if (byteLength(raw) > MAX_LOCAL_WORKSPACE_BYTES) return { kind: "corrupt", workspace: null, issue: "The saved workspace is larger than the supported local record size." };

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { kind: "corrupt", workspace: null, issue: "The saved workspace is not valid JSON. Download the original record before starting a new workspace." };
  }
  if (!isRecord(value)) return { kind: "corrupt", workspace: null, issue: "The saved workspace has an invalid structure. Download the original record before starting a new workspace." };

  let rawWorkspace: unknown = value;
  if (value.format === "katalyst-local-workspace") {
    if (value.schemaVersion !== LOCAL_WORKSPACE_SCHEMA_VERSION) {
      return { kind: "unsupported", workspace: null, issue: `This local workspace uses schema version ${String(value.schemaVersion)}, which this KATALYST version cannot read. Keep the record and restore it with a compatible version.` };
    }
    rawWorkspace = value.workspace;
  } else if (typeof value.schemaVersion === "number") {
    return { kind: "unsupported", workspace: null, issue: `This local record declares schema version ${value.schemaVersion}, which is not supported by the current workspace key.` };
  }

  const direct = fullyValid(rawWorkspace);
  if (direct) {
    const issues: string[] = [];
    const sanitizedSkills = sanitizeSkills(direct.skills, issues);
    if (!issues.length && JSON.stringify(sanitizedSkills) === JSON.stringify(direct.skills)) return { kind: "valid", workspace: direct };
    return { kind: "recoverable", workspace: { ...direct, skills: sanitizedSkills }, issues: issues.length ? issues : ["Imported skill text was sanitized before loading."] };
  }
  if (!isRecord(rawWorkspace)) return { kind: "corrupt", workspace: null, issue: "The saved workspace does not contain a readable workspace object." };

  const issues: string[] = [];
  const projects = addUniqueProjects(rawWorkspace.projects, issues);
  const skills = sanitizeSkills(rawWorkspace.skills, issues);
  const workspace = normalizedWorkspace(rawWorkspace, projects, skills, issues);
  const normalized = workspaceSchema.safeParse(workspace);
  if (!normalized.success) return { kind: "corrupt", workspace: null, issue: "The saved workspace has no recoverable structure. Download the original record before starting a new workspace." };
  if (!issues.length) issues.push("Some workspace fields were normalized to the current supported format.");
  return { kind: "recoverable", workspace: normalized.data, issues };
}

export function serializeLocalWorkspace(workspace: WorkspaceData): string {
  const parsed = workspaceSchema.safeParse(workspace);
  if (!parsed.success) throw new Error("The workspace contains invalid data and could not be saved.");
  if (!fullyValid(parsed.data)) throw new Error("The workspace contains duplicate IDs or invalid references and could not be saved.");
  const serialized = JSON.stringify(parsed.data);
  if (byteLength(serialized) > MAX_LOCAL_WORKSPACE_BYTES) throw new Error("The workspace is larger than the 8 MB local storage limit. Export a smaller backup before making more changes.");
  return serialized;
}

export function writeLocalWorkspace(storage: Pick<Storage, "getItem" | "setItem">, key: string, workspace: WorkspaceData): void {
  const serialized = serializeLocalWorkspace(workspace);
  if (storage.getItem(key) === serialized) return;
  storage.setItem(key, serialized);
}
