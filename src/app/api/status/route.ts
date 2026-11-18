import "server-only";
import { getDefaultModel, isProviderId, providerCatalog, providerIds } from "@/lib/providers/catalog";
import { isServerCloudflareAccountConfigured, isServerProviderConfigured, isServerProviderKeyConfigured } from "@/lib/providers/credentials";

export async function GET() {
  const configuredProvider = isProviderId(process.env.AI_PROVIDER) ? process.env.AI_PROVIDER : "cloudflare";
  const configuredModel = process.env.AI_MODEL;
  const defaultModel = !providerCatalog[configuredProvider].dynamicModels && configuredModel && providerCatalog[configuredProvider].models.some((model) => model.id === configuredModel)
    ? configuredModel
    : getDefaultModel(configuredProvider);
  const providers = Object.fromEntries(providerIds.map((id) => [id, {
    configured: isServerProviderConfigured(id),
    ...(id === "cloudflare" ? {
      tokenConfigured: isServerProviderKeyConfigured("cloudflare"),
      accountConfigured: isServerCloudflareAccountConfigured(),
    } : {}),
  }]));

  return Response.json({ defaultProvider: configuredProvider, defaultModel, providers }, { headers: { "Cache-Control": "no-store" } });
}
