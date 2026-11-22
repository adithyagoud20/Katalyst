import { expect, test, type Page } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const sizes = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(sizes.document, `${label} document width ${sizes.document}px exceeded ${sizes.viewport}px`).toBeLessThanOrEqual(sizes.viewport);
  expect(sizes.body, `${label} body width ${sizes.body}px exceeded ${sizes.viewport}px`).toBeLessThanOrEqual(sizes.viewport);
}

async function expectMinimumTargetHeight(locator: import("@playwright/test").Locator, minHeight = 44) {
  await expect(locator).toBeVisible();
  const height = await locator.evaluate((element) => element.getBoundingClientRect().height);
  expect(height, "mobile control should meet the minimum touch height").toBeGreaterThanOrEqual(minHeight);
}

async function selectSidebarView(page: Page, name: string) {
  const menu = page.getByRole("button", { name: "Open navigation" });
  if (await menu.isVisible()) {
    await menu.click();
    await expect(page.locator(".sidebar")).toHaveClass(/sidebar-open/);
  }
  await page.locator(".sidebar").getByRole("button", { name, exact: true }).click();
}

test.describe("390px mobile MVP", () => {
  test("guest learning pages stay in the viewport and Playground opens a full-screen IDE", async ({ page }) => {
    await page.goto("/#katalyst=home");
    await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");
    await expect(page.getByRole("heading", { name: /explore how things work/i })).toBeVisible();
    await expectNoHorizontalOverflow(page, "Home");
    await expect(page).not.toHaveURL(/\/login/);
    await expectMinimumTargetHeight(page.locator(".topbar .theme-quick-toggle"));
    await expectMinimumTargetHeight(page.getByRole("button", { name: "Open settings", exact: true }));
    await expect(page.locator(".topbar .provider-selector, .topbar .model-selector, .topbar .model-managed-label")).toHaveCount(0);

    await selectSidebarView(page, "Explore Learning Paths");
    await expect(page.getByRole("heading", { name: "Build a foundation" })).toBeVisible();
    await expectNoHorizontalOverflow(page, "Explore");
    const pathsView = page.locator(".learning-view.learning-paths");
    await expect.poll(() => pathsView.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
    await pathsView.evaluate((element) => { element.scrollTop = 320; });
    await expect(page.locator(".topbar")).toHaveClass(/topbar-collapsed/);
    await pathsView.evaluate((element) => { element.scrollTop = 0; });
    await expect(page.locator(".topbar")).not.toHaveClass(/topbar-collapsed/);
    const firstCourse = page.locator(".course-card-unified").first();
    const start = page.getByRole("button", { name: /start learning|continue this course/i }).first();
    if (!(await start.isVisible().catch(() => false))) await firstCourse.click();
    await expect(start).toBeVisible();
    await start.click();
    await expect(page.getByRole("heading", { name: "From source code to output" })).toBeVisible();
    for (const name of ["Learn", "Code", "Kat"]) {
      await expectMinimumTargetHeight(page.getByRole("tab", { name }));
    }
    await expectNoHorizontalOverflow(page, "Lesson");

    const learningPanel = page.locator("#learning-panel");
    await expect.poll(() => learningPanel.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
    await learningPanel.evaluate((element) => { element.scrollTop = 320; });
    await expect(page.locator(".topbar")).toHaveClass(/topbar-collapsed/);
    await learningPanel.evaluate((element) => { element.scrollTop = 0; });
    await expect(page.locator(".topbar")).not.toHaveClass(/topbar-collapsed/);
    await page.waitForTimeout(250);
    await expect(page).not.toHaveURL(/\/login/);

    await selectSidebarView(page, "Playground");
    await expect(page.getByRole("heading", { name: "Runtime & Lab Launcher" })).toBeVisible();
    await expectNoHorizontalOverflow(page, "Playground launcher");
    await page.getByText("Launch C Workbench").click();
    await expect(page.locator(".app-shell")).toHaveClass(/app-shell-ide/);
    await expectNoHorizontalOverflow(page, "C Workbench");

    const editor = await page.locator(".c-source-editor-host").boundingBox();
    expect(editor?.height).toBeGreaterThan(380);
    await expect(page.locator(".c-stdin-editor")).toBeHidden();
    await expect(page.locator(".c-output-pane")).toBeHidden();
    await expect(page.locator(".c-console-output")).toHaveCSS("overflow-y", "auto");

    const main = page.locator(".main-panel");
    const scrollable = await main.evaluate((element) => element.scrollHeight > element.clientHeight);
    expect(scrollable).toBe(false);
    await page.getByRole("button", { name: "Run", exact: true }).click();
    await expect(page.locator(".c-output-pane")).toBeVisible();
    await expect(page.locator(".c-console-output")).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);

    await page.getByRole("button", { name: "All Labs" }).click();
    await page.getByText("Launch Arduino Lab").click();
    const boardLab = page.locator(".circuit-simulator-root");
    await expect(boardLab).toBeVisible();
    await expect.poll(() => boardLab.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
    await boardLab.evaluate((element) => { element.scrollTop = element.scrollHeight; });
    await expect.poll(() => boardLab.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await page.getByLabel("Switch Runtime or Lab").selectOption("circuit:esp32");
    await expect(boardLab).toContainText("ESP32 IoT Lab");
    await boardLab.evaluate((element) => { element.scrollTop = element.scrollHeight; });
    await expect.poll(() => boardLab.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);

    await page.goto("/download");
    await expect(page.getByRole("heading", { name: "Your studio, one tap away." })).toBeVisible();
    await expectNoHorizontalOverflow(page, "Download");
  });

  test("serves a complete install manifest and a secret-free health summary", async ({ page, request }) => {
    await page.goto("/download");
    const manifestResponse = await request.get("/manifest.webmanifest");
    expect(manifestResponse.ok()).toBe(true);
    const manifest = await manifestResponse.json();
    expect(manifest.name).toBe("KATALYST — Interactive Learning Studio");
    expect(manifest.short_name).toBe("KATALYST");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ sizes: "192x192", type: "image/png" }),
      expect.objectContaining({ sizes: "512x512", type: "image/png" }),
      expect.objectContaining({ purpose: "maskable" }),
    ]));

    for (const icon of manifest.icons as Array<{ src: string }>) {
      const response = await request.get(icon.src);
      expect(response.ok(), `manifest icon ${icon.src} should resolve`).toBe(true);
    }

    const favicon = await request.get("/icon.png");
    expect(favicon.ok()).toBe(true);
    const faviconBytes = await favicon.body();
    expect(faviconBytes.readUInt32BE(16)).toBe(512);
    expect(faviconBytes.readUInt32BE(20)).toBe(512);

    const socialImage = await request.get("/opengraph-image.png");
    expect(socialImage.ok()).toBe(true);
    expect(socialImage.headers()["content-type"]).toContain("image/png");
    const socialImageBytes = await socialImage.body();
    expect(socialImageBytes.readUInt32BE(16)).toBe(1200);
    expect(socialImageBytes.readUInt32BE(20)).toBe(630);

    const healthResponse = await request.get("/api/health");
    expect(healthResponse.ok()).toBe(true);
    const health = await healthResponse.json();
    expect(health.ok).toBe(true);
    expect(health.coursesCount).toBe(19);
    expect(typeof health.services.cloudflareConfigured).toBe("boolean");
    expect(typeof health.services.supabaseConfigured).toBe("boolean");
    expect(JSON.stringify(health)).not.toMatch(/(?:api[_-]?key|secret|token)\s*[:=]\s*[^\s,}]+/i);
  });
});
