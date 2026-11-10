import { NextResponse } from "next/server";
import { requireAccountUser } from "@/lib/account-server";

export async function GET() {
  const auth = await requireAccountUser();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return NextResponse.json({
    user: {
      id: auth.user.id,
      email: auth.user.email ?? null,
      displayName: String(auth.user.user_metadata?.full_name ?? auth.user.user_metadata?.name ?? "").slice(0, 120),
      avatarUrl: String(auth.user.user_metadata?.avatar_url ?? auth.user.user_metadata?.picture ?? "").slice(0, 2_000),
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
