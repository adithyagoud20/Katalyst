import { describe, expect, it } from "vitest";
import { AI_ACTIVITY_KEY, beginAIRequest, finishAIRequest, getAIActivitySummary, readAIActivity } from "../src/lib/ai-activity";

function createStorage(initial: string | null = null) {
  const records = new Map<string, string>();
  if (initial !== null) records.set(AI_ACTIVITY_KEY, initial);
  return {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => records.set(key, value),
  };
}

describe("local AI request analytics", () => {
  it("records only provider request metadata and provider-reported token counts", () => {
    const storage = createStorage();
    const id = beginAIRequest(storage, { id: "request-1", at: 1_800_000_000_000, provider: "cloudflare", model: "@cf/google/gemma-4-26b-a4b-it" });
    expect(id).toBe("request-1");
    finishAIRequest(storage, id, "complete", { inputTokens: 12, outputTokens: 7 });
    const raw = storage.getItem(AI_ACTIVITY_KEY) ?? "";
    expect(raw).not.toMatch(/prompt|secret|api.?key|response/i);
    expect(readAIActivity(raw)).toMatchObject({ kind: "valid", activity: { requests: [{ outcome: "complete", usage: { inputTokens: 12, outputTokens: 7 } }] } });
  });

  it("counts failed and stopped real requests without adding token estimates", () => {
    const storage = createStorage();
    beginAIRequest(storage, { id: "failed", at: 100, provider: "openai", model: "gpt-6-luna" });
    finishAIRequest(storage, "failed", "failed");
    beginAIRequest(storage, { id: "stopped", at: 200, provider: "gemini", model: "gemini-3.8-flash" });
    finishAIRequest(storage, "stopped", "stopped");
    const parsed = readAIActivity(storage.getItem(AI_ACTIVITY_KEY));
    expect(parsed.kind).toBe("valid");
    if (parsed.kind !== "valid") return;
    expect(parsed.activity.requests.map((request) => request.outcome)).toEqual(["failed", "stopped"]);
    expect(parsed.activity.requests.every((request) => request.usage === undefined)).toBe(true);
  });

  it("rejects malformed, duplicate, oversized, and unsupported analytics without overwriting them", () => {
    expect(readAIActivity("{").kind).toBe("corrupt");
    expect(readAIActivity(JSON.stringify({ version: 2, requests: [] })).kind).toBe("unsupported");
    expect(readAIActivity(JSON.stringify({ version: 1, requests: [{ id: "x", at: 1, provider: "openai", model: "gpt-6-luna", outcome: "complete", apiKey: "secret" }] })).kind).toBe("corrupt");
    expect(readAIActivity(JSON.stringify({ version: 1, requests: [
      { id: "same", at: 1, provider: "openai", model: "gpt-6-luna", outcome: "complete" },
      { id: "same", at: 2, provider: "openai", model: "gpt-6-luna", outcome: "failed" },
    ] })).kind).toBe("corrupt");
  });

  it("aggregates real provider requests and local-day counts", () => {
    const today = new Date(2026, 10, 9, 12).getTime();
    const summary = getAIActivitySummary([
      { id: "a", at: today, provider: "openai", model: "gpt-6-luna", outcome: "complete", usage: { inputTokens: 5 } },
      { id: "b", at: today, provider: "openai", model: "gpt-6-luna", outcome: "failed" },
    ], today);
    expect(summary).toMatchObject({ requestCount: 2, providers: [{ provider: "openai", count: 2 }], inputTokens: 5, inputTokenRequests: 1 });
    expect(summary.days.at(-1)?.count).toBe(2);
    expect(summary.outputTokens).toBeUndefined();
  });
});
