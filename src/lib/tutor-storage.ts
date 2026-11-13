import { z } from "zod";
import type { ProviderId } from "./providers/catalog";
import type { AppliedSkill, SkillOmission } from "./skills";
import type { TutorMode } from "./tutor-request";

export const TUTOR_STORAGE_KEY = "katalyst.tutor.v1";
export const TUTOR_STORE_CHANGE_EVENT = "katalyst:tutor-store-changed";
export const MAX_TUTOR_CONVERSATIONS = 30;
export const MAX_MESSAGES_PER_CONVERSATION = 50;
export const MAX_TUTOR_STORE_BYTES = 500_000;

export type TutorPersistedMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  responseProvider?: ProviderId;
  responseModel?: string;
  appliedSkills?: AppliedSkill[];
  omittedSkills?: SkillOmission[];
};

export type TutorConversation = {
  id: string;
  lessonId?: string;
  title: string;
  mode?: TutorMode;
  createdAt: string;
  updatedAt: string;
  messages: TutorPersistedMessage[];
};

export type TutorStore = {
  version: 1;
  activeConversationId: string;
  conversations: TutorConversation[];
};

const tutorPersistedMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string().max(10_000),
  createdAt: z.string(),
  responseProvider: z.string().optional() as z.ZodType<ProviderId | undefined>,
  responseModel: z.string().optional(),
  appliedSkills: z.array(z.any()).optional(),
  omittedSkills: z.array(z.any()).optional(),
});

const tutorConversationSchema = z.object({
  id: z.string(),
  lessonId: z.string().optional(),
  title: z.string().min(1).max(120),
  mode: z.enum(["Concept teacher", "Socratic tutor", "Practical mentor", "Exam coach"]).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  messages: z.array(tutorPersistedMessageSchema).max(MAX_MESSAGES_PER_CONVERSATION),
});

export const tutorStoreSchema = z.object({
  version: z.literal(1),
  activeConversationId: z.string(),
  conversations: z.array(tutorConversationSchema).max(MAX_TUTOR_CONVERSATIONS),
});

export function emptyTutorStore(): TutorStore {
  const initialConvId = "conv-general";
  const now = new Date().toISOString();
  return {
    version: 1,
    activeConversationId: initialConvId,
    conversations: [
      {
        id: initialConvId,
        title: "General learning",
        mode: "Concept teacher",
        createdAt: now,
        updatedAt: now,
        messages: [],
      },
    ],
  };
}

let cachedTutorStore: TutorStore | null = null;
let cachedTutorStoreRaw: string | null = null;

export function getTutorStoreSnapshot(): TutorStore {
  if (typeof window === "undefined") return emptyTutorStore();
  try {
    const raw = window.localStorage.getItem(TUTOR_STORAGE_KEY);
    if (raw === cachedTutorStoreRaw && cachedTutorStore !== null) {
      return cachedTutorStore;
    }
    cachedTutorStoreRaw = raw;
    if (!raw) {
      cachedTutorStore = emptyTutorStore();
      return cachedTutorStore;
    }
    const parsed = JSON.parse(raw);
    const result = tutorStoreSchema.safeParse(parsed);
    cachedTutorStore = result.success ? result.data : emptyTutorStore();
    return cachedTutorStore;
  } catch {
    cachedTutorStore = emptyTutorStore();
    return cachedTutorStore;
  }
}

const serverEmptyStore: TutorStore = emptyTutorStore();
export function getTutorStoreServerSnapshot(): TutorStore {
  return serverEmptyStore;
}

