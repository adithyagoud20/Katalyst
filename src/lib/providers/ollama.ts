import { providerCatalog, type ModelMetadata } from "./catalog";
import { DEFAULT_OLLAMA_BASE_URL, MAX_OLLAMA_URL_LENGTH } from "./constants";
import { addWorkspaceContext, providerInstructions } from "./prompt";
import { ProviderError, providerSignal, type GenerateResult, type ModelProvider } from "./types";

function isLoopbackHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}

export function normalizeOllamaBaseUrl(value?: string): string {
  const input = (value?.trim() || DEFAULT_OLLAMA_BASE_URL).slice(0, MAX_OLLAMA_URL_LENGTH + 1);
  if (input.length > MAX_OLLAMA_URL_LENGTH) throw new ProviderError("The Ollama address is too long.", 400);
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new ProviderError("Enter an Ollama address such as http://localhost:11434.", 400);
  }
  const authority = input.match(/^[A-Za-z][A-Za-z0-9+.-]*:\/\/([^/?#]*)/)?.[1] ?? "";
  const explicitPort = authority.startsWith("[") ? authority.match(/^\[[^\]]+\]:(\d+)$/)?.[1] : authority.match(/:(\d+)$/)?.[1];
  if (url.protocol !== "http:" || !isLoopbackHostname(url.hostname) || (explicitPort !== undefined && explicitPort !== "11434") || (url.port && url.port !== "11434") || url.username || url.password || !["", "/"].includes(url.pathname) || url.search || url.hash) {
    throw new ProviderError("Ollama must use a loopback address on port 11434. Remote and custom network endpoints are blocked.", 400);
  }
  const host = url.hostname.toLowerCase();
  return `http://${host}:11434`;
}

export function isLocalOllamaRequest(request: Request): boolean {
  const url = new URL(request.url);
  if (!isLoopbackHostname(url.hostname)) return false;
  const hostHeader = request.headers.get("host");
  if (hostHeader) {
    try {
      if (new URL(`http://${hostHeader}`).host.toLowerCase() !== url.host.toLowerCase()) return false;
    } catch {
      return false;
    }
  }
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin.toLowerCase() !== url.origin.toLowerCase()) return false;
    } catch {
      return false;
    }
  }
  return true;
}

type OllamaTag = {
  name?: string;
  size?: number;
  details?: { parameter_size?: string; quantization_level?: string; family?: string; families?: string[] };
};

function safeText(value: unknown, maximum: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maximum);
  return text || undefined;
}

async function readTags(response: Response): Promise<{ models?: unknown }> {
  if (!response.body) throw new ProviderError("Ollama returned an empty model list.", 502);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let raw = "";
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 2_000_000) {
      await reader.cancel();
      throw new ProviderError("The Ollama model list is too large to load safely.", 502);
    }
    raw += decoder.decode(value, { stream: true });
  }
  raw += decoder.decode();
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected an object");
    return value as { models?: unknown };
  } catch {
    throw new ProviderError("Ollama returned an unreadable model list.", 502);
  }
}

function mapOllamaError(response: Response, message?: string): ProviderError {
  if (response.status === 404 || /model .* not found|model not found/i.test(message ?? "")) {
    return new ProviderError("Ollama could not find that model. Pull it with the Ollama app or CLI, then refresh the model list.", 404);
  }
  if (response.status === 400) return new ProviderError("Ollama rejected the request. Check the selected model and try again.", 400);
  if (response.status >= 500) return new ProviderError("The Ollama server reported an error. Check that it is running and try again.", 502);
  return new ProviderError("Ollama could not complete the request. Check the local server and try again.", response.status || 502);
}

