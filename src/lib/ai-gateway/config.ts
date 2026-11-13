import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { AISystemConfig, AIModelConfig, AICreditPolicies } from "./types";

const DEFAULT_SYSTEM_CONFIG: AISystemConfig = {
  sharedAiEnabled: true,
  killSwitchActive: false,
  selectedModelId: "@cf/meta/llama-3.3-70b-instruct",
  globalDailyThresholdCredits: 100000,
  globalWarningThresholdCredits: 80000,
  updatedAt: new Date().toISOString(),
};

const DEFAULT_CREDIT_POLICIES: AICreditPolicies = {
  monthlyAuthenticatedCredits: 1000,
  guestTrialCredits: 50,
  maxInputCharacters: 44000,
  maxRequestBytes: 192000,
  userRequestsPerMinute: 15,
  guestRequestsPerMinute: 6,
};

const DEFAULT_MODEL_CONFIGS: Record<string, AIModelConfig> = {
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast": {
    modelId: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    enabled: true,
    creditWeight: 1.0,
    tokenCostMultiplier: 1.0,
    maxInputTokens: 4096,
    maxOutputTokens: 2048,
  },
  "@cf/meta/llama-3.3-70b-instruct": {
    modelId: "@cf/meta/llama-3.3-70b-instruct",
    enabled: true,
    creditWeight: 1.0,
    tokenCostMultiplier: 1.0,
    maxInputTokens: 4096,
    maxOutputTokens: 2048,
  },
  "@cf/meta/llama-3.1-8b-instruct-fp8": {
    modelId: "@cf/meta/llama-3.1-8b-instruct-fp8",
    enabled: true,
    creditWeight: 0.5,
    tokenCostMultiplier: 0.5,
    maxInputTokens: 4096,
    maxOutputTokens: 2048,
  },
  "@cf/meta/llama-3.1-8b-instruct": {
    modelId: "@cf/meta/llama-3.1-8b-instruct",
    enabled: true,
    creditWeight: 0.5,
    tokenCostMultiplier: 0.5,
    maxInputTokens: 4096,
    maxOutputTokens: 2048,
  },
  "@cf/qwen/qwen2.5-coder-32b-instruct": {
    modelId: "@cf/qwen/qwen2.5-coder-32b-instruct",
    enabled: true,
    creditWeight: 1.0,
    tokenCostMultiplier: 1.0,
    maxInputTokens: 4096,
    maxOutputTokens: 2048,
  },
  "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b": {
    modelId: "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
    enabled: true,
    creditWeight: 1.0,
    tokenCostMultiplier: 1.0,
    maxInputTokens: 4096,
    maxOutputTokens: 2048,
  },
};

function getAdminClient() {
  const config = getSupabaseConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!config || !serviceKey) return null;
  return createClient(config.url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// In-memory short-lived cache (10 seconds)
let cachedConfig: { data: AISystemConfig; expiresAt: number } | null = null;
let cachedPolicies: { data: AICreditPolicies; expiresAt: number } | null = null;

export async function getAiSystemConfig(): Promise<AISystemConfig> {
  const now = Date.now();
  if (cachedConfig && cachedConfig.expiresAt > now) {
    return cachedConfig.data;
  }
  const admin = getAdminClient();
  if (!admin) return DEFAULT_SYSTEM_CONFIG;

  try {
    const { data, error } = await admin
      .from("ai_system_config")
      .select("shared_ai_enabled,kill_switch_active,selected_model_id,global_daily_threshold_credits,global_warning_threshold_credits,updated_at")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return DEFAULT_SYSTEM_CONFIG;

    const result: AISystemConfig = {
      sharedAiEnabled: Boolean(data.shared_ai_enabled),
      killSwitchActive: Boolean(data.kill_switch_active),
      selectedModelId: data.selected_model_id || DEFAULT_SYSTEM_CONFIG.selectedModelId,
      globalDailyThresholdCredits: Number(data.global_daily_threshold_credits ?? DEFAULT_SYSTEM_CONFIG.globalDailyThresholdCredits),
      globalWarningThresholdCredits: Number(data.global_warning_threshold_credits ?? DEFAULT_SYSTEM_CONFIG.globalWarningThresholdCredits),
      updatedAt: data.updated_at || new Date().toISOString(),
    };
    cachedConfig = { data: result, expiresAt: now + 10_000 };
    return result;
  } catch {
    return DEFAULT_SYSTEM_CONFIG;
  }
}

export async function getAiCreditPolicies(): Promise<AICreditPolicies> {
  const now = Date.now();
  if (cachedPolicies && cachedPolicies.expiresAt > now) {
    return cachedPolicies.data;
  }
  const admin = getAdminClient();
  if (!admin) return DEFAULT_CREDIT_POLICIES;

  try {
    const { data, error } = await admin
      .from("ai_credit_policies")
      .select("monthly_authenticated_credits,guest_trial_credits,max_input_characters,max_request_bytes,user_requests_per_minute,guest_requests_per_minute")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return DEFAULT_CREDIT_POLICIES;

    const result: AICreditPolicies = {
      monthlyAuthenticatedCredits: Number(data.monthly_authenticated_credits ?? 1000),
      guestTrialCredits: Number(data.guest_trial_credits ?? 50),
      maxInputCharacters: Number(data.max_input_characters ?? 44000),
      maxRequestBytes: Number(data.max_request_bytes ?? 192000),
      userRequestsPerMinute: Number(data.user_requests_per_minute ?? 15),
      guestRequestsPerMinute: Number(data.guest_requests_per_minute ?? 6),
    };
    cachedPolicies = { data: result, expiresAt: now + 10_000 };
    return result;
  } catch {
    return DEFAULT_CREDIT_POLICIES;
  }
}

export async function getAiModelConfig(modelId: string): Promise<AIModelConfig> {
  const admin = getAdminClient();
  if (!admin) return DEFAULT_MODEL_CONFIGS[modelId] || {
    modelId,
    enabled: true,
    creditWeight: 1.0,
    tokenCostMultiplier: 1.0,
    maxInputTokens: 4096,
    maxOutputTokens: 2048,
  };

  try {
    const { data } = await admin
      .from("ai_model_config")
      .select("model_id,enabled,credit_weight,token_cost_multiplier,max_input_tokens,max_output_tokens")
      .eq("model_id", modelId)
      .maybeSingle();

    if (!data) {
      return DEFAULT_MODEL_CONFIGS[modelId] || {
        modelId,
        enabled: true,
        creditWeight: 1.0,
        tokenCostMultiplier: 1.0,
        maxInputTokens: 4096,
        maxOutputTokens: 2048,
      };
    }

    return {
      modelId: data.model_id,
      enabled: Boolean(data.enabled),
      creditWeight: Number(data.credit_weight ?? 1.0),
      tokenCostMultiplier: Number(data.token_cost_multiplier ?? 1.0),
      maxInputTokens: Number(data.max_input_tokens ?? 4096),
      maxOutputTokens: Number(data.max_output_tokens ?? 2048),
    };
  } catch {
    return DEFAULT_MODEL_CONFIGS[modelId] || {
      modelId,
      enabled: true,
      creditWeight: 1.0,
      tokenCostMultiplier: 1.0,
      maxInputTokens: 4096,
      maxOutputTokens: 2048,
    };
  }
}

export function invalidateConfigCache() {
  cachedConfig = null;
  cachedPolicies = null;
}
