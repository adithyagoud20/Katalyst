import { providerCatalog } from "./catalog";
import { getProviderApiKey } from "./credentials";
import { addWorkspaceContext, providerInstructions } from "./prompt";
import { ProviderError, providerSignal, type GenerateResult, type ModelProvider } from "./types";

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  error?: { code?: number; status?: string; message?: string };
};

export function parseGeminiResponse(payload: GeminiResponse): GenerateResult {
  const outputText = (payload.candidates ?? [])
    .flatMap((candidate) => candidate.content?.parts ?? [])
    .filter((part) => !part.thought && typeof part.text === "string")
    .map((part) => part.text ?? "")
    .join("")
    .trim();
  if (outputText) {
    const usage = payload.usageMetadata;
    return {
      text: outputText,
      ...(usage && (Number.isSafeInteger(usage.promptTokenCount) || Number.isSafeInteger(usage.candidatesTokenCount)) ? {
        usage: {
          ...(Number.isSafeInteger(usage.promptTokenCount) && (usage.promptTokenCount ?? -1) >= 0 ? { inputTokens: usage.promptTokenCount } : {}),
          ...(Number.isSafeInteger(usage.candidatesTokenCount) && (usage.candidatesTokenCount ?? -1) >= 0 ? { outputTokens: usage.candidatesTokenCount } : {}),
        },
      } : {}),
    };
  }
  if (payload.promptFeedback?.blockReason || payload.candidates?.some((candidate) => candidate.finishReason === "SAFETY")) {
    throw new ProviderError("Gemini blocked this response. Rephrase the request and try again.", 422);
  }
  throw new ProviderError("Gemini returned an empty response. Try again or choose another model.", 502);
}

function mapGeminiError(response: Response, payload: GeminiResponse): ProviderError {
  const status = payload.error?.status?.toUpperCase();
  const message = payload.error?.message?.toLowerCase() ?? "";
  if (response.status === 401 || status === "UNAUTHENTICATED") return new ProviderError("Gemini rejected this API key. Check that it is active and has Gemini API access.", 401);
  if (response.status === 403 || status === "PERMISSION_DENIED") return new ProviderError("Gemini denied access to this model or key. Check model availability and key permissions.", 403);
  if (response.status === 429 || status === "RESOURCE_EXHAUSTED") {
    return new ProviderError("Gemini rate or quota limit reached. Check your Google AI Studio limits and try again later.", 429);
  }
  if (response.status === 404 || status === "NOT_FOUND" || message.includes("model")) {
    return new ProviderError("That Gemini model is unavailable. Choose a supported model or check your API access.", 400);
  }
  if (response.status === 400) return new ProviderError("Gemini rejected the request. Check the message and selected model, then try again.", 400);
  return new ProviderError("Gemini could not complete the request. Try again after checking the provider status.", response.status >= 500 ? 502 : response.status);
}

export const geminiProvider: ModelProvider = {
  id: "gemini",
  name: providerCatalog.gemini.name,
  models: providerCatalog.gemini.models,
  async generate({ model, messages, context, assistantSurface, apiKey: userApiKey, maxOutputTokens, signal }) {
    const apiKey = getProviderApiKey("gemini", userApiKey);
    if (!apiKey) throw new ProviderError("Add GEMINI_API_KEY or a session key in Settings to connect Gemini.", 503);
    if (!model || model.length > 200 || !/^[A-Za-z0-9._-]+$/.test(model)) throw new ProviderError("Choose a valid Gemini model ID from the model catalog.", 400);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: providerInstructions("gemini", model, assistantSurface) }] },
        contents: addWorkspaceContext(messages, context).map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
        generationConfig: { maxOutputTokens: Number.isInteger(maxOutputTokens) && (maxOutputTokens ?? 0) > 0 ? Math.min(maxOutputTokens!, 2048) : 1200 },
      }),
      signal: providerSignal(signal, 45_000),
      redirect: "error",
    });

    const payload = (await response.json().catch(() => ({}))) as GeminiResponse;
    if (!response.ok) throw mapGeminiError(response, payload);
    return parseGeminiResponse(payload);
  },
};
