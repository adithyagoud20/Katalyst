import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { requireAccountUser, sameOriginMutation } from "@/lib/account-server";

export async function POST(request: NextRequest) {
  if (!sameOriginMutation(request)) return NextResponse.json({ error: "This account change must come from the KATALYST site." }, { status: 403 });
  const auth = await requireAccountUser();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
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
