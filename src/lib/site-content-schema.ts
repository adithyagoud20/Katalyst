import { z } from "zod";

function isSafePublicHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    const labels = host.split(".");
    const ipv4 = labels.length === 4 && labels.every((part) => /^\d{1,3}$/.test(part))
      ? labels.map(Number)
      : null;
    const privateIpv4 = ipv4 && (
      ipv4.some((octet) => octet > 255)
      || ipv4[0] === 0
      || ipv4[0] === 10
      || ipv4[0] === 127
      || ipv4[0] >= 224
      || (ipv4[0] === 169 && ipv4[1] === 254)
      || (ipv4[0] === 172 && ipv4[1] >= 16 && ipv4[1] <= 31)
      || (ipv4[0] === 192 && (ipv4[1] === 168 || (ipv4[1] === 0 && (ipv4[2] === 0 || ipv4[2] === 2))))
      || (ipv4[0] === 100 && ipv4[1] >= 64 && ipv4[1] <= 127)
      || (ipv4[0] === 198 && (ipv4[1] === 18 || ipv4[1] === 19 || (ipv4[1] === 51 && ipv4[2] === 100)))
      || (ipv4[0] === 203 && ipv4[1] === 0 && ipv4[2] === 113)
    );
    return url.protocol === "https:"
      && !url.username
      && !url.password
      && host !== "localhost"
      && !host.endsWith(".localhost")
      && !host.endsWith(".local")
      && !host.endsWith(".internal")
      && !["test", "example", "invalid"].includes(labels.at(-1) ?? "")
      && labels.length > 1
      && !privateIpv4
      && !host.startsWith("[");
  } catch {
    return false;
  }
}

const scheduleDateSchema = z.string().datetime({ offset: true }).nullable();

export const siteAnnouncementSchema = z.object({
  enabled: z.boolean(),
  tone: z.enum(["info", "important"]),
  title: z.string().trim().max(120),
  message: z.string().trim().max(420),
  actionLabel: z.string().trim().max(36),
  actionUrl: z.string().trim().max(1024),
  startsAt: scheduleDateSchema,
  endsAt: scheduleDateSchema,
}).strict().superRefine((announcement, context) => {
  if (announcement.enabled && (!announcement.title || !announcement.message)) {
    context.addIssue({ code: "custom", path: [!announcement.title ? "title" : "message"], message: "An enabled announcement needs a title and message." });
  }
  if (Boolean(announcement.actionLabel) !== Boolean(announcement.actionUrl)) {
    context.addIssue({ code: "custom", path: ["actionUrl"], message: "Provide both the action label and destination, or leave both empty." });
  }
  if (announcement.actionUrl) {
    const internalPath = announcement.actionUrl.startsWith("/")
      && !announcement.actionUrl.startsWith("//")
      && !announcement.actionUrl.includes("\\");
    if (!internalPath && !isSafePublicHttpsUrl(announcement.actionUrl)) {
      context.addIssue({ code: "custom", path: ["actionUrl"], message: "Use a same-site path or a public HTTPS URL." });
    }
  }
  if (announcement.enabled && (!announcement.startsAt || !announcement.endsAt)) {
    context.addIssue({ code: "custom", path: ["startsAt"], message: "Set the announcement start and end times." });
  }
  if (announcement.startsAt && announcement.endsAt && Date.parse(announcement.endsAt) <= Date.parse(announcement.startsAt)) {
    context.addIssue({ code: "custom", path: ["endsAt"], message: "The end time must be after the start time." });
  }
});

export const launchEventSchema = z.object({
  enabled: z.boolean(),
  title: z.string().trim().max(120),
  message: z.string().trim().max(420),
  videoUrl: z.string().trim().max(2048),
  startsAt: scheduleDateSchema,
  endsAt: scheduleDateSchema,
}).strict().superRefine((event, context) => {
  if (event.enabled && (!event.title || !event.message || !event.videoUrl)) {
    const path = !event.title ? "title" : !event.message ? "message" : "videoUrl";
    context.addIssue({ code: "custom", path: [path], message: "An enabled launch event needs a title, message, and video URL." });
  }
  if (event.videoUrl && !isSafePublicHttpsUrl(event.videoUrl)) {
    context.addIssue({ code: "custom", path: ["videoUrl"], message: "Use a public HTTPS video URL. Local, private, and non-HTTPS URLs are not allowed." });
  }
  if (event.enabled && (!event.startsAt || !event.endsAt)) {
    context.addIssue({ code: "custom", path: ["startsAt"], message: "Set the event start and end times." });
  }
  if (event.startsAt && event.endsAt && Date.parse(event.endsAt) <= Date.parse(event.startsAt)) {
    context.addIssue({ code: "custom", path: ["endsAt"], message: "The end time must be after the start time." });
  }
});

export const siteContentSchema = z.object({
  announcement: siteAnnouncementSchema,
  launchEvent: launchEventSchema,
}).strict();

export type SiteAnnouncement = z.infer<typeof siteAnnouncementSchema>;
export type SiteLaunchEvent = z.infer<typeof launchEventSchema>;
export type SiteContent = z.infer<typeof siteContentSchema>;

export const emptySiteContent: SiteContent = {
  announcement: {
    enabled: false,
    tone: "info",
    title: "",
    message: "",
    actionLabel: "",
    actionUrl: "",
    startsAt: null,
    endsAt: null,
  },
  launchEvent: {
    enabled: false,
    title: "",
    message: "",
    videoUrl: "",
    startsAt: null,
    endsAt: null,
  },
};

export function isScheduleActive(enabled: boolean, startsAt: string | null, endsAt: string | null, now = Date.now()): boolean {
  return enabled
    && startsAt !== null
    && endsAt !== null
    && Date.parse(startsAt) <= now
    && Date.parse(endsAt) > now;
}
