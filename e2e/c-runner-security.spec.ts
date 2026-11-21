import { expect, test, type Page } from "@playwright/test";

const guardedRoutes = [
  "/",
  "/account/delete",
  "/api/account/delete",
  "/api/account/export",
  "/api/account/me",
  "/api/account/snapshot",
  "/api/admin/analytics",
  "/api/admin/config",
  "/api/admin/kill-switch",
  "/api/admin/site-content",
  "/api/admin/users",
  "/api/ai/kat-model",
  "/api/ai/session",
  "/api/chat",
  "/api/curriculum/lesson",
  "/api/health",
  "/api/legal/consent",
  "/api/models",
  "/api/site-content",
  "/api/status",
  "/courses",
  "/courses/c-programming-foundations",
  "/courses/c-programming-foundations/source-to-output",
  "/delete-account",
  "/download",
  "/auth",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/paths",
  "/playground",
  "/practice",
  "/privacy",
  "/tutor",
  "/workspace",
  "/skills",
  "/progress",
  "/my-learning",
  "/settings",
  "/login",
  "/signin",
  "/auth/callback",
  "/terms",
  "/sitemap",
  "/sitemap.xml",
  "/robots.txt",
  "/lab-runner/c",
];

function scriptDirective(policy: string): string {
  return policy.split(";").find((directive) => directive.trim().startsWith("script-src")) ?? "";
}

async function assertHeadersStayHardened(page: import("@playwright/test").Page, path: string) {
  const response = await page.request.get(path);
  const headers = response.headers();
  const context = `${path} returned ${response.status()}`;

  expect(headers["x-frame-options"], context).toBe("DENY");
  expect(headers["content-security-policy"], context).toContain("frame-ancestors 'none'");
  expect(headers["content-security-policy"], context).toContain("'nonce-");
  expect(headers["content-security-policy"], context).toContain("'strict-dynamic'");
  expect(Object.values(headers).join("\n"), context).not.toMatch(/(?:^|[;\s])'unsafe-eval'(?:$|[;\s])/);
  expect(scriptDirective(headers["content-security-policy"] ?? ""), context).not.toContain("'unsafe-inline'");
}

test("retired C runner route is missing and every app response keeps the security headers", async ({ page }) => {
  test.setTimeout(180_000);
  for (const path of guardedRoutes) {
    await assertHeadersStayHardened(page, path);
  }

  const sitemapResponse = await page.request.get("/sitemap.xml");
  const sitemap = await sitemapResponse.text();
  const publicPaths = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)]
    .map((match) => new URL(match[1].replaceAll("&amp;", "&")).pathname);
  expect(publicPaths.length).toBeGreaterThan(0);
  for (const path of publicPaths) await assertHeadersStayHardened(page, path);

  const runner = await page.request.get("/lab-runner/c");
  expect(runner.status()).toBe(404);
});

