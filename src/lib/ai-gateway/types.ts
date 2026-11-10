import { z } from "zod";

export type QuotaErrorCode =
  | "GUEST_TRIAL_EXHAUSTED"
  | "MONTHLY_QUOTA_EXHAUSTED"
  | "KILL_SWITCH_ACTIVE"
  | "SHARED_AI_DISABLED"
  | "MODEL_UNAVAILABLE"
  | "RATE_LIMIT_EXCEEDED"
  | "CONCURRENCY_LIMIT"
  | "PAYLOAD_TOO_LARGE";

export type AISystemConfig = {
  sharedAiEnabled: boolean;
  killSwitchActive: boolean;
  selectedModelId: string;
  globalDailyThresholdCredits: number;
  globalWarningThresholdCredits: number;
  updatedAt: string;
};

export type AIModelConfig = {
  modelId: string;
  enabled: boolean;
  creditWeight: number;
  tokenCostMultiplier: number;
  maxInputTokens: number;
  maxOutputTokens: number;
};

export type AICreditPolicies = {
  monthlyAuthenticatedCredits: number;
  guestTrialCredits: number;
  maxInputCharacters: number;
  maxRequestBytes: number;
  userRequestsPerMinute: number;
  guestRequestsPerMinute: number;
};

export type UserCreditStatus = {
  isGuest: false;
  userId: string;
  creditsAllocated: number;
  creditsUsed: number;
  creditsReserved: number;
  creditsRemaining: number;
  periodStart: string;
  periodEnd: string;
  resetDate: string;
  isLowBalance: boolean;
  isExhausted: boolean;
};

export type GuestCreditStatus = {
  isGuest: true;
  guestId: string;
  trialCreditsAllocated: number;
  trialCreditsUsed: number;
  trialCreditsReserved: number;
  trialCreditsRemaining: number;
  isExhausted: boolean;
  expiresAt: string;
};

export type CreditStatus = UserCreditStatus | GuestCreditStatus;

export type ReservationResult = {
  ok: boolean;
  reservationId?: string;
  creditsReserved?: number;
  creditsRemaining?: number;
  errorCode?: QuotaErrorCode;
  errorMessage?: string;
  requiresSignIn?: boolean;
  resetDate?: string;
};

export type SettlementResult = {
  ok: boolean;
  creditsSettled: number;
  creditsRemaining: number;
  isEstimated: boolean;
};

export const guestSessionCookieSchema = z.object({
  guestId: z.string().uuid(),
  createdAt: z.number(),
  expiresAt: z.number(),
  signature: z.string(),
});

export type GuestSessionPayload = z.infer<typeof guestSessionCookieSchema>;
