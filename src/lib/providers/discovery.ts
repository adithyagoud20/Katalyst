import { createHash } from "node:crypto";
import { freeRouterModel, providerCatalog, type ModelDiscoveryDiagnostic, type ModelMetadata, type ProviderId } from "./catalog";
import { cloudflareModelMetadata, isCloudflareApiToken } from "./cloudflare";
import { ProviderError } from "./types";
import { discoverOllamaModels, normalizeOllamaBaseUrl } from "./ollama";

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 32;
const MAX_CATALOG_BYTES = 3_000_000;
const recommendedGeminiModelIds = new Set(["gemini-3.8-flash", "gemini-2.5-pro", "gemini-3.5-flash-lite"]);
const cache = new Map<string, { models: ModelMetadata[]; diagnostic?: ModelDiscoveryDiagnostic; refreshedAt: number; expiresAt: number }>();

export type ModelDiscoveryResult = { provider: ProviderId; models: ModelMetadata[]; diagnostic?: ModelDiscoveryDiagnostic; refreshedAt: number; cached: boolean };

type GeminiCatalogResponse = {
  models?: Array<{
    name?: string;
    displayName?: string;
    description?: string;
    inputTokenLimit?: number;
    outputTokenLimit?: number;
    supportedGenerationMethods?: string[];
  }>;
  nextPageToken?: string;
  error?: { code?: number; status?: string; message?: string };
};

type OpenRouterCatalogResponse = {
  data?: Array<{
    id?: string;
    name?: string;
    description?: string;
    context_length?: number;
    architecture?: { input_modalities?: string[]; output_modalities?: string[] };
    pricing?: { prompt?: string; completion?: string };
    supported_parameters?: string[];
  }>;
  error?: { message?: string; code?: number };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function cacheKey(provider: ProviderId, apiKey: string, accountId = ""): string {
  return `${provider}:${createHash("sha256").update(`${accountId}:${apiKey}`).digest("hex")}`;
}

function cacheResult(key: string, provider: ProviderId, models: ModelMetadata[], diagnostic?: ModelDiscoveryDiagnostic): ModelDiscoveryResult {
  const now = Date.now();
  for (const [cachedKey, entry] of cache) if (entry.expiresAt <= now) cache.delete(cachedKey);
  cache.delete(key);
  cache.set(key, { models, diagnostic, refreshedAt: now, expiresAt: now + CACHE_TTL_MS });
  while (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value as string);
  return { provider, models, diagnostic, refreshedAt: now, cached: false };
}

async function readBoundedJson<T>(response: Response): Promise<T> {
  if (!response.body) throw new ProviderError("The provider returned an empty model catalog.", 502);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let bytes = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    bytes += chunk.value.byteLength;
    if (bytes > MAX_CATALOG_BYTES) {
      await reader.cancel();
      throw new ProviderError("The provider model catalog was too large to load safely.", 502);
    }
    text += decoder.decode(chunk.value, { stream: true });
  }
  text += decoder.decode();
  try {
    const payload: unknown = JSON.parse(text);
    if (!isRecord(payload)) throw new Error("Expected a JSON object");
    return payload as T;
  } catch {
    throw new ProviderError("The provider returned an unreadable model catalog.", 502);
  }
}

function safeCatalogText(value: unknown, maximumLength: number): string | undefined {
  if (typeof value !== "string" || !value) return undefined;
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maximumLength);
  return clean || undefined;
}

function uniqueModels(models: ModelMetadata[]): ModelMetadata[] {
  const byId = new Map<string, ModelMetadata>();
  for (const model of models) byId.set(model.id, model);
  return [...byId.values()];
}

