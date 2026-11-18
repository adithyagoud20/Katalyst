import "server-only";
import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { getProvider } from "@/lib/providers";
import { isCloudflareModelId } from "@/lib/providers/cloudflare";
import { isProviderId, isSupportedModel, providerCatalog } from "@/lib/providers/catalog";
import { discoverModels } from "@/lib/providers/discovery";
import { getProviderApiKey, isSecureSessionKeyRequest, MAX_SESSION_KEY_LENGTH, SESSION_KEY_HEADER } from "@/lib/providers/credentials";
import { ProviderError } from "@/lib/providers/types";
import { CLOUDFLARE_ACCOUNT_HEADER, DEFAULT_OLLAMA_BASE_URL, MAX_OLLAMA_URL_LENGTH, OLLAMA_URL_HEADER } from "@/lib/providers/constants";
import { isLocalOllamaRequest } from "@/lib/providers/ollama";
import { getVerifiedSupabaseUser } from "@/lib/supabase/server";
import { getOrCreateGuestIdentity, GUEST_COOKIE_NAME } from "./guest";
import { consumeGuestNetworkLimit } from "./guest-network-limit";
import { getAiSystemConfig, getAiCreditPolicies, getAiModelConfig } from "./config";
import { consumeRateLimit } from "./rate-limiter";
import { reserveDailySharedBudget, releaseDailySharedBudget, settleDailySharedBudget } from "./global-budget";
import type { AICreditPolicies } from "./types";
import {
  calculateEstimatedReservationCredits,
  calculateSettledCredits,
  estimateTokensFromText,
  reserveCredits,
  settleCredits,
  releaseReservation,
} from "./credits";

export type GatewayChatInput = {
  provider: string;
  model: string;
  cloudflareMode?: "platform" | "byok";
  assistantSurface?: "workspace" | "kat";
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  context?: string;
};

export type GatewayChatResult = {
  text: string;
  provider: string;
  model: string;
  usage?: { inputTokens?: number; outputTokens?: number };
  creditsDeducted?: number;
  creditsRemaining?: number;
  isEstimated?: boolean;
  isByok?: boolean;
};

export class GatewayError extends Error {
  status: number;
  code?: string;
  errorKind?: string;
  requiresSignIn?: boolean;
  resetDate?: string;
  creditsRemaining?: number;

  constructor(message: string, status = 400, options: {
    code?: string;
    errorKind?: string;
    requiresSignIn?: boolean;
    resetDate?: string;
    creditsRemaining?: number;
  } = {}) {
    super(message);
    this.name = "GatewayError";
    this.status = status;
    this.code = options.code;
    this.errorKind = options.errorKind;
    this.requiresSignIn = options.requiresSignIn;
    this.resetDate = options.resetDate;
    this.creditsRemaining = options.creditsRemaining;
  }
}

function getGuestCookieValue(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${GUEST_COOKIE_NAME}=([^;]*)`));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1].trim()).replace(/^"|"$/g, "");
  } catch {
    return null;
  }
}

function createGuestSessionCookie(request: Request, token: string): string {
  const secure = process.env.NODE_ENV === "production" || new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${GUEST_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`;
}

async function enforceRequestRateLimit(identifier: string, isGuest: boolean, policies: AICreditPolicies, maxRequestsOverride?: number): Promise<void> {
  let status: Awaited<ReturnType<typeof consumeRateLimit>>;
  try {
    status = await consumeRateLimit(identifier, isGuest, policies, maxRequestsOverride);
  } catch {
    throw new GatewayError("AI requests are temporarily unavailable. Please try again shortly.", 503, {
      code: "RATE_LIMIT_STORE_UNAVAILABLE",
    });
  }
  if (!status.allowed) {
    throw new GatewayError(
      `Rate limit exceeded. Please wait ${status.retryAfterSeconds}s before sending another message.`,
      429,
      { code: "RATE_LIMIT_EXCEEDED" }
    );
  }
}

