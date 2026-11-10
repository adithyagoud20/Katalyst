import { providerCatalog, type ProviderId } from "./catalog";

export { SESSION_KEY_HEADER } from "./constants";

export const MAX_SESSION_KEY_LENGTH = 2_048;

export function getProviderApiKey(provider: ProviderId, sessionKey?: string | null): string | undefined {
  const selected = sessionKey?.trim();
  if (selected) return selected;
  const environmentKey = process.env[providerCatalog[provider].keyEnv]?.trim();
  return environmentKey && environmentKey !== "your_api_key_here" ? environmentKey : undefined;
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
