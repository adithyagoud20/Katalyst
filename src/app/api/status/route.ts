import "server-only";
import { getDefaultModel, isProviderId, providerCatalog, providerIds } from "@/lib/providers/catalog";
import { isServerCloudflareAccountConfigured, isServerProviderConfigured, isServerProviderKeyConfigured, getSharedAiProviderId, resolveSharedAiSelection } from "@/lib/providers/credentials";
import { getAiSystemConfig } from "@/lib/ai-gateway/config";

export async function GET() {
  const configuredProvider = isProviderId(process.env.AI_PROVIDER) ? process.env.AI_PROVIDER : "cloudflare";
  const configuredModel = process.env.AI_MODEL;
  const defaultModel = !providerCatalog[configuredProvider].dynamicModels && configuredModel && providerCatalog[configuredProvider].models.some((model) => model.id === configuredModel)
    ? configuredModel
    : getDefaultModel(configuredProvider);
  const sharedProviderId = getSharedAiProviderId();
  const providers = Object.fromEntries(providerIds.map((id) => [id, {
    // A Gemini key selected for shared Kat is not a Workspace credential.
    configured: id === "gemini" && sharedProviderId === "gemini" ? false : isServerProviderConfigured(id),
    ...(id === "cloudflare" ? {
      tokenConfigured: isServerProviderKeyConfigured("cloudflare"),
      accountConfigured: isServerCloudflareAccountConfigured(),
    } : {}),
  }]));

  const system = await getAiSystemConfig();
  const sharedSelection = resolveSharedAiSelection(system.selectedModelId);
  const configuredSharedProvider = sharedSelection?.providerId ?? sharedProviderId;
  const sharedAi = {
    providerId: configuredSharedProvider,
    configured: Boolean(sharedSelection && configuredSharedProvider && isServerProviderConfigured(configuredSharedProvider)),
  };

  return Response.json({ defaultProvider: configuredProvider, defaultModel, providers, sharedAi }, { headers: { "Cache-Control": "no-store" } });
}
