import { NextResponse } from "next/server";
import { learningPaths } from "@/lib/learning-curriculum";
import { getSupabaseConfig } from "@/lib/supabase/config";

function isCloudflareConfigured(): boolean {
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? "";
  return Boolean(token && token !== "your_api_key_here" && /^[a-f\d]{32}$/i.test(accountId));
}

export async function GET() {
  const supabaseConfigured = Boolean(getSupabaseConfig());
  const cloudflareConfigured = isCloudflareConfigured();

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
