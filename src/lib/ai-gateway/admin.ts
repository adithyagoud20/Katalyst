import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getVerifiedSupabaseUser } from "@/lib/supabase/server";

function getAdminClient() {
  const config = getSupabaseConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!config || !serviceKey) return null;
  return createClient(config.url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function isEmailConfiguredAdmin(email?: string | null): boolean {
  if (!email) return false;
  const adminEmails = (process.env.KATALYST_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

export async function checkIsAppAdmin(userId: string, email?: string | null): Promise<boolean> {
  // Check bootstrap environment list first
  if (isEmailConfiguredAdmin(email)) return true;

  const admin = getAdminClient();
  if (!admin) return false;

  try {
    const { data } = await admin
      .from("app_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}

export async function requireAdminUser() {
  const verified = await getVerifiedSupabaseUser();
  if (!verified.configured || !verified.supabase) {
    return { ok: false as const, status: 503, error: "Authentication service is not configured." };
  }
  if (!verified.user) {
    return { ok: false as const, status: 401, error: "Sign in to access admin capabilities." };
  }
  const isAdmin = await checkIsAppAdmin(verified.user.id, verified.user.email);
  if (!isAdmin) {
    return { ok: false as const, status: 403, error: "Access denied. Administrator privileges required." };
  }
  return { ok: true as const, user: verified.user, supabase: verified.supabase };
}

export async function recordAdminAuditLog(params: {
  actorId: string;
  actorEmail: string;
  action: string;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  ipAddress?: string | null;
}): Promise<void> {
  const admin = getAdminClient();
  if (!admin) return;

  try {
    await admin.from("ai_admin_audit_log").insert({
      actor_id: params.actorId,
      actor_email: params.actorEmail,
      action: params.action,
      previous_state: params.previousState ?? null,
      new_state: params.newState ?? null,
      ip_address: params.ipAddress ?? null,
    });
  } catch {
    // Ignore audit log persistence failure
  }
}

export type AdminAnalyticsData = {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  activeUsers: number;
  guestCount: number;
  totalCreditsDeducted: number;
  estimatedCount: number;
  actualCount: number;
  modelDistribution: Record<string, number>;
  dailyUsage: Array<{ date: string; requests: number; credits: number }>;
  quotaExhaustionCount: number;
  dailyThresholdStatus: {
    consumedToday: number;
    threshold: number;
    warningThreshold: number;
    isWarning: boolean;
    isExceeded: boolean;
  };
};

export async function getAdminAnalytics(): Promise<AdminAnalyticsData> {
  const admin = getAdminClient();
  const emptyResult: AdminAnalyticsData = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    activeUsers: 0,
    guestCount: 0,
    totalCreditsDeducted: 0,
    estimatedCount: 0,
    actualCount: 0,
    modelDistribution: {},
    dailyUsage: [],
    quotaExhaustionCount: 0,
    dailyThresholdStatus: {
      consumedToday: 0,
      threshold: 100000,
      warningThreshold: 80000,
      isWarning: false,
      isExceeded: false,
    },
  };

  if (!admin) return emptyResult;

  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const { data: ledger } = await admin
      .from("ai_usage_ledger")
      .select("user_id,guest_id,model_id,credits_deducted,is_estimated,outcome,created_at")
      .gte("created_at", fourteenDaysAgo);

    if (!ledger) return emptyResult;

    const totalRequests = ledger.length;
    let successfulRequests = 0;
    let failedRequests = 0;
    let totalCreditsDeducted = 0;
    let estimatedCount = 0;
    let actualCount = 0;
    let consumedToday = 0;

    const usersSet = new Set<string>();
    const guestsSet = new Set<string>();
    const modelDistribution: Record<string, number> = {};
    const dailyMap: Record<string, { requests: number; credits: number }> = {};

    for (const row of ledger) {
      if (row.outcome === "success") successfulRequests++;
      else failedRequests++;

      const creds = Number(row.credits_deducted ?? 0);
      totalCreditsDeducted += creds;

      if (new Date(row.created_at) >= todayStart) {
        consumedToday += creds;
      }

      if (row.is_estimated) estimatedCount++;
      else actualCount++;

      if (row.user_id) usersSet.add(row.user_id);
      if (row.guest_id) guestsSet.add(row.guest_id);

      const mId = row.model_id || "unknown";
      modelDistribution[mId] = (modelDistribution[mId] || 0) + 1;

      const dayStr = row.created_at.slice(0, 10);
      if (!dailyMap[dayStr]) dailyMap[dayStr] = { requests: 0, credits: 0 };
      dailyMap[dayStr].requests++;
      dailyMap[dayStr].credits += creds;
    }

    const dailyUsage = Object.entries(dailyMap)
      .map(([date, val]) => ({ date, requests: val.requests, credits: Number(val.credits.toFixed(1)) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get system config for thresholds
    const { data: sysConfig } = await admin.from("ai_system_config").select("global_daily_threshold_credits,global_warning_threshold_credits").eq("id", 1).maybeSingle();
    const threshold = Number(sysConfig?.global_daily_threshold_credits ?? 100000);
    const warningThreshold = Number(sysConfig?.global_warning_threshold_credits ?? 80000);

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      activeUsers: usersSet.size,
      guestCount: guestsSet.size,
      totalCreditsDeducted: Number(totalCreditsDeducted.toFixed(1)),
      estimatedCount,
      actualCount,
      modelDistribution,
      dailyUsage,
      quotaExhaustionCount: 0,
      dailyThresholdStatus: {
        consumedToday: Number(consumedToday.toFixed(1)),
        threshold,
        warningThreshold,
        isWarning: consumedToday >= warningThreshold && consumedToday < threshold,
        isExceeded: consumedToday >= threshold,
      },
    };
  } catch {
    return emptyResult;
  }
}
