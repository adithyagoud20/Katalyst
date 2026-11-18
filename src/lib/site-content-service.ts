import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { emptySiteContent, siteContentSchema, type SiteContent } from "@/lib/site-content-schema";

function getAdminClient() {
  const config = getSupabaseConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!config || !serviceKey) return null;
  return createClient(config.url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

function contentFromRow(row: Record<string, unknown> | null): SiteContent {
  if (!row) return emptySiteContent;
  const parsed = siteContentSchema.safeParse({
    announcement: {
      enabled: row.announcement_enabled,
      tone: row.announcement_tone,
      title: row.announcement_title,
      message: row.announcement_message,
      actionLabel: row.announcement_action_label,
      actionUrl: row.announcement_action_url,
      startsAt: row.announcement_starts_at,
      endsAt: row.announcement_ends_at,
    },
    launchEvent: {
      enabled: row.launch_event_enabled,
      title: row.launch_event_title,
      message: row.launch_event_message,
      videoUrl: row.launch_event_video_url,
      startsAt: row.launch_event_starts_at,
      endsAt: row.launch_event_ends_at,
    },
  });
  if (!parsed.success) throw new Error("Stored site content is invalid.");
  return parsed.data;
}

export async function readSiteContent(): Promise<SiteContent> {
  const admin = getAdminClient();
  if (!admin) throw new Error("Site content storage is not configured.");
  const { data, error } = await admin.from("site_content").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error("Site content could not be loaded.");
  return contentFromRow(data as Record<string, unknown> | null);
}

export async function writeSiteContent(content: SiteContent, actorId: string): Promise<SiteContent> {
  const admin = getAdminClient();
  if (!admin) throw new Error("Site content storage is not configured.");
  const row = {
    id: 1,
    announcement_enabled: content.announcement.enabled,
    announcement_tone: content.announcement.tone,
    announcement_title: content.announcement.title,
    announcement_message: content.announcement.message,
    announcement_action_label: content.announcement.actionLabel,
    announcement_action_url: content.announcement.actionUrl,
    announcement_starts_at: content.announcement.startsAt,
    announcement_ends_at: content.announcement.endsAt,
    launch_event_enabled: content.launchEvent.enabled,
    launch_event_title: content.launchEvent.title,
    launch_event_message: content.launchEvent.message,
    launch_event_video_url: content.launchEvent.videoUrl,
    launch_event_starts_at: content.launchEvent.startsAt,
    launch_event_ends_at: content.launchEvent.endsAt,
    updated_at: new Date().toISOString(),
    updated_by: actorId,
  };
  const { data, error } = await admin.from("site_content").upsert(row, { onConflict: "id" }).select("*").single();
  if (error) throw new Error("Site content could not be saved.");
  return contentFromRow(data as Record<string, unknown>);
}
