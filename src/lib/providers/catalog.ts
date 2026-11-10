export type ProviderId = "cloudflare" | "openai" | "gemini" | "openrouter" | "ollama";
export type ModelPricingStatus = "free" | "paid" | "unknown";
export type CredentialAccess = "listed-for-key" | "not-verified";
export type ModelDiscoveryDiagnostic = { sourceCount: number; compatibleCount: number; excludedCount: number; message: string };

export type ModelMetadata = {
  providerId: ProviderId;
  id: string;
  name: string;
  description?: string;
  capabilities: string[];
  contextLimit?: number;
  pricing?: { inputPerMillion?: number; outputPerMillion?: number };
  pricingStatus: ModelPricingStatus;
  source: "built-in" | "cloudflare-models-api" | "gemini-models-api" | "openrouter-models-api" | "openrouter-router" | "ollama-tags-api";
  namespace?: string;
  discoveredAt?: number;
  credentialAccess: CredentialAccess;
  freeRouting?: boolean;
  local?: boolean;
  sizeBytes?: number;
  parameterSize?: string;
  quantization?: string;
  family?: string;
  recommended?: boolean;
};

export const freeRouterModel: ModelMetadata = {
  providerId: "openrouter",
  id: "openrouter/free",
  name: "Free model routing",
  description: "OpenRouter chooses an available free text model for each request.",
  capabilities: ["text input", "text output", "dynamic routing"],
  contextLimit: 200_000,
  pricing: { inputPerMillion: 0, outputPerMillion: 0 },
  pricingStatus: "free",
  source: "openrouter-router",
  namespace: "OpenRouter",
  credentialAccess: "not-verified",
  freeRouting: true,
};

export const providerCatalog = {
  cloudflare: {
    id: "cloudflare",
    name: "Cloudflare Workers AI",
    apiLabel: "Workers AI OpenAI-compatible Chat Completions API",
    keyEnv: "CLOUDFLARE_API_TOKEN",
    logo: "C",
    dynamicModels: true,
    models: [] satisfies ModelMetadata[],
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    apiLabel: "Responses API",
    keyEnv: "OPENAI_API_KEY",
    logo: "O",
    dynamicModels: false,
    models: [
      { providerId: "openai", id: "gpt-6-luna", name: "GPT-6 Luna", description: "Fast, lower cost", capabilities: ["text input", "text output"], pricingStatus: "unknown", source: "built-in", credentialAccess: "not-verified" },
      { providerId: "openai", id: "gpt-6.1-sol", name: "GPT-6.1 Sol", description: "Balanced", capabilities: ["text input", "text output"], pricingStatus: "unknown", source: "built-in", credentialAccess: "not-verified" },
      { providerId: "openai", id: "gpt-6-astra", name: "GPT-6 Astra", description: "Complex work", capabilities: ["text input", "text output"], pricingStatus: "unknown", source: "built-in", credentialAccess: "not-verified" },
    ] satisfies ModelMetadata[],
  },
  gemini: {
    id: "gemini",
    name: "Gemini",
    apiLabel: "Gemini generateContent API",
    keyEnv: "GEMINI_API_KEY",
    logo: "G",
    dynamicModels: true,
    models: [] satisfies ModelMetadata[],
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    apiLabel: "OpenRouter Chat Completions API",
    keyEnv: "OPENROUTER_API_KEY",
    logo: "R",
    dynamicModels: true,
    models: [freeRouterModel],
  },
  ollama: {
    id: "ollama",
    name: "Ollama",
    apiLabel: "Ollama local API",
    keyEnv: "",
    logo: "L",
    dynamicModels: true,
    models: [] satisfies ModelMetadata[],
  },
} as const satisfies Record<ProviderId, { id: ProviderId; name: string; apiLabel: string; keyEnv: string; logo: string; dynamicModels: boolean; models: readonly ModelMetadata[] }>;

export const providerIds = Object.keys(providerCatalog) as ProviderId[];

export function isProviderId(value: unknown): value is ProviderId {
  return typeof value === "string" && Object.hasOwn(providerCatalog, value);
}

export function isSupportedModel(provider: ProviderId, model: string): boolean {
  return providerCatalog[provider].models.some((option) => option.id === model);
}

export function getDefaultModel(provider: ProviderId): string {
  return providerCatalog[provider].models[0]?.id ?? "";
}
