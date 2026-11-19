import "server-only";
import { NextResponse } from "next/server";
import { getAiModelConfig, getAiSystemConfig } from "@/lib/ai-gateway/config";
import { isCloudflareModelId } from "@/lib/providers/cloudflare";
import { isServerProviderConfigured, resolveSharedAiSelection } from "@/lib/providers/credentials";

export async function GET() {
  const system = await getAiSystemConfig();
  if (!system.sharedAiEnabled || system.killSwitchActive) return NextResponse.json({ error: "Kat AI is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  const selection = resolveSharedAiSelection(system.selectedModelId);
  if (!selection || (selection.providerId === "cloudflare" && !isCloudflareModelId(selection.modelId))) {
    return NextResponse.json({ error: "Kat AI provider or model is not available." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  if (!isServerProviderConfigured(selection.providerId)) {
    const providerName = selection.providerId === "gemini" ? "Gemini" : "Cloudflare Workers AI";
    return NextResponse.json({ error: `Shared Kat AI needs the deployment owner's ${providerName} credentials configured on the server.` }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  const config = await getAiModelConfig(selection.modelId);
  if (!config.enabled) return NextResponse.json({ error: "Kat AI model is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ providerId: selection.providerId, modelId: selection.modelId }, { headers: { "Cache-Control": "private, no-store" } });
}
