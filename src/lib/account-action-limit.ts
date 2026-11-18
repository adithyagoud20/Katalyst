import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";

const DELETE_WINDOW_MS = 15 * 60 * 1_000;
const DELETE_MAX_ATTEMPTS = 3;

export async function allowAccountDeletionAttempt(userId: string): Promise<boolean> {
  const config = getSupabaseConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!config || !serviceKey) {
    if (process.env.NODE_ENV === "production") throw new Error("Account deletion rate limiting is not configured.");
    return true;
  }

  const now = Date.now();
  const windowStart = Math.floor(now / DELETE_WINDOW_MS) * DELETE_WINDOW_MS;
  const windowEnd = windowStart + DELETE_WINDOW_MS;
  const admin = createClient(config.url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  const { data, error } = await admin.rpc("consume_account_action_rate_limit", {
    p_user_id: userId,
    p_action: "account_delete",
    p_window_start: new Date(windowStart).toISOString(),
    p_expires_at: new Date(windowEnd).toISOString(),
    p_max_attempts: DELETE_MAX_ATTEMPTS,
  });
  if (error || typeof data !== "boolean") throw new Error("Account deletion rate limit could not be checked.");
  return data;
}