async function enforceGuestNetworkRateLimit(request: Request | NextRequest, policies: AICreditPolicies): Promise<void> {
  let status: Awaited<ReturnType<typeof consumeGuestNetworkLimit>>;
  try {
    status = await consumeGuestNetworkLimit(request, policies);
  } catch {
    throw new GatewayError("AI requests are temporarily unavailable. Please try again shortly.", 503, {
      code: "RATE_LIMIT_STORE_UNAVAILABLE",
    });
  }
  if (!status.allowed) {
    throw new GatewayError(
      `Too many AI requests are coming from this network. Please wait ${status.retryAfterSeconds}s before trying again.`,
      429,
      { code: "RATE_LIMIT_EXCEEDED" }
    );
  }
}

/**
 * Central AI Gateway Pipeline
 * Enforces server-side quota, reservations, rate-limits, and telemetry for shared AI,
 * while seamlessly servicing BYOK requests without credit consumption.
 */
export async function executeGatewayChat(
  request: Request | NextRequest,
  input: GatewayChatInput
): Promise<{ result: GatewayChatResult; setCookie?: string }> {
  const rawSessionKey = request.headers.get(SESSION_KEY_HEADER);
  const rawOllamaUrl = request.headers.get(OLLAMA_URL_HEADER);
  const rawCloudflareAccountId = request.headers.get(CLOUDFLARE_ACCOUNT_HEADER);

  if (input.provider === "cloudflare") {
    const mode = input.cloudflareMode ?? "platform";
    if (mode === "platform" && (rawSessionKey || rawCloudflareAccountId)) {
      throw new GatewayError("Cloudflare credentials are not accepted in platform mode. Choose BYOK explicitly to use personal credentials.", 400, { code: "UNEXPECTED_CLOUDFLARE_CREDENTIALS" });
    }
    if (mode === "byok" && (!rawSessionKey?.trim() || !rawCloudflareAccountId?.trim())) {
      throw new GatewayError("BYOK mode requires your own Cloudflare API token and account ID.", 400, { code: "BYOK_CREDENTIALS_REQUIRED" });
    }
    if (mode === "platform" && input.assistantSurface !== "kat") {
      throw new GatewayError("Shared Kat AI is available in the Kat tutor only. Choose BYOK to use your own Cloudflare account in Workspace.", 403, { code: "SHARED_AI_KAT_ONLY" });
    }
  }

  // Security & header validations
  if (rawOllamaUrl && rawOllamaUrl.length > MAX_OLLAMA_URL_LENGTH) {
    throw new GatewayError("The Ollama address is too long.", 400);
  }
  if (rawSessionKey && rawSessionKey.length > MAX_SESSION_KEY_LENGTH) {
    throw new GatewayError("The session API key is too long.", 400);
  }
  if (rawSessionKey && !isSecureSessionKeyRequest(request)) {
    throw new GatewayError("Session API keys can only be sent over HTTPS outside localhost.", 400);
  }
  if (rawCloudflareAccountId && rawCloudflareAccountId.length > 128) {
    throw new GatewayError("The Cloudflare account ID is too long.", 400);
  }

  // Aggregate text length check
  const inputCharacters = input.messages.reduce((total, message) => total + message.content.length, 0) + (input.context?.length ?? 0);
  if (inputCharacters > 44_000) {
    throw new GatewayError("Conversation and workspace context are limited to 44,000 characters per request.", 413, {
      code: "PAYLOAD_TOO_LARGE",
    });
  }

  if (!isProviderId(input.provider)) {
    throw new GatewayError("Choose a supported provider.", 400);
  }

  // --------------------------------------------------------------------------
  // BYOK PATHWAY:
  // If user selected non-cloudflare provider (Gemini, OpenAI, OpenRouter, Ollama)
  // OR provided their own personal session Cloudflare key, route to BYOK pipeline.
  // --------------------------------------------------------------------------
  const isByokRequest = input.provider !== "cloudflare" || input.cloudflareMode === "byok";

  if (isByokRequest) {
    if (input.provider === "ollama" && !isLocalOllamaRequest(request)) {
      throw new GatewayError("Ollama access is available only from a local KATALYST instance. Do not expose local inference to public users.", 403);
    }
    if (input.provider === "ollama" && rawSessionKey) {
      throw new GatewayError("Ollama uses local inference and does not accept cloud API keys.", 400);
    }
    if (input.provider !== "cloudflare" && rawCloudflareAccountId) {
      throw new GatewayError("A Cloudflare account ID can only be used with Cloudflare Workers AI.", 400);
    }

    const authUser = await getVerifiedSupabaseUser();
    const userId = authUser.user?.id || null;
    const creditPolicies = await getAiCreditPolicies();
    let guestId: string | null = null;
    let setCookie: string | undefined;
    if (!userId) {
      await enforceGuestNetworkRateLimit(request, creditPolicies);
      const guestData = await getOrCreateGuestIdentity(request, getGuestCookieValue(request));
      guestId = guestData.guestId;
      setCookie = createGuestSessionCookie(request, guestData.cookieToken);
    }
    await enforceRequestRateLimit(userId ? `user:${userId}` : `guest:${guestId}`, !userId, creditPolicies);

    const provider = getProvider(input.provider);
    const apiKey = input.provider === "ollama" ? undefined : input.provider === "cloudflare"
      ? rawSessionKey!.trim()
      : getProviderApiKey(input.provider, rawSessionKey);
    const cloudflareAccountId = input.provider === "cloudflare" ? rawCloudflareAccountId!.trim() : undefined;

    try {
      const availableModels = isSupportedModel(input.provider, input.model)
        ? null
        : (await discoverModels(input.provider, apiKey, { ...(input.provider === "cloudflare" ? { accountId: cloudflareAccountId } : {}) })).models;
      if (availableModels && !availableModels.some((m) => m.id === input.model)) {
        throw new GatewayError(`The selected model is not in the current ${providerCatalog[input.provider].name} catalog. Refresh models and choose a listed model.`, 400);
      }

      const generated = await provider.generate({
        ...input,
        apiKey,
        ...(input.provider === "cloudflare" ? { cloudflareAccountId } : {}),
        ...(input.provider === "ollama" ? { ollamaBaseUrl: rawOllamaUrl || DEFAULT_OLLAMA_BASE_URL } : {}),
        signal: request.signal,
      });

      return {
        result: {
          text: generated.text,
          provider: input.provider,
          model: input.model,
          ...(generated.usage ? { usage: generated.usage } : {}),
        },
        ...(setCookie ? { setCookie } : {}),
      };
    } catch (err) {
      if (err instanceof GatewayError) throw err;
      if (err instanceof ProviderError) {
        throw new GatewayError(err.message, err.status, { errorKind: err.kind });
      }
      if (err instanceof DOMException && err.name === "TimeoutError") {
        throw new GatewayError(`${provider.name} took too long to respond. Try again.`, 504);
      }
      throw new GatewayError(`Could not reach ${provider.name}. Check your connection and try again.`, 502);
    }
  }

  // --------------------------------------------------------------------------
  // SHARED CLOUDFLARE WORKERS AI GATEWAY PATHWAY:
  // --------------------------------------------------------------------------

  // Step 1: Session or guest identity validation
  const guestCookieVal = getGuestCookieValue(request);

  const authUser = await getVerifiedSupabaseUser();
  const userId = authUser.user?.id || null;
  const creditPolicies = await getAiCreditPolicies();

  let guestId: string | null = null;
  let setCookie: string | undefined;

  if (!userId) {
    await enforceGuestNetworkRateLimit(request, creditPolicies);
    const guestData = await getOrCreateGuestIdentity(request, guestCookieVal);
    guestId = guestData.guestId;
    setCookie = createGuestSessionCookie(request, guestData.cookieToken);
  }

  // Step 2: System kill switch & enablement checks
  const systemConfig = await getAiSystemConfig();
  if (systemConfig.killSwitchActive) {
    throw new GatewayError("KATALYST AI is temporarily paused by administrators for maintenance.", 503, {
      code: "KILL_SWITCH_ACTIVE",
    });
  }
  if (!systemConfig.sharedAiEnabled) {
    throw new GatewayError("Shared KATALYST AI inference is currently disabled.", 503, {
      code: "SHARED_AI_DISABLED",
    });
  }

  // Step 3: Model resolution & admin model lock. Public request bodies never
  // select the shared model; only the server-side admin setting is authoritative.
  const rawModelId = systemConfig.selectedModelId || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
  // Map historical model IDs to active Cloudflare inference IDs
  const targetModelId = rawModelId === "@cf/meta/llama-3.3-70b-instruct"
    ? "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
    : rawModelId === "@cf/meta/llama-3.1-8b-instruct"
      ? "@cf/meta/llama-3.1-8b-instruct-fp8"
      : rawModelId;
  if (!isCloudflareModelId(targetModelId)) {
    throw new GatewayError("The administrator-selected Kat AI model is invalid. Shared AI has been paused until it is corrected.", 503, { code: "MODEL_UNAVAILABLE" });
  }
  const modelConfig = await getAiModelConfig(targetModelId);
  if (!modelConfig.enabled) {
    throw new GatewayError("The configured shared AI model is temporarily unavailable.", 503, {
      code: "MODEL_UNAVAILABLE",
    });
  }

  const estimatedInputTokens = estimateTokensFromText(inputCharacters, 0).inputTokens;
  if (estimatedInputTokens > modelConfig.maxInputTokens) {
    throw new GatewayError(`This request is too large for the configured Kat AI model. Shorten the conversation to about ${modelConfig.maxInputTokens.toLocaleString()} input tokens.`, 413, { code: "PAYLOAD_TOO_LARGE" });
  }

  // Step 4: Rate limit check
  const rateLimitTarget = userId ? `user:${userId}` : `guest:${guestId}`;
  await enforceRequestRateLimit(rateLimitTarget, !userId, creditPolicies);

  // Step 5: Input & output bounds check
  if (inputCharacters > creditPolicies.maxInputCharacters) {
    throw new GatewayError(
      `Context exceeds the maximum allowed size of ${creditPolicies.maxInputCharacters.toLocaleString()} characters.`,
      413,
      { code: "PAYLOAD_TOO_LARGE" }
    );
  }

  // Step 6: Atomic credit reservation
  const idempotencyKey = crypto.randomUUID();
  const estimatedCredits = calculateEstimatedReservationCredits(modelConfig, inputCharacters);
  const dailyBudgetReservationId = crypto.randomUUID();
  const maxBillableCredits = calculateSettledCredits(
    modelConfig,
    Math.min(modelConfig.maxInputTokens, 16_000),
    Math.min(modelConfig.maxOutputTokens, 2_048),
  );
  let dailyBudgetAllowed: boolean;
  try {
    dailyBudgetAllowed = await reserveDailySharedBudget({
      reservationId: dailyBudgetReservationId,
      usageDate: new Date().toISOString().slice(0, 10),
      reserveCredits: Math.max(maxBillableCredits, estimatedCredits),
      dailyLimitCredits: systemConfig.globalDailyThresholdCredits,
    });
  } catch {
    throw new GatewayError("Shared Kat AI is temporarily unavailable because its daily usage limit could not be checked.", 503, { code: "DAILY_BUDGET_UNAVAILABLE" });
  }
  if (!dailyBudgetAllowed) {
    throw new GatewayError("Kat AI has reached its daily shared usage limit. Please try again after the UTC day resets or use your own provider key.", 429, { code: "DAILY_SHARED_BUDGET_REACHED" });
  }

  let reservation: Awaited<ReturnType<typeof reserveCredits>>;
  try {
    reservation = await reserveCredits({
      idempotencyKey,
      modelId: targetModelId,
      estimatedCredits,
      userId,
      guestId,
    });
  } catch {
    await releaseDailySharedBudget(dailyBudgetReservationId).catch(() => undefined);
    throw new GatewayError("Kat AI could not reserve your credit balance. Please try again shortly.", 503, { code: "CREDIT_RESERVATION_UNAVAILABLE" });
  }

  if (!reservation.ok) {
    await releaseDailySharedBudget(dailyBudgetReservationId).catch(() => undefined);
    throw new GatewayError(reservation.errorMessage || "AI credit reservation failed.", 403, {
      code: reservation.errorCode,
      requiresSignIn: reservation.requiresSignIn,
      resetDate: reservation.resetDate,
      creditsRemaining: reservation.creditsRemaining,
    });
  }

  const reservationId = reservation.reservationId!;

  // Step 7: Cloudflare inference execution
  const provider = getProvider("cloudflare");
  const cloudflareApiKey = process.env.CLOUDFLARE_API_TOKEN?.trim();
  const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();

  if (!cloudflareApiKey || !cloudflareAccountId) {
    await releaseReservation({ reservationId, outcome: "failure", errorKind: "unconfigured" });
    await releaseDailySharedBudget(dailyBudgetReservationId).catch(() => undefined);
    throw new GatewayError("Shared KATALYST AI server credentials are not configured.", 503);
  }

  let generated;
  try {
    generated = await provider.generate({
      ...input,
      model: targetModelId,
      maxOutputTokens: Math.min(modelConfig.maxOutputTokens, 2048),
      apiKey: cloudflareApiKey,
      cloudflareAccountId,
      signal: request.signal,
    });
  } catch (inferenceError) {
    // Release reservation on failure so user is not docked credits
    const isAbort = request.signal.aborted;
    await releaseReservation({
      reservationId,
      outcome: isAbort ? "cancelled" : "failure",
      errorKind: inferenceError instanceof ProviderError ? inferenceError.kind : "upstream_error",
    });
    await releaseDailySharedBudget(dailyBudgetReservationId).catch(() => undefined);

    if (inferenceError instanceof ProviderError) {
      throw new GatewayError(inferenceError.message, inferenceError.status, { errorKind: inferenceError.kind });
    }
    if (inferenceError instanceof DOMException && inferenceError.name === "TimeoutError") {
      throw new GatewayError("Cloudflare Workers AI took too long to respond. Try again.", 504);
    }
    throw new GatewayError("Could not reach Cloudflare Workers AI. Try again shortly.", 502);
  }

  // Step 8 & 9: Token accounting & Settlement
  let inputTokens = generated.usage?.inputTokens ?? 0;
  let outputTokens = generated.usage?.outputTokens ?? 0;
  let isEstimated = false;

  if (inputTokens <= 0 || outputTokens <= 0) {
    const est = estimateTokensFromText(inputCharacters, generated.text.length);
    inputTokens = inputTokens > 0 ? inputTokens : est.inputTokens;
    outputTokens = outputTokens > 0 ? outputTokens : est.outputTokens;
    isEstimated = true;
  }

  const actualCredits = calculateSettledCredits(modelConfig, inputTokens, outputTokens);

  // The global budget reservation uses a worst-case token allocation. Settle
  // its actual usage after successful inference and before returning output.
  try {
    await settleDailySharedBudget(dailyBudgetReservationId, actualCredits);
  } catch {
    // Keep the maximum reservation in place if accounting is temporarily down.
    // This is conservative for the shared daily cap and contains no prompt data.
    console.error("[ai-gateway] Shared daily budget settlement failed; reserved capacity is retained.");
  }

  const settlement = await settleCredits({
    reservationId,
    inputTokens,
    outputTokens,
    actualCredits,
    isEstimated,
  });

  return {
    result: {
      text: generated.text,
      provider: "cloudflare",
      model: targetModelId,
      usage: { inputTokens, outputTokens },
      creditsDeducted: actualCredits,
      creditsRemaining: settlement.creditsRemaining,
      isEstimated,
      isByok: false,
    },
    setCookie,
  };
}
