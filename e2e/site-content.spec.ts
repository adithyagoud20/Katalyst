import { expect, test } from "@playwright/test";

test.describe("public announcements and scheduled launch video", () => {
  test("lets an administrator prepare a banner and future launch event", async ({ page }) => {
    let savedPayload: Record<string, unknown> | undefined;
    await page.route("**/api/ai/session", (route) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ isAdmin: true, creditStatus: null, system: null }),
    }));
    await page.route("**/api/admin/config", (route) => route.request().method() === "GET"
      ? route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        system: { sharedAiEnabled: true, killSwitchActive: false, selectedModelId: "test/model", globalDailyThresholdCredits: 100000, globalWarningThresholdCredits: 80000, updatedAt: "2026-11-18T00:00:00.000Z" },
        policies: { monthlyAuthenticatedCredits: 1000, guestTrialCredits: 50, maxInputCharacters: 12000, maxRequestBytes: 192000, userRequestsPerMinute: 10, guestRequestsPerMinute: 5 },
        models: [],
      }) })
      : route.continue());
    await page.route("**/api/admin/analytics", (route) => route.fulfill({ status: 403, contentType: "application/json", body: "{}" }));
    await page.route("**/api/admin/users", (route) => route.fulfill({ status: 403, contentType: "application/json", body: "{}" }));
    await page.route("**/api/admin/site-content", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: {
          announcement: { enabled: false, tone: "info", title: "", message: "", actionLabel: "", actionUrl: "", startsAt: null, endsAt: null },
          launchEvent: { enabled: false, title: "", message: "", videoUrl: "", startsAt: null, endsAt: null },
        } }) });
      }
      savedPayload = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, auditLogged: true }) });
    });

    await page.goto("/");
    await page.getByRole("button", { name: "Open settings", exact: true }).click();
    await page.getByRole("tab", { name: "Admin", exact: true }).click();
    const panel = page.getByRole("region", { name: "Public announcement & launch video" });
    await expect(panel).toBeVisible();

    const banner = panel.getByRole("group", { name: "Announcement banner" });
    await banner.getByLabel("Show during the scheduled window").check();
    await banner.getByLabel("Title").fill("Opening day");
    await banner.getByLabel("Message").fill("Welcome to the studio.");
    await banner.getByLabel("Starts").fill("2030-11-18T09:00");
    await banner.getByLabel("Ends").fill("2030-11-18T10:00");

    const launch = panel.getByRole("group", { name: "Home launch event" });
    await launch.getByLabel("Open the event on Home during the scheduled window").check();
    await launch.getByLabel("Title").fill("Welcome video");
    await launch.getByLabel("Message").fill("A short hello from the team.");
    await launch.getByLabel("Public MP4/WebM video URL").fill("https://media.example.com/launch.mp4");
    await launch.getByLabel("Starts").fill("2030-11-18T09:00");
    await launch.getByLabel("Ends").fill("2030-11-18T10:00");
    await panel.getByRole("button", { name: "Save public content" }).click();
    await expect(panel.getByRole("status")).toContainText("Public banner and launch schedule saved.");
    expect(savedPayload).toMatchObject({
      announcement: { enabled: true, title: "Opening day", message: "Welcome to the studio.", startsAt: expect.any(String), endsAt: expect.any(String) },
      launchEvent: { enabled: true, title: "Welcome video", videoUrl: "https://media.example.com/launch.mp4", startsAt: expect.any(String), endsAt: expect.any(String) },
    });
  });

  test("renders admin copy as text and opens a dismissible muted launch event on Home", async ({ page }) => {
    const announcementTitle = '<img src=x onerror="alert(1)"> Launch notice';
    await page.route("https://media.example.com/**", (route) => route.fulfill({ status: 200, contentType: "video/mp4", headers: { "Access-Control-Allow-Origin": "*" }, body: Buffer.alloc(0) }));
    await page.route("**/api/site-content", (route) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        announcement: {
          enabled: true,
          tone: "important",
          title: announcementTitle,
          message: "We are opening the studio today.",
          actionLabel: "Explore courses",
          actionUrl: "/courses",
          startsAt: "2026-11-17T00:00:00.000Z",
          endsAt: "2026-11-20T00:00:00.000Z",
        },
        launchEvent: {
          enabled: true,
          title: "Welcome to KATALYST",
          message: "A short note from the team.",
          videoUrl: "https://media.example.com/katalyst-launch.mp4",
          startsAt: "2026-11-17T00:00:00.000Z",
          endsAt: "2026-11-20T00:00:00.000Z",
        },
      }),
    }));

    await page.goto("/#katalyst=home");
    const banner = page.getByRole("region", { name: "KATALYST announcement" });
    await expect(banner.getByText(announcementTitle, { exact: true })).toBeVisible();
    await expect(banner.locator("img")).toHaveCount(0);
    await expect(banner.getByRole("link", { name: /explore courses/i })).toHaveAttribute("href", "/courses");

    const launchDialog = page.getByRole("dialog", { name: "Welcome to KATALYST" });
    await expect(launchDialog).toBeVisible();
    const video = launchDialog.locator("video");
    await expect(video).toHaveAttribute("src", "https://media.example.com/katalyst-launch.mp4");
    await expect(video).toHaveAttribute("crossorigin", "anonymous");
    expect(await video.evaluate((element: HTMLVideoElement) => ({ muted: element.muted, autoplay: element.autoplay, controls: element.controls, inline: element.playsInline }))).toEqual({ muted: true, autoplay: true, controls: true, inline: true });
    await launchDialog.getByRole("button", { name: "Continue to KATALYST" }).click();
    await expect(launchDialog).toBeHidden();
    await banner.getByRole("button", { name: "Dismiss announcement" }).click();
    await expect(banner).toBeHidden();
  });

  test("does not show notices outside their scheduled window", async ({ page }) => {
    await page.route("**/api/site-content", (route) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ announcement: null, launchEvent: null }),
    }));
    await page.goto("/#katalyst=home");
    await expect(page.locator(".site-announcement")).toHaveCount(0);
    await expect(page.locator(".launch-event-dialog")).not.toBeVisible();
  });

  test("keeps the admin content API closed to guests", async ({ request }) => {
    const response = await request.get("/api/admin/site-content");
    expect([401, 403, 503]).toContain(response.status());
    const body = await response.json() as { content?: unknown };
    expect(body.content).toBeUndefined();
  });
});