test("C and C++ remain editable while their retired Run action is clearly explained", async ({ page }) => {
  await page.goto("/playground");
  await page.getByText("Launch C Workbench").click();

  const cEditor = page.getByLabel("C source code");
  await expect(cEditor).toBeVisible();
  await cEditor.fill("int main(void) { return 0; }");
  await expect(cEditor).toContainText("int main");
  if (process.env.NEXT_PUBLIC_C_RUN_ENABLED === "false") {
    await expect(page.getByRole("status").filter({ hasText: "C run is being upgraded" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Unavailable" })).toBeDisabled();
  } else {
    await expect(page.getByRole("button", { name: /Run/i }).first()).toBeEnabled();
  }
  await expect(page.locator('iframe[title="Isolated C runtime runner"]')).toHaveCount(0);

  await page.locator("#runtime-switcher-select").selectOption("code:cpp");
  const cppEditor = page.getByLabel("C++ source code");
  await expect(cppEditor).toBeVisible();
  await cppEditor.fill("int main() { return 0; }");
  await expect(cppEditor).toContainText("int main");
  await expect(page.getByRole("button", { name: "Unavailable" })).toBeDisabled();
});

async function returnToLauncher(page: Page) {
  await page.getByRole("button", { name: "All Labs", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Runtime & Lab Launcher" })).toBeVisible();
}

test("remaining browser workbenches and simulators run under the production CSP with zero violations and C lesson shows upgrade notice", async ({ page }) => {
  test.skip(process.env.KATALYST_E2E_PRODUCTION !== "true", "run against npm start with KATALYST_E2E_PRODUCTION=true");
  test.setTimeout(180_000);

  const cspViolations: string[] = [];
  const cspConsoleErrors: string[] = [];
  await page.addInitScript(() => {
    const host = window as Window & { __katalystCspViolations?: string[] };
    host.__katalystCspViolations = [];
    window.addEventListener("securitypolicyviolation", (event) => {
      host.__katalystCspViolations?.push(`${event.violatedDirective}: ${event.blockedURI}`);
    });
  });
  page.on("console", (message) => {
    if (message.type() === "error" && /content security policy|violates the following|refused to .*policy|blocked by csp/i.test(message.text())) {
      cspConsoleErrors.push(message.text());
    }
  });

  await page.goto("/playground");
  await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");

  await page.getByText("Launch JS Workbench").click();
  await page.locator(".ide-run").click();
  await expect(page.locator(".c-console-output")).toContainText("Fibonacci(10):", { timeout: 15_000 });
  await returnToLauncher(page);

  await page.getByText("Launch Python Workbench").click();
  await page.locator(".ide-run").click();
  await expect(page.locator(".c-console-output")).toContainText("Hello from Python 3.12!", { timeout: 120_000 });
  await returnToLauncher(page);

  await page.getByText("Launch SQL Workbench").click();
  await page.locator(".ide-run").click();
  await expect(page.locator(".c-console-output")).toContainText("Grace Hopper", { timeout: 30_000 });
  await returnToLauncher(page);

  await page.getByText("Launch Web Sandbox").click();
  await page.getByRole("button", { name: "Output", exact: true }).click();
  const htmlPreview = page.frameLocator('iframe[title="HTML Live Sandbox Preview"]');
  await expect(htmlPreview.getByRole("heading", { name: "KATALYST Web Sandbox" })).toBeVisible();
  await htmlPreview.getByText("Test Interaction").click();
  await expect(htmlPreview.getByText("Hello from KATALYST!")).toBeVisible();
  await returnToLauncher(page);

  await page.getByText("Launch Arduino Lab").click();
  await page.getByRole("button", { name: "Run sketch" }).click();
  await expect(page.getByLabel("Serial monitor output")).toContainText("LED on");
  await expect(page.getByRole("status").filter({ hasText: "Completed" })).toBeVisible();
  await returnToLauncher(page);

  await page.getByText("Launch ESP32 Lab").click();
  await expect(page.getByTestId("board-anatomy")).toBeVisible();
  await page.getByRole("button", { name: "Run sketch" }).click();
  await expect(page.getByLabel("Serial monitor output")).toContainText("LED on");
  await expect(page.getByRole("status").filter({ hasText: "Completed" })).toBeVisible();
  await returnToLauncher(page);

  await page.getByText("Launch Breadboard Lab").click();
  const redLed = page.getByRole("button", { name: /Pin D13 \(Red LED\)/ });
  await redLed.click();
  await expect(redLed).toContainText("LOW (0)");
  await redLed.click();
  await expect(redLed).toContainText("HIGH (1)");
  await returnToLauncher(page);

  await page.getByText("Launch Logic Lab").click();
  await page.getByRole("button", { name: "AND", exact: true }).click();
  const inputA = page.getByRole("button").filter({ hasText: "Input A:" });
  const inputB = page.getByRole("button").filter({ hasText: "Input B:" });
  await inputA.click();
  await inputB.click();
  await expect(page.locator(".font-mono").filter({ hasText: "Output: HIGH (1)" })).toBeVisible();

  // C lesson displays the friendly "being upgraded" message when disabled
  await page.goto("/courses/c-programming-foundations/source-to-output");
  if (process.env.NEXT_PUBLIC_C_RUN_ENABLED === "false") {
    await expect(page.getByRole("status").filter({ hasText: "C run is being upgraded" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Unavailable" })).toBeDisabled();
  } else {
    await expect(page.getByRole("button", { name: /Run/i }).first()).toBeEnabled();
  }

  cspViolations.push(...await page.evaluate(() => (window as Window & { __katalystCspViolations?: string[] }).__katalystCspViolations ?? []));
  expect(cspViolations).toEqual([]);
  expect(cspConsoleErrors).toEqual([]);
});
