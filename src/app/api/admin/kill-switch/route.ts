import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { requireAdminUser, recordAdminAuditLog } from "@/lib/ai-gateway/admin";
import { getAiSystemConfig, invalidateConfigCache } from "@/lib/ai-gateway/config";

function getAdminClient() {
  const config = getSupabaseConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!config || !serviceKey) return null;
  return createClient(config.url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: NextRequest) {
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

  const parsed = z.object({ active: z.boolean() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Active state boolean required." }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database service unavailable." }, { status: 503 });
  }

  const previousSystem = await getAiSystemConfig();

  await admin
    .from("ai_system_config")
    .update({
      kill_switch_active: parsed.data.active,
      updated_at: new Date().toISOString(),
      updated_by: adminAuth.user.id,
    })
    .eq("id", 1);

  invalidateConfigCache();

  await recordAdminAuditLog({
    actorId: adminAuth.user.id,
    actorEmail: adminAuth.user.email || "admin",
    action: parsed.data.active ? "emergency_kill_switch_activated" : "emergency_kill_switch_deactivated",
    previousState: { killSwitchActive: previousSystem.killSwitchActive },
    newState: { killSwitchActive: parsed.data.active },
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0] || null,
  });

  return NextResponse.json({ success: true, killSwitchActive: parsed.data.active });
}
