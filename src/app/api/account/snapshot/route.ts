import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ACCOUNT_SNAPSHOT_MAX_BYTES, parseAccountSnapshot } from "@/lib/account-data";
import { requireAccountUser, sameOriginMutation } from "@/lib/account-server";

export async function GET() {
  const auth = await requireAccountUser();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { data, error } = await auth.supabase
    .from("account_snapshots")
    .select("workspace,learning_progress,preferences,revision,updated_at")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Account data could not be loaded. Try again." }, { status: 502 });
  if (!data) return NextResponse.json({ snapshot: null, revision: 0, updatedAt: null }, { headers: { "Cache-Control": "no-store" } });
  try {
    const snapshot = parseAccountSnapshot({ workspace: data.workspace, learningProgress: data.learning_progress, preferences: data.preferences });
    return NextResponse.json({ snapshot, revision: data.revision, updatedAt: data.updated_at }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Saved account data failed validation. The server record was not changed." }, { status: 500 });
  }
}

const saveBody = z.object({
  snapshot: z.unknown(),
  expectedRevision: z.number().int().min(0).max(2_000_000_000),
  migrationId: z.string().uuid().optional(),
}).strict();

export async function PUT(request: NextRequest) {
  if (!sameOriginMutation(request)) return NextResponse.json({ error: "This account change must come from the KATALYST site." }, { status: 403 });
  const auth = await requireAccountUser();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > ACCOUNT_SNAPSHOT_MAX_BYTES + 100_000) return NextResponse.json({ error: "Account data exceeds the supported 9 MB limit." }, { status: 413 });

  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > ACCOUNT_SNAPSHOT_MAX_BYTES + 100_000) return NextResponse.json({ error: "Account data exceeds the supported 9 MB limit." }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "The account update must contain valid JSON." }, { status: 400 });
  }
  const parsed = saveBody.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "The account update has an invalid shape." }, { status: 400 });

  let snapshot;
  try {
    snapshot = parseAccountSnapshot(parsed.data.snapshot);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The account update failed validation." }, { status: 400 });
  }

  const { data, error } = await auth.supabase.rpc("save_account_snapshot", {
    p_workspace: snapshot.workspace,
    p_learning_progress: snapshot.learningProgress,
    p_preferences: snapshot.preferences,
    p_expected_revision: parsed.data.expectedRevision,
    p_migration_id: parsed.data.migrationId ?? null,
  });
  if (error) return NextResponse.json({ error: "Account data could not be saved. Your local copy remains available." }, { status: 502 });
  const result = Array.isArray(data) ? data[0] as { status?: string; revision?: number; updated_at?: string } | undefined : undefined;
  if (!result || !["saved", "conflict", "already_migrated"].includes(result.status ?? "")) {
    return NextResponse.json({ error: "The account service returned an invalid save result." }, { status: 502 });
  }
  if (result.status === "conflict") return NextResponse.json({ status: result.status, revision: result.revision ?? 0, error: "This account changed on another device. Choose how to resolve the conflict." }, { status: 409 });
  return NextResponse.json({ status: result.status, revision: result.revision ?? 0, updatedAt: result.updated_at ?? null }, { headers: { "Cache-Control": "no-store" } });
}
