import { describe, expect, it } from "vitest";
import { deleteConversation, moveConversation, renameConversation, setConversationPinned } from "../src/lib/workspace-actions";
import type { WorkspaceData } from "../src/lib/workspace-portability";

function workspace(): WorkspaceData {
  return {
    projects: [
      { id: "source", name: "Source", instructions: "source instructions", chats: [{ id: "chat-1", title: "Old name", updatedAt: 123, pinned: false, messages: [{ role: "user", content: "keep this" }] }] },
      { id: "target", name: "Target", instructions: "target instructions", chats: [] },
    ],
    skills: [], provider: "openai", models: { cloudflare: "", openai: "gpt-6-luna", gemini: "", openrouter: "", ollama: "" }, activeChatId: "chat-1",
  };
}

describe("local conversation management", () => {
  it("renames without changing messages or timestamps", () => {
    const result = renameConversation(workspace(), "chat-1", "  New   title  ");
    expect(result.projects[0].chats[0]).toMatchObject({ title: "New title", updatedAt: 123, messages: [{ content: "keep this" }] });
  });

  it("persists pin state without changing conversation content", () => {
    const pinned = setConversationPinned(workspace(), "chat-1", true);
    expect(pinned.projects[0].chats[0]).toMatchObject({ pinned: true, messages: [{ content: "keep this" }] });
    expect(setConversationPinned(pinned, "chat-1", false).projects[0].chats[0].pinned).toBe(false);
  });

  it("moves a conversation and its full record to another project", () => {
    const original = workspace();
    const moved = moveConversation(original, "chat-1", "target");
    expect(original.projects[0].chats).toHaveLength(1);
    expect(moved.projects[0].chats).toHaveLength(0);
    expect(moved.projects[1].chats[0]).toEqual(original.projects[0].chats[0]);
    expect(moved.activeChatId).toBe("chat-1");
  });

  it("deletes only the requested conversation and clears its active reference", () => {
    const result = deleteConversation(workspace(), "chat-1");
    expect(result.projects[0].chats).toEqual([]);
    expect(result.projects[1].chats).toEqual([]);
    expect(result.activeChatId).toBeNull();
  });
});
