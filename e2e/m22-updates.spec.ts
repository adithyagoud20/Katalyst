import { expect, test } from "@playwright/test";

async function ensureCourseDetails(page: import("@playwright/test").Page) {
  const startButton = page.getByRole("button", { name: /start learning|continue this course/i }).first();
  if (!(await startButton.isVisible().catch(() => false))) {
    await page.locator(".course-card-unified").first().click();
  }
  await expect(startButton).toBeVisible();
}

test.describe("Milestone M22 Featured Courses, Lazy Playground, Compiler Toggle & UI Polish", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/lab-runner/c/runner.js", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/javascript",
        body: String.raw`const expectedParent = document.querySelector('meta[name="c-lab-parent-origin"]').content;
let token = "";
let active = null;
let ready = false;
function send(type, requestId, payload = {}) { parent.postMessage({ version: 1, type, token, requestId, ...payload }, expectedParent); }
function finish(requestId, stdout = "mock interactive output\n") {
  send("OUTPUT", requestId, { channel: "stdout", text: stdout });
  send("DONE", requestId, { outcome: "success", stdout, stderr: "", diagnostics: "", error: "", durationMs: 3, exitCode: 0 });
  active = null;
}
window.addEventListener("message", (event) => {
  if (event.source !== parent || event.origin !== expectedParent) return;
  const message = event.data;
  if (!message || message.version !== 1) return;
  if (message.type === "INIT") {
    token = message.token;
    send("READY", message.requestId);
    send("COMPILER_STATE", message.requestId, { state: "idle" });
  } else if (message.token !== token) return;
  else if (message.type === "RUN") {
    active = message;
    ready = true;
    send("COMPILER_STATE", message.requestId, { state: "ready" });
    send("PHASE", message.requestId, { phase: "compiling" });
    send("PHASE", message.requestId, { phase: "running" });
  } else if (message.type === "INPUT" && active?.requestId === message.requestId) finish(message.requestId);
  else if (message.type === "STOP" && active?.requestId === message.requestId) {
    send("DONE", message.requestId, { outcome: "stopped", stdout: "", stderr: "", diagnostics: "", error: "Run stopped.", durationMs: 1 });
    active = null;
  }
});
document.body.textContent = "Mock C runtime ready.";`,
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
    await expect(page.locator(".app-shell")).toHaveClass(/app-shell-ide/);
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

  test("restores the selected circuit lab when returning to Playground from another app view", async ({ page }) => {
    await page.goto("/#katalyst=playground");
    await page.getByText("Launch Arduino Lab").click();
    await expect(page.getByRole("heading", { name: /Arduino Uno Lab/i })).toBeVisible();
    await page.evaluate(() => {
      window.history.pushState({}, "", "#katalyst=home");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await page.getByRole("button", { name: "Playground", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Arduino Uno Lab/i })).toBeVisible();
  });

  test("uses one source-defined logo and one animated pipeline for every learning field", async ({ page }) => {
    await page.goto("/#katalyst=home");
    await expect(page.getByRole("heading", { name: /explore how things work/i })).toBeVisible();
    await expect(page.locator(".home-domain-switcher")).toHaveCount(0);
    const constellation = page.locator(".track-constellation");
    await expect(constellation).toBeVisible();
    await expect(constellation).toContainText("Software");
    await expect(constellation).toContainText("Circuits");
    await expect(constellation).toContainText("Data");
    await expect(constellation).toContainText("Visual media");
    await expect(page.locator(".pipeline-signal")).toHaveCount(2);
    await page.getByRole("button", { name: "Open settings", exact: true }).click();
    await expect(page.locator(".brand-logo-picker")).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Appearance", exact: true })).toBeVisible();
  });

  // Test 2: Compiler Toggle in Programming Lessons (Expands Theory to Full-Width)
  test("toggles compiler workspace visibility in programming lessons", async ({ page }) => {
    await page.goto("/#katalyst=paths");
    await expect(page.getByRole("heading", { name: "Build a foundation" })).toBeVisible();

    await page.getByRole("button", { name: /C Programming Foundations/i }).click();
    await expect(page.getByRole("heading", { name: "C Programming Foundations" })).toBeVisible();
    await ensureCourseDetails(page);
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

  // Settings remains full width without a redundant bottom account/sign-in control.
  test("removes the bottom account control and keeps full-width settings tables", async ({ page }) => {
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

    await expect(page.locator(".sidebar .account-entry")).toHaveCount(0);
    await expect(page.locator(".sidebar-legal-links a[href='/login']")).toHaveCount(0);
    const card = page.locator(".settings-card").first();
    await expect(card).toHaveCSS("color", "rgb(250, 250, 250)");
  });

  test("starts with a full-height editor and opens a side-by-side output pane on run", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/#katalyst=playground");
    await page.getByText("Launch Python Workbench").click();

    const editor = await page.locator(".c-editor-pane").boundingBox();
    expect(editor?.height).toBeGreaterThan(300);
    await expect(page.locator(".c-output-pane")).toBeHidden();
    await page.getByRole("button", { name: "Output", exact: true }).click();
    await expect(page.locator(".c-output-pane")).toBeVisible();
    const terminal = await page.locator(".c-output-pane").boundingBox();
    const editorAfterRun = await page.locator(".c-editor-pane").boundingBox();
    expect(terminal).not.toBeNull();
    expect(terminal!.x).toBeGreaterThanOrEqual(editorAfterRun!.x + editorAfterRun!.width - 2);
  });

  test("uses the full lesson reading width after closing both side panels", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/#katalyst=lesson&course=c-programming-foundations&lesson=source-to-output");
    await expect(page.getByRole("heading", { name: "From source code to output" })).toBeVisible();

    const compilerToggle = page.getByTestId("toggle-compiler-btn");
    await expect(compilerToggle).toHaveAttribute("aria-expanded", "true");
    await compilerToggle.press("Space");
    await expect(compilerToggle).toHaveAttribute("aria-expanded", "false");
    const katToggle = page.locator(".lesson-topbar-actions .kat-toggle-button");
    if (await katToggle.getAttribute("aria-expanded") === "true") await katToggle.press("Space");
    await expect(katToggle).toHaveAttribute("aria-expanded", "false");

    const workspace = page.locator(".learning-workspace-grid");
    await expect(workspace).toHaveClass(/learning-workspace-wide/);
    const widths = await page.evaluate(() => {
      const panel = document.querySelector<HTMLElement>(".learning-panel");
      const article = document.querySelector<HTMLElement>(".lesson-panel-content");
      return { panel: panel?.getBoundingClientRect().width ?? 0, article: article?.getBoundingClientRect().width ?? 0 };
    });
    expect(widths.panel).toBeGreaterThan(1000);
    expect(widths.article).toBeGreaterThan(widths.panel * 0.9);
  });

  test("keeps the mobile IDE header compact and the editor viewport locked", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#katalyst=playground");
    await page.getByText("Launch Python Workbench").click();

    const mainPanel = page.locator(".main-panel-playground");
    await expect(mainPanel).toHaveCSS("overflow", "hidden");
    await expect(page.locator(".topbar")).toBeHidden();
    await expect(page.locator(".playground-runtime-header")).toBeVisible();
    await expect(page.locator(".c-output-pane")).toBeHidden();
    const editor = await page.locator(".c-editor-pane").boundingBox();
    expect(editor?.height).toBeGreaterThan(500);
    await page.getByRole("button", { name: "Output", exact: true }).click();
    await expect(page.locator(".c-output-pane")).toBeVisible();
  });

  test("accepts C++ stdin in the interactive terminal while the program is running", async ({ page }) => {
    await page.goto("/#katalyst=playground");
    await page.getByText("Launch C++ Workbench").click();
    expect(await page.evaluate(() => window.crossOriginIsolated)).toBe(true);

    const editor = page.locator(".cm-content").first();
    await editor.fill("#include <iostream>\nint main() { int value; std::cin >> value; std::cout << value; }");
    await expect(page.locator(".c-stdin-label")).toHaveCount(0);
    await expect(page.locator("#c-playground-stdin")).toHaveCount(0);
    await page.getByRole("button", { name: "Run", exact: true }).click();
    const terminalInput = page.getByLabel("Terminal standard input");
    await expect(terminalInput).toBeEnabled();
    await terminalInput.fill("42");
    await terminalInput.press("Enter");
    await expect(page.locator(".c-console-output")).toContainText("mock interactive output");
  });

  test("shows dedicated board guides and the selected board pin references", async ({ page }) => {
    await page.goto("/#katalyst=playground");
    await page.getByText("Launch Arduino Lab").click();
    await expect(page.getByTestId("board-anatomy")).toBeVisible();
    await page.getByRole("button", { name: "Analog inputs", exact: true }).click();
    await expect(page.locator(".board-part-detail")).toContainText("10-bit ADC");
    await page.getByText("Open representative pin reference (20 entries)").click();
    await expect(page.locator(".board-pin-map")).toContainText("D13");
    await expect(page.locator(".board-target-fixed")).toContainText("Arduino Uno");

    await page.locator(".switch-runtime-btn").click();
    await page.getByText("Launch ESP32 Lab").click();
    await expect(page.getByTestId("board-anatomy")).toBeVisible();
    await expect(page.locator(".board-part-detail")).toContainText("GPIO18");
    await expect(page.locator(".board-part-detail")).toContainText("GPIO34");
    await page.getByText(/Open representative pin reference/).click();
    await expect(page.locator(".board-pin-map")).toContainText("boot strapping pin");
  });

  test("runs editable Arduino sketches and reports serial output from the simulated board", async ({ page }) => {
    await page.goto("/#katalyst=playground");
    await page.getByText("Launch Arduino Lab").click();
    const sketch = page.getByRole("textbox", { name: "Arduino Uno firmware sketch editor" });
    await expect(sketch).toBeVisible();
    await page.getByRole("button", { name: "Run sketch" }).click();
    await expect(page.getByLabel("Serial monitor output")).toContainText("LED on");
    await expect(page.getByRole("status").filter({ hasText: "Completed" })).toBeVisible();

    await page.getByRole("combobox", { name: "Sketch preset" }).selectOption("sensor");
    await page.getByRole("button", { name: "Run sketch" }).click();
    await expect(page.getByLabel("Serial monitor output")).toContainText("ADC: 512");

    await sketch.fill(`const int LED_PIN = 13;
void setup() { pinMode(LED_PIN, OUTPUT); }
void loop() { if (Serial.available() > 0) { int command = Serial.read(); if (command == '1') digitalWrite(LED_PIN, HIGH); } }`);
    await page.getByRole("textbox", { name: "Serial input before run" }).fill("1");
    await page.getByRole("button", { name: "Run sketch" }).click();
    await expect(page.getByRole("button", { name: /Pin D13 \(Red LED\)/ })).toContainText("HIGH (1)");
  });

  test("renders a human sitemap and exposes the crawler XML separately", async ({ page }) => {
    await page.goto("/sitemap");
    await expect(page.getByRole("heading", { name: "Find your way around KATALYST." })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Published learning paths/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Privacy notice" })).toHaveAttribute("href", "/privacy");
    await expect(page.getByRole("link", { name: /View the XML sitemap/ })).toHaveAttribute("href", "/sitemap.xml");

    const xmlResponse = await page.request.get("/sitemap.xml");
    expect(xmlResponse.ok()).toBeTruthy();
    expect(xmlResponse.headers()["content-type"]).toContain("xml");
  });
});
