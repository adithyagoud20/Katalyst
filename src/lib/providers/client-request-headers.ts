import {
  CLOUDFLARE_ACCOUNT_HEADER,
  OLLAMA_URL_HEADER,
  SESSION_KEY_HEADER,
} from "./constants";
import type { ProviderId } from "./catalog";

export type CloudflareRequestMode = "platform" | "byok";

export function getProviderRequestHeaders(options: {
  provider: ProviderId;
  sessionKey?: string;
  cloudflareMode?: CloudflareRequestMode;
  cloudflareAccountId?: string;
  ollamaBaseUrl?: string;
}): Record<string, string> {
  const headers: Record<string, string> = {};
  const sessionKey = options.sessionKey?.trim();

  if (options.provider === "cloudflare") {
    if (options.cloudflareMode === "byok") {
      if (sessionKey) headers[SESSION_KEY_HEADER] = sessionKey;
      const accountId = options.cloudflareAccountId?.trim();
      if (accountId) headers[CLOUDFLARE_ACCOUNT_HEADER] = accountId;
    }
    return headers;
  }

  if (options.provider !== "ollama" && sessionKey) headers[SESSION_KEY_HEADER] = sessionKey;
  if (options.provider === "ollama" && options.ollamaBaseUrl?.trim()) {
    headers[OLLAMA_URL_HEADER] = options.ollamaBaseUrl.trim();
  }
  return headers;
}

