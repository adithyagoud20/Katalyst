import { describe, expect, it, beforeEach } from "vitest";
import {
  readTutorStore,
  getOrCreateConversation,
  addMessageToConversation,
  createNewConversation,
  clearConversationMessages,
  deleteConversation,
  renameConversation,
  updateConversationMode,
  emptyTutorStore,
  TUTOR_STORAGE_KEY,
} from "../src/lib/tutor-storage";

describe("Kat Tutor Storage and Conversation Memory", () => {
  const storeMap = new Map<string, string>();
  const mockStorage: Storage = {
    getItem: (key: string) => storeMap.get(key) ?? null,
    setItem: (key: string, value: string) => storeMap.set(key, value),
    removeItem: (key: string) => storeMap.delete(key),
    clear: () => storeMap.clear(),
    key: (i: number) => Array.from(storeMap.keys())[i] ?? null,
    length: 0,
  };

  beforeEach(() => {
    storeMap.clear();
    globalThis.localStorage = mockStorage;
    // @ts-expect-error test mock
    globalThis.window = { localStorage: mockStorage, dispatchEvent: () => true };
  });

  it("initializes with an empty tutor store when storage is blank", () => {
    const store = readTutorStore();
    expect(store.version).toBe(1);
    expect(store.conversations.length).toBe(1);
    expect(store.conversations[0]?.title).toBe("General learning");
  });

  it("recovers gracefully from corrupted storage", () => {
    localStorage.setItem(TUTOR_STORAGE_KEY, "invalid-json{{[");
    const store = readTutorStore();
    expect(store.version).toBe(1);
    expect(store.conversations.length).toBe(1);
  });

  it("creates and retrieves lesson-specific conversations", () => {
    const store = readTutorStore();
    const { store: s1, conversation: c1 } = getOrCreateConversation(store, "variables", "Working with Variables");
    expect(c1.lessonId).toBe("variables");
    expect(c1.title).toBe("Lesson: Working with Variables");
    expect(s1.activeConversationId).toBe(c1.id);

    // Calling again returns the existing conversation
    const { conversation: c2 } = getOrCreateConversation(s1, "variables", "Working with Variables");
    expect(c2.id).toBe(c1.id);
  });

  it("appends messages and bounds conversation history", () => {
    const store = emptyTutorStore();
    const convId = store.activeConversationId;

    const { store: s1, conversation: c1 } = addMessageToConversation(store, convId, {
      role: "user",
      content: "What is an int in C?",
    });

    expect(c1.messages.length).toBe(1);
    expect(c1.messages[0]?.content).toBe("What is an int in C?");

    const { conversation: c2 } = addMessageToConversation(s1, convId, {
      role: "assistant",
      content: "An int is a fixed-width integer type.",
    });

    expect(c2.messages.length).toBe(2);
    expect(c2.messages[1]?.role).toBe("assistant");
  });

  it("clears conversation messages while retaining the conversation entity", () => {
    const store = emptyTutorStore();
    const convId = store.activeConversationId;

    const { store: s1 } = addMessageToConversation(store, convId, {
      role: "user",
      content: "Hello",
    });

    const s2 = clearConversationMessages(s1, convId);
    const active = s2.conversations.find((c) => c.id === convId);
    expect(active?.messages.length).toBe(0);
  });

  it("creates, renames, and deletes conversations", () => {
    const store = emptyTutorStore();
    const { store: s1, conversation: c1 } = createNewConversation(store, undefined, "Custom Chat");
    expect(c1.title).toBe("New learning conversation");

    const s2 = renameConversation(s1, c1.id, "Advanced Pointers Discussion");
    expect(s2.conversations.find((c) => c.id === c1.id)?.title).toBe("Advanced Pointers Discussion");

    const s3 = deleteConversation(s2, c1.id);
    expect(s3.conversations.some((c) => c.id === c1.id)).toBe(false);
  });

  it("preserves selected teaching mode per conversation", () => {
    const store = emptyTutorStore();
    const convId = store.activeConversationId;

    const s1 = updateConversationMode(store, convId, "Socratic tutor");
    expect(s1.conversations.find((c) => c.id === convId)?.mode).toBe("Socratic tutor");

    // Switching to a second conversation with a different mode
    const { store: s2, conversation: c2 } = createNewConversation(s1, "pointers", "Pointers");
    const s3 = updateConversationMode(s2, c2.id, "Practical mentor");
    expect(s3.conversations.find((c) => c.id === c2.id)?.mode).toBe("Practical mentor");
    // Original conversation preserves its mode
    expect(s3.conversations.find((c) => c.id === convId)?.mode).toBe("Socratic tutor");
  });

  it("isolates conversation history when switching between multiple lessons", () => {
    let store = readTutorStore();
    const { store: s1, conversation: varConv } = getOrCreateConversation(store, "variables", "Variables");
    const res1 = addMessageToConversation(s1, varConv.id, { role: "user", content: "What is an int?" });
    store = res1.store;

    const { store: s2, conversation: ptrConv } = getOrCreateConversation(store, "pointers", "Pointers");
    const res2 = addMessageToConversation(s2, ptrConv.id, { role: "user", content: "What is a pointer?" });
    store = res2.store;

    // Verify messages are strictly separated
    const varLoaded = store.conversations.find((c) => c.id === varConv.id);
    const ptrLoaded = store.conversations.find((c) => c.id === ptrConv.id);

    expect(varLoaded?.messages.length).toBe(1);
    expect(varLoaded?.messages[0]?.content).toBe("What is an int?");

    expect(ptrLoaded?.messages.length).toBe(1);
    expect(ptrLoaded?.messages[0]?.content).toBe("What is a pointer?");
  });
});
