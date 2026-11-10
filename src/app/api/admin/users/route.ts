import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { requireAdminUser } from "@/lib/ai-gateway/admin";
import { getCurrentUtcMonthPeriod } from "@/lib/ai-gateway/credits";

function getAdminClient() {
  const config = getSupabaseConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!config || !serviceKey) return null;
  return createClient(config.url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET() {
  const adminAuth = await requireAdminUser();
  if (!adminAuth.ok) {
    return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.status });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database service unavailable." }, { status: 503 });
  }

  try {
    const { periodStart } = getCurrentUtcMonthPeriod();

    const { data: profiles } = await admin
      .from("profiles")
      .select("id,email,display_name,created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    const { data: periods } = await admin
      .from("ai_credit_periods")
      .select("user_id,credits_allocated,credits_used,credits_reserved,updated_at")
      .eq("period_start", periodStart);

    const periodMap = new Map((periods || []).map((p) => [p.user_id, p]));

    const users = (profiles || []).map((prof) => {
      const period = periodMap.get(prof.id);
      const allocated = period?.credits_allocated ?? 1000;
      const used = Number(period?.credits_used ?? 0);
      const reserved = Number(period?.credits_reserved ?? 0);
      const remaining = Math.max(0, allocated - used - reserved);

      return {
        id: prof.id,
        email: prof.email,
        displayName: prof.display_name,
        creditsAllocated: allocated,
        creditsUsed: Number(used.toFixed(1)),
        creditsReserved: Number(reserved.toFixed(1)),
        creditsRemaining: Number(remaining.toFixed(1)),
        lastActive: period?.updated_at || prof.created_at,
      };
    });

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: "Could not load user quota list." }, { status: 500 });
  }
}
