import { providerCatalog, isSupportedModel } from "./catalog";
import { getProviderApiKey } from "./credentials";
import { addWorkspaceContext, providerInstructions } from "./prompt";
import { ProviderError, providerSignal, type GenerateResult, type ModelProvider } from "./types";

export { ProviderError } from "./types";

type ResponsesPayload = {
  output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string; refusal?: string }> }>;
  usage?: { input_tokens?: number; output_tokens?: number };
  error?: { message?: string; type?: string; code?: string };
};

export function parseOpenAIResponse(payload: ResponsesPayload): GenerateResult {
  const text = (payload.output ?? [])
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.type === "output_text" || part.type === "refusal")
    .map((part) => part.type === "refusal" ? part.refusal ?? "" : part.text ?? "")
    .join("")
    .trim();
  if (!text) throw new ProviderError("OpenAI returned an empty response. Try again or choose another model.", 502);
  const usage = payload.usage;
  return {
    text,
    ...(usage && (Number.isSafeInteger(usage.input_tokens) || Number.isSafeInteger(usage.output_tokens)) ? {
      usage: {
        ...(Number.isSafeInteger(usage.input_tokens) && (usage.input_tokens ?? -1) >= 0 ? { inputTokens: usage.input_tokens } : {}),
        ...(Number.isSafeInteger(usage.output_tokens) && (usage.output_tokens ?? -1) >= 0 ? { outputTokens: usage.output_tokens } : {}),
      },
    } : {}),
  };
}

export const openAIProvider: ModelProvider = {
  id: "openai",
  name: providerCatalog.openai.name,
  models: providerCatalog.openai.models,
  async generate({ model, messages, context, assistantSurface, apiKey: userApiKey, signal }) {
    if (!isSupportedModel("openai", model)) throw new ProviderError("Choose a supported OpenAI model from the model menu.", 400);
    const apiKey = getProviderApiKey("openai", userApiKey);
    if (!apiKey) throw new ProviderError("Add OPENAI_API_KEY or a session key in Settings to connect OpenAI.", 503);

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        input: addWorkspaceContext(messages, context).map((message) => ({ role: message.role, content: message.content })),
        instructions: providerInstructions("openai", model, assistantSurface),
        max_output_tokens: 1200,
        store: false,
      }),
      signal: providerSignal(signal, 45_000),
      redirect: "error",
    });

    const payload = (await response.json().catch(() => ({}))) as ResponsesPayload;
    if (!response.ok) {
      const code = payload.error?.code;
      if (response.status === 401 || response.status === 403) throw new ProviderError("OpenAI rejected the configured API key. Check that it is active and has API access.", response.status);
      if (response.status === 429) throw new ProviderError("OpenAI rate or usage limit reached. Check your provider account and try again later.", 429);
      if ((response.status === 400 || response.status === 404) && (code === "model_not_found" || payload.error?.message?.toLowerCase().includes("model"))) {
        throw new ProviderError("That OpenAI model is unavailable to this API key. Choose another supported model or check your provider access.", 400);
      }
      throw new ProviderError("OpenAI could not complete the request. Check the selected model and try again.", response.status >= 500 ? 502 : response.status);
    }
    return parseOpenAIResponse(payload);
  },
};