export async function discoverOllamaModels(baseUrl?: string): Promise<ModelMetadata[]> {
  const base = normalizeOllamaBaseUrl(baseUrl);
  let response: Response;
  try {
    response = await fetch(`${base}/api/tags`, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8_000) });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") throw new ProviderError("Ollama did not respond within 8 seconds. Check that the local server is running.", 504);
    throw new ProviderError("Could not reach Ollama at this local address. Start Ollama and try refreshing models.", 503);
  }
  if (!response.ok) throw mapOllamaError(response);
  const payload = await readTags(response);
  if (payload.models !== undefined && !Array.isArray(payload.models)) throw new ProviderError("Ollama returned an invalid model list.", 502);
  const discoveredAt = Date.now();
  const models = (payload.models ?? []).flatMap((value): ModelMetadata[] => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return [];
    const model = value as OllamaTag;
    const id = safeText(model.name, 200);
    if (!id || !/^[A-Za-z0-9._:-]+$/.test(id)) return [];
    const details = model.details && typeof model.details === "object" ? model.details : {};
    const sizeBytes = typeof model.size === "number" && Number.isSafeInteger(model.size) && model.size > 0 ? model.size : undefined;
    const parameterSize = safeText(details.parameter_size, 32);
    const quantization = safeText(details.quantization_level, 32);
    const family = safeText(details.family, 64);
    const info = [parameterSize, quantization, family].filter(Boolean).join(" · ");
    return [{
      providerId: "ollama",
      id,
      name: id,
      ...(info ? { description: info } : {}),
      capabilities: ["text generation", "local"],
      pricingStatus: "unknown",
      source: "ollama-tags-api",
      namespace: "Local Ollama",
      discoveredAt,
      credentialAccess: "not-verified",
      local: true,
      ...(sizeBytes ? { sizeBytes } : {}),
      ...(parameterSize ? { parameterSize } : {}),
      ...(quantization ? { quantization } : {}),
      ...(family ? { family } : {}),
    }];
  });
  return [...new Map(models.map((model) => [model.id, model])).values()];
}

type OllamaChatResponse = {
  model?: string;
  message?: { content?: string };
  done?: boolean;
  prompt_eval_count?: number;
  eval_count?: number;
  error?: string;
};

export function parseOllamaResponse(payload: OllamaChatResponse): GenerateResult {
  const text = typeof payload.message?.content === "string" ? payload.message.content.trim() : "";
  if (!text) throw new ProviderError("Ollama returned an empty response. Check the model and try again.", 502);
  const usage = (Number.isSafeInteger(payload.prompt_eval_count) && (payload.prompt_eval_count ?? -1) >= 0)
    || (Number.isSafeInteger(payload.eval_count) && (payload.eval_count ?? -1) >= 0)
    ? {
        ...(Number.isSafeInteger(payload.prompt_eval_count) && (payload.prompt_eval_count ?? -1) >= 0 ? { inputTokens: payload.prompt_eval_count } : {}),
        ...(Number.isSafeInteger(payload.eval_count) && (payload.eval_count ?? -1) >= 0 ? { outputTokens: payload.eval_count } : {}),
      }
    : undefined;
  return { text, ...(usage ? { usage } : {}) };
}

export const ollamaProvider: ModelProvider = {
  id: "ollama",
  name: providerCatalog.ollama.name,
  models: [],
  async generate({ model, messages, context, assistantSurface, ollamaBaseUrl, signal }) {
    if (!model || model.length > 200 || !/^[A-Za-z0-9._:-]+$/.test(model)) throw new ProviderError("Choose a valid model from the Ollama model list.", 400);
    const base = normalizeOllamaBaseUrl(ollamaBaseUrl);
    let response: Response;
    try {
      response = await fetch(`${base}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: providerInstructions("ollama", model, assistantSurface) },
            ...addWorkspaceContext(messages, context),
          ],
          stream: false,
          options: { num_predict: 1_200 },
        }),
        signal: providerSignal(signal, 120_000),
        redirect: "error",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "TimeoutError") throw new ProviderError("Ollama took too long to respond. The first response can take longer while a model loads; try again or choose a smaller model.", 504);
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      throw new ProviderError("Could not reach Ollama. Check that the local server is running and try again.", 503);
    }
    const payload = await response.json().catch(() => ({})) as OllamaChatResponse;
    if (!response.ok) throw mapOllamaError(response, payload.error);
    return parseOllamaResponse(payload);
  },
};
