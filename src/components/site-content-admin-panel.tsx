"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Megaphone, Save, Video } from "lucide-react";
import { emptySiteContent, type SiteContent } from "@/lib/site-content-schema";

type ScheduleDraft = {
  announcement: Omit<SiteContent["announcement"], "startsAt" | "endsAt"> & { startsAt: string; endsAt: string };
  launchEvent: Omit<SiteContent["launchEvent"], "startsAt" | "endsAt"> & { startsAt: string; endsAt: string };
};

function toLocalInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function toIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toDraft(content: SiteContent): ScheduleDraft {
  return {
    announcement: { ...content.announcement, startsAt: toLocalInput(content.announcement.startsAt), endsAt: toLocalInput(content.announcement.endsAt) },
    launchEvent: { ...content.launchEvent, startsAt: toLocalInput(content.launchEvent.startsAt), endsAt: toLocalInput(content.launchEvent.endsAt) },
  };
}

function toPayload(draft: ScheduleDraft): SiteContent {
  return {
    announcement: { ...draft.announcement, startsAt: toIso(draft.announcement.startsAt), endsAt: toIso(draft.announcement.endsAt) },
    launchEvent: { ...draft.launchEvent, startsAt: toIso(draft.launchEvent.startsAt), endsAt: toIso(draft.launchEvent.endsAt) },
  };
}

export function SiteContentAdminPanel() {
  const [draft, setDraft] = useState<ScheduleDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let alive = true;
    void fetch("/api/admin/site-content", { cache: "no-store" }).then(async (response) => {
      const result = await response.json() as { content?: SiteContent; error?: string };
      if (!response.ok) throw new Error(result.error || "Could not load public site content.");
      if (alive) setDraft(toDraft(result.content ?? emptySiteContent));
    }).catch((loadError: unknown) => {
      if (alive) setError(loadError instanceof Error ? loadError.message : "Could not load public site content.");
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft || saving) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(draft)),
      });
      const result = await response.json() as { content?: SiteContent; error?: string; auditLogged?: boolean };
      if (!response.ok) throw new Error(result.error || "Could not save public site content.");
      if (result.content) setDraft(toDraft(result.content));
      setSuccess(result.auditLogged === false
        ? "Public content saved, but its audit record could not be confirmed. Check the Admin audit log setup."
        : "Public banner and launch schedule saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save public site content.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <section className="site-content-admin"><p role="status">Loading announcements and launch schedule…</p></section>;
  if (!draft) return <section className="site-content-admin"><p className="inline-error" role="alert">{error || "Site content settings are unavailable."}</p><p className="settings-explainer">Apply the site-content database migration and make sure the server has its service-role credential.</p></section>;

  const setAnnouncement = (patch: Partial<ScheduleDraft["announcement"]>) => setDraft((current) => current ? { ...current, announcement: { ...current.announcement, ...patch } } : current);
  const setLaunchEvent = (patch: Partial<ScheduleDraft["launchEvent"]>) => setDraft((current) => current ? { ...current, launchEvent: { ...current.launchEvent, ...patch } } : current);

  return (
    <section className="site-content-admin" aria-labelledby="site-content-admin-title">
      <div className="context-head"><div><h3 id="site-content-admin-title">Public announcement &amp; launch video</h3><p>Schedule a plain-text site banner and a home-screen launch event. Times use this device’s timezone.</p></div><CalendarClock size={19} aria-hidden="true" /></div>
      {error && <p className="inline-error" role="alert">{error}</p>}
      {success && <p className="inline-success" role="status">{success}</p>}

      <form className="site-content-admin-form" onSubmit={(event) => void save(event)}>
        <fieldset className="site-content-admin-group">
          <legend><Megaphone size={16} /> Announcement banner</legend>
          <label className="checkbox-label"><input type="checkbox" checked={draft.announcement.enabled} onChange={(event) => setAnnouncement({ enabled: event.target.checked })} /> Show during the scheduled window</label>
          <div className="site-content-admin-grid">
            <label>Style<select value={draft.announcement.tone} onChange={(event) => setAnnouncement({ tone: event.target.value as "info" | "important" })}><option value="info">Information</option><option value="important">Important</option></select></label>
            <label>Title<input maxLength={120} value={draft.announcement.title} onChange={(event) => setAnnouncement({ title: event.target.value })} /></label>
            <label className="site-content-admin-wide">Message<textarea rows={3} maxLength={420} value={draft.announcement.message} onChange={(event) => setAnnouncement({ message: event.target.value })} /></label>
            <label>Action label (optional)<input maxLength={36} value={draft.announcement.actionLabel} onChange={(event) => setAnnouncement({ actionLabel: event.target.value })} placeholder="Explore the update" /></label>
            <label>Action link (optional)<input maxLength={1024} value={draft.announcement.actionUrl} onChange={(event) => setAnnouncement({ actionUrl: event.target.value })} placeholder="/courses or https://…" /></label>
            <label>Starts<input type="datetime-local" value={draft.announcement.startsAt} onChange={(event) => setAnnouncement({ startsAt: event.target.value })} required={draft.announcement.enabled} /></label>
            <label>Ends<input type="datetime-local" value={draft.announcement.endsAt} onChange={(event) => setAnnouncement({ endsAt: event.target.value })} required={draft.announcement.enabled} /></label>
          </div>
        </fieldset>

        <fieldset className="site-content-admin-group">
          <legend><Video size={16} /> Home launch event</legend>
          <label className="checkbox-label"><input type="checkbox" checked={draft.launchEvent.enabled} onChange={(event) => setLaunchEvent({ enabled: event.target.checked })} /> Open the event on Home during the scheduled window</label>
          <div className="site-content-admin-grid">
            <label>Title<input maxLength={120} value={draft.launchEvent.title} onChange={(event) => setLaunchEvent({ title: event.target.value })} required={draft.launchEvent.enabled} /></label>
            <label className="site-content-admin-wide">Message<textarea rows={3} maxLength={420} value={draft.launchEvent.message} onChange={(event) => setLaunchEvent({ message: event.target.value })} required={draft.launchEvent.enabled} /></label>
            <label className="site-content-admin-wide">Public MP4/WebM video URL<input type="url" maxLength={2048} value={draft.launchEvent.videoUrl} onChange={(event) => setLaunchEvent({ videoUrl: event.target.value })} placeholder="https://your-video-host/launch.mp4" required={draft.launchEvent.enabled} /></label>
            <label>Starts<input type="datetime-local" value={draft.launchEvent.startsAt} onChange={(event) => setLaunchEvent({ startsAt: event.target.value })} required={draft.launchEvent.enabled} /></label>
            <label>Ends<input type="datetime-local" value={draft.launchEvent.endsAt} onChange={(event) => setLaunchEvent({ endsAt: event.target.value })} required={draft.launchEvent.enabled} /></label>
          </div>
          <p className="settings-explainer">The video opens in a dismissible launch dialog on Home, starts muted, and includes native controls. Host an MP4/WebM file at a public HTTPS URL that sends an Access-Control-Allow-Origin header for this site (or * for a public video). Use a video CDN or object store; do not upload large media through this settings form.</p>
        </fieldset>

        <div className="account-actions"><button type="submit" className="primary-button" disabled={saving}><Save size={15} />{saving ? "Saving…" : "Save public content"}</button></div>
      </form>
    </section>
  );
}