function geminiTextModel(model: unknown, discoveredAt: number): ModelMetadata | null {
  if (!isRecord(model)) return null;
  const resourceName = model.name;
  if (typeof resourceName !== "string" || !resourceName.startsWith("models/")) return null;
  const methods = Array.isArray(model.supportedGenerationMethods) ? model.supportedGenerationMethods.filter((value): value is string => typeof value === "string") : [];
  if (!methods.includes("generateContent") || typeof model.outputTokenLimit !== "number" || !Number.isFinite(model.outputTokenLimit) || model.outputTokenLimit <= 0) return null;
  // These APIs can return non-chat generation models as well. Exclude known non-text task families conservatively.
  if (/(?:embedding|\bembed\b|\btts\b|text-to-speech|imagen|\bimage\b|\bveo\b|\baudio\b|\blive\b|\bmusic\b|transcri|rerank|robotics|lyria)/i.test(`${resourceName} ${model.displayName ?? ""}`)) return null;
  const id = resourceName.slice("models/".length);
  if (!/^[A-Za-z0-9._-]{1,200}$/.test(id)) return null;
  const normalizedId = id.toLowerCase();
  const knownRetired = new Set([
    "gemini-2.0-flash", "gemini-2.0-flash-001", "gemini-2.0-flash-lite", "gemini-2.0-flash-lite-001",
    "gemini-3-flash-preview", "gemini-3-pro-preview", "gemini-3.1-flash-lite-preview",
  ]);
  if (knownRetired.has(normalizedId) || /(?:preview|experimental|(?:^|[-])exp(?:[-.]|$)|latest)$/.test(normalizedId)) return null;
  const displayName = safeCatalogText(model.displayName, 160);
  const description = safeCatalogText(model.description, 500);
  return {
    providerId: "gemini",
    id,
    name: displayName || id,
    ...(description ? { description } : {}),
    capabilities: ["text input", "text output", "generateContent"],
    ...(typeof model.inputTokenLimit === "number" && Number.isFinite(model.inputTokenLimit) && model.inputTokenLimit > 0 ? { contextLimit: model.inputTokenLimit } : {}),
    pricingStatus: "unknown",
    source: "gemini-models-api",
    namespace: "Google",
    discoveredAt,
    credentialAccess: "listed-for-key",
    recommended: recommendedGeminiModelIds.has(id.toLowerCase()),
  };
}

async function discoverGemini(apiKey: string): Promise<ModelMetadata[]> {
  const discoveredAt = Date.now();
  const models: ModelMetadata[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < 10; page += 1) {
    const url = new URL("https://generativelanguage.googleapis.com/v1beta/models");
    url.searchParams.set("pageSize", "1000");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const response = await fetch(url, {
      headers: { "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(20_000),
      redirect: "error",
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new ProviderError("Gemini rejected this key while listing models. Check the key and its API access.", response.status);
      if (response.status === 429) throw new ProviderError("Gemini model discovery is rate limited. Try refreshing later.", 429);
      throw new ProviderError("Gemini could not load its model catalog. Check the key and try again.", response.status >= 500 ? 502 : 400);
    }
    const payload = await readBoundedJson<GeminiCatalogResponse>(response);
    if (!Array.isArray(payload.models)) throw new ProviderError("Gemini returned an invalid model catalog.", 502);
    for (const model of payload.models) {
      const compatible = geminiTextModel(model, discoveredAt);
      if (compatible) models.push(compatible);
    }
    if (payload.nextPageToken !== undefined && typeof payload.nextPageToken !== "string") throw new ProviderError("Gemini returned an invalid page token.", 502);
    pageToken = payload.nextPageToken;
    if (!pageToken) return uniqueModels(models).sort((a, b) => Number(Boolean(b.recommended)) - Number(Boolean(a.recommended)) || a.name.localeCompare(b.name));
  }
  throw new ProviderError("Gemini returned too many model catalog pages to process safely.", 502);
}

function parsePerTokenPrice(value: unknown): number | undefined {
  if ((typeof value !== "string" && typeof value !== "number") || String(value).trim() === "") return undefined;
  const perToken = Number(value);
  if (!Number.isFinite(perToken) || perToken < 0) return undefined;
  return perToken * 1_000_000;
}

function openRouterTextModel(model: unknown, discoveredAt: number): ModelMetadata | null {
  if (!isRecord(model) || typeof model.id !== "string" || model.id.length > 240 || !/^[A-Za-z0-9._:/-]+$/.test(model.id)) return null;
  const architecture = isRecord(model.architecture) ? model.architecture : {};
  const inputModalities = Array.isArray(architecture.input_modalities) ? architecture.input_modalities.filter((value): value is string => typeof value === "string") : [];
  const outputModalities = Array.isArray(architecture.output_modalities) ? architecture.output_modalities.filter((value): value is string => typeof value === "string") : [];
  if (!inputModalities.includes("text") || !outputModalities.includes("text")) return null;
  const name = safeCatalogText(model.name, 160);
  const description = safeCatalogText(model.description, 500);
  if (!name) return null;

  const pricing = isRecord(model.pricing) ? model.pricing : {};
  const inputPerMillion = parsePerTokenPrice(pricing.prompt);
  const outputPerMillion = parsePerTokenPrice(pricing.completion);
  const hasInputPrice = inputPerMillion !== undefined;
  const hasOutputPrice = outputPerMillion !== undefined;
  const freeVariant = model.id.endsWith(":free");
  const pricingStatus = freeVariant || (hasInputPrice && hasOutputPrice && inputPerMillion === 0 && outputPerMillion === 0)
    ? "free"
    : hasInputPrice && hasOutputPrice
      ? "paid"
      : "unknown";
  const parameters = Array.isArray(model.supported_parameters) ? model.supported_parameters.filter((value): value is string => typeof value === "string") : [];
  const capabilities = ["text input", "text output"];
  if (parameters.includes("tools") || parameters.includes("tool_choice")) capabilities.push("tool calling");
  if (parameters.includes("response_format")) capabilities.push("structured output");
  const namespace = model.id.split("/")[0];
  return {
    providerId: "openrouter",
    id: model.id,
    name,
    ...(description ? { description } : {}),
    capabilities,
    ...(typeof model.context_length === "number" && Number.isFinite(model.context_length) && model.context_length > 0 ? { contextLimit: model.context_length } : {}),
    pricing: { ...(hasInputPrice ? { inputPerMillion } : {}), ...(hasOutputPrice ? { outputPerMillion } : {}) },
    pricingStatus,
    source: "openrouter-models-api",
    namespace,
    discoveredAt,
    credentialAccess: "not-verified",
  };
}

async function discoverOpenRouter(apiKey: string): Promise<ModelMetadata[]> {
  const url = new URL("https://openrouter.ai/api/v1/models");
  url.searchParams.set("input_modalities", "text");
  url.searchParams.set("output_modalities", "text");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(20_000),
    redirect: "error",
  });
  const payload = await readBoundedJson<OpenRouterCatalogResponse>(response);
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new ProviderError("OpenRouter rejected this key while listing models. Check the key and its API access.", response.status);
    if (response.status === 429) throw new ProviderError("OpenRouter model discovery is rate limited. Try refreshing later.", 429);
    throw new ProviderError("OpenRouter could not load its model catalog. Check the key and try again.", response.status >= 500 ? 502 : 400);
  }
  const discoveredAt = Date.now();
  if (payload.data !== undefined && !Array.isArray(payload.data)) throw new ProviderError("OpenRouter returned an invalid model catalog.", 502);
  const models = (payload.data ?? []).flatMap((model) => {
    const compatible = openRouterTextModel(model, discoveredAt);
    return compatible ? [compatible] : [];
  });
  return uniqueModels([{ ...freeRouterModel, discoveredAt }, ...models]);
}

