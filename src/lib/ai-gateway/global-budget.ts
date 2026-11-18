import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";

function getAdminClient() {
  const config = getSupabaseConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!config || !serviceKey) {
    if (process.env.NODE_ENV === "production") throw new Error("Shared AI requires the Supabase-backed daily budget.");
    return null;
  }
  return createClient(config.url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}

export async function reserveDailySharedBudget(input: { reservationId: string; usageDate: string; reserveCredits: number; dailyLimitCredits: number }): Promise<boolean> {
  const admin = getAdminClient();
  if (!admin) return true;
  const { data, error } = await admin.rpc("reserve_ai_global_daily_budget", {
    p_reservation_id: input.reservationId,
    p_usage_date: input.usageDate,
    p_reserve_credits: input.reserveCredits,
    p_daily_limit_credits: input.dailyLimitCredits,
  });
  if (error) throw new Error("The shared AI daily budget could not be checked.");
  const result = Array.isArray(data) ? data[0] as { allowed?: boolean } | undefined : undefined;
  if (!result || typeof result.allowed !== "boolean") throw new Error("The shared AI daily budget returned an invalid response.");
  return result.allowed;
}

export async function releaseDailySharedBudget(reservationId: string): Promise<void> {
  const admin = getAdminClient();
  if (!admin) return;
  const { error } = await admin.rpc("release_ai_global_daily_budget", { p_reservation_id: reservationId });
  if (error) throw new Error("The shared AI daily budget reservation could not be released.");
}

export async function settleDailySharedBudget(reservationId: string, actualCredits: number): Promise<void> {
  const admin = getAdminClient();
  if (!admin) return;
  const { error } = await admin.rpc("settle_ai_global_daily_budget", { p_reservation_id: reservationId, p_actual_credits: actualCredits });
  if (error) throw new Error("The shared AI daily budget could not be settled.");
}
