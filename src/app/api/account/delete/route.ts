import "server-only";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { requireAccountUser, sameOriginMutation } from "@/lib/account-server";
import { allowAccountDeletionAttempt } from "@/lib/account-action-limit";

export async function POST(request: NextRequest) {
  if (!sameOriginMutation(request)) return NextResponse.json({ error: "This account change must come from the KATALYST site." }, { status: 403 });
  const auth = await requireAccountUser();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const lastSignInAt = Date.parse(auth.user.last_sign_in_at ?? "");
  if (!Number.isFinite(lastSignInAt) || Date.now() - lastSignInAt > 10 * 60 * 1_000) {
    return NextResponse.json({ error: "Sign in again before deleting your account. Recent authentication is required for this action." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  let allowed: boolean;
  try { allowed = await allowAccountDeletionAttempt(auth.user.id); }
  catch { return NextResponse.json({ error: "Account deletion is temporarily unavailable. Try again shortly." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
  if (!allowed) return NextResponse.json({ error: "Too many deletion attempts. Wait 15 minutes and try again." }, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "900" } });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Confirm account deletion in Settings." }, { status: 400 }); }
  if (!z.object({ confirmation: z.literal("delete my account") }).strict().safeParse(body).success) {
    return NextResponse.json({ error: "Type “delete my account” to confirm permanent deletion." }, { status: 400 });
  }

  const config = getSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!config || !serviceRoleKey) return NextResponse.json({ error: "Account deletion is unavailable until the server-side Supabase service key is configured." }, { status: 503 });

  const admin = createClient(config.url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  const { error } = await admin.auth.admin.deleteUser(auth.user.id);
  if (error) return NextResponse.json({ error: "The account could not be deleted. Its data was left in place." }, { status: 502 });
  // The Auth cascade removes profile, snapshot, and migration rows. Clear this browser's session too.
  await auth.supabase.auth.signOut({ scope: "global" }).catch(() => undefined);
  return NextResponse.json({ deleted: true }, { headers: { "Cache-Control": "no-store" } });
}
import "server-only";
