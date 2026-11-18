import "server-only";
import { NextResponse } from "next/server";
import { getAiModelConfig, getAiSystemConfig } from "@/lib/ai-gateway/config";
import { isCloudflareModelId } from "@/lib/providers/cloudflare";

export async function GET() {
  const system = await getAiSystemConfig();
  if (!system.sharedAiEnabled || system.killSwitchActive) return NextResponse.json({ error: "Kat AI is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  if (!isCloudflareModelId(system.selectedModelId)) return NextResponse.json({ error: "Kat AI model is not available." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  const config = await getAiModelConfig(system.selectedModelId);
  if (!config.enabled) return NextResponse.json({ error: "Kat AI model is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ modelId: system.selectedModelId }, { headers: { "Cache-Control": "private, no-store" } });
}
