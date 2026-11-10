import { z } from "zod";
import { providerIds, type ProviderId } from "@/lib/providers/catalog";

export const AI_ACTIVITY_KEY = "katalyst.ai-activity.v1";
export const MAX_AI_ACTIVITY_RECORDS = 500;

export type AIRequestOutcome = "started" | "complete" | "failed" | "stopped";
export type AIRequestUsage = { inputTokens?: number; outputTokens?: number };
export type AIRequestActivity = {
  id: string;
  at: number;
  provider: ProviderId;
  model: string;
  outcome: AIRequestOutcome;
  usage?: AIRequestUsage;
};
export type AIActivityData = { version: 1; requests: AIRequestActivity[] };
export type AIActivityRead =
  | { kind: "missing"; activity: AIActivityData }
  | { kind: "valid"; activity: AIActivityData }
  | { kind: "corrupt"; issue: string }
  | { kind: "unsupported"; issue: string };

const usageSchema = z.object({
  inputTokens: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),
  outputTokens: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),
}).strict();
const requestSchema = z.object({
  id: z.string().min(1).max(100),
  at: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  provider: z.enum(providerIds),
  model: z.string().min(1).max(240),
  outcome: z.enum(["started", "complete", "failed", "stopped"]),
  usage: usageSchema.optional(),
}).strict();
const activitySchema = z.object({
  version: z.literal(1),
  requests: z.array(requestSchema).max(MAX_AI_ACTIVITY_RECORDS),
}).strict();

export function readAIActivity(raw: string | null): AIActivityRead {
  if (raw === null) return { kind: "missing", activity: { version: 1, requests: [] } };
  if (new TextEncoder().encode(raw).byteLength > 500_000) {
    return { kind: "corrupt", issue: "Saved AI activity is larger than the supported limit and was left unchanged." };
  }

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { kind: "corrupt", issue: "Saved AI activity is not valid JSON and was left unchanged." };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { kind: "corrupt", issue: "Saved AI activity has an invalid shape and was left unchanged." };
  }
  if ((value as { version?: unknown }).version !== 1) {
    return { kind: "unsupported", issue: "This AI activity version is not supported and was left unchanged." };
  }
  const parsed = activitySchema.safeParse(value);
  if (!parsed.success || new Set(parsed.data.requests.map((request) => request.id)).size !== parsed.data.requests.length) {
    return { kind: "corrupt", issue: "Saved AI activity contains invalid records and was left unchanged." };
  }
  return { kind: "valid", activity: parsed.data };
}

function readWritableActivity(storage: Pick<Storage, "getItem">): AIActivityData | null {
  const result = readAIActivity(storage.getItem(AI_ACTIVITY_KEY));
  return result.kind === "missing" || result.kind === "valid" ? result.activity : null;
}

export function beginAIRequest(
  storage: Pick<Storage, "getItem" | "setItem">,
  request: { id: string; at: number; provider: ProviderId; model: string },
): string | null {
  try {
    const current = readWritableActivity(storage);
    if (!current) return null;
    const parsed = requestSchema.parse({ ...request, outcome: "started" });
    const requests = [...current.requests.filter((item) => item.id !== parsed.id), parsed].slice(-MAX_AI_ACTIVITY_RECORDS);
    storage.setItem(AI_ACTIVITY_KEY, JSON.stringify({ version: 1, requests } satisfies AIActivityData));
    return parsed.id;
  } catch {
    return null;
  }
}

export function finishAIRequest(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string | null,
  outcome: Exclude<AIRequestOutcome, "started">,
  usage?: AIRequestUsage,
): void {
  if (!id) return;
  try {
    const current = readWritableActivity(storage);
    if (!current) return;
    const requests = current.requests.map((request) => request.id === id && request.outcome === "started"
      ? { ...request, outcome, ...(usage ? { usage: usageSchema.parse(usage) } : {}) }
      : request);
    storage.setItem(AI_ACTIVITY_KEY, JSON.stringify({ version: 1, requests } satisfies AIActivityData));
  } catch {
    // Analytics must never interrupt a model request or response.
  }
}

export function trackAIRequestStart(
  provider: ProviderId,
  model: string,
  at = Date.now(),
): string | null {
  try {
    if (typeof window === "undefined") return null;
    return beginAIRequest(window.localStorage, { id: crypto.randomUUID(), at, provider, model });
  } catch {
    return null;
  }
}

export function trackAIRequestFinish(id: string | null, outcome: Exclude<AIRequestOutcome, "started">, usage?: AIRequestUsage): void {
  try {
    if (typeof window === "undefined") return;
    finishAIRequest(window.localStorage, id, outcome, usage);
  } catch {
    // Analytics are best-effort and do not affect provider calls.
  }
}

export function getAIActivitySummary(requests: AIRequestActivity[], now = Date.now()) {
  const providers = new Map<ProviderId, number>();
  const models = new Map<string, { provider: ProviderId; count: number; lastUsedAt: number }>();
  let inputTokens = 0;
  let inputTokenRequests = 0;
  let inputTokenTotalSafe = true;
  let outputTokens = 0;
  let outputTokenRequests = 0;
  let outputTokenTotalSafe = true;

  for (const request of requests) {
    providers.set(request.provider, (providers.get(request.provider) ?? 0) + 1);
    const key = `${request.provider}:${request.model}`;
    const model = models.get(key);
    models.set(key, { provider: request.provider, count: (model?.count ?? 0) + 1, lastUsedAt: Math.max(model?.lastUsedAt ?? 0, request.at) });
    if (request.usage?.inputTokens !== undefined) {
      const nextTotal = inputTokens + request.usage.inputTokens;
      if (Number.isSafeInteger(nextTotal)) inputTokens = nextTotal;
      else inputTokenTotalSafe = false;
      inputTokenRequests += 1;
    }
    if (request.usage?.outputTokens !== undefined) {
      const nextTotal = outputTokens + request.usage.outputTokens;
      if (Number.isSafeInteger(nextTotal)) outputTokens = nextTotal;
      else outputTokenTotalSafe = false;
      outputTokenRequests += 1;
    }
  }

  const days = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - offset));
    const start = date.getTime();
    const end = start + 24 * 60 * 60 * 1_000;
    return {
      date: start,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      count: requests.filter((request) => request.at >= start && request.at < end).length,
    };
  });

  return {
    requestCount: requests.length,
    providers: [...providers.entries()].map(([provider, count]) => ({ provider, count })).sort((a, b) => b.count - a.count),
    models: [...models.entries()].map(([key, model]) => ({ key, ...model })).sort((a, b) => b.lastUsedAt - a.lastUsedAt),
    inputTokens: inputTokenRequests && inputTokenTotalSafe ? inputTokens : undefined,
    inputTokenRequests,
    outputTokens: outputTokenRequests && outputTokenTotalSafe ? outputTokens : undefined,
    outputTokenRequests,
    days,
  };
}
