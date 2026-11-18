import "server-only";
import type { ProviderId } from "./catalog";

export { SESSION_KEY_HEADER } from "./constants";

export const MAX_SESSION_KEY_LENGTH = 2_048;

const providerEnvironmentKey: Partial<Record<ProviderId, string>> = {
  cloudflare: "CLOUDFLARE_API_TOKEN",
  openai: "OPENAI_API_KEY",
  gemini: "GEMINI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
};

export function getProviderApiKey(provider: ProviderId, sessionKey?: string | null): string | undefined {
  const selected = sessionKey?.trim();
  if (selected) return selected;
  const environmentKey = providerEnvironmentKey[provider]
    ? process.env[providerEnvironmentKey[provider]!]?.trim()
    : undefined;
  return environmentKey && environmentKey !== "your_api_key_here" ? environmentKey : undefined;
}

export function isServerProviderConfigured(provider: ProviderId): boolean {
  if (provider === "ollama") return false;
  const keyName = providerEnvironmentKey[provider];
  const key = keyName ? process.env[keyName]?.trim() : undefined;
  if (!key || key === "your_api_key_here") return false;
  if (provider === "cloudflare") {
    return /^[a-f\d]{32}$/i.test(process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? "");
  }
  return true;
}

export function isServerProviderKeyConfigured(provider: ProviderId): boolean {
  if (provider === "ollama") return false;
  const keyName = providerEnvironmentKey[provider];
  const key = keyName ? process.env[providerEnvironmentKey[provider]!]?.trim() : undefined;
  return Boolean(key && key !== "your_api_key_here");
}

export function isServerCloudflareAccountConfigured(): boolean {
  return /^[a-f\d]{32}$/i.test(process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? "");
}

export function getCloudflareAccountId(sessionAccountId?: string | null): string | undefined {
  const selected = sessionAccountId?.trim();
  if (selected) return selected;
  const environmentAccountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  return environmentAccountId && environmentAccountId !== "your_account_id_here" ? environmentAccountId : undefined;
}

export function isSecureSessionKeyRequest(request: Request): boolean {
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();
  const isLoopback = host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
  return url.protocol === "https:" || isLoopback;
}
