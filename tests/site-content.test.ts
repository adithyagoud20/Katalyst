import { afterEach, describe, expect, it, vi } from "vitest";
import { emptySiteContent, isScheduleActive, launchEventSchema, siteAnnouncementSchema } from "@/lib/site-content-schema";
import { getSiteOrigin } from "@/lib/site-origin";

afterEach(() => vi.unstubAllEnvs());

describe("admin-authored site content validation", () => {
  it("accepts a same-site announcement with a scheduled interval", () => {
    const result = siteAnnouncementSchema.safeParse({
      ...emptySiteContent.announcement,
      enabled: true,
      title: "Launch day",
      message: "The studio is open.",
      actionLabel: "Explore courses",
      actionUrl: "/courses",
      startsAt: "2026-11-18T09:00:00.000Z",
      endsAt: "2026-11-18T18:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a public HTTPS video host", () => {
    expect(launchEventSchema.safeParse({
      ...emptySiteContent.launchEvent,
      enabled: true,
      title: "Launch",
      message: "Welcome",
      videoUrl: "https://media.example.com/katalyst-launch.mp4",
      startsAt: "2026-11-18T09:00:00.000Z",
      endsAt: "2026-11-18T18:00:00.000Z",
    }).success).toBe(true);
  });

  it.each(["javascript:alert(1)", "//attacker.example.com/path", "https://127.0.0.1/secret", "https://localhost/video.mp4", "https://192.168.1.1/video.mp4", "https://2130706433/video.mp4", "https://media.example.test/video.mp4"])("rejects unsafe public URLs: %s", (url) => {
    const result = launchEventSchema.safeParse({
      ...emptySiteContent.launchEvent,
      enabled: true,
      title: "Launch",
      message: "Welcome",
      videoUrl: url,
      startsAt: "2026-11-18T09:00:00.000Z",
      endsAt: "2026-11-18T18:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });

  it("requires valid windows and action pairs before publishing", () => {
    expect(siteAnnouncementSchema.safeParse({ ...emptySiteContent.announcement, enabled: true, title: "Notice", message: "Hello" }).success).toBe(false);
    expect(siteAnnouncementSchema.safeParse({ ...emptySiteContent.announcement, actionLabel: "Go" }).success).toBe(false);
    expect(launchEventSchema.safeParse({ ...emptySiteContent.launchEvent, enabled: true, title: "Launch", message: "Hello", videoUrl: "https://media.example.test/video.mp4", startsAt: "2026-11-19T12:00:00Z", endsAt: "2026-11-18T12:00:00Z" }).success).toBe(false);
  });

  it("activates content only inside its half-open schedule window", () => {
    const start = Date.parse("2026-11-18T09:00:00.000Z");
    const end = Date.parse("2026-11-18T18:00:00.000Z");
    expect(isScheduleActive(true, new Date(start).toISOString(), new Date(end).toISOString(), start - 1)).toBe(false);
    expect(isScheduleActive(true, new Date(start).toISOString(), new Date(end).toISOString(), start)).toBe(true);
    expect(isScheduleActive(true, new Date(start).toISOString(), new Date(end).toISOString(), end)).toBe(false);
    expect(isScheduleActive(false, new Date(start).toISOString(), new Date(end).toISOString(), start)).toBe(false);
  });
});

describe("canonical origin selection for Vercel hosting", () => {
  it("uses the configured production .vercel.app origin", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://katalyst-studio.vercel.app");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "other-project.vercel.app");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("NODE_ENV", "production");
    expect(getSiteOrigin()).toBe("https://katalyst-studio.vercel.app");
  });

  it("ignores stale custom-domain values and uses the Vercel project alias", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://old-custom-domain.example");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "katalyst-studio.vercel.app");
    expect(getSiteOrigin()).toBe("https://katalyst-studio.vercel.app");
  });

  it("uses a deployment alias for previews, not as a production canonical", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "preview-123.vercel.app");
    expect(getSiteOrigin()).toBe("https://preview-123.vercel.app");
  });

  it("rejects a configured path and falls back to the production project alias", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://katalyst-studio.vercel.app/path");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "katalyst-studio.vercel.app");
    expect(getSiteOrigin()).toBe("https://katalyst-studio.vercel.app");
  });

  it("fails closed on a Vercel production build with no .vercel.app origin", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://old-custom-domain.example");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "old-custom-domain.example");
    vi.stubEnv("VERCEL_URL", "deployment-id.vercel.app");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => getSiteOrigin()).toThrow(/production \.vercel\.app origin/);
  });
});
