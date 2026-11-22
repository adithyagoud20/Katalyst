import { expect, test } from "@playwright/test";

test.describe("In-Browser C WebAssembly Execution (behind feature flag)", () => {
  test.skip(
    process.env.NEXT_PUBLIC_C_RUN_ENABLED === "false",
    "Skipped when NEXT_PUBLIC_C_RUN_ENABLED is false"
  );

  test("compiles and runs C in the browser with zero CSP violations", async ({ page }) => {
    test.setTimeout(60_000);
    const cspViolations: string[] = [];
    const cspConsoleErrors: string[] = [];

    await page.exposeFunction("__onCspViolation", (directive: string, blockedUri: string) => {
      if (directive.includes("style-src")) return;
      // In dev mode Next.js/React attempts eval() to reconstruct debug callstacks
      if (process.env.KATALYST_E2E_PRODUCTION !== "true" && blockedUri === "eval") return;
      cspViolations.push(`${directive}: ${blockedUri}`);
    });

    await page.addInitScript(() => {
      window.addEventListener("securitypolicyviolation", (event) => {
        (window as Window & { __onCspViolation?: (d: string, u: string) => void }).__onCspViolation?.(
          event.violatedDirective,
          event.blockedURI
        );
      });
    });

    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        /content security policy|violates the following|refused to .*policy|blocked by csp/i.test(
          message.text()
        )
      ) {
        if (message.text().includes("style-src")) return;
        cspConsoleErrors.push(message.text());
      }
    });

    // 1. Check lesson page execution
    await page.goto("/courses/c-programming-foundations/source-to-output");
    const runBtn = page.locator("button.c-run-button").first();
    await expect(runBtn).toBeVisible({ timeout: 15_000 });
    await expect(runBtn).toContainText("Run code");

    await runBtn.click();
    await expect(page.locator(".c-run-status.outcome-success")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(".c-output-stream pre").first()).toContainText("Hello, C!");

    // 2. Exercise verification runs through test cases
    const verifyBtn = page.locator("button.verify-solution-btn, button:has-text('Verify Solution'), button:has-text('Verify exercise')").first();
    await expect(verifyBtn).toBeVisible();
    await verifyBtn.click();
    await expect(page.locator(".verifier-summary-banner, .lesson-verifier-card")).toContainText("passed", {
      timeout: 20_000,
    });

    // 3. Check C workbench in playground
    await page.goto("/playground");
    await page.getByText("Launch C Workbench").click();
    const cEditor = page.getByLabel("C source code");
    await expect(cEditor).toBeVisible();
    await cEditor.fill('#include <stdio.h>\nint main(void) { printf("KATALYST_C_OK\\n"); return 0; }');

    const ideRunBtn = page.locator("button.ide-run, button:has-text('Run')").first();
    await ideRunBtn.click();
    await expect(page.locator(".c-run-status.outcome-success, .ide-status-indicator")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator(".c-console-output")).toContainText("KATALYST_C_OK", { timeout: 10_000 });

    // 4. Stop button terminates runaway execution
    await cEditor.fill("int main(void) { while(1); return 0; }");
    await ideRunBtn.click();
    const stopBtn = page.locator("button.ide-stop, button:has-text('Stop')").first();
    await expect(stopBtn).toBeVisible({ timeout: 5_000 });
    await stopBtn.click();
    await expect(page.locator(".ide-status-indicator").filter({ hasText: "stopped" })).toBeVisible({ timeout: 5_000 });

    // 5. C++ remains disabled
    await page.locator("#runtime-switcher-select").selectOption("code:cpp");
    const cppUnavailable = page.getByRole("button", { name: "Unavailable" });
    await expect(cppUnavailable).toBeDisabled();

    // Verify 0 CSP violations
    expect(cspViolations).toEqual([]);
    expect(cspConsoleErrors).toEqual([]);
  });
});
