import { NextResponse } from "next/server";
import { requireAdminUser, getAdminAnalytics } from "@/lib/ai-gateway/admin";

export async function GET() {
  const adminAuth = await requireAdminUser();
  if (!adminAuth.ok) {
    return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.status });
  }

  const analytics = await getAdminAnalytics();
  return NextResponse.json(analytics);
}
