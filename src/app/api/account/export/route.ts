import { NextResponse } from "next/server";
import { parseAccountSnapshot } from "@/lib/account-data";
import { requireAccountUser } from "@/lib/account-server";

export async function GET() {
  const auth = await requireAccountUser();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { data, error } = await auth.supabase
    .from("account_snapshots")
    .select("workspace,learning_progress,preferences,revision,updated_at")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Account data could not be exported. Try again." }, { status: 502 });
  let snapshot = null;
  if (data) {
    try {
      snapshot = parseAccountSnapshot({ workspace: data.workspace, learningProgress: data.learning_progress, preferences: data.preferences });
    } catch {
      return NextResponse.json({ error: "Saved account data failed validation and could not be exported." }, { status: 500 });
    }
  }
  const body = {
    format: "katalyst-account-export",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    userId: auth.user.id,
    revision: data?.revision ?? 0,
    snapshot,
  };
  if (JSON.stringify(body).length > 9_200_000) return NextResponse.json({ error: "Account data exceeds the supported export size." }, { status: 413 });
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="katalyst-account-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
