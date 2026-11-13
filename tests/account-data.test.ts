import { describe, expect, it } from "vitest";
import { cProgrammingPath, pythonProgrammingPath } from "@/lib/learning-curriculum";
import { enrollInPath, emptyLearningProgress, completeLesson } from "@/lib/learning-progress";
import { DEFAULT_USER_PREFERENCES } from "@/lib/user-preferences";
import { getDefaultModel } from "@/lib/providers/catalog";
import { mergeAccountSnapshots, parseAccountSnapshot, writeAccountSnapshotToStorage, type AccountSnapshot } from "@/lib/account-data";
import type { WorkspaceData } from "@/lib/workspace-portability";

function workspace(projectId = "project", chatId = "conversation"): WorkspaceData {
  return {
    projects: [{
      id: projectId,
      name: projectId,
      instructions: "",
      chats: [{ id: chatId, title: chatId, messages: [{ role: "user", content: "Original words: sk-proj-abcdefghijklmnopqrstuvwxyz0123456789" }], updatedAt: 100 }],
    }],
    skills: [],
    provider: "cloudflare",
    models: { cloudflare: "", openai: getDefaultModel("openai"), gemini: getDefaultModel("gemini"), openrouter: getDefaultModel("openrouter"), ollama: "" },
    activeChatId: chatId,
  };
}

function snapshot(data = workspace(), progress = emptyLearningProgress()): AccountSnapshot {
  return parseAccountSnapshot({ workspace: data, learningProgress: progress, preferences: DEFAULT_USER_PREFERENCES });
}

describe("account snapshot validation and guest migration", () => {
  it("accepts the current versioned workspace, progress, and preferences schemas", () => {
    expect(snapshot().workspace.projects[0].id).toBe("project");
  });

  it("rejects malformed and oversized account data before it reaches persistence", () => {
    expect(() => parseAccountSnapshot({ workspace: {}, learningProgress: {}, preferences: {} })).toThrow(/invalid structure/i);
    expect(() => parseAccountSnapshot({ workspace: workspace(), learningProgress: { version: 2, enrollments: [] }, preferences: DEFAULT_USER_PREFERENCES })).toThrow(/learning progress/i);
    const large = workspace();
    large.projects[0].instructions = "x".repeat(4_001);
    expect(() => snapshot(large)).toThrow();
  });

  it("merges guest projects without overwriting colliding project or conversation IDs", () => {
    const result = mergeAccountSnapshots(snapshot(), snapshot(), "account", (() => {
      let id = 0;
      return () => `remapped-${++id}`;
    })());
    expect(result.workspace.projects).toHaveLength(2);
    expect(new Set(result.workspace.projects.map((item) => item.id)).size).toBe(2);
    expect(new Set(result.workspace.projects.flatMap((item) => item.chats.map((chat) => chat.id))).size).toBe(2);
    expect(result.workspace.projects.some((item) => item.chats[0].messages[0].content.includes("sk-proj-abcdefghijklmnopqrstuvwxyz0123456789"))).toBe(true);
  });

  it("unions explicit lesson progress and applies the chosen appearance preference", () => {
    const accountProgress = enrollInPath(emptyLearningProgress(), cProgrammingPath.id, 100);
    const guestProgress = completeLesson(enrollInPath(emptyLearningProgress(), cProgrammingPath.id, 200), cProgrammingPath.id, "source-to-output", 300);
    const guest = { ...snapshot(workspace("guest", "guest-chat"), guestProgress), preferences: { ...DEFAULT_USER_PREFERENCES, theme: "dark" as const } };
    const result = mergeAccountSnapshots(snapshot(workspace("account", "account-chat"), accountProgress), guest, "guest");
    expect(result.learningProgress.enrollments[0].completedLessons).toEqual([{ lessonId: "source-to-output", completedAt: 300 }]);
    expect(result.learningProgress.enrollments[0].enrolledAt).toBe(100);
    expect(result.preferences.theme).toBe("dark");
  });

  it("writes all three validated records and leaves provider keys out of the account shape", () => {
    const records = new Map<string, string>();
    const storage = { setItem: (key: string, value: string) => { records.set(key, value); } };
    const result = writeAccountSnapshotToStorage(storage as unknown as Storage, snapshot());
    expect([...records.keys()]).toEqual(["katalyst.workspace.v1", "katalyst.learning.v1", "katalyst.preferences.v1"]);
    expect(JSON.stringify(result)).not.toMatch(/api.?key|session.?key|authorization/i);
  });

  it("merges account snapshots containing Python course and dual enrollments", () => {
    const accountProgress = enrollInPath(emptyLearningProgress(), pythonProgrammingPath.id, 100);
    let guestProgress = enrollInPath(emptyLearningProgress(), pythonProgrammingPath.id, 200);
    guestProgress = completeLesson(guestProgress, pythonProgrammingPath.id, "py-source-to-interpreter", 300);
    guestProgress = enrollInPath(guestProgress, cProgrammingPath.id, 250);
    guestProgress = completeLesson(guestProgress, cProgrammingPath.id, "source-to-output", 350);

    const guest = snapshot(workspace("guest", "guest-chat"), guestProgress);
    const account = snapshot(workspace("account", "account-chat"), accountProgress);

    const merged = mergeAccountSnapshots(account, guest, "guest");
    expect(merged.learningProgress.enrollments).toHaveLength(2);
    expect(merged.learningProgress.enrollments.find((e) => e.pathId === pythonProgrammingPath.id)?.completedLessons).toEqual([
      { lessonId: "py-source-to-interpreter", completedAt: 300 }
    ]);
    expect(merged.learningProgress.enrollments.find((e) => e.pathId === cProgrammingPath.id)?.completedLessons).toEqual([
      { lessonId: "source-to-output", completedAt: 350 }
    ]);
  });
});
