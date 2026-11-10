import { geminiProvider } from "./gemini";
import { cloudflareProvider } from "./cloudflare";
import { openAIProvider } from "./openai";
import { openRouterProvider } from "./openrouter";
import { ollamaProvider } from "./ollama";
import type { ProviderId } from "./catalog";
import type { ModelProvider } from "./types";

export const providers: Record<ProviderId, ModelProvider> = {
  cloudflare: cloudflareProvider,
  openai: openAIProvider,
  gemini: geminiProvider,
  openrouter: openRouterProvider,
  ollama: ollamaProvider,
};

export function getProvider(id: ProviderId): ModelProvider {
  return providers[id];
}
