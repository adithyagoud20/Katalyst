import { z } from "zod";
import { getProvider } from "@/lib/providers";
import { isProviderId, isSupportedModel, providerCatalog } from "@/lib/providers/catalog";
import { discoverModels } from "@/lib/providers/discovery";
import { getCloudflareAccountId, getProviderApiKey, isSecureSessionKeyRequest, MAX_SESSION_KEY_LENGTH, SESSION_KEY_HEADER } from "@/lib/providers/credentials";
import { ProviderError } from "@/lib/providers/types";
import { CLOUDFLARE_ACCOUNT_HEADER, DEFAULT_OLLAMA_BASE_URL, MAX_OLLAMA_URL_LENGTH, OLLAMA_URL_HEADER } from "@/lib/providers/constants";
import { isLocalOllamaRequest } from "@/lib/providers/ollama";

const messageSchema = z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(8_000) });
const requestSchema = z.object({
  provider: z.string().refine(isProviderId),
  model: z.string().min(1).max(240),
  assistantSurface: z.enum(["workspace", "kat"]).optional(),
  messages: z.array(messageSchema).min(1).max(20),
  context: z.string().max(24_000).optional(),
});

export async function POST(request: Request) {
  const rawSessionKey = request.headers.get(SESSION_KEY_HEADER);
  const rawOllamaUrl = request.headers.get(OLLAMA_URL_HEADER);
  const rawCloudflareAccountId = request.headers.get(CLOUDFLARE_ACCOUNT_HEADER);
  if (rawOllamaUrl && rawOllamaUrl.length > MAX_OLLAMA_URL_LENGTH) return Response.json({ error: "The Ollama address is too long." }, { status: 400 });
  if (rawSessionKey && rawSessionKey.length > MAX_SESSION_KEY_LENGTH) return Response.json({ error: "The session API key is too long." }, { status: 400 });
  if (rawSessionKey && !isSecureSessionKeyRequest(request)) {
    return Response.json({ error: "Session API keys can only be sent over HTTPS outside localhost." }, { status: 400 });
  }
  if (rawCloudflareAccountId && rawCloudflareAccountId.length > 128) return Response.json({ error: "The Cloudflare account ID is too long." }, { status: 400 });

  const maxBytes = 192_000;
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maxBytes) return Response.json({ error: "Request is too large. Shorten the message or reduce selected skill instructions." }, { status: 413 });

  let raw: unknown;
  try {
    if (!request.body) throw new Error("Missing body");
    const reader = request.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    let bytes = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        return Response.json({ error: "Request is too large. Shorten the message or reduce selected skill instructions." }, { status: 413 });
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    raw = JSON.parse(text);
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Check the message, provider, model, or workspace context and try again." }, { status: 400 });
  const input = parsed.data;
  const inputCharacters = input.messages.reduce((total, message) => total + message.content.length, 0) + (input.context?.length ?? 0);
  if (inputCharacters > 44_000) {
    return Response.json({ error: "Conversation and workspace context are limited to 44,000 characters per request." }, { status: 413 });
  }
  if (!isProviderId(input.provider)) return Response.json({ error: "Choose a supported provider." }, { status: 400 });
  if (input.provider === "ollama" && !isLocalOllamaRequest(request)) {
    return Response.json({ error: "Ollama access is available only from a local KATALYST instance. Do not expose local inference to public users." }, { status: 403 });
  }
  if (input.provider === "ollama" && rawSessionKey) return Response.json({ error: "Ollama uses local inference and does not accept cloud API keys." }, { status: 400 });
  if (input.provider !== "cloudflare" && rawCloudflareAccountId) return Response.json({ error: "A Cloudflare account ID can only be used with Cloudflare Workers AI." }, { status: 400 });
  const provider = getProvider(input.provider);
  const apiKey = input.provider === "ollama" ? undefined : getProviderApiKey(input.provider, rawSessionKey);
  const cloudflareAccountId = input.provider === "cloudflare" ? getCloudflareAccountId(rawCloudflareAccountId) : undefined;
  try {
    const availableModels = isSupportedModel(input.provider, input.model)
      ? null
      : (await discoverModels(input.provider, apiKey, { ...(input.provider === "cloudflare" ? { accountId: cloudflareAccountId } : {}) })).models;
    if (availableModels && !availableModels.some((model) => model.id === input.model)) {
      return Response.json({ error: `The selected model is not in the current ${providerCatalog[input.provider].name} catalog. Refresh models and choose a listed model.` }, { status: 400 });
    }
    const generated = await provider.generate({
      ...input,
      apiKey,
      ...(input.provider === "cloudflare" ? { cloudflareAccountId } : {}),
      ...(input.provider === "ollama" ? { ollamaBaseUrl: rawOllamaUrl || DEFAULT_OLLAMA_BASE_URL } : {}),
      signal: request.signal,
    });
    return Response.json({ ...generated, provider: input.provider, model: input.model });
  } catch (error) {
    if (error instanceof ProviderError) return Response.json({ error: error.message, ...(error.kind ? { errorKind: error.kind } : {}) }, { status: error.status });
    if (error instanceof DOMException && error.name === "TimeoutError") return Response.json({ error: `${provider.name} took too long to respond. Try again.` }, { status: 504 });
    return Response.json({ error: `Could not reach ${provider.name}. Check your connection and try again.` }, { status: 502 });
  }
}
