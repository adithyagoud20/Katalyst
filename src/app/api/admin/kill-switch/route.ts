import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { sameOriginMutation } from "@/lib/account-server";
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
  if (!sameOriginMutation(request)) {
    return NextResponse.json({ error: "This admin change must come from the KATALYST site." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  const adminAuth = await requireAdminUser();
  if (!adminAuth.ok) {
    return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.status });
  }

  const maxBodyBytes = 1024;
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > maxBodyBytes) return NextResponse.json({ error: "Admin request payload is too large." }, { status: 413, headers: { "Cache-Control": "no-store" } });

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > maxBodyBytes) return NextResponse.json({ error: "Admin request payload is too large." }, { status: 413, headers: { "Cache-Control": "no-store" } });
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const parsed = z.object({ active: z.boolean() }).strict().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Active state boolean required." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database service unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
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

  return NextResponse.json({ success: true, killSwitchActive: parsed.data.active }, { headers: { "Cache-Control": "no-store" } });
}