type CloudflareCatalogPage = {
  success?: unknown;
  errors?: unknown;
  messages?: unknown;
  result?: unknown;
  result_info?: unknown;
};

function cloudflareError(payload: CloudflareCatalogPage, status: number): ProviderError {
  if (status === 401) return new ProviderError("Cloudflare rejected this API token. Check the token and its Workers AI access.", 401, "authentication");
  if (status === 403) return new ProviderError("Cloudflare denied access to this account. Check the token permissions and account ID.", 403, "permission");
  if (status === 429) return new ProviderError("Cloudflare model discovery is rate limited. Wait briefly and refresh again.", 429, "rate-limit");
  if (status === 408) return new ProviderError("Cloudflare model discovery timed out. Try again.", 504, "timeout");
  if (status >= 500) return new ProviderError("Cloudflare model discovery is temporarily unavailable. Try again shortly.", 502, "provider");

  const details = Array.isArray(payload.errors) ? payload.errors.flatMap((item) => isRecord(item) && typeof item.message === "string" ? [item.message] : []).join(" ").toLowerCase() : "";
  if (/auth|token|credential/.test(details)) return new ProviderError("Cloudflare rejected this API token. Check the token and its Workers AI access.", 401, "authentication");
  if (/permission|forbidden|access denied/.test(details)) return new ProviderError("Cloudflare denied access to this account. Check the token permissions and account ID.", 403, "permission");
  if (/account|not found|unknown account/.test(details)) return new ProviderError("Cloudflare could not find or access this account. Check the account ID.", 400, "account");
  return new ProviderError("Cloudflare could not load its Workers AI model catalog. Check the account configuration and try again.", status >= 400 ? status : 502, "account");
}

function cloudflareResultInfo(value: unknown): { page?: number; perPage?: number; totalCount?: number } {
  if (!isRecord(value)) return {};
  const numberValue = (item: unknown) => typeof item === "number" && Number.isInteger(item) && item >= 0 ? item : undefined;
  return {
    page: numberValue(value.page),
    perPage: numberValue(value.per_page),
    totalCount: numberValue(value.total_count),
  };
}

