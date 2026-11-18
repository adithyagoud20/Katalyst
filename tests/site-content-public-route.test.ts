import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { readSiteContent } = vi.hoisted(() => ({ readSiteContent: vi.fn() }));
vi.mock("@/lib/site-content-service", () => ({ readSiteContent }));

import { GET } from "@/app/api/site-content/route";
import { emptySiteContent } from "@/lib/site-content-schema";

describe("public active site content route", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-18T12:00:00.000Z"));
    readSiteContent.mockReset();
  });

  afterEach(() => vi.useRealTimers());

  it("returns active content while withholding future and expired content", async () => {
    const content = structuredClone(emptySiteContent);
    content.announcement = {
      enabled: true,
      tone: "info",
      title: "Now live",
      message: "The update is ready.",
      actionLabel: "",
      actionUrl: "",
      startsAt: "2026-11-18T11:00:00.000Z",
      endsAt: "2026-11-18T13:00:00.000Z",
    };
    content.launchEvent = {
      enabled: true,
      title: "Tomorrow",
      message: "Not public yet.",
      videoUrl: "https://media.example.test/launch.mp4",
      startsAt: "2026-11-19T11:00:00.000Z",
      endsAt: "2026-11-19T13:00:00.000Z",
    };
    readSiteContent.mockResolvedValue(content);

    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("s-maxage=10");
    await expect(response.json()).resolves.toEqual({ announcement: content.announcement, launchEvent: null });
  });

  it("fails closed without returning storage errors to visitors", async () => {
    readSiteContent.mockRejectedValue(new Error("private storage failure"));
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ announcement: null, launchEvent: null });
  });
});
