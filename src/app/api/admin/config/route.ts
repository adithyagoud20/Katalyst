import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { requireAdminUser, recordAdminAuditLog } from "@/lib/ai-gateway/admin";
import { getAiSystemConfig, getAiCreditPolicies, invalidateConfigCache } from "@/lib/ai-gateway/config";

function getAdminClient() {
  const config = getSupabaseConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!config || !serviceKey) return null;
  return createClient(config.url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const updateConfigSchema = z.object({
  system: z.object({
    sharedAiEnabled: z.boolean().optional(),
    killSwitchActive: z.boolean().optional(),
    selectedModelId: z.string().min(1).optional(),
    globalDailyThresholdCredits: z.number().int().min(100).optional(),
    globalWarningThresholdCredits: z.number().int().min(100).optional(),
  }).optional(),
  policies: z.object({
    monthlyAuthenticatedCredits: z.number().int().min(10).optional(),
    guestTrialCredits: z.number().int().min(5).optional(),
    userRequestsPerMinute: z.number().int().min(1).max(120).optional(),
    guestRequestsPerMinute: z.number().int().min(1).max(60).optional(),
    maxInputCharacters: z.number().int().min(1000).max(100000).optional(),
  }).optional(),
  models: z.record(z.string(), z.object({
    enabled: z.boolean().optional(),
    creditWeight: z.number().min(0.1).max(100).optional(),
  })).optional(),
});

export async function GET() {
  const adminAuth = await requireAdminUser();
  if (!adminAuth.ok) {
    return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.status });
  }

  const system = await getAiSystemConfig();
  const policies = await getAiCreditPolicies();
  const admin = getAdminClient();

  let models: Array<{ model_id: string; enabled: boolean; credit_weight: number }> = [];
  if (admin) {
    const { data } = await admin
      .from("ai_model_config")
      .select("model_id,enabled,credit_weight")
      .order("model_id");
    if (data) models = data;
  }

  return NextResponse.json({ system, policies, models });
}

export async function PUT(request: NextRequest) {
  const adminAuth = await requireAdminUser();
  if (!adminAuth.ok) {
    return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = updateConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", issues: parsed.error.issues }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database service unavailable." }, { status: 503 });
  }

  const previousSystem = await getAiSystemConfig();
  const previousPolicies = await getAiCreditPolicies();

  if (parsed.data.system) {
    await admin
      .from("ai_system_config")
      .update({
        ...(parsed.data.system.sharedAiEnabled !== undefined ? { shared_ai_enabled: parsed.data.system.sharedAiEnabled } : {}),
        ...(parsed.data.system.killSwitchActive !== undefined ? { kill_switch_active: parsed.data.system.killSwitchActive } : {}),
        ...(parsed.data.system.selectedModelId ? { selected_model_id: parsed.data.system.selectedModelId } : {}),
        ...(parsed.data.system.globalDailyThresholdCredits ? { global_daily_threshold_credits: parsed.data.system.globalDailyThresholdCredits } : {}),
        ...(parsed.data.system.globalWarningThresholdCredits ? { global_warning_threshold_credits: parsed.data.system.globalWarningThresholdCredits } : {}),
        updated_at: new Date().toISOString(),
        updated_by: adminAuth.user.id,
      })
      .eq("id", 1);
  }

  if (parsed.data.policies) {
    await admin
      .from("ai_credit_policies")
      .update({
        ...(parsed.data.policies.monthlyAuthenticatedCredits !== undefined ? { monthly_authenticated_credits: parsed.data.policies.monthlyAuthenticatedCredits } : {}),
        ...(parsed.data.policies.guestTrialCredits !== undefined ? { guest_trial_credits: parsed.data.policies.guestTrialCredits } : {}),
        ...(parsed.data.policies.userRequestsPerMinute !== undefined ? { user_requests_per_minute: parsed.data.policies.userRequestsPerMinute } : {}),
        ...(parsed.data.policies.guestRequestsPerMinute !== undefined ? { guest_requests_per_minute: parsed.data.policies.guestRequestsPerMinute } : {}),
        ...(parsed.data.policies.maxInputCharacters !== undefined ? { max_input_characters: parsed.data.policies.maxInputCharacters } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
  }

  if (parsed.data.models) {
    for (const [modelId, modConfig] of Object.entries(parsed.data.models)) {
      await admin
        .from("ai_model_config")
        .upsert({
          model_id: modelId,
          ...(modConfig.enabled !== undefined ? { enabled: modConfig.enabled } : {}),
          ...(modConfig.creditWeight !== undefined ? { credit_weight: modConfig.creditWeight } : {}),
          updated_at: new Date().toISOString(),
        });
    }
  }

  invalidateConfigCache();

  // Audit log
  await recordAdminAuditLog({
    actorId: adminAuth.user.id,
    actorEmail: adminAuth.user.email || "admin",
    action: "update_ai_config",
    previousState: { system: previousSystem, policies: previousPolicies },
    newState: parsed.data,
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0] || null,
  });

  return NextResponse.json({ success: true, updated: parsed.data });
}