async function discoverCloudflare(apiKey: string, accountId: string): Promise<{ models: ModelMetadata[]; diagnostic: ModelDiscoveryDiagnostic }> {
  if (!accountId) throw new ProviderError("Add a Cloudflare account ID before loading models.", 503, "configuration");
  if (!/^[a-f\d]{32}$/i.test(accountId)) throw new ProviderError("Enter a valid 32-character Cloudflare account ID before loading models.", 400, "configuration");
  const entries: unknown[] = [];
  const pageSize = 100;
  const maxPages = 10;
  for (let page = 1; page <= maxPages; page += 1) {
    const url = new URL(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/models/search`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(pageSize));
    url.searchParams.set("hide_experimental", "true");
    url.searchParams.set("include_deprecated", "false");
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(20_000),
        redirect: "error",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "TimeoutError") throw new ProviderError("Cloudflare model discovery timed out. Try again.", 504, "timeout");
      throw new ProviderError("Could not reach Cloudflare model discovery. Check the server connection and try again.", 502, "network");
    }
    let payload: CloudflareCatalogPage;
    try {
      payload = await readBoundedJson(response);
    } catch (error) {
      if (!response.ok) throw cloudflareError({}, response.status);
      throw new ProviderError(error instanceof Error ? error.message : "Cloudflare returned an unreadable model catalog.", 502, "invalid-response");
    }
    if (!response.ok) throw cloudflareError(payload, response.status);
    if (typeof payload.success !== "boolean" || !Array.isArray(payload.errors) || !Array.isArray(payload.messages) || !Array.isArray(payload.result)) {
      throw new ProviderError("Cloudflare returned an invalid model catalog response.", 502, "invalid-response");
    }
    if (!payload.success) throw cloudflareError(payload, response.status);
    entries.push(...payload.result);
    const pageInfo = cloudflareResultInfo(payload.result_info);
    if (pageInfo.totalCount !== undefined && entries.length >= pageInfo.totalCount) break;
    if (payload.result.length < pageSize) break;
    if (page === maxPages) throw new ProviderError("Cloudflare returned too many model catalog pages to process safely.", 502, "invalid-response");
  }

  const discoveredAt = Date.now();
  const compatible = entries.flatMap((entry) => {
    const model = cloudflareModelMetadata(entry, discoveredAt);
    return model ? [model] : [];
  });
  const models = uniqueModels(compatible).sort((a, b) => a.name.localeCompare(b.name));
  const diagnostic: ModelDiscoveryDiagnostic = {
    sourceCount: entries.length,
    compatibleCount: models.length,
    excludedCount: Math.max(0, entries.length - models.length),
    message: entries.length === 0
      ? "Cloudflare returned an empty model catalog for this account."
      : models.length === 0
        ? `Cloudflare returned ${entries.length} catalog entries, but none could be confirmed as text-generation models for Chat Completions.`
        : `${models.length} of ${entries.length} Cloudflare catalog entries support text generation through Chat Completions.`,
  };
  return { models, diagnostic };
}

export async function discoverModels(
  provider: ProviderId,
  apiKey: string | undefined,
  options: { refresh?: boolean; baseUrl?: string; accountId?: string } = {},
): Promise<ModelDiscoveryResult> {
  if (provider === "ollama") {
    const models = await discoverOllamaModels(normalizeOllamaBaseUrl(options.baseUrl));
    return { provider, models, refreshedAt: Date.now(), cached: false };
  }
  if (!providerCatalog[provider].dynamicModels) {
    return { provider, models: [...providerCatalog[provider].models], refreshedAt: Date.now(), cached: false };
  }
  if (!apiKey && provider === "openrouter") {
    return { provider, models: [{ ...freeRouterModel }], refreshedAt: Date.now(), cached: false };
  }
  if (!apiKey) throw new ProviderError(`Add ${providerCatalog[provider].keyEnv} or a session key before loading models.`, 503, "configuration");
  if (provider === "cloudflare" && !isCloudflareApiToken(apiKey)) throw new ProviderError("The Cloudflare API token format is invalid. Enter a token without spaces or control characters.", 400, "configuration");
  if (provider === "cloudflare" && !options.accountId) throw new ProviderError("Add CLOUDFLARE_ACCOUNT_ID and a Cloudflare API token before loading models.", 503, "configuration");
  const key = cacheKey(provider, apiKey, options.accountId);
  const now = Date.now();
  const cached = cache.get(key);
  if (!options.refresh && cached && cached.expiresAt > now) return { provider, models: cached.models, diagnostic: cached.diagnostic, refreshedAt: cached.refreshedAt, cached: true };

  const discovery = provider === "cloudflare"
    ? await discoverCloudflare(apiKey, options.accountId ?? "")
    : { models: provider === "gemini" ? await discoverGemini(apiKey) : await discoverOpenRouter(apiKey) };
  const result = cacheResult(key, provider, discovery.models, "diagnostic" in discovery ? discovery.diagnostic : undefined);
  return { ...result, provider };
}

export function clearModelDiscoveryCache(): void {
  cache.clear();
}
