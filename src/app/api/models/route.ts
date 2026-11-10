import { discoverModels } from "@/lib/providers/discovery";
import { getCloudflareAccountId, getProviderApiKey, isSecureSessionKeyRequest, MAX_SESSION_KEY_LENGTH, SESSION_KEY_HEADER } from "@/lib/providers/credentials";
import { isProviderId, providerCatalog } from "@/lib/providers/catalog";
import { ProviderError } from "@/lib/providers/types";
import { CLOUDFLARE_ACCOUNT_HEADER, DEFAULT_OLLAMA_BASE_URL, MAX_OLLAMA_URL_LENGTH, OLLAMA_URL_HEADER } from "@/lib/providers/constants";
import { isLocalOllamaRequest } from "@/lib/providers/ollama";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const providerParam = url.searchParams.get("provider");
  if (!isProviderId(providerParam)) return Response.json({ error: "Choose a supported provider to load models." }, { status: 400 });

  const rawOllamaUrl = request.headers.get(OLLAMA_URL_HEADER);
  const rawCloudflareAccountId = request.headers.get(CLOUDFLARE_ACCOUNT_HEADER);
  if (providerParam === "ollama" && !isLocalOllamaRequest(request)) {
    return Response.json({ error: "Ollama access is available only from a local KATALYST instance. Do not expose local inference to public users." }, { status: 403 });
  }
  if (rawOllamaUrl && rawOllamaUrl.length > MAX_OLLAMA_URL_LENGTH) return Response.json({ error: "The Ollama address is too long." }, { status: 400 });
  if (providerParam === "ollama" && request.headers.has(SESSION_KEY_HEADER)) return Response.json({ error: "Ollama uses local inference and does not accept cloud API keys." }, { status: 400 });
  if (providerParam !== "cloudflare" && rawCloudflareAccountId) return Response.json({ error: "A Cloudflare account ID can only be used with Cloudflare Workers AI." }, { status: 400 });
  if (rawCloudflareAccountId && rawCloudflareAccountId.length > 128) return Response.json({ error: "The Cloudflare account ID is too long." }, { status: 400 });

  const rawSessionKey = request.headers.get(SESSION_KEY_HEADER);
  if (rawSessionKey && rawSessionKey.length > MAX_SESSION_KEY_LENGTH) {
    return Response.json({ error: "The session API key is too long." }, { status: 400 });
  }
  if (rawSessionKey && !isSecureSessionKeyRequest(request)) {
    return Response.json({ error: "Session API keys can only be sent over HTTPS outside localhost." }, { status: 400 });
  }

  try {
    const result = await discoverModels(
      providerParam,
      providerParam === "ollama" ? undefined : getProviderApiKey(providerParam, rawSessionKey),
      {
        refresh: url.searchParams.get("refresh") === "true",
        ...(providerParam === "ollama" ? { baseUrl: rawOllamaUrl || DEFAULT_OLLAMA_BASE_URL } : {}),
        ...(providerParam === "cloudflare" ? { accountId: getCloudflareAccountId(rawCloudflareAccountId) } : {}),
      },
    );
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ProviderError) return Response.json({ error: error.message, ...(error.kind ? { errorKind: error.kind } : {}) }, { status: error.status });
    return Response.json({ error: `${providerCatalog[providerParam].name} model discovery failed. Check the connection and try again.` }, { status: 502 });
  }
}
