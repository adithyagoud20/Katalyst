import { expect, test } from "@playwright/test";

test.describe("Milestone M19 Features & Architecture E2E Suite", () => {
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

  // Feature 1: 4-Course Catalog Discovery & Navigation
  test("discovers all 4 courses in the catalog and navigates into JavaScript course", async ({ page }) => {
    await page.goto("/#katalyst=paths");
    await expect(page.getByRole("heading", { name: "Build a foundation" })).toBeVisible();

    const courseCards = page.locator(".course-card-unified");
    await expect(courseCards).toHaveCount(9);

    // Verify C Foundations card
    const cCard = courseCards.filter({ hasText: "C Programming Foundations" });
    await expect(cCard).toBeVisible();
    await expect(cCard).toContainText("16 lessons");
    await expect(cCard).toContainText("6 modules");

    // Verify Python Foundations card
    const pyCard = courseCards.filter({ hasText: "Python Programming Foundations" });
    await expect(pyCard).toBeVisible();
    await expect(pyCard).toContainText("19 lessons");
    await expect(pyCard).toContainText("7 modules");

    // Verify JavaScript & Algorithmic Systems card
    const jsCard = courseCards.filter({ hasText: "JavaScript & Algorithmic Systems" });
    await expect(jsCard).toBeVisible();
    await expect(jsCard).toContainText("10 lessons");
    await expect(jsCard).toContainText("4 modules");
    await expect(jsCard).toContainText("JAVASCRIPT (ES2024)");

    // Verify Digital Logic & Circuit Foundations card
    const circuitsCard = courseCards.filter({ hasText: "Digital Logic & Circuit Foundations" });
    await expect(circuitsCard).toBeVisible();
    await expect(circuitsCard).toContainText("8 lessons");
    await expect(circuitsCard).toContainText("3 modules");
    await expect(circuitsCard).toContainText("DIGITAL LOGIC");

    // Select JavaScript course and start learning
    await page.getByRole("button", { name: /JavaScript & Algorithmic Systems/i }).click();
    await expect(page.getByRole("heading", { name: "JavaScript & Algorithmic Systems" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "10 lessons. 4 modules." })).toBeVisible();

    await page.getByRole("button", { name: /start learning|continue this course/i }).click();
    await expect(page.getByRole("heading", { name: "Lexical scope and closures" })).toBeVisible();
  });

  // Feature 2: JavaScript Web Worker Execution & Automated Verification
  test("runs JavaScript code in isolated runner and executes automated exercise verification", async ({ page }) => {
    await page.goto("/#katalyst=paths");
    await expect(page.getByRole("heading", { name: "Build a foundation" })).toBeVisible();

    await page.getByRole("button", { name: /JavaScript & Algorithmic Systems/i }).click();
    await expect(page.getByRole("heading", { name: "JavaScript & Algorithmic Systems" })).toBeVisible();
    await page.getByRole("button", { name: /start learning|continue this course/i }).click();
    await expect(page.getByRole("heading", { name: "Lexical scope and closures" })).toBeVisible();

    // Verify CodeWorkspace is loaded
    await expect(page.locator(".workspace-editor-viewport")).toBeVisible();
    const runBtn = page.locator(".c-run-button");
    await expect(runBtn).toBeVisible();

    // Verify the Automated Verifier card is rendered
    const verifierCard = page.locator(".exercise-verifier-card");
    await expect(verifierCard).toBeVisible();
    await expect(verifierCard).toContainText("Solution Test Cases");

    // Click "Verify Solution" button
    const verifyBtn = page.locator(".verify-solution-btn");
    await expect(verifyBtn).toBeVisible();
    await verifyBtn.click();

    // Automated verifier summary banner should appear with pass/fail evaluation
    await expect(page.locator(".verifier-summary-banner")).toBeVisible();
  });

  // Feature 3: Interactive Simulators (Circuit Simulator & Memory Visualizer)
  test("interacts with Circuit Simulator inputs and Memory Visualizer stepper", async ({ page }) => {
    // 3a: Circuit Simulator
    await page.goto("/#katalyst=paths");
    await expect(page.getByRole("heading", { name: "Build a foundation" })).toBeVisible();

    await page.getByRole("button", { name: /Digital Logic & Circuit Foundations/i }).click();
    await expect(page.getByRole("heading", { name: "Digital Logic & Circuit Foundations" })).toBeVisible();
    await page.getByRole("button", { name: /start learning|continue this course/i }).click();
    await expect(page.getByRole("heading", { name: /Ohm's Law, Voltage, and Resistor Networks/i })).toBeVisible();

    const circuitSim = page.locator('[data-testid="circuit-simulator"]');
    await expect(circuitSim).toBeVisible();

    // Switch to Digital Logic mode
    await circuitSim.getByRole("button", { name: "Digital Logic" }).click();

    // Select AND gate
    await circuitSim.getByRole("button", { name: "AND", exact: true }).click();

    // Toggle Input A
    const inputABtn = circuitSim.locator("button").filter({ hasText: "Input A:" });
    await expect(inputABtn).toContainText("0");
    await inputABtn.click();
    await expect(inputABtn).toContainText("1");

    // Toggle Input B
    const inputBBtn = circuitSim.locator("button").filter({ hasText: "Input B:" });
    await expect(inputBBtn).toContainText("0");
    await inputBBtn.click();
    await expect(inputBBtn).toContainText("1");

    // Output should be HIGH (1)
    await expect(circuitSim.locator(".font-mono").filter({ hasText: "Output: HIGH (1)" })).toBeVisible();

    // 3b: Memory Visualizer in C Course (Dynamic Memory lesson)
    await page.goto("/#katalyst=paths");
    await expect(page.getByRole("heading", { name: "Build a foundation" })).toBeVisible();

    await page.getByRole("button", { name: /C Programming Foundations/i }).click();
    await expect(page.getByRole("heading", { name: "C Programming Foundations" })).toBeVisible();
    await page.getByRole("button", { name: /start learning|continue this course/i }).click();
    await expect(page.getByRole("heading", { name: "From source code to output" })).toBeVisible();

    // Navigate to Lesson 15 via course navigation dropdown
    await page.getByText("Course navigation").click();
    await page.locator(".workspace-course-nav button").filter({ hasText: "Dynamic memory allocation and cleanup" }).click();
    await expect(page.getByRole("heading", { name: "Dynamic memory allocation and cleanup" })).toBeVisible();

    const memVis = page.locator('[data-testid="memory-visualizer"]');
    await expect(memVis).toBeVisible();
    await expect(memVis.getByText(/Step 1 of/i)).toBeVisible();

    // Advance step
    const nextBtn = memVis.getByRole("button", { name: /Next Step/i });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();
    await expect(memVis.getByText(/Step 2 of/i)).toBeVisible();

    // Reset back to Step 1
    const resetBtn = memVis.getByRole("button", { name: /Reset/i });
    await resetBtn.click();
    await expect(memVis.getByText(/Step 1 of/i)).toBeVisible();
  });

  // Feature 4: Inline Diagnostics & Kat Error Bridge
  test("detects runtime/syntax error, renders diagnostic card, and bridges error to Kat AI tutor", async ({ page }) => {
    await page.goto("/#katalyst=paths");
    await expect(page.getByRole("heading", { name: "Build a foundation" })).toBeVisible();

    await page.getByRole("button", { name: /JavaScript & Algorithmic Systems/i }).click();
    await expect(page.getByRole("heading", { name: "JavaScript & Algorithmic Systems" })).toBeVisible();
    await page.getByRole("button", { name: /start learning|continue this course/i }).click();
    await expect(page.getByRole("heading", { name: "Lexical scope and closures" })).toBeVisible();

    // Inject syntax/runtime fault into CodeMirror editor
    const editor = page.locator(".cm-content");
    await editor.click();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type("throw new Error('Uncaught invariant fault on line 1');");

    // Run code
    await page.locator(".c-run-button").click();

    // Verify stderr block and "Ask Kat to Explain Error" button appear
    await expect(page.locator(".terminal-stderr-block")).toBeVisible();
    const askKatBtn = page.getByRole("button", { name: /Ask Kat to Explain Error/i });
    await expect(askKatBtn).toBeVisible();

    // Click "Ask Kat to Explain Error"
    await askKatBtn.click();

    // Kat panel should open and the composer input should be pre-populated
    await expect(page.locator(".learning-kat-panel")).toBeVisible();
    const composerInput = page.getByLabel("Ask Kat a question");
    await expect(composerInput).toBeVisible();
    await expect(composerInput).toHaveValue(/Can you explain this error/i);
  });

  // Feature 5: Practice Lab Challenge Hub Multi-Course Filters
  test("filters Challenge Hub exercises by course and updates card counts accurately", async ({ page }) => {
    await page.goto("/#katalyst=practice");
    await expect(page.getByRole("heading", { name: /Make your thinking/i })).toBeVisible();

    const practiceCards = page.locator(".practice-card");

    // Filter by All Courses (91 lessons in total across 9 courses)
    await page.getByRole("button", { name: "All Courses", exact: true }).click();
    await expect(practiceCards).toHaveCount(91);

    // Filter by JavaScript (10 lessons)
    await page.getByRole("button", { name: "JavaScript", exact: true }).click();
    await expect(practiceCards).toHaveCount(10);

    // Filter by Circuits (8 lessons)
    await page.getByRole("button", { name: "Circuits", exact: true }).click();
    await expect(practiceCards).toHaveCount(8);

    // Filter by Python (19 lessons)
    await page.getByRole("button", { name: "Python", exact: true }).click();
    await expect(practiceCards).toHaveCount(19);

    // Filter by C (16 lessons)
    await page.getByRole("button", { name: "C", exact: true }).click();
    await expect(practiceCards).toHaveCount(16);
  });
});
