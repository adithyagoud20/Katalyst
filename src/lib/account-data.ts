import { z } from "zod";
import { emptyLearningProgress, readLearningProgress, type LearningProgress } from "@/lib/learning-progress";
import { DEFAULT_USER_PREFERENCES, readUserPreferences, type UserPreferences } from "@/lib/user-preferences";
import { sanitizeImportedSkill } from "@/lib/skills";
import { MAX_LOCAL_WORKSPACE_BYTES, readLocalWorkspace, serializeLocalWorkspace } from "@/lib/workspace-storage";
import { applyBackup, workspaceSchema, type WorkspaceData } from "@/lib/workspace-portability";
import {
  TUTOR_STORAGE_KEY,
  tutorStoreSchema,
  MAX_TUTOR_CONVERSATIONS,
  type TutorStore,
} from "@/lib/tutor-storage";

export const ACCOUNT_SNAPSHOT_MAX_BYTES = 9_000_000;
export const ACCOUNT_LOCAL_CHANGE_EVENT = "katalyst:account-local-data-changed";
export const ACCOUNT_SNAPSHOT_APPLIED_EVENT = "katalyst:account-snapshot-applied";
export const ACCOUNT_GUEST_BACKUP_KEY = "katalyst.guest-backup.v1";
export const ACCOUNT_ACTIVE_KEY = "katalyst.account-active.v1";
export const ACCOUNT_MIGRATION_PREFIX = "katalyst.account-migration.v1.";

export type AccountSnapshot = {
  workspace: WorkspaceData;
  learningProgress: LearningProgress;
  preferences: UserPreferences;
  tutorStore?: TutorStore;
};

export type AccountActiveMarker = { userId: string; revision: number; snapshotHash: string };

const accountSnapshotShape = z.object({
  workspace: workspaceSchema,
  learningProgress: z.unknown(),
  preferences: z.unknown(),
  tutorStore: z.unknown().optional(),
}).strict();

export function parseAccountSnapshot(value: unknown): AccountSnapshot {
  const parsed = accountSnapshotShape.safeParse(value);
  if (!parsed.success) throw new Error("Account data has an invalid structure and was not saved.");

  const workspace = {
    ...parsed.data.workspace,
    skills: parsed.data.workspace.skills.map((skill) => sanitizeImportedSkill(skill)),
  };
  // Reuse the local record's duplicate-ID, reference, OpenAI model, and size checks.
  const workspaceJson = serializeLocalWorkspace(workspace);
  if (new TextEncoder().encode(workspaceJson).byteLength > MAX_LOCAL_WORKSPACE_BYTES) {
    throw new Error("The workspace exceeds the supported 8 MB limit.");
  }
  const learningProgress = readLearningProgress(JSON.stringify(parsed.data.learningProgress));
  if (learningProgress.kind !== "valid") throw new Error("Learning progress is invalid or uses an unsupported version.");
  const preferences = readUserPreferences(JSON.stringify(parsed.data.preferences));
  if (preferences.kind !== "valid") throw new Error("Appearance preferences are invalid or use an unsupported version.");

  let tutorStore: TutorStore | undefined;
  if (parsed.data.tutorStore !== undefined) {
    const parsedTutor = tutorStoreSchema.safeParse(parsed.data.tutorStore);
    if (parsedTutor.success) tutorStore = parsedTutor.data;
  }

  const snapshot: AccountSnapshot = {
    workspace,
    learningProgress: learningProgress.progress,
    preferences: preferences.preferences,
    ...(tutorStore ? { tutorStore } : {}),
  };
  if (new TextEncoder().encode(JSON.stringify(snapshot)).byteLength > ACCOUNT_SNAPSHOT_MAX_BYTES) {
    throw new Error("The account snapshot exceeds the supported 9 MB limit.");
  }
  return snapshot;
}

export function emptyAccountSnapshot(workspace: WorkspaceData): AccountSnapshot {
  return parseAccountSnapshot({ workspace, learningProgress: emptyLearningProgress(), preferences: DEFAULT_USER_PREFERENCES });
}

