import type { WorkspaceChat, WorkspaceData } from "@/lib/workspace-portability";
import { MAX_BACKUP_CHATS_PER_PROJECT } from "@/lib/workspace-portability";

function updateConversation(workspace: WorkspaceData, chatId: string, update: (chat: WorkspaceChat) => WorkspaceChat): WorkspaceData {
  return {
    ...workspace,
    projects: workspace.projects.map((project) => ({
      ...project,
      chats: project.chats.map((chat) => chat.id === chatId ? update(chat) : chat),
    })),
  };
}

export function renameConversation(workspace: WorkspaceData, chatId: string, title: string): WorkspaceData {
  const normalized = title.trim().replace(/\s+/g, " ").slice(0, 200);
  if (!normalized) return workspace;
  return updateConversation(workspace, chatId, (chat) => ({ ...chat, title: normalized }));
}

export function setConversationPinned(workspace: WorkspaceData, chatId: string, pinned: boolean): WorkspaceData {
  return updateConversation(workspace, chatId, (chat) => ({ ...chat, pinned }));
}

export function deleteConversation(workspace: WorkspaceData, chatId: string): WorkspaceData {
  return {
    ...workspace,
    activeChatId: workspace.activeChatId === chatId ? null : workspace.activeChatId,
    projects: workspace.projects.map((project) => ({ ...project, chats: project.chats.filter((chat) => chat.id !== chatId) })),
  };
}

export function moveConversation(workspace: WorkspaceData, chatId: string, targetProjectId: string): WorkspaceData {
  const source = workspace.projects.find((project) => project.chats.some((chat) => chat.id === chatId));
  const target = workspace.projects.find((project) => project.id === targetProjectId);
  if (!source || !target || source.id === target.id) return workspace;
  if (target.chats.length >= MAX_BACKUP_CHATS_PER_PROJECT) throw new Error("This project already has the maximum of 500 conversations.");
  const chat = source.chats.find((item) => item.id === chatId);
  if (!chat) return workspace;

  return {
    ...workspace,
    projects: workspace.projects.map((project) => project.id === source.id
      ? { ...project, chats: project.chats.filter((item) => item.id !== chatId) }
      : project.id === target.id
        ? { ...project, chats: [chat, ...project.chats] }
        : project),
  };
}
