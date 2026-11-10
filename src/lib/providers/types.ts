import type { ModelMetadata, ProviderId } from "./catalog";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type ProviderUsage = { inputTokens?: number; outputTokens?: number; costUsd?: number };
export type GenerateResult = { text: string; usage?: ProviderUsage };
export type AssistantSurface = "workspace" | "kat";
export type GenerateInput = { model: string; messages: ChatMessage[]; context?: string; assistantSurface?: AssistantSurface; apiKey?: string; cloudflareAccountId?: string; ollamaBaseUrl?: string; signal?: AbortSignal };
export type ProviderErrorKind = "configuration" | "authentication" | "permission" | "account" | "rate-limit" | "network" | "timeout" | "invalid-response" | "unsupported-model" | "provider";

export class ProviderError extends Error {
  constructor(message: string, readonly status: number, readonly kind?: ProviderErrorKind) {
    super(message);
    this.name = "ProviderError";
  }
}

export interface ModelProvider {
  readonly id: ProviderId;
  readonly name: string;
  readonly models: readonly ModelMetadata[];
  generate(input: GenerateInput): Promise<GenerateResult>;
}

export function providerSignal(signal: AbortSignal | undefined, timeoutMs: number): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}
