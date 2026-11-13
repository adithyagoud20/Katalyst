import { expect, test } from "@playwright/test";

test.describe("Milestone M21 Architecture & Platform Expansion E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    // Fast mock for Wasmer SDK browser package
    await page.route("**/vendor/wasmer-sdk/dist/index.js", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/javascript",
        body: `export class Wasmer {
          constructor() {
            this.packages = { load: async () => ({ entrypoint: "clang" }) };
            this.sandboxes = { create: async () => ({
              command: () => ({ spawn: async () => ({
                stdin: { write: async () => {}, close: async () => {} },
                wait: async () => ({ reason: "exited", exitCode: 0, stdout: { text: () => "mock C output" }, stderr: { text: () => "" } }),
                kill: async () => {},
              }) }),
              fs: { readFile: async () => new Uint8Array([1]) },
              installPackage: async () => {},
              close: async () => {},
            }) };
          }
          async close() {}
        }`,
      });
    });
  });

  // Test 1: 9-Course Catalog & Category Filtering Pills
  test("filters 9-course catalog via category pills in Explore view", async ({ page }) => {
    await page.goto("/#katalyst=paths");
    await expect(page.getByRole("heading", { name: "Build a foundation" })).toBeVisible();

    // Verify all 9 courses visible under "All"
    const allCards = page.locator(".course-card-unified");
    await expect(allCards).toHaveCount(9);

    // Filter by Databases
    await page.getByRole("tab", { name: "Databases" }).click();
    const dbCards = page.locator(".course-card-unified");
    await expect(dbCards).toHaveCount(1);
    await expect(dbCards.first()).toContainText("Relational Databases & SQL Foundations");

    // Filter by Web
    await page.getByRole("tab", { name: "Web" }).click();
    const webCards = page.locator(".course-card-unified");
    await expect(webCards).toHaveCount(2); // html-css-web & js-systems-algorithms

    // Filter by Hardware
    await page.getByRole("tab", { name: "Hardware" }).click();
    const hwCards = page.locator(".course-card-unified");
    await expect(hwCards).toHaveCount(1);
    await expect(hwCards.first()).toContainText("Digital Logic & Circuit Foundations");

    // Filter by AI & Media
    await page.getByRole("tab", { name: "AI & Media" }).click();
    const aiCards = page.locator(".course-card-unified");
    await expect(aiCards).toHaveCount(2); // prompt-engineering & photo-editing-media

    // Reset to All
    await page.getByRole("tab", { name: "All" }).click();
    await expect(page.locator(".course-card-unified")).toHaveCount(9);
  });

  // Test 2: Unified Multi-Language Playground Switcher & HTML Live Sandbox Preview
  test("switches runtimes in the unified Playground and renders HTML live sandbox preview", async ({ page }) => {
    await page.goto("/#katalyst=playground");

    // Verify runtime tabs
    const runtimeBar = page.getByRole("tablist", { name: "Execution Runtimes" });
    await expect(runtimeBar).toBeVisible();
    await expect(runtimeBar.getByRole("tab", { name: /C \(C11\)/i })).toBeVisible();
    await expect(runtimeBar.getByRole("tab", { name: /Python \(3\.12\)/i })).toBeVisible();
    await expect(runtimeBar.getByRole("tab", { name: /JavaScript \(ES2024\)/i })).toBeVisible();
    await expect(runtimeBar.getByRole("tab", { name: /SQL \(WASM\)/i })).toBeVisible();
    await expect(runtimeBar.getByRole("tab", { name: /HTML & CSS/i })).toBeVisible();
    await expect(runtimeBar.getByRole("tab", { name: /Circuit Simulator/i })).toBeVisible();

    // Switch to SQL Workbench
    await runtimeBar.getByRole("tab", { name: /SQL \(WASM\)/i }).click();
    await expect(page.getByRole("heading", { name: "SQL Query Workbench" })).toBeVisible();
    await expect(page.locator(".c-pane-heading strong", { hasText: "query.sql" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Execute SQL/i })).toBeVisible();

    // Switch to HTML Live Preview
    await runtimeBar.getByRole("tab", { name: /HTML & CSS/i }).click();
    await expect(page.getByRole("heading", { name: "HTML & CSS Sandbox" })).toBeVisible();
    await expect(page.locator(".c-pane-heading strong", { hasText: "index.html" })).toBeVisible();

    // Verify HTML live sandbox iframe is rendered
    const previewFrame = page.locator("iframe[title='HTML Live Sandbox Preview']");
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
