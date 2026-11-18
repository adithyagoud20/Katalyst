"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Megaphone, X } from "lucide-react";
import type { SiteAnnouncement, SiteLaunchEvent } from "@/lib/site-content-schema";

type ActiveSiteContent = { announcement: SiteAnnouncement | null; launchEvent: SiteLaunchEvent | null };

export function SiteContentNotices({ isHome }: { isHome: boolean }) {
  const [content, setContent] = useState<ActiveSiteContent>({ announcement: null, launchEvent: null });
  const [dismissedAnnouncementKey, setDismissedAnnouncementKey] = useState<string | null>(null);
  const [dismissedLaunchStart, setDismissedLaunchStart] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/site-content", { signal });
      if (!response.ok) return;
      const next = await response.json() as ActiveSiteContent;
      setContent({
        announcement: next.announcement && typeof next.announcement.title === "string" ? next.announcement : null,
        launchEvent: next.launchEvent && typeof next.launchEvent.videoUrl === "string" ? next.launchEvent : null,
      });
    } catch {
      // A temporary notice-service outage should not block the app.
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const initialRefresh = window.setTimeout(() => void refresh(controller.signal), 0);
    const interval = window.setInterval(() => void refresh(controller.signal), 30_000);
    return () => {
      controller.abort();
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
    };
  }, [refresh]);

  const launch = content.launchEvent;
  const announcement = content.announcement;
  const announcementKey = announcement ? `${announcement.startsAt}:${announcement.title}` : "";
  const shouldOpenLaunch = Boolean(isHome && launch && dismissedLaunchStart !== launch.startsAt);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (shouldOpenLaunch && !dialog.open) {
      try {
        dialog.showModal();
      } catch {
        // Keep the launch video available in the ordinary home layout if native dialogs are unavailable.
      }
    } else if (!shouldOpenLaunch && dialog.open) {
      dialog.querySelector("video")?.pause();
      dialog.close();
    }
  }, [shouldOpenLaunch]);

  const dismissLaunch = () => {
    if (launch) setDismissedLaunchStart(launch.startsAt);
    dialogRef.current?.querySelector("video")?.pause();
    dialogRef.current?.close();
  };

  return (
    <div className="site-content-notices">
      {announcement && dismissedAnnouncementKey !== announcementKey && (
        <aside className={`site-announcement site-announcement-${announcement.tone}`} role="region" aria-label="KATALYST announcement">
          <span className="site-announcement-icon"><Megaphone size={17} aria-hidden="true" /></span>
          <div className="site-announcement-copy">
            <strong>{announcement.title}</strong>
            <p>{announcement.message}</p>
          </div>
          {announcement.actionLabel && announcement.actionUrl && (
            <a className="site-announcement-action" href={announcement.actionUrl} target={announcement.actionUrl.startsWith("http") ? "_blank" : undefined} rel={announcement.actionUrl.startsWith("http") ? "noopener noreferrer" : undefined}>
              {announcement.actionLabel}<ArrowUpRight size={14} aria-hidden="true" />
            </a>
          )}
          <button type="button" className="site-announcement-dismiss" aria-label="Dismiss announcement" onClick={() => setDismissedAnnouncementKey(announcementKey)}><X size={16} /></button>
        </aside>
      )}

      {isHome && launch && (
        <dialog
          ref={dialogRef}
          className="launch-event-dialog"
          aria-labelledby="launch-event-title"
          aria-describedby="launch-event-message"
          onCancel={(event) => { event.preventDefault(); dismissLaunch(); }}
          onClick={(event) => { if (event.target === dialogRef.current) dismissLaunch(); }}
        >
          <div className="launch-event-shell">
            <div className="launch-event-heading">
              <div><span className="eyebrow">KATALYST · LAUNCH EVENT</span><h2 id="launch-event-title">{launch.title}</h2></div>
              <button type="button" className="site-announcement-dismiss" aria-label="Close launch video" onClick={dismissLaunch}><X size={18} /></button>
            </div>
            <p id="launch-event-message">{launch.message}</p>
            <video className="launch-event-video" src={launch.videoUrl} crossOrigin="anonymous" controls autoPlay muted playsInline preload="metadata">
              Your browser does not support embedded video. Use the video link from the announcement to watch the launch.
            </video>
            <div className="launch-event-footer"><span>Video starts muted. Use the player controls to turn on sound.</span><button type="button" className="primary-button" onClick={dismissLaunch}>Continue to KATALYST</button></div>
          </div>
        </dialog>
      )}
    </div>
  );
}
