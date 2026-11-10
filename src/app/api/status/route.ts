import { getDefaultModel, isProviderId, providerCatalog, providerIds } from "@/lib/providers/catalog";

function isConfigured(environmentName: string): boolean {
  const key = process.env[environmentName]?.trim();
  return Boolean(key && key !== "your_api_key_here");
}

export async function GET() {
  const configuredProvider = isProviderId(process.env.AI_PROVIDER) ? process.env.AI_PROVIDER : "cloudflare";
  const configuredModel = process.env.AI_MODEL;
  const defaultModel = !providerCatalog[configuredProvider].dynamicModels && configuredModel && providerCatalog[configuredProvider].models.some((model) => model.id === configuredModel)
    ? configuredModel
    : getDefaultModel(configuredProvider);
  const providers = Object.fromEntries(providerIds.map((id) => [id, {
    configured: id === "cloudflare"
      ? isConfigured("CLOUDFLARE_API_TOKEN") && /^[a-f\d]{32}$/i.test(process.env.CLOUDFLARE_ACCOUNT_ID ?? "")
      : isConfigured(providerCatalog[id].keyEnv),
    ...(id === "cloudflare" ? {
      tokenConfigured: isConfigured("CLOUDFLARE_API_TOKEN"),
      accountConfigured: /^[a-f\d]{32}$/i.test(process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? ""),
    } : {}),
  }]));

  return Response.json({ defaultProvider: configuredProvider, defaultModel, providers }, { headers: { "Cache-Control": "no-store" } });
}
