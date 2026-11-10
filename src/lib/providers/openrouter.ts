import { freeRouterModel, providerCatalog } from "./catalog";
import { getProviderApiKey } from "./credentials";
import { addWorkspaceContext, providerInstructions } from "./prompt";
import { ProviderError, providerSignal, type GenerateResult, type ModelProvider } from "./types";

type OpenRouterResponse = {
  choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
  error?: { message?: string; code?: number };
};

export function parseOpenRouterResponse(payload: OpenRouterResponse): GenerateResult {
  const content = payload.choices?.[0]?.message?.content;
  const text = typeof content === "string"
    ? content
    : (content ?? []).filter((part) => part.type === "text" && typeof part.text === "string").map((part) => part.text ?? "").join("");
  if (!text.trim()) throw new ProviderError("OpenRouter returned an empty response. Try again or choose another model.", 502);
  const usage = payload.usage;
  return {
    text: text.trim(),
    ...(usage && (Number.isSafeInteger(usage.prompt_tokens) || Number.isSafeInteger(usage.completion_tokens) || (typeof usage.cost === "number" && Number.isFinite(usage.cost) && usage.cost >= 0)) ? {
      usage: {
        ...(Number.isSafeInteger(usage.prompt_tokens) && (usage.prompt_tokens ?? -1) >= 0 ? { inputTokens: usage.prompt_tokens } : {}),
        ...(Number.isSafeInteger(usage.completion_tokens) && (usage.completion_tokens ?? -1) >= 0 ? { outputTokens: usage.completion_tokens } : {}),
        ...(typeof usage.cost === "number" && Number.isFinite(usage.cost) && usage.cost >= 0 ? { costUsd: usage.cost } : {}),
      },
    } : {}),
  };
}

function mapError(response: Response, payload: OpenRouterResponse): ProviderError {
  if (response.status === 401) return new ProviderError("OpenRouter rejected this API key. Check that it is active and has API access.", 401);
  if (response.status === 403) return new ProviderError("OpenRouter denied access to this model or key. Check model availability and key permissions.", 403);
  if (response.status === 402) return new ProviderError("OpenRouter needs available credits for this request. Check the selected model's price and your account balance.", 402);
  if (response.status === 429) return new ProviderError("OpenRouter rate or quota limit reached. Try again later or check your account limits.", 429);
  if (response.status === 404 || /model/i.test(payload.error?.message ?? "")) return new ProviderError("OpenRouter cannot access the selected model. Refresh the catalog and choose a listed model.", 400);
  return new ProviderError("OpenRouter could not complete the request. Try again after checking the provider status.", response.status >= 500 ? 502 : response.status);
}

export const openRouterProvider: ModelProvider = {
  id: "openrouter",
  name: providerCatalog.openrouter.name,
  models: [freeRouterModel],
  async generate({ model, messages, context, assistantSurface, apiKey: userApiKey, signal }) {
    const apiKey = getProviderApiKey("openrouter", userApiKey);
    if (!apiKey) throw new ProviderError("Add OPENROUTER_API_KEY or a session key in Settings to connect OpenRouter.", 503);
    if (!model || model.length > 240 || !/^[A-Za-z0-9._:/-]+$/.test(model)) throw new ProviderError("Choose a valid OpenRouter model ID from the model catalog.", 400);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: providerInstructions("openrouter", model, assistantSurface) },
          ...addWorkspaceContext(messages, context),
        ],
        max_tokens: 1200,
        stream: false,
      }),
      signal: providerSignal(signal, 45_000),
      redirect: "error",
    });

    const payload = (await response.json().catch(() => ({}))) as OpenRouterResponse;
    if (!response.ok) throw mapError(response, payload);
    return parseOpenRouterResponse(payload);
  },
};
