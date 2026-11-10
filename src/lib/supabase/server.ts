import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

export async function createSupabaseServerClient() {
  const config = getSupabaseConfig();
  if (!config) return null;
  const cookieStore = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server components cannot write cookies. Route handlers and proxy.ts refresh them.
        }
      },
    },
  });
}

export async function getVerifiedSupabaseUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { configured: false as const, supabase: null, user: null };
  const { data, error } = await supabase.auth.getUser();
  return { configured: true as const, supabase, user: error ? null : data.user };
}
