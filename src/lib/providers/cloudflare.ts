import { providerCatalog, type ModelMetadata } from "./catalog";
import { getCloudflareAccountId, getProviderApiKey } from "./credentials";
import { addWorkspaceContext, providerInstructions } from "./prompt";
import { ProviderError, providerSignal, type GenerateInput, type ModelProvider, type ProviderUsage } from "./types";

const CLOUDFLARE_API = "https://api.cloudflare.com/client/v4";
const RESPONSE_LIMIT = 2_000_000;

export type CloudflareCompletion = {
  choices?: Array<{ message?: { content?: unknown } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string; type?: string; code?: string | number };
  errors?: Array<{ message?: string; code?: number }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function cloudflareMessageText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.flatMap((part) => isRecord(part) && part.type === "text" && typeof part.text === "string" ? [part.text] : []).join("");
  }
  return "";
}

export function isCloudflareModelId(value: string): boolean {
  return /^@cf\/[A-Za-z0-9][A-Za-z0-9._-]*(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)+$/.test(value);
}

export function isCloudflareApiToken(value: string): boolean {
  return value.length > 0 && value.length <= 2_048 && !/[\s\u0000-\u001f\u007f]/.test(value);
}

function cleanCatalogString(value: unknown, maximumLength: number): string | undefined {
  if (typeof value !== "string" || !value) return undefined;
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maximumLength);
  return clean || undefined;
}

function taskName(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (!isRecord(value)) return undefined;
  for (const key of ["name", "display_name", "displayName", "id"]) {
    if (typeof value[key] === "string") return value[key] as string;
  }
  return undefined;
}

function propertyMap(entry: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(entry.properties)) return {};
  return Object.fromEntries(entry.properties.flatMap((item) => {
    if (!isRecord(item) || typeof item.property_id !== "string" || !Object.hasOwn(item, "value")) return [];
    return [[item.property_id, item.value]];
  }));
}