export function subscribeTutorStore(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(TUTOR_STORE_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(TUTOR_STORE_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function readTutorStore(storage?: Pick<Storage, "getItem">): TutorStore {
  try {
    const targetStorage = storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
    if (!targetStorage) return emptyTutorStore();
    const raw = targetStorage.getItem(TUTOR_STORAGE_KEY);
    if (!raw) return emptyTutorStore();
    const parsed = JSON.parse(raw);
    const result = tutorStoreSchema.safeParse(parsed);
    if (!result.success) return emptyTutorStore();
    return result.data;
  } catch {
    return emptyTutorStore();
  }
}

export function writeTutorStore(store: TutorStore, storage?: Pick<Storage, "setItem">): boolean {
  try {
    const targetStorage = storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
    if (!targetStorage) return false;
    const validated = tutorStoreSchema.parse(store);
    const serialized = JSON.stringify(validated);
    cachedTutorStore = validated;
    cachedTutorStoreRaw = serialized;
    if (new TextEncoder().encode(serialized).byteLength > MAX_TUTOR_STORE_BYTES) {
      // Prune oldest conversations if exceeding byte capacity
      const pruned = {
        ...validated,
        conversations: validated.conversations.slice(-15),
      };
      targetStorage.setItem(TUTOR_STORAGE_KEY, JSON.stringify(pruned));
    } else {
      targetStorage.setItem(TUTOR_STORAGE_KEY, serialized);
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(TUTOR_STORE_CHANGE_EVENT));
    }
    return true;
  } catch {
    return false;
  }
}

export function getOrCreateConversation(
  store: TutorStore,
  lessonId?: string,
  lessonTitle?: string
): { store: TutorStore; conversation: TutorConversation } {
  const now = new Date().toISOString();
  if (lessonId) {
    const existing = store.conversations.find((c) => c.lessonId === lessonId);
    if (existing) {
      return {
        store: { ...store, activeConversationId: existing.id },
        conversation: existing,
      };
    }
    const newConv: TutorConversation = {
      id: `conv-lesson-${lessonId}`,
      lessonId,
      title: lessonTitle ? `Lesson: ${lessonTitle}` : `Lesson ${lessonId}`,
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    const nextConversations = [newConv, ...store.conversations].slice(0, MAX_TUTOR_CONVERSATIONS);
    const nextStore: TutorStore = {
      ...store,
      activeConversationId: newConv.id,
      conversations: nextConversations,
    };
    writeTutorStore(nextStore);
    return { store: nextStore, conversation: newConv };
  }

  // General conversation
  let active = store.conversations.find((c) => c.id === store.activeConversationId);
  if (!active) {
    active = store.conversations[0];
  }
  if (!active) {
    const brandNew: TutorConversation = {
      id: `conv-${Date.now()}`,
      title: "General learning",
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    const nextStore: TutorStore = {
      version: 1,
      activeConversationId: brandNew.id,
      conversations: [brandNew],
    };
    writeTutorStore(nextStore);
    return { store: nextStore, conversation: brandNew };
  }
  return { store, conversation: active };
}

export function addMessageToConversation(
  store: TutorStore,
  conversationId: string,
  message: Omit<TutorPersistedMessage, "id" | "createdAt">
): { store: TutorStore; conversation: TutorConversation } {
  const now = new Date().toISOString();
  const fullMessage: TutorPersistedMessage = {
    ...message,
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now,
  };

  const nextConversations = store.conversations.map((c) => {
    if (c.id !== conversationId) return c;
    const boundedMessages = [...c.messages, fullMessage].slice(-MAX_MESSAGES_PER_CONVERSATION);
    return {
      ...c,
      updatedAt: now,
      messages: boundedMessages,
    };
  });

  const updatedConversation = nextConversations.find((c) => c.id === conversationId);
  const nextStore: TutorStore = {
    ...store,
    conversations: nextConversations,
  };
  writeTutorStore(nextStore);

  return {
    store: nextStore,
    conversation: updatedConversation ?? store.conversations[0]!,
  };
}

export function clearConversationMessages(store: TutorStore, conversationId: string): TutorStore {
  const now = new Date().toISOString();
  const nextConversations = store.conversations.map((c) => {
    if (c.id !== conversationId) return c;
    return {
      ...c,
      updatedAt: now,
      messages: [],
    };
  });
  const nextStore: TutorStore = {
    ...store,
    conversations: nextConversations,
  };
  writeTutorStore(nextStore);
  return nextStore;
}

export function createNewConversation(
  store: TutorStore,
  lessonId?: string,
  title?: string
): { store: TutorStore; conversation: TutorConversation } {
  const now = new Date().toISOString();
  const uniqueId = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const defaultTitle = lessonId ? (title ? `Lesson: ${title}` : `Lesson chat`) : "New learning conversation";

  const newConv: TutorConversation = {
    id: uniqueId,
    lessonId,
    title: defaultTitle,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };

  const nextConversations = [newConv, ...store.conversations].slice(0, MAX_TUTOR_CONVERSATIONS);
  const nextStore: TutorStore = {
    ...store,
    activeConversationId: newConv.id,
    conversations: nextConversations,
  };
  writeTutorStore(nextStore);
  return { store: nextStore, conversation: newConv };
}

export function renameConversation(
  store: TutorStore,
  conversationId: string,
  newTitle: string
): TutorStore {
  const trimmed = newTitle.trim().slice(0, 100);
  if (!trimmed) return store;
  const now = new Date().toISOString();
  const nextConversations = store.conversations.map((c) => {
    if (c.id !== conversationId) return c;
    return { ...c, title: trimmed, updatedAt: now };
  });
  const nextStore: TutorStore = { ...store, conversations: nextConversations };
  writeTutorStore(nextStore);
  return nextStore;
}

export function deleteConversation(
  store: TutorStore,
  conversationId: string
): TutorStore {
  const nextConversations = store.conversations.filter((c) => c.id !== conversationId);
  if (nextConversations.length === 0) {
    return emptyTutorStore();
  }
  const nextActiveId =
    store.activeConversationId === conversationId
      ? nextConversations[0]!.id
      : store.activeConversationId;
  const nextStore: TutorStore = {
    ...store,
    activeConversationId: nextActiveId,
    conversations: nextConversations,
  };
  writeTutorStore(nextStore);
  return nextStore;
}

export function updateConversationMode(
  store: TutorStore,
  conversationId: string,
  mode: TutorMode
): TutorStore {
  const now = new Date().toISOString();
  const nextConversations = store.conversations.map((c) => {
    if (c.id !== conversationId) return c;
    return { ...c, mode, updatedAt: now };
  });
  const nextStore: TutorStore = { ...store, conversations: nextConversations };
  writeTutorStore(nextStore);
  return nextStore;
}

export function setActiveConversation(
  store: TutorStore,
  conversationId: string
): TutorStore {
  if (store.activeConversationId === conversationId) return store;
  const nextStore: TutorStore = { ...store, activeConversationId: conversationId };
  writeTutorStore(nextStore);
  return nextStore;
}
