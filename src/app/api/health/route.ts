import "server-only";
import { NextResponse } from "next/server";
import { learningPaths } from "@/lib/learning-curriculum";
import { isServerProviderConfigured } from "@/lib/providers/credentials";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function GET() {
  const supabaseConfigured = Boolean(getSupabaseConfig());
  const cloudflareConfigured = isServerProviderConfigured("cloudflare");

  return NextResponse.json(
    {
      ok: true,
      status: "healthy",
      coursesCount: learningPaths.length,
      services: {
        cloudflareConfigured,
        supabaseConfigured,
      },
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