function positiveNumber(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function providerError(response: Response, payload: CloudflareCompletion): ProviderError {
  const rootMessage = isRecord(payload.error) && typeof payload.error.message === "string" ? payload.error.message : undefined;
  const errorMessages = Array.isArray(payload.errors) ? payload.errors.flatMap((entry) => isRecord(entry) && typeof entry.message === "string" ? [entry.message] : []) : [];
  const detail = [rootMessage, ...errorMessages]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .slice(0, 500)
    .toLowerCase();
  if (/quota|neuron|billing|payment|daily limit|exhaust/.test(detail) && response.status !== 401) {
    return new ProviderError("Cloudflare Workers AI usage is unavailable because the account quota or billing limit has been reached. Check the Workers AI dashboard and account plan.", response.status === 402 ? 402 : 429, "rate-limit");
  }
  if (response.status === 401 || response.status === 403) {
    if (/quota|neuron|billing|payment|daily limit|exhaust/.test(detail)) {
      return new ProviderError("Cloudflare Workers AI usage is unavailable because the account quota or billing limit has been reached. Check the Workers AI dashboard and account plan.", response.status, "rate-limit");
    }
    return response.status === 401
      ? new ProviderError("Cloudflare rejected this API token. Check the token and its Workers AI access.", 401, "authentication")
      : new ProviderError("Cloudflare denied access to this account. Check the token permissions and account ID.", 403, "permission");
  }
  if (response.status === 429) {
    if (/quota|neuron|billing|daily|exhaust/.test(detail)) {
      return new ProviderError("Cloudflare Workers AI has reached an account quota. Check the dashboard; usage may resume after the daily reset or require a paid plan.", 429, "rate-limit");
    }
    return new ProviderError("Cloudflare Workers AI is rate limiting requests. Wait briefly and try again.", 429, "rate-limit");
  }
  if (response.status === 400 || response.status === 404) {
    if (/model|not found|unsupported/.test(detail)) {
      return new ProviderError("Cloudflare does not currently support the selected model for this account or chat endpoint. Refresh the model list and choose another listed model.", 400, "unsupported-model");
    }
    return new ProviderError("Cloudflare could not accept this chat request. Check the selected model and shorten the context if needed.", 400);
  }
  if (response.status === 402) {
    return new ProviderError("Cloudflare Workers AI requires an active billing method for this request. Check the account plan and model pricing.", 402, "account");
  }
  if (response.status >= 500 || response.status === 408) {
    return new ProviderError("Cloudflare Workers AI is temporarily unavailable or at capacity. Try again shortly.", 502, "provider");
  }
  return new ProviderError("Cloudflare Workers AI could not complete this request. Check the provider status and try again.", response.status || 502, "provider");
}

async function readResponse(response: Response): Promise<CloudflareCompletion> {
  if (!response.body) {
    if (!response.ok) return {};
    throw new ProviderError("Cloudflare returned an empty response.", 502, "invalid-response");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let size = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.byteLength;
    if (size > RESPONSE_LIMIT) {
      await reader.cancel();
      throw new ProviderError("Cloudflare returned a response larger than KATALYST can process.", 502, "invalid-response");
    }
    text += decoder.decode(part.value, { stream: true });
  }
  text += decoder.decode();
  try {
    const payload: unknown = JSON.parse(text);
    if (!isRecord(payload)) throw new Error("Unexpected response object");
    return payload as CloudflareCompletion;
  } catch {
    if (!response.ok) return {};
    throw new ProviderError("Cloudflare returned an unreadable response. Try again or choose another model.", 502, "invalid-response");
  }
}

function normalizedUsage(value: CloudflareCompletion["usage"]): ProviderUsage | undefined {
  if (!value) return undefined;
  const inputTokens = value.prompt_tokens;
  const outputTokens = value.completion_tokens;
  return {
    ...(typeof inputTokens === "number" && Number.isInteger(inputTokens) && inputTokens >= 0 ? { inputTokens } : {}),
    ...(typeof outputTokens === "number" && Number.isInteger(outputTokens) && outputTokens >= 0 ? { outputTokens } : {}),
  };
}

export const cloudflareProvider: ModelProvider = {
  id: "cloudflare",
  name: providerCatalog.cloudflare.name,
  models: [],
  async generate(input: GenerateInput) {
    const apiKey = getProviderApiKey("cloudflare", input.apiKey);
    const accountId = getCloudflareAccountId(input.cloudflareAccountId);
    if (!apiKey) throw new ProviderError("Add a Cloudflare API token in Settings or configure CLOUDFLARE_API_TOKEN on the server.", 503, "configuration");
    if (!isCloudflareApiToken(apiKey)) throw new ProviderError("The Cloudflare API token format is invalid. Enter a token without spaces or control characters.", 400, "configuration");
    if (!accountId || !/^[a-f\d]{32}$/i.test(accountId)) throw new ProviderError("Enter a valid 32-character Cloudflare account ID in Settings or configure CLOUDFLARE_ACCOUNT_ID on the server.", 400, "configuration");
    if (!isCloudflareModelId(input.model)) throw new ProviderError("Choose a compatible Cloudflare text-generation model from the current model list.", 400, "unsupported-model");
    const body = {
      model: input.model,
      ...(Number.isInteger(input.maxOutputTokens) && input.maxOutputTokens! > 0 ? { max_tokens: Math.min(input.maxOutputTokens!, 2048) } : {}),
      messages: [
        { role: "system" as const, content: providerInstructions("cloudflare", input.model, input.assistantSurface) },
        ...addWorkspaceContext(input.messages, input.context),
      ],
    };
    let response: Response;
    try {
      response = await fetch(`${CLOUDFLARE_API}/accounts/${accountId}/ai/v1/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: providerSignal(input.signal, 60_000),
        redirect: "error",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "TimeoutError") throw new ProviderError("Cloudflare Workers AI took too long to respond. Try again.", 504, "timeout");
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      throw new ProviderError("Could not reach Cloudflare Workers AI. Check the server connection and try again.", 502, "network");
    }
    const payload = await readResponse(response);
    if (!response.ok) throw providerError(response, payload);
    const text = cloudflareMessageText(payload.choices?.[0]?.message?.content).trim();
    if (!text) throw new ProviderError("Cloudflare returned an empty answer. Try again or choose another model.", 502, "invalid-response");
    return { text, usage: normalizedUsage(payload.usage) };
  },
};

export function cloudflareModelMetadata(entry: unknown, discoveredAt: number): ModelMetadata | null {
  if (!isRecord(entry)) return null;
  const id = typeof entry.name === "string" && entry.name.startsWith("@cf/") ? entry.name
    : typeof entry.id === "string" && entry.id.startsWith("@cf/") ? entry.id : "";
  if (!isCloudflareModelId(id)) return null;

  const task = taskName(entry.task);
  if (task && task.toLowerCase().replace(/[\s_-]/g, "") !== "textgeneration") return null;
  if (!task) {
    const properties = propertyMap(entry);
    const hints = [id, entry.name, entry.description, properties.task, properties.task_name]
      .filter((value): value is string => typeof value === "string").join(" ").toLowerCase();
    if (/(?:embedding|\bembed\b|\bbge[-/]|\bgte[-/]|text[-_ ]to[-_ ]image|image[-_ ]?(?:generation|generator|gen)|stable[- ]diffusion|\bflux[-/]|speech|\baudio\b|\btts\b|text[- ]to[- ]speech|automatic speech|transcri|\bwhisper\b|summari[sz]|classif|translation|\btranslate\b|rerank|object detection|image classification|music generation)/i.test(hints)) return null;
  }

  const displayName = cleanCatalogString(entry.display_name ?? entry.displayName ?? (entry.name === id ? undefined : entry.name), 160);
  const name = displayName || id.slice("@cf/".length).replace(/[-_/]+/g, " ");
  const description = cleanCatalogString(entry.description, 500);
  const properties = propertyMap(entry);
  const contextLimit = positiveNumber(entry.context_window ?? entry.contextWindow ?? entry.context_limit ?? properties.context_window ?? properties.contextWindow);
  return {
    providerId: "cloudflare",
    id,
    name: name.slice(0, 160) || id,
    ...(description ? { description } : {}),
    capabilities: ["text input", "text output", "Chat Completions"],
    ...(contextLimit ? { contextLimit } : {}),
    pricingStatus: "unknown",
    source: "cloudflare-models-api",
    namespace: "Cloudflare Workers AI",
    discoveredAt,
    credentialAccess: "listed-for-key",
  };
}
