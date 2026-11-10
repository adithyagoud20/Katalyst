import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { ReservationResult, SettlementResult, UserCreditStatus, AIModelConfig } from "./types";

function getAdminClient() {
  const config = getSupabaseConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!config || !serviceKey) return null;
  return createClient(config.url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Calculates estimated credits required for initial reservation.
 */
export function calculateEstimatedReservationCredits(modelConfig: AIModelConfig, inputCharacters: number): number {
  const estimatedInputTokens = Math.ceil(inputCharacters / 3.8);
  const estimatedOutputTokens = 500; // Typical completion expectation
  const tokenFactor = (estimatedInputTokens + estimatedOutputTokens) / 2000;
  return Math.max(0.5, Number((modelConfig.creditWeight * (1 + tokenFactor)).toFixed(2)));
}

/**
 * Calculates final settled credits based on actual or conservatively estimated tokens.
 */
export function calculateSettledCredits(
  modelConfig: AIModelConfig,
  inputTokens: number,
  outputTokens: number
): number {
  const tokenFactor = (inputTokens + outputTokens) / 2000;
  const credits = modelConfig.creditWeight * (1 + tokenFactor);
  return Math.max(0.2, Number(credits.toFixed(2)));
}

/**
 * Conservative estimation method when Cloudflare / provider does not report token counts.
 * Documents characters-to-tokens conversion heuristic (~3.8 characters per token for English & C code).
 */
export function estimateTokensFromText(inputChars: number, outputChars: number): { inputTokens: number; outputTokens: number } {
  return {
    inputTokens: Math.max(1, Math.ceil(inputChars / 3.8)),
    outputTokens: Math.max(1, Math.ceil(outputChars / 3.8)),
  };
}

export function getCurrentUtcMonthPeriod(): { periodStart: string; periodEnd: string; resetDate: string } {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-indexed

  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const nextMonthYear = month === 11 ? year + 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const end = new Date(Date.UTC(nextMonthYear, nextMonth, 1, 0, 0, 0, 0));

  return {
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    resetDate: end.toISOString(),
  };
}

/**
 * Gets or initializes the active monthly credit period for an authenticated user.
 */
export async function getAuthenticatedUserCreditStatus(userId: string): Promise<UserCreditStatus | null> {
  const admin = getAdminClient();
  const { periodStart, periodEnd, resetDate } = getCurrentUtcMonthPeriod();

  if (!admin) {
    // Unconfigured fallback
    return {
      isGuest: false,
      userId,
      creditsAllocated: 1000,
      creditsUsed: 0,
      creditsReserved: 0,
      creditsRemaining: 1000,
      periodStart,
      periodEnd,
      resetDate,
      isLowBalance: false,
      isExhausted: false,
    };
  }

  try {
    const { data, error } = await admin.rpc("get_or_create_user_credit_period", {
      p_user_id: userId,
      p_period_start: periodStart,
      p_period_end: periodEnd,
    });

    if (error || !data || data.length === 0) {
      // Fallback direct query
      const { data: row } = await admin
        .from("ai_credit_periods")
        .select("credits_allocated,credits_used,credits_reserved")
        .eq("user_id", userId)
        .eq("period_start", periodStart)
        .maybeSingle();

      const allocated = row?.credits_allocated ?? 1000;
      const used = Number(row?.credits_used ?? 0);
      const reserved = Number(row?.credits_reserved ?? 0);
      const remaining = Math.max(0, allocated - used - reserved);

      return {
        isGuest: false,
        userId,
        creditsAllocated: allocated,
        creditsUsed: used,
        creditsReserved: reserved,
        creditsRemaining: remaining,
        periodStart,
        periodEnd,
        resetDate,
        isLowBalance: remaining > 0 && remaining <= 100,
        isExhausted: remaining <= 0,
      };
    }

    const row = data[0];
    const allocated = Number(row.credits_allocated ?? 1000);
    const used = Number(row.credits_used ?? 0);
    const reserved = Number(row.credits_reserved ?? 0);
    const remaining = Number(row.credits_available ?? Math.max(0, allocated - used - reserved));

    return {
      isGuest: false,
      userId,
      creditsAllocated: allocated,
      creditsUsed: used,
      creditsReserved: reserved,
      creditsRemaining: Math.max(0, remaining),
      periodStart,
      periodEnd,
      resetDate,
      isLowBalance: remaining > 0 && remaining <= 100,
      isExhausted: remaining <= 0,
    };
  } catch {
    return null;
  }
}

/**
 * Atomically reserves AI credits before sending a shared inference request.
 */
export async function reserveCredits(params: {
  idempotencyKey: string;
  modelId: string;
  estimatedCredits: number;
  userId?: string | null;
  guestId?: string | null;
}): Promise<ReservationResult> {
  const admin = getAdminClient();
  const { resetDate } = getCurrentUtcMonthPeriod();

  if (!admin) {
    // Unconfigured environment: mock success for guest/local testing
    return {
      ok: true,
      reservationId: params.idempotencyKey,
      creditsReserved: params.estimatedCredits,
      creditsRemaining: 1000 - params.estimatedCredits,
    };
  }

  const { data, error } = await admin.rpc("reserve_ai_credits", {
    p_idempotency_key: params.idempotencyKey,
    p_model_id: params.modelId,
    p_estimated_credits: params.estimatedCredits,
    p_guest_id: params.guestId ?? null,
  });

  if (error) {
    return {
      ok: false,
      errorCode: "SHARED_AI_DISABLED",
      errorMessage: "Could not allocate AI credits for this request. Please try again.",
    };
  }

  const row = data?.[0];
  if (!row) {
    return { ok: false, errorMessage: "Unexpected reservation response from database." };
  }

  if (row.status === "quota_exhausted") {
    return {
      ok: false,
      errorCode: "MONTHLY_QUOTA_EXHAUSTED",
      errorMessage: row.error_message || "Your monthly KATALYST shared AI credit allowance has been exhausted for this period.",
      creditsRemaining: 0,
      resetDate,
    };
  }

  if (row.status === "guest_trial_exhausted") {
    return {
      ok: false,
      errorCode: "GUEST_TRIAL_EXHAUSTED",
      errorMessage: row.error_message || "Guest trial exhausted. Sign in with Google to continue using KATALYST shared AI.",
      requiresSignIn: true,
      creditsRemaining: 0,
    };
  }

  if (row.status === "error") {
    return {
      ok: false,
      errorCode: "SHARED_AI_DISABLED",
      errorMessage: row.error_message || "Shared KATALYST AI inference is currently unavailable.",
    };
  }

  return {
    ok: true,
    reservationId: row.reservation_id,
    creditsReserved: Number(row.credits_reserved ?? params.estimatedCredits),
    creditsRemaining: Number(row.credits_remaining ?? 0),
  };
}

/**
 * Settles AI credits after successful inference response.
 */
export async function settleCredits(params: {
  reservationId: string;
  inputTokens: number;
  outputTokens: number;
  actualCredits: number;
  isEstimated: boolean;
}): Promise<SettlementResult> {
  const admin = getAdminClient();
  if (!admin) {
    return {
      ok: true,
      creditsSettled: params.actualCredits,
      creditsRemaining: 1000 - params.actualCredits,
      isEstimated: params.isEstimated,
    };
  }

  const { data, error } = await admin.rpc("settle_ai_credits", {
    p_reservation_id: params.reservationId,
    p_input_tokens: params.inputTokens,
    p_output_tokens: params.outputTokens,
    p_actual_credits: params.actualCredits,
    p_is_estimated: params.isEstimated,
  });

  if (error || !data || data.length === 0) {
    return {
      ok: false,
      creditsSettled: params.actualCredits,
      creditsRemaining: 0,
      isEstimated: params.isEstimated,
    };
  }

  const row = data[0];
  return {
    ok: row.status === "settled",
    creditsSettled: Number(row.credits_settled ?? params.actualCredits),
    creditsRemaining: Number(row.credits_remaining ?? 0),
    isEstimated: params.isEstimated,
  };
}

/**
 * Releases reserved credits back to the user/guest balance on request failure or cancellation.
 */
export async function releaseReservation(params: {
  reservationId: string;
  outcome: "failure" | "cancelled";
  errorKind?: string;
}): Promise<void> {
  const admin = getAdminClient();
  if (!admin) return;

  try {
    await admin.rpc("release_ai_reservation", {
      p_reservation_id: params.reservationId,
      p_outcome: params.outcome,
      p_error_kind: params.errorKind ?? null,
    });
  } catch {
    // Release failure logged silently
  }
}
