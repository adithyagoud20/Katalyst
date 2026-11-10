import type { NextRequest } from "next/server";
import { getVerifiedSupabaseUser } from "@/lib/supabase/server";

export async function requireAccountUser() {
  const auth = await getVerifiedSupabaseUser();
  if (!auth.configured || !auth.supabase) return { ok: false as const, status: 503, error: "Accounts are unavailable until Supabase is configured." };
  if (!auth.user) return { ok: false as const, status: 401, error: "Sign in to access account data." };
  return { ok: true as const, supabase: auth.supabase, user: auth.user };
}

export function sameOriginMutation(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return origin !== null && origin === request.nextUrl.origin;
}
