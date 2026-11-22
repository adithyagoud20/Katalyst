import { expect, test } from "@playwright/test";

test.describe("Milestone M21 Architecture & Platform Expansion E2E Suite", () => {
  // Test 1: 9-Course Catalog & Category Filtering Pills
  test("filters 9-course catalog via category pills in Explore view", async ({ page }) => {
    await page.goto("/#katalyst=paths");
    await expect(page.getByRole("heading", { name: "Build a foundation" })).toBeVisible();

    // Verify all 14 courses visible under "All"
    const allCards = page.locator(".course-card-unified");
    await expect(allCards).toHaveCount(14);

    // Filter by Databases
    await page.getByRole("tab", { name: "Databases" }).click();
    const dbCards = page.locator(".course-card-unified");
    await expect(dbCards).toHaveCount(1);
    await expect(dbCards.first()).toContainText("Relational Databases & SQL Foundations");

    // Filter by Web
    await page.getByRole("tab", { name: "Web" }).click();
    const webCards = page.locator(".course-card-unified");
    await expect(webCards).toHaveCount(3); // html-css-web, js-systems-algorithms & ai-app-web-dev

    // Filter by Hardware
    await page.getByRole("tab", { name: "Hardware" }).click();
    const hwCards = page.locator(".course-card-unified");
    await expect(hwCards).toHaveCount(5); // digital-logic-circuits, arduino-embedded, esp32-iot-systems, breadboard-electronics & circuits-eee-core

    // Filter by AI & Media
    await page.getByRole("tab", { name: "AI & Media" }).click();
    const aiCards = page.locator(".course-card-unified");
    await expect(aiCards).toHaveCount(3); // prompt-engineering, photo-editing-media & ai-app-web-dev

    // Reset to All
    await page.getByRole("tab", { name: "All" }).click();
    await expect(page.locator(".course-card-unified")).toHaveCount(15);
  });

  test("shows the full catalog first, then keeps course details aligned with the selected category", async ({ page }) => {
    await page.goto("/#katalyst=paths");
    const details = page.locator(".path-detail-shell");
    await expect(details).toBeHidden();
    await page.getByRole("tab", { name: "Hardware" }).click();
    await page.getByRole("button", { name: /Arduino Uno Embedded Systems/i }).click();
    await expect(details).toBeVisible();
    await expect(details.getByRole("heading", { name: /Arduino Uno Embedded Systems/i })).toBeVisible();

    await page.getByRole("tab", { name: "Databases" }).click();
    await expect(details.getByRole("heading", { name: /Relational Databases & SQL Foundations/i })).toBeVisible();
    await page.getByRole("button", { name: "All courses" }).click();
    await expect(details).toBeHidden();
    await expect(page.locator(".course-card-unified")).toHaveCount(14);
  });

  // Test 2: Unified Multi-Language Playground Switcher & HTML Live Sandbox Preview
  test("switches runtimes in the unified Playground and renders HTML live sandbox preview", async ({ page }) => {
    await page.goto("/#katalyst=playground");

    // From Launcher grid, launch SQL Workbench
    await page.getByText("Launch SQL Workbench").click();
    await expect(page.locator(".ide-file-status code")).toHaveText("query.sql");
    await expect(page.locator(".c-pane-heading strong", { hasText: "query.sql" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Run", exact: true })).toBeVisible();
    const sqliteWasm = await page.request.get("/vendor/sqljs/sql-wasm.wasm");
    expect(sqliteWasm.status(), "SQLite WebAssembly asset must be served to the browser").toBe(200);
    expect(sqliteWasm.headers()["content-type"], "SQLite WASM asset must have the correct media type").toContain("application/wasm");

    const runSql = page.getByRole("button", { name: "Run", exact: true });
    await runSql.click();
    await expect(page.locator(".c-console-output")).toContainText("Ada Lovelace");
    await expect(page.locator(".c-run-status")).toContainText("Execution completed");
    await runSql.click();
    await expect(page.locator(".c-console-output")).toContainText("Grace Hopper");
    await expect(page.locator(".c-run-status")).toContainText("Execution completed");

    // Use runtime dropdown switcher to switch to HTML Live Preview
    const switcher = page.locator("#runtime-switcher-select");
    await expect(switcher).toBeVisible();
    await switcher.selectOption("code:html");
    await expect(page.locator(".ide-file-status code")).toHaveText("index.html");
    await expect(page.locator(".c-pane-heading strong", { hasText: "index.html" })).toBeVisible();

    // Verify HTML live sandbox iframe is rendered
    const previewFrame = page.locator("iframe[title='HTML Live Sandbox Preview']");
    await expect(previewFrame).toBeHidden();
    await page.getByRole("button", { name: "Output", exact: true }).click();
    await expect(previewFrame).toBeVisible();

    // Test Mobile / Desktop viewport toggle
    const mobileBtn = page.getByTitle("Mobile Preview (375px)");
    await expect(mobileBtn).toBeVisible();
    await mobileBtn.click();
    await expect(previewFrame).toHaveCSS("width", "375px");

    const desktopBtn = page.getByTitle("Desktop Preview");
    await desktopBtn.click();
    await expect(previewFrame).toHaveCSS("width", /.+px/);
  });

  // Test 3: On-Demand Curriculum API & Lesson Detail Delivery
  test("fetches full lesson details on-demand via /api/curriculum/lesson", async ({ page }) => {
    const response = await page.request.get("/api/curriculum/lesson?courseId=sql-databases&lessonId=sql-relational-tables");
    expect(response.status()).toBe(200);

    const lesson = await response.json();
    expect(lesson.id).toBe("sql-relational-tables");
    expect(lesson.title).toBe("Relational Schemas, Tables, and Data Types");
    expect(lesson.content).toContain("CREATE TABLE");
    expect(lesson.exercise).toBeDefined();
    expect(lesson.exercise.testCases.length).toBeGreaterThanOrEqual(1);
    expect(response.headers()["cache-control"]).toContain("max-age=3600");
  });

  // Test 4: Image & Color Lab Interactive Visualizer
  test("navigates into Computational Photography and interacts with Image Lab visualizer", async ({ page }) => {
    await page.goto("/#katalyst=lesson&course=photo-editing-media&lesson=media-pixels-rgba-buffers");

    // Verify Interactive Image Lab heading and canvas
    await expect(page.getByRole("heading", { name: "Interactive Image & Color Lab" }).first()).toBeVisible();
    const canvas = page.locator(".canvas-wrapper canvas");
    await expect(canvas).toBeVisible();

    // Verify convolution filter buttons exist
    await expect(page.getByRole("button", { name: "sharpen", exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "blur", exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "edge", exact: false })).toBeVisible();

    // Verify Tone Adjustments sliders exist
    await expect(page.getByText("Exposure / Brightness")).toBeVisible();
    await expect(page.getByText("Contrast", { exact: true })).toBeVisible();
    await expect(page.getByText("Color Saturation")).toBeVisible();
  });
});
