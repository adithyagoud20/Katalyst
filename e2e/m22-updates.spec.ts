import { expect, test } from "@playwright/test";

test.describe("Milestone M22 Featured Courses, Lazy Playground, Compiler Toggle & UI Polish", () => {
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

  // Test 1: Lazy Playground Runtime & Lab Launcher (No Auto-Download)
  test("opens Playground to Runtime Launcher grid and allows launching workbenches on-demand", async ({ page }) => {
    await page.goto("/#katalyst=playground");

    // Verify Runtime & Lab Launcher is displayed
    const heading = page.getByRole("heading", { name: "Runtime & Lab Launcher" });
    await expect(heading).toBeVisible();

    // Verify all 10 runtime cards are visible
    const cards = page.locator(".launcher-card");
    await expect(cards).toHaveCount(10);
    await expect(page.getByText("C (C11 · WebAssembly)")).toBeVisible();
    await expect(page.getByText("C++ (C++17 · WebAssembly)")).toBeVisible();
    await expect(page.getByText("Python (3.12 · WebAssembly)")).toBeVisible();
    await expect(page.getByText("JavaScript (ES2024 · Worker)")).toBeVisible();
    await expect(page.getByText("SQL (SQLite · WebAssembly)")).toBeVisible();
    await expect(page.getByText("HTML & CSS (Live Sandbox)")).toBeVisible();
    await expect(page.getByText("Arduino Uno Lab")).toBeVisible();
    await expect(page.getByText("ESP32 IoT Lab")).toBeVisible();
    await expect(page.getByText("Breadboard Circuit Lab")).toBeVisible();
    await expect(page.getByText("Digital Logic Gates")).toBeVisible();

    // Launch Python Workbench
    await page.getByText("Launch Python Workbench").click();
    await expect(page.getByRole("heading", { name: "Python Workbench" })).toBeVisible();
    await expect(page.locator(".c-pane-heading strong", { hasText: "main.py" })).toBeVisible();

    // Verify Switch Runtime button exists and returns to Launcher
    const switchBtn = page.locator(".switch-runtime-btn");
    await expect(switchBtn).toBeVisible();
    await switchBtn.click();
    await expect(page.getByRole("heading", { name: "Runtime & Lab Launcher" })).toBeVisible();

    // Launch Arduino Uno Lab
    await page.getByText("Launch Arduino Lab").click();
    await expect(page.getByRole("heading", { name: /Interactive Circuit & Hardware Simulator/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Arduino Uno", exact: true })).toBeVisible();
  });

  // Test 2: Compiler Toggle in Programming Lessons (Expands Theory to Full-Width)
  test("toggles compiler workspace visibility in programming lessons", async ({ page }) => {
    await page.goto("/#katalyst=paths");
    await expect(page.getByRole("heading", { name: "Build a foundation" })).toBeVisible();

    await page.getByRole("button", { name: /C Programming Foundations/i }).click();
    await expect(page.getByRole("heading", { name: "C Programming Foundations" })).toBeVisible();
    await page.getByRole("button", { name: /start learning|continue this course/i }).click();
    await expect(page.getByRole("heading", { name: "From source code to output" })).toBeVisible();

    // Check that Hide Compiler button is visible
    const toggleBtn = page.getByTestId("toggle-compiler-btn");
    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toContainText("Hide Compiler");

    // Code panel is visible initially
    const codePanel = page.locator(".learning-code-panel");
    await expect(codePanel).toBeVisible();

    // Click Hide Compiler
    await toggleBtn.click();
    await expect(toggleBtn).toContainText("Open Compiler");
    await expect(codePanel).toHaveCSS("display", "none");

    // Click Open Compiler
    await toggleBtn.click();
    await expect(toggleBtn).toContainText("Hide Compiler");
    await expect(codePanel).not.toHaveCSS("display", "none");
  });

  // Test 3: Featured Courses in Positions #3 and #4 in Explore
  test("features AI App Dev at position #4 and Arduino at position #5 in Explore", async ({ page }) => {
    await page.goto("/#katalyst=paths");
    await expect(page.getByRole("heading", { name: "Build a foundation" })).toBeVisible();

    const courseCards = page.locator(".course-card-unified");
    await expect(courseCards).toHaveCount(14);

    // Course #1: C
    await expect(courseCards.nth(0)).toContainText("C Programming Foundations");
    // Course #2: C++
    await expect(courseCards.nth(1)).toContainText("C++17 Systems & Object-Oriented Programming");
    // Course #3: Python
    await expect(courseCards.nth(2)).toContainText("Python Programming Foundations");
    // Course #4: AI App Web Dev
    await expect(courseCards.nth(3)).toContainText("AI-Powered App & Web Development");
    // Course #5: Arduino
    await expect(courseCards.nth(4)).toContainText("Arduino Uno Embedded Systems & ATmega328P");

    // Open Course #4 (AI App Dev)
    await courseCards.nth(3).click();
    await expect(page.getByRole("heading", { name: "AI-Powered App & Web Development" })).toBeVisible();
    await expect(page.getByText("AI-Assisted Engineering Workflow & Scaffolding")).toBeVisible();

    // Return to Explore and open Course #5 (Arduino)
    await page.goto("/#katalyst=paths");
    await expect(page.getByRole("heading", { name: "Build a foundation" })).toBeVisible();
    const course5 = page.locator(".course-card-unified").nth(4);
    await course5.click();
    await expect(page.getByRole("heading", { name: "Arduino Uno Embedded Systems & ATmega328P" })).toBeVisible();
    await expect(page.getByText("Arduino Sketch Lifecycle, Setup/Loop & Pin Mapping")).toBeVisible();
  });

  // Test 4: Dark Mode Account Chip Contrast & Settings Table Width
  test("renders high-contrast user account chip in dark mode and full-width settings tables", async ({ page }) => {
    await page.goto("/#katalyst=paths");
    await page.getByRole("button", { name: "Open settings", exact: true }).click();

    // Verify settings container expands cleanly
    const settingsView = page.locator(".settings-view");
    await expect(settingsView).toBeVisible();
    const box = await settingsView.boundingBox();
    expect(box?.width).toBeGreaterThan(700);

    // Toggle Dark Mode
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "dark");
    });

    // Verify Dark Mode account chip styling
    const accountEntry = page.locator(".sidebar-footer.account-entry");
    await expect(accountEntry).toBeVisible();
    await expect(accountEntry).toHaveCSS("background-color", "rgb(24, 24, 27)");
    await expect(accountEntry).toHaveCSS("color", "rgb(248, 250, 252)");
  });
});