export function readAccountSnapshotFromStorage(storage: Pick<Storage, "getItem">, fallbackWorkspace?: WorkspaceData): AccountSnapshot {
  const workspaceRaw = storage.getItem("katalyst.workspace.v1");
  let workspace: WorkspaceData;
  if (workspaceRaw === null && fallbackWorkspace) workspace = fallbackWorkspace;
  else {
    const parsedWorkspace = readLocalWorkspace(workspaceRaw);
    if (parsedWorkspace.kind === "missing") {
      if (!fallbackWorkspace) throw new Error("This device has no saved workspace to sync.");
      workspace = fallbackWorkspace;
    } else if (parsedWorkspace.kind === "valid") workspace = parsedWorkspace.workspace;
    else throw new Error("Resolve the saved workspace recovery notice before moving this data to an account.");
  }

  const progressRaw = storage.getItem("katalyst.learning.v1");
  const progress = readLearningProgress(progressRaw);
  if (progress.kind !== "valid" && progress.kind !== "missing") throw new Error("Resolve the saved learning progress issue before moving this data to an account.");

  const preferencesRaw = storage.getItem("katalyst.preferences.v1");
  const preferences = readUserPreferences(preferencesRaw);
  if (preferences.kind !== "valid" && preferences.kind !== "missing") throw new Error("Resolve the saved appearance preference issue before moving this data to an account.");

  const tutorRaw = storage.getItem(TUTOR_STORAGE_KEY);
  let tutorStore: TutorStore | undefined;
  if (tutorRaw) {
    try {
      const parsedTutor = tutorStoreSchema.safeParse(JSON.parse(tutorRaw));
      if (parsedTutor.success) tutorStore = parsedTutor.data;
    } catch {
      // Ignore corrupt tutor storage in snapshot assembly
    }
  }

  return parseAccountSnapshot({
    workspace,
    learningProgress: progress.progress,
    preferences: preferences.preferences,
    ...(tutorStore ? { tutorStore } : {}),
  });
}

export function writeAccountSnapshotToStorage(storage: Pick<Storage, "setItem">, input: unknown): AccountSnapshot {
  const snapshot = parseAccountSnapshot(input);
  const workspaceJson = serializeLocalWorkspace(snapshot.workspace);
  const progressJson = JSON.stringify(snapshot.learningProgress);
  const preferencesJson = JSON.stringify(snapshot.preferences);
  // Store the largest record first; the account remains recoverable from the server if storage fills mid-write.
  storage.setItem("katalyst.workspace.v1", workspaceJson);
  storage.setItem("katalyst.learning.v1", progressJson);
  storage.setItem("katalyst.preferences.v1", preferencesJson);
  if (snapshot.tutorStore) {
    storage.setItem(TUTOR_STORAGE_KEY, JSON.stringify(snapshot.tutorStore));
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(ACCOUNT_SNAPSHOT_APPLIED_EVENT));
  return snapshot;
}

export async function hashAccountSnapshot(snapshot: AccountSnapshot): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(parseAccountSnapshot(snapshot)));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function mergeAccountSnapshots(
  accountInput: AccountSnapshot,
  guestInput: AccountSnapshot,
  preferenceSource: "account" | "guest",
  createId: () => string = () => crypto.randomUUID(),
): AccountSnapshot {
  const account = parseAccountSnapshot(accountInput);
  const guest = parseAccountSnapshot(guestInput);
  const workspace = applyBackup(account.workspace, {
    format: "katalyst-workspace",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    workspace: guest.workspace,
  }, "merge", createId).workspace;
  const progressByPath = new Map(account.learningProgress.enrollments.map((enrollment) => [enrollment.pathId, enrollment]));

  for (const incoming of guest.learningProgress.enrollments) {
    const current = progressByPath.get(incoming.pathId);
    if (!current) {
      progressByPath.set(incoming.pathId, incoming);
      continue;
    }
    const completed = new Map(current.completedLessons.map((item) => [item.lessonId, item.completedAt]));
    for (const item of incoming.completedLessons) {
      const existing = completed.get(item.lessonId);
      completed.set(item.lessonId, existing === undefined ? item.completedAt : Math.min(existing, item.completedAt));
    }
    const activities = new Map<string, LearningProgress["enrollments"][number]["activity"][number]>();
    for (const item of [...current.activity, ...incoming.activity]) {
      activities.set(`${item.kind}|${item.at}|${item.lessonId ?? ""}`, item);
    }
    progressByPath.set(incoming.pathId, {
      pathId: incoming.pathId,
      enrolledAt: Math.min(current.enrolledAt, incoming.enrolledAt),
      lastOpenedLessonId: incoming.activity.filter((item) => item.kind === "lesson-opened").at(-1)?.lessonId
        ?? current.lastOpenedLessonId ?? incoming.lastOpenedLessonId,
      completedLessons: [...completed].map(([lessonId, completedAt]) => ({ lessonId, completedAt })).sort((a, b) => a.completedAt - b.completedAt),
      activity: [...activities.values()].sort((a, b) => a.at - b.at).slice(-100),
    });
  }

  const tutorStore: TutorStore | undefined = account.tutorStore || guest.tutorStore
    ? {
        version: 1 as const,
        activeConversationId: account.tutorStore?.activeConversationId ?? guest.tutorStore?.activeConversationId ?? "conv-general",
        conversations: [
          ...(account.tutorStore?.conversations ?? []),
          ...(guest.tutorStore?.conversations ?? []).filter((gc) => !account.tutorStore?.conversations.some((ac) => ac.id === gc.id)),
        ].slice(0, MAX_TUTOR_CONVERSATIONS),
      }
    : undefined;

  const learningProgress = { version: 1 as const, enrollments: [...progressByPath.values()] };
  return parseAccountSnapshot({
    workspace,
    learningProgress,
    preferences: preferenceSource === "guest" ? guest.preferences : account.preferences,
    ...(tutorStore ? { tutorStore } : {}),
  });
}
