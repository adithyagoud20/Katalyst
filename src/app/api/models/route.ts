import "server-only";
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
  const rawMode = url.searchParams.get("mode");
  const cloudflareMode = rawMode === "byok" ? "byok" : "platform";
  if (providerParam === "cloudflare" && rawMode && rawMode !== "platform" && rawMode !== "byok") {
    return Response.json({ error: "Choose platform or BYOK Cloudflare mode." }, { status: 400 });
  }

  const rawOllamaUrl = request.headers.get(OLLAMA_URL_HEADER);
  const rawCloudflareAccountId = request.headers.get(CLOUDFLARE_ACCOUNT_HEADER);
  const rawSessionKey = request.headers.get(SESSION_KEY_HEADER);
  if (providerParam === "cloudflare" && cloudflareMode === "platform" && (rawSessionKey || rawCloudflareAccountId)) {
    return Response.json({ error: "Cloudflare credentials are not accepted in platform mode. Choose BYOK explicitly to use personal credentials." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  if (providerParam === "cloudflare" && cloudflareMode === "byok" && (!rawSessionKey?.trim() || !rawCloudflareAccountId?.trim())) {
    return Response.json({ error: "BYOK mode requires your own Cloudflare API token and account ID." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  if (providerParam === "ollama" && !isLocalOllamaRequest(request)) {
    return Response.json({ error: "Ollama access is available only from a local KATALYST instance. Do not expose local inference to public users." }, { status: 403 });
  }
  if (rawOllamaUrl && rawOllamaUrl.length > MAX_OLLAMA_URL_LENGTH) return Response.json({ error: "The Ollama address is too long." }, { status: 400 });
  if (providerParam === "ollama" && request.headers.has(SESSION_KEY_HEADER)) return Response.json({ error: "Ollama uses local inference and does not accept cloud API keys." }, { status: 400 });
  if (providerParam !== "cloudflare" && rawCloudflareAccountId) return Response.json({ error: "A Cloudflare account ID can only be used with Cloudflare Workers AI." }, { status: 400 });
  if (rawCloudflareAccountId && rawCloudflareAccountId.length > 128) return Response.json({ error: "The Cloudflare account ID is too long." }, { status: 400 });

  if (rawSessionKey && rawSessionKey.length > MAX_SESSION_KEY_LENGTH) {
    return Response.json({ error: "The session API key is too long." }, { status: 400 });
  }
  if (rawSessionKey && !isSecureSessionKeyRequest(request)) {
    return Response.json({ error: "Session API keys can only be sent over HTTPS outside localhost." }, { status: 400 });
  }

  try {
    if (providerParam === "cloudflare" && cloudflareMode === "platform") {
      return Response.json({ error: "Shared Kat AI models are managed by KATALYST and are not part of the BYOK model catalog." }, { status: 403, headers: { "Cache-Control": "no-store" } });
    }
    const apiKey = providerParam === "cloudflare"
      ? cloudflareMode === "byok" ? rawSessionKey!.trim() : getProviderApiKey("cloudflare")
      : providerParam === "ollama" ? undefined : getProviderApiKey(providerParam, rawSessionKey);
    const accountId = providerParam === "cloudflare"
      ? cloudflareMode === "byok" ? rawCloudflareAccountId!.trim() : getCloudflareAccountId()
      : undefined;
    const result = await discoverModels(
      providerParam,
      apiKey,
      {
        refresh: url.searchParams.get("refresh") === "true",
        ...(providerParam === "ollama" ? { baseUrl: rawOllamaUrl || DEFAULT_OLLAMA_BASE_URL } : {}),
        ...(providerParam === "cloudflare" ? { accountId } : {}),
      },
    );
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ProviderError) return Response.json({ error: redactProviderError(error.message, [rawSessionKey, rawCloudflareAccountId]), ...(error.kind ? { errorKind: error.kind } : {}) }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    return Response.json({ error: `${providerCatalog[providerParam].name} model discovery failed. Check the connection and try again.` }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

function redactProviderError(message: string, requestSecrets: Array<string | null>): string {
  let safe = message;
  const secrets = [
    ...requestSecrets,
    ...Object.entries(process.env)
      .filter(([name, value]) => value && /(?:api.?key|token|secret|service.?role|account.?id)/i.test(name))
      .map(([, value]) => value!),
  ].filter((value): value is string => Boolean(value));
  for (const secret of secrets) if (secret.length >= 4) safe = safe.split(secret).join("[redacted]");
  return safe.replace(/(?:bearer\s+)[a-z0-9._-]{8,}/gi, "Bearer [redacted]");
}
