import { NextResponse } from "next/server";
import { isScheduleActive } from "@/lib/site-content-schema";
import { readSiteContent } from "@/lib/site-content-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const content = await readSiteContent();
    const now = Date.now();
    const announcement = isScheduleActive(content.announcement.enabled, content.announcement.startsAt, content.announcement.endsAt, now)
      ? content.announcement
      : null;
    const launchEvent = isScheduleActive(content.launchEvent.enabled, content.launchEvent.startsAt, content.launchEvent.endsAt, now)
      ? content.launchEvent
      : null;
    return NextResponse.json({ announcement, launchEvent }, {
      headers: { "Cache-Control": "public, max-age=10, s-maxage=10, stale-while-revalidate=30" },
    });
  } catch {
    return NextResponse.json({ announcement: null, launchEvent: null }, {
      headers: { "Cache-Control": "public, max-age=10, s-maxage=10, stale-while-revalidate=30" },
    });
  }
}
