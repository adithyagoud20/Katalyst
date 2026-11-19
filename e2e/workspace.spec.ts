import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function ensureCourseDetails(page: import("@playwright/test").Page) {
  const startButton = page.getByRole("button", { name: /start learning|continue this course/i }).first();
  if (!(await startButton.isVisible().catch(() => false))) {
    await page.locator(".course-card-unified").first().click();
  }
  await expect(startButton).toBeVisible();
}

async function expectMobileHeaderStableDuringPanelScroll(page: Page, scroller: Locator) {
  const topbar = page.locator(".topbar");
  await expect.poll(() => scroller.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  const initiallyCollapsed = await topbar.evaluate((element) => element.classList.contains("topbar-collapsed"));
  for (const position of [80, 86, 80, 87, 81, 88, 0]) {
    await scroller.evaluate((element, nextPosition) => { element.scrollTop = nextPosition; }, position);
    await page.waitForTimeout(25);
    if (initiallyCollapsed) await expect(topbar).toHaveClass(/topbar-collapsed/);
    else await expect(topbar).not.toHaveClass(/topbar-collapsed/);
  }
}

async function openWorkspace(page: import("@playwright/test").Page) {
  if (await page.getByRole("button", { name: "Open navigation" }).isVisible()) {
    await page.getByRole("button", { name: "Open navigation" }).click();
  }
  await page.locator(".secondary-nav .nav-item").filter({ hasText: "Workspace" }).click();
}

async function openSettingsCategory(page: import("@playwright/test").Page, category: string) {
  const targetCategory = ["AI Providers", "Models", "Usage & Credits"].includes(category)
    ? "AI & Kat"
    : category === "Workspace" ? "Workspace Data" : category;
  const targetTab = page.getByRole("tab", { name: targetCategory, exact: true });
  if (!(await targetTab.isVisible().catch(() => false))) {
    await page.getByRole("button", { name: "Open settings", exact: true }).click();
  }
  await page.getByRole("tab", { name: targetCategory, exact: true }).click();
}

async function selectProviderInSettings(page: Page, providerName: string) {
  await openSettingsCategory(page, "AI & Kat");
  const cardName = providerName === "Kat AI" ? "Cloudflare Workers AI" : providerName;
  const card = page.locator(".provider-settings-card").filter({
    has: page.getByRole("heading", { name: cardName, exact: true }),
  });
  await expect(card).toBeVisible();
  const useProvider = card.getByRole("button", { name: "Use " + cardName, exact: true });
  if (await useProvider.count()) await useProvider.click();
  return card;
}

async function selectSettingsModel(page: Page, modelId: string) {
  await page.getByLabel("Settings selected model").selectOption(modelId);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { (window as Window & { __failCompilerFirst?: boolean }).__failCompilerFirst = window.location.search.includes("failCompilerFirst=1"); });
  await page.route("**/vendor/wasmer-sdk/dist/index.js", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/javascript",
      body: `const output = (value = "") => ({ text: () => value, truncated: false });
export class Wasmer {
  constructor(options = {}) {
    this.namespace = options.cache?.namespace ?? "default";
    window.__wasmerCacheNamespace = this.namespace;
    this.packages = { load: async (reference) => {
      window.__compilerAttempts = (window.__compilerAttempts ?? 0) + 1;
      if (typeof reference === "string") {
        const cacheKey = this.namespace + ":" + reference;
        const cache = window.__wasmerPackageCache ?? (window.__wasmerPackageCache = []);
        if (cache.includes(cacheKey)) window.__wasmerCacheHits = (window.__wasmerCacheHits ?? 0) + 1;
        else {
          if (window.__failCompilerFirst) throw new Error("Mock compiler download failure");
          cache.push(cacheKey);
          window.__compilerPackageDownloads = (window.__compilerPackageDownloads ?? 0) + 1;
        }
        return { entrypoint: "clang" };
      }
      return { id: "mock-program" };
    } };
    this.sandboxes = { create: async () => ({
      command: (_program, args) => ({ spawn: async () => {
        const compiling = Array.isArray(args);
        const mode = window.__cPlaygroundOutcome;
        let releaseInput;
        const inputReceived = new Promise((resolve) => { releaseInput = resolve; });
        return {
          stdin: { write: async (value) => { window.__capturedTerminalInput = value; releaseInput(); }, close: async () => { releaseInput(); } },
          stdout: null,
          stderr: null,
          wait: async () => {
            if (!compiling && window.__mockWaitForInput) await inputReceived;
            return compiling && mode === "compile-error"
              ? { reason: "exited", exitCode: 1, stdout: output(), stderr: output("main.c:1: error: expected ';'") }
              : { reason: "exited", exitCode: !compiling && mode === "runtime-error" ? 7 : 0, stdout: output(!compiling && mode === "runtime-error" ? "mock program output" : !compiling && window.__mockWaitForInput ? "mock interactive output" : ""), stderr: output(!compiling && mode === "runtime-error" ? "mock runtime stderr" : "") };
          },
          kill: async () => {},
        };
      } }),
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

test("compiler package registry is permitted by the document security headers", async ({ page }) => {
  const response = await page.goto("/");
  expect(response).not.toBeNull();
  const headers = response!.headers();
  expect(headers["content-security-policy"]).toContain("https://registry.wasmer.io");
  expect(headers["content-security-policy"]).toContain("https://cdn.wasmer.io");
  expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
  expect(headers["cross-origin-embedder-policy"]).toBe("require-corp");
});

test("workspace explains provider setup when no key is configured", async ({ page }) => {
  page.on("pageerror", (error) => console.error("Browser page error:", error.message));
  await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ defaultProvider: "openai", defaultModel: "gpt-6-luna", providers: { openai: { configured: false }, gemini: { configured: false }, openrouter: { configured: false } } }) }));
  await page.route("**/api/chat", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Add OPENAI_API_KEY to your local .env.local file to connect OpenAI." }) }));
  await page.goto("/");
  await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");
  await expect(page.getByRole("heading", { name: /explore how things work/i })).toBeVisible();
  await openWorkspace(page);
  await page.screenshot({ path: "work/katalyst-desktop.png", fullPage: true });
  await expect(page.getByRole("heading", { name: /make room for/i })).toBeVisible();
  await expect(page.getByText(/Set up AI access in Settings/i)).toBeVisible();
  await page.getByRole("button", { name: /new conversation/i }).click();
  await page.getByRole("textbox", { name: "Message Katalyst" }).fill("A request that should not get a fake answer");
  await expect(page.getByRole("button", { name: "Send message" })).toBeEnabled();
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByText("A request that should not get a fake answer")).toBeVisible();
  await expect(page.locator(".send-error")).toContainText("OPENAI_API_KEY");
});

test("switches provider and only shows that provider's model catalog", async ({ page }) => {
  await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ defaultProvider: "openai", defaultModel: "gpt-6-luna", providers: { openai: { configured: false }, gemini: { configured: false }, openrouter: { configured: false } } }) }));
  await page.route("**/api/models**", (route) => route.request().url().includes("provider=gemini")
    ? route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ models: [
      { providerId: "gemini", id: "gemini-3.8-flash", name: "Gemini 3.8 Flash", capabilities: ["text input", "text output"], pricingStatus: "unknown", source: "gemini-models-api", credentialAccess: "listed-for-key" },
      { providerId: "gemini", id: "gemini-3.7-flash", name: "Gemini 3.7 Flash", capabilities: ["text input", "text output"], pricingStatus: "unknown", source: "gemini-models-api", credentialAccess: "listed-for-key" },
    ], refreshedAt: Date.now(), cached: false }) })
    : route.continue());
  await page.goto("/");
  await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");
  await page.goto("/");
  const geminiSettings = await selectProviderInSettings(page, "Gemini");
  await page.getByLabel("Gemini session API key").fill("ephemeral-gemini-key");
  await geminiSettings.getByRole("button", { name: "Save & refresh models" }).click();
  await expect(geminiSettings).toContainText("2 supported models");
  const modelSelect = page.getByLabel("Settings selected model");
  await expect(modelSelect).toContainText("Gemini 3.8 Flash · gemini-3.8-flash");
  await expect(modelSelect).toContainText("Gemini 3.7 Flash · gemini-3.7-flash");
  await expect(modelSelect).not.toContainText("GPT-6");
  await selectSettingsModel(page, "gemini-3.7-flash");
  await expect(page.locator(".active-model-setting")).toContainText("Gemini 3.7 Flash");
  await expect(geminiSettings).toContainText("Session credentials set for this tab");
  await expect(geminiSettings).toContainText("Active provider for new requests");
});

test("configures Cloudflare with a session token and account ID, then sends the selected model", async ({ page }) => {
  const accountId = "0123456789abcdef0123456789abcdef";
  let sentProvider = "";
  let sentModel = "";
  let sentToken = "";
  let sentAccount = "";
  let cloudflareCatalogRequestCount = 0;
  await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ defaultProvider: "openai", defaultModel: "gpt-6-luna", providers: { cloudflare: { configured: false, tokenConfigured: false, accountConfigured: false }, openai: { configured: false }, gemini: { configured: false }, openrouter: { configured: false }, ollama: { configured: false } } }) }));
  await page.route("**/api/models**", (route) => {
    if (!route.request().url().includes("provider=cloudflare")) return route.continue();
    cloudflareCatalogRequestCount += 1;
    if (cloudflareCatalogRequestCount > 1) return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ error: "Cloudflare denied access to this account.", errorKind: "permission" }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ provider: "cloudflare", models: [
      { providerId: "cloudflare", id: "@cf/google/gemma-4-26b-a4b-it", name: "Gemma 4 26B A4B IT", capabilities: ["text input", "text output"], pricingStatus: "unknown", source: "cloudflare-models-api", namespace: "Cloudflare Workers AI", credentialAccess: "listed-for-key" },
    ], diagnostic: { sourceCount: 1, compatibleCount: 1, excludedCount: 0, message: "1 of 1 Cloudflare catalog entries support text generation through Chat Completions." }, refreshedAt: Date.now(), cached: false }) })
  });
  await page.route("**/api/chat", async (route) => {
    const request = route.request().postDataJSON() as { provider: string; model: string };
    const headers = route.request().headers();
    sentProvider = request.provider;
    sentModel = request.model;
    sentToken = headers["x-katalyst-provider-key"] ?? "";
    sentAccount = headers["x-katalyst-cloudflare-account-id"] ?? "";
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ text: "Cloudflare answered the lesson question." }) });
  });
  await page.goto("/");
  const settingsCard = await selectProviderInSettings(page, "Kat AI");
  await page.getByRole("radio", { name: /Bring your own key/ }).check();
  await page.getByLabel("Cloudflare account ID").fill(accountId);
  await page.getByLabel("Cloudflare Workers AI session API key").fill("tab-cloudflare-secret");
  await settingsCard.getByRole("button", { name: "Save & refresh models" }).click();
  await expect(settingsCard).toContainText("1 supported model");
  await expect(page.getByLabel("Settings selected model")).toContainText("Gemma 4 26B A4B IT");
  await selectSettingsModel(page, "@cf/google/gemma-4-26b-a4b-it");
  await settingsCard.getByRole("button", { name: "Test inference" }).click();
  await expect(settingsCard).toContainText("Inference succeeded using @cf/google/gemma-4-26b-a4b-it.");
  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  await page.getByRole("textbox", { name: "Message Katalyst" }).fill("Help me understand C compilation");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByText("Cloudflare answered the lesson question.")).toBeVisible();
  await openSettingsCategory(page, "AI & Kat");
  await expect(settingsCard).toContainText("Inference succeeded");
  await settingsCard.getByRole("button", { name: "Save & refresh models" }).click();
  await expect(settingsCard.locator(".inline-error")).toContainText("Cloudflare denied access");
  await expect(page.locator(".active-model-setting")).toContainText("Gemma 4 26B A4B IT");
  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  await expect(page.locator(".topbar .provider-selector")).toHaveCount(0);
  await expect(page.locator(".topbar .model-selector")).toHaveCount(0);
  expect({ sentProvider, sentModel, sentToken, sentAccount }).toEqual({ sentProvider: "cloudflare", sentModel: "@cf/google/gemma-4-26b-a4b-it", sentToken: "tab-cloudflare-secret", sentAccount: accountId });
  const localRecord = await page.evaluate(() => window.localStorage.getItem("katalyst.workspace.v1") ?? "");
  expect(localRecord).not.toContain("tab-cloudflare-secret");
  expect(localRecord).not.toContain(accountId);
});

test("explains empty and filtered Cloudflare catalogs in Settings and the model picker", async ({ page }) => {
  let refreshCount = 0;
  await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ defaultProvider: "cloudflare", defaultModel: "", providers: { cloudflare: { configured: false, tokenConfigured: false, accountConfigured: false }, openai: { configured: false }, gemini: { configured: false }, openrouter: { configured: false }, ollama: { configured: false } } }) }));
  await page.route("**/api/models**", async (route) => {
    if (!route.request().url().includes("provider=cloudflare")) return route.continue();
    refreshCount += 1;
    const empty = refreshCount === 1;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      provider: "cloudflare",
      models: [],
      diagnostic: empty
        ? { sourceCount: 0, compatibleCount: 0, excludedCount: 0, message: "Cloudflare returned an empty model catalog for this account." }
        : { sourceCount: 3, compatibleCount: 0, excludedCount: 3, message: "Cloudflare returned 3 catalog entries, but none could be confirmed as text-generation models for Chat Completions." },
      refreshedAt: Date.now(), cached: false,
    }) });
  });
  await page.goto("/");
  const card = await selectProviderInSettings(page, "Kat AI");
  await page.getByRole("radio", { name: /Bring your own key/ }).check();
  await page.getByLabel("Cloudflare account ID").fill("0123456789abcdef0123456789abcdef");
  await page.getByLabel("Cloudflare Workers AI session API key").fill("mock-cloudflare-token");
  const refresh = card.getByRole("button", { name: "Save & refresh models" });
  await refresh.click();
  await expect(card.locator(".model-catalog-diagnostic")).toContainText("empty model catalog");
  await refresh.click();
  await expect(card.locator(".model-catalog-diagnostic")).toContainText("3 catalog entries");
  await expect(page.getByLabel("Settings selected model")).toBeDisabled();
  await expect(page.getByLabel("Settings selected model")).toContainText("No supported models loaded");
  expect(refreshCount).toBe(2);
});

test("includes an enabled skill in the model request and shows what was applied", async ({ page }) => {
  let sentRequest: { provider: string; context?: string } | undefined;
  await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ defaultProvider: "openai", defaultModel: "gpt-6-luna", providers: { openai: { configured: false }, gemini: { configured: false }, openrouter: { configured: false } } }) }));
  await page.route("**/api/chat", async (route) => {
    sentRequest = route.request().postDataJSON() as { provider: string; context?: string };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ text: "Mocked response for the UI test." }) });
  });
  await page.goto("/");
  await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: /skill library/i }).click();
  await page.getByRole("checkbox", { name: "Enable Clear technical writing" }).check();
  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  await page.getByRole("textbox", { name: "Message Katalyst" }).fill("Explain a concept");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByText("Mocked response for the UI test.")).toBeVisible();
  await expect(page.locator(".applied-skills")).toContainText("Clear technical writing");
  expect(sentRequest?.provider).toBe("openai");
  expect(sentRequest?.context).toContain("Use plain language.");
});

test("imports and enables a local Markdown skill", async ({ page }) => {
  await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ defaultProvider: "openai", defaultModel: "gpt-6-luna", providers: { openai: { configured: false }, gemini: { configured: false }, openrouter: { configured: false } } }) }));
  await page.goto("/");
  await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: /skill library/i }).click();
  await page.getByRole("button", { name: /import a skill/i }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "meeting-notes.md",
    mimeType: "text/markdown",
    buffer: Buffer.from("---\nname: Meeting notes\ndescription: Summarize decisions and owners.\n---\n\nList each decision, owner, and due date."),
  });
  await expect(page.getByRole("heading", { name: "Meeting notes" })).toBeVisible();
  const toggle = page.getByRole("checkbox", { name: "Enable Meeting notes" });
  await toggle.check();
  await expect(toggle).toBeChecked();
});

test("keeps session-only keys out of localStorage and sends them in a request header", async ({ page }) => {
  let sentKey = "";
  await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ defaultProvider: "openai", defaultModel: "gpt-6-luna", providers: { openai: { configured: false }, gemini: { configured: false }, openrouter: { configured: false } } }) }));
  await page.route("**/api/chat", async (route) => {
    sentKey = route.request().headers()["x-katalyst-provider-key"] ?? "";
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ text: "Session key answer" }) });
  });
  await page.goto("/");
  await openSettingsCategory(page, "AI Providers");
  await page.getByLabel("OpenAI session API key").fill("tab-only-secret");
  const openAiSettings = page.locator(".settings-card").filter({ has: page.getByRole("heading", { name: "OpenAI", exact: true }) });
  await openAiSettings.getByRole("button", { name: "Save for this tab" }).click();
  const persisted = await page.evaluate(() => window.localStorage.getItem("katalyst.workspace.v1") ?? "");
  expect(persisted).not.toContain("tab-only-secret");
  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  await page.getByRole("textbox", { name: "Message Katalyst" }).fill("Use the session key");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Session key answer")).toBeVisible();
  expect(sentKey).toBe("tab-only-secret");
  await openSettingsCategory(page, "AI Providers");
  await openAiSettings.getByRole("button", { name: "Clear session key" }).click();
  await expect(page.getByLabel("OpenAI session API key")).toHaveValue("");
  await page.reload();
  await openSettingsCategory(page, "AI Providers");
  await expect(page.getByLabel("OpenAI session API key")).toHaveValue("");
});

test("filters OpenRouter catalog prices and routes the selected model without a fallback", async ({ page }) => {
  let sentRequest: { provider: string; model: string } | undefined;
  await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ defaultProvider: "openai", defaultModel: "gpt-6-luna", providers: { openai: { configured: false }, gemini: { configured: false }, openrouter: { configured: false } } }) }));
  await page.route("**/api/models**", (route) => route.request().url().includes("provider=openrouter")
    ? route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ models: [
      { providerId: "openrouter", id: "openrouter/free", name: "Free model routing", capabilities: ["text input", "text output"], contextLimit: 200000, pricing: { inputPerMillion: 0, outputPerMillion: 0 }, pricingStatus: "free", source: "openrouter-router", namespace: "OpenRouter", credentialAccess: "not-verified", freeRouting: true },
      { providerId: "openrouter", id: "publisher/free-demo:free", name: "Publisher Free Demo", capabilities: ["text input", "text output"], contextLimit: 4096, pricing: { inputPerMillion: 0, outputPerMillion: 0 }, pricingStatus: "free", source: "openrouter-models-api", namespace: "publisher", credentialAccess: "not-verified" },
      { providerId: "openrouter", id: "publisher/paid-demo", name: "Publisher Paid Demo", capabilities: ["text input", "text output"], contextLimit: 8192, pricing: { inputPerMillion: 1.25, outputPerMillion: 2.5 }, pricingStatus: "paid", source: "openrouter-models-api", namespace: "publisher", credentialAccess: "not-verified" },
    ], refreshedAt: Date.now(), cached: false }) })
    : route.continue());
  await page.route("**/api/chat", async (route) => {
    sentRequest = route.request().postDataJSON() as { provider: string; model: string };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ text: "Selected OpenRouter model answered." }) });
  });
  await page.goto("/");
  const openRouterSettings = await selectProviderInSettings(page, "OpenRouter");
  await page.getByLabel("OpenRouter session API key").fill("tab-router-key");
  await openRouterSettings.getByRole("button", { name: "Save & refresh models" }).click();
  const modelSelect = page.getByLabel("Settings selected model");
  await page.getByLabel("Filter by price").selectOption("free");
  await expect(modelSelect).toContainText("Publisher Free Demo");
  await expect(modelSelect).not.toContainText("Publisher Paid Demo");
  await page.getByLabel("Filter by price").selectOption("paid");
  await expect(modelSelect).toContainText("Publisher Paid Demo");
  await expect(modelSelect).not.toContainText("Publisher Free Demo");
  await expect(modelSelect).toContainText("$1.25");
  await page.getByLabel("Search models in settings").fill("Publisher Paid Demo");
  await expect(modelSelect.locator("option")).toHaveCount(2);
  await selectSettingsModel(page, "publisher/paid-demo");
  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  await page.getByRole("textbox", { name: "Message Katalyst" }).fill("Use the selected model");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Selected OpenRouter model answered.")).toBeVisible();
  expect(sentRequest?.provider).toBe("openrouter");
  expect(sentRequest?.model).toBe("publisher/paid-demo");
});

test("opens the mobile navigation without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => window.localStorage.setItem("katalyst.sidebar.collapsed.v1", "true"));
  await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ defaultProvider: "openai", defaultModel: "gpt-6-luna", providers: { openai: { configured: false }, gemini: { configured: false }, openrouter: { configured: false } } }) }));
  await page.goto("/");
  await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");
  await page.screenshot({ path: "work/katalyst-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Open navigation" }).click();
  const sidebar = page.locator(".sidebar");
  await expect(sidebar).toHaveClass(/sidebar-open/);
  await expect(sidebar).not.toHaveClass(/sidebar-collapsed/);
  await expect(sidebar.getByRole("button", { name: "Learning Home" })).toBeVisible();
  await expect(sidebar.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  const dimensions = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: window.innerWidth }));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
});

test("collapses and restores navigation preference and uses the KATALYST breadcrumb", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");
  const sidebar = page.locator(".sidebar");
  await page.waitForFunction(() => window.localStorage.getItem("katalyst.sidebar.collapsed.v1") === "false");
  await page.getByRole("button", { name: "Collapse navigation" }).click();
  await expect(sidebar).toHaveClass(/sidebar-collapsed/);
  await page.waitForFunction(() => window.localStorage.getItem("katalyst.sidebar.collapsed.v1") === "true");

  await page.reload();
  await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");
  await expect(page.getByRole("button", { name: "Expand navigation" })).toBeVisible();
  await expect(sidebar).toHaveClass(/sidebar-collapsed/);
  await page.getByRole("button", { name: "Expand navigation" }).click();
  await expect(sidebar).not.toHaveClass(/sidebar-collapsed/);
  await page.waitForFunction(() => window.localStorage.getItem("katalyst.sidebar.collapsed.v1") === "false");

  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await page.getByRole("button", { name: "KATALYST", exact: true }).click();
  await expect(page.getByRole("heading", { name: /explore how things work/i })).toBeVisible();
});

test("keeps a fully collapsed, accessible icon rail at desktop and tablet widths", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");
  for (const width of [1440, 1280, 1024, 800, 768]) {
    await page.setViewportSize({ width, height: 800 });
    const sidebar = page.locator(".sidebar");
    await page.getByRole("button", { name: "Collapse navigation" }).click();
    await expect(sidebar).toHaveClass(/sidebar-collapsed/);
    await expect.poll(() => sidebar.evaluate((element) => Math.round(element.getBoundingClientRect().width))).toBe(48);
    await expect(page.getByRole("button", { name: "Expand navigation" })).toBeVisible();
    await expect(sidebar.getByRole("button", { name: "Learning Home" })).toHaveAttribute("title", "Learning Home");
    await expect(sidebar.getByRole("button", { name: "Workspace", exact: true })).toHaveAttribute("title", "Workspace");
    await expect(sidebar.locator(".section-heading").first()).toBeHidden();
    await expect(sidebar.locator(".provider-state")).toBeHidden();
    await expect(sidebar.locator(".sidebar-legal-links")).toBeHidden();
    await expect(sidebar.locator("a[href='/login']")).toHaveCount(0);
    await expect(sidebar.locator(".brand-mark")).toBeHidden();
    await expect(sidebar.locator('.nav-item[aria-current="page"]')).toBeVisible();
    if (width === 800) {
      const workspaceIcon = sidebar.getByRole("button", { name: "Workspace", exact: true });
      await workspaceIcon.focus();
      await page.keyboard.press("Enter");
      await expect(workspaceIcon).toHaveClass(/selected/);
    }
    const dimensions = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
    await page.getByRole("button", { name: "Expand navigation" }).click();
    await expect.poll(() => sidebar.evaluate((element) => Math.round(element.getBoundingClientRect().width))).toBe(220);
  }
});

test("keeps the editor and rendered lesson code dark in both appearance themes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await page.getByRole("button", { name: "Explore Learning Paths", exact: true }).click();
  await ensureCourseDetails(page);
  await page.getByRole("button", { name: /start learning/i }).click();
  await expect(page.getByLabel("C source code")).toBeVisible();

  const editor = page.locator(".c-source-editor-host .cm-editor");
  const terminal = page.locator(".learning-code-panel .c-console-output");
  const codeBlock = page.locator(".lesson-copy .markdown-code-block").first();
  await expect.poll(() => editor.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(26, 29, 33)");
  await expect.poll(() => editor.evaluate((element) => getComputedStyle(element).color)).toBe("rgb(230, 237, 243)");
  await expect.poll(() => terminal.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(26, 29, 33)");
  await expect.poll(() => terminal.evaluate((element) => getComputedStyle(element).color)).toBe("rgb(230, 237, 243)");
  await expect.poll(() => codeBlock.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(26, 29, 33)");
  await expect.poll(() => codeBlock.locator(".markdown-code-heading").evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(34, 38, 43)");

  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.getByRole("button", { name: "Explore Learning Paths", exact: true }).click();
  await ensureCourseDetails(page);
  await page.getByRole("button", { name: /start learning|continue this course/i }).click();
  await expect.poll(() => editor.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(24, 24, 29)");
  await expect.poll(() => editor.evaluate((element) => getComputedStyle(element).color)).toBe("rgb(228, 228, 231)");
  await expect.poll(() => terminal.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(24, 24, 29)");
  await expect.poll(() => terminal.evaluate((element) => getComputedStyle(element).color)).toBe("rgb(228, 228, 231)");
  await expect.poll(() => codeBlock.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(24, 24, 29)");
  const dimensions = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
});

test("shows expected example output without horizontal page overflow in both themes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Explore Learning Paths", exact: true }).click();
  await page.getByRole("button", { name: /C Programming Foundations/i }).click();
  await ensureCourseDetails(page);
  await page.getByRole("button", { name: /start learning/i }).click();
  const expectedOutput = page.locator(".lesson-example-run");
  await expect(expectedOutput).toContainText("Hello, C!");

  for (const [theme, expectedBackground] of [["Light", "rgb(37, 99, 235)"], ["Dark", "rgb(37, 99, 235)"]] as const) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole("button", { name: "Open settings", exact: true }).click();
    await page.getByRole("button", { name: theme, exact: true }).click();
    await page.getByRole("button", { name: "Learning Home", exact: true }).click();
    await expect(page.locator(".app-shell")).toHaveAttribute("data-theme", theme.toLowerCase());
    const primary = page.locator(".home-lab-actions .primary-button");
    const colors = await primary.evaluate((element) => {
      const parse = (value: string) => value.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
      const linear = (value: number) => { const channel = value / 255; return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4; };
      const luminance = (color: number[]) => 0.2126 * linear(color[0]!) + 0.7152 * linear(color[1]!) + 0.0722 * linear(color[2]!);
      const background = parse(getComputedStyle(element).backgroundColor);
      const foreground = parse(getComputedStyle(element).color);
      const light = Math.max(luminance(background), luminance(foreground));
      const dark = Math.min(luminance(background), luminance(foreground));
      return { background: getComputedStyle(element).backgroundColor, contrast: (light + 0.05) / (dark + 0.05) };
    });
    expect(colors.background).toBe(expectedBackground);
    expect(colors.contrast).toBeGreaterThanOrEqual(4.5);
    await primary.click();
    await expect(expectedOutput).toBeVisible();

    for (const width of [1440, 1024, 390]) {
      await page.setViewportSize({ width, height: 850 });
      const dimensions = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }));
      expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
      await expect(expectedOutput).toBeVisible();
    }
  }
});

test("verifies dark mode contrast, readability, and absence of legacy green tones across views", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");

  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator(".app-shell")).toHaveAttribute("data-theme", "dark");

  const checkContrastAndLegibility = async (viewName: string) => {
    const parse = (val: string) => val.match(/\d+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
    const shellBg = await page.locator(".app-shell").evaluate((el) => getComputedStyle(el).backgroundColor);
    const [r, g, b] = parse(shellBg);
    expect(r, `${viewName} shell bg red`).toBeLessThan(40);
    expect(g, `${viewName} shell bg green`).toBeLessThan(40);
    expect(b, `${viewName} shell bg blue`).toBeLessThan(40);

    const headings = page.locator("h1, h2");
    const headingCount = await headings.count();
    for (let i = 0; i < Math.min(headingCount, 4); i++) {
      const heading = headings.nth(i);
      if (await heading.isVisible()) {
        const text = (await heading.textContent())?.trim();
        if (text) {
          const color = await heading.evaluate((el) => getComputedStyle(el).color);
          const [hr, hg, hb] = parse(color);
          expect(hr, `${viewName} heading "${text}" red`).toBeGreaterThan(180);
          expect(hg, `${viewName} heading "${text}" green`).toBeGreaterThan(180);
          expect(hb, `${viewName} heading "${text}" blue`).toBeGreaterThan(180);
        }
      }
    }

    const legacyGreens = ["rgb(15, 118, 110)", "rgb(20, 184, 166)", "rgb(13, 148, 136)", "rgb(45, 212, 191)"];
    const elementsWithLegacyColor = await page.evaluate((greens) => {
      const all = Array.from(document.querySelectorAll("button, a, span, p, h1, h2, div"));
      return all.some((el) => {
        const style = window.getComputedStyle(el);
        return greens.includes(style.backgroundColor) || greens.includes(style.color);
      });
    }, legacyGreens);
    expect(elementsWithLegacyColor, `${viewName} has no legacy green colors`).toBe(false);
  };

  await checkContrastAndLegibility("Settings");

  await page.getByRole("button", { name: "Learning Home", exact: true }).click();
  await checkContrastAndLegibility("Learning Home");

  await page.getByRole("button", { name: "Explore Learning Paths", exact: true }).click();
  await checkContrastAndLegibility("Explore");

  await ensureCourseDetails(page);
  await page.getByRole("button", { name: /start learning|continue this course/i }).first().click();
  await checkContrastAndLegibility("Lesson Workspace");

  await page.getByRole("button", { name: "Playground", exact: true }).click();
  await checkContrastAndLegibility("Playground");
});

test("keeps provider and model controls inside the AI & Kat Settings section", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(page.locator(".topbar .provider-selector, .topbar .model-selector, .topbar .model-managed-label")).toHaveCount(0);
  await expect(page.locator(".ai-quota-pill")).toHaveCount(0);
  await expect(page.locator(".provider-settings-card")).toHaveCount(0);
  await openSettingsCategory(page, "AI & Kat");
  await expect(page.getByRole("heading", { name: "AI & Kat", exact: true })).toBeVisible();
  await expect(page.locator(".provider-settings-card").first()).toBeVisible();
  await selectProviderInSettings(page, "OpenAI");
  await expect(page.getByLabel("Settings selected model")).toBeVisible();
  await expect(page.locator(".topbar .provider-selector, .topbar .model-selector, .topbar .model-managed-label")).toHaveCount(0);
  await expect(page.locator(".app-shell")).not.toHaveCSS("overflow-x", "scroll");
});
test("renders one settings category and preserves category selection across app navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open settings" }).click();
  await expect(page.getByRole("heading", { name: "Appearance" })).toBeVisible();
  await expect(page.locator(".settings-card")).toHaveCount(1);

  await page.getByRole("tab", { name: "AI & Kat" }).click();
  await expect(page.getByRole("heading", { name: "AI & Kat", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Usage & Credits" })).toBeVisible();
  await expect(page.locator(".settings-section-nav")).toHaveCSS("position", "sticky");

  await page.getByRole("tab", { name: "Workspace Data" }).click();
  await expect(page.getByRole("heading", { name: "Workspace", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Learning Home" }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Workspace Data" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "Workspace backup" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Appearance" })).toHaveCount(0);
});

test("keeps the C Playground usable on a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Playground", exact: true }).click();
  await page.getByText("Launch C Workbench").click();
  await expect.poll(() => page.locator(".sidebar").evaluate((element) => element.getBoundingClientRect().right)).toBeLessThanOrEqual(0);
  await expect(page.locator(".app-shell")).toHaveClass(/app-shell-ide/);
  await expect(page.locator(".playground-runtime-header")).toBeVisible();
  await expect(page.getByLabel("C source code")).toBeVisible();
  await expect(page.locator("#c-playground-stdin")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeVisible();
  await expect(page.locator(".c-output-pane")).toBeHidden();
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.locator(".c-output-pane")).toBeVisible();
  await expect(page.getByLabel("Terminal standard input")).toBeVisible();
  const dimensions = await page.evaluate(() => ({ body: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
  await page.screenshot({ path: "work/katalyst-mobile-playground.png", fullPage: true });
});

test("fits the full-screen C IDE at desktop, laptop, tablet, and mobile widths", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }, { width: 768, height: 900 }, { width: 375, height: 812 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    if (viewport.width <= 760) await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("button", { name: "Playground", exact: true }).click();
    await page.getByText("Launch C Workbench").click();
    await expect(page.locator(".c-editor-pane")).toBeVisible();
    await expect(page.locator(".c-output-pane")).toBeHidden();
    await page.getByRole("button", { name: "Run", exact: true }).click();
    await expect(page.locator(".c-output-pane")).toBeVisible();
    const layout = await page.evaluate(() => {
      const editor = document.querySelector(".c-editor-pane")!.getBoundingClientRect();
      const terminal = document.querySelector(".c-output-pane")!.getBoundingClientRect();
      return { editorX: editor.x, editorY: editor.y, editorWidth: editor.width, editorBottom: editor.bottom, terminalX: terminal.x, terminalY: terminal.y, terminalWidth: terminal.width, viewportWidth: window.innerWidth, pageWidth: document.documentElement.scrollWidth };
    });
    expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewportWidth);
    if (viewport.width > 767) {
      expect(layout.terminalX).toBeGreaterThanOrEqual(layout.editorX + layout.editorWidth - 2);
      expect(layout.terminalWidth).toBeGreaterThanOrEqual(300);
    } else {
      expect(layout.terminalY).toBeGreaterThanOrEqual(layout.editorBottom - 2);
    }
  }
});

test("selects Ollama, discovers a local model, and sends a local generation request", async ({ page }) => {
  await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ defaultProvider: "openai", defaultModel: "gpt-6-luna", providers: { openai: { configured: false }, gemini: { configured: false }, openrouter: { configured: false }, ollama: { configured: false } } }) }));
  await page.route("**/api/models?provider=ollama**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ provider: "ollama", models: [{ providerId: "ollama", id: "qwen2.5:7b", name: "qwen2.5:7b", namespace: "Local Ollama", capabilities: ["text generation", "local"], pricingStatus: "unknown", source: "ollama-tags-api", credentialAccess: "not-verified", local: true, sizeBytes: 4_681_000_000, parameterSize: "7B", quantization: "Q4_K_M" }] }) }));
  let requestBody: Record<string, unknown> | undefined;
  let requestHeaders: Record<string, string> | undefined;
  await page.route("**/api/chat", async (route) => {
    requestBody = route.request().postDataJSON() as Record<string, unknown>;
    requestHeaders = await route.request().allHeaders();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ text: "Local Ollama answer", provider: "ollama", model: "qwen2.5:7b", usage: { inputTokens: 9, outputTokens: 5 } }) });
  });
  await page.goto("/");
  const ollamaSettings = await selectProviderInSettings(page, "Ollama");
  await ollamaSettings.getByRole("button", { name: "Save & refresh models" }).click();
  await expect(ollamaSettings).toContainText("1 supported model");
  await selectSettingsModel(page, "qwen2.5:7b");
  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  await page.getByRole("textbox", { name: "Message Katalyst" }).fill("Use local inference");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByText("Local Ollama answer")).toBeVisible();
  expect(requestBody).toMatchObject({ provider: "ollama", model: "qwen2.5:7b" });
  expect(requestHeaders).toMatchObject({ "x-katalyst-ollama-url": "http://localhost:11434" });
  expect(requestHeaders).not.toHaveProperty("x-katalyst-provider-key");
  const requestMetadata = page.locator(".message-metadata").last();
  await expect(requestMetadata).toContainText("Request complete");
  await expect(requestMetadata).not.toContainText("Ollama");
  await expect(requestMetadata).not.toContainText("qwen2.5:7b");
});

const markdownProviderCases = [
  { provider: "openai", name: "OpenAI", model: "gpt-6-luna", displayModel: "GPT-6 Luna" },
  { provider: "gemini", name: "Gemini", model: "gemini-3.8-flash", displayModel: "gemini-3.8-flash" },
  { provider: "openrouter", name: "OpenRouter", model: "openrouter/free", displayModel: "openrouter/free" },
  { provider: "ollama", name: "Ollama", model: "qwen2.5:7b", displayModel: "qwen2.5:7b" },
] as const;

const assistantMarkdownReply = "# Provider response\n\n**Bold** and *italic*.\n\n1. First\n   - Nested\n\n| Item | State |\n| --- | --- |\n| Markdown | rendered |\n\n```ts\nconst answer = 42;\n// A deliberately long code line to check that the code panel scrolls horizontally on small screens without stretching the page.\n```\n\n[Safe link](https://example.com)\n\n<script>window.__katalystMarkdownXssProbe = true;</script>\n<img src=x onerror=\"window.__katalystMarkdownXssProbe = true\">";

for (const { provider, name, model } of markdownProviderCases) {
  test(`renders ${name} Markdown responses with code and tables`, async ({ page }) => {
    if (provider === "openai") await page.setViewportSize({ width: 375, height: 812 });
    await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ defaultProvider: "openai", defaultModel: "gpt-6-luna", providers: { openai: { configured: true }, gemini: { configured: true }, openrouter: { configured: true }, ollama: { configured: true } } }) }));
    await page.route("**/api/models**", (route) => {
      const requestedProvider = new URL(route.request().url()).searchParams.get("provider");
      const models = requestedProvider === "gemini" ? [{ providerId: "gemini", id: model, name: model, capabilities: ["text input", "text output"], pricingStatus: "unknown", source: "gemini-models-api", credentialAccess: "listed-for-key" }]
        : requestedProvider === "openrouter" ? [{ providerId: "openrouter", id: model, name: model, capabilities: ["text input", "text output"], pricingStatus: "free", source: "openrouter-router", credentialAccess: "not-verified", freeRouting: true }]
          : requestedProvider === "ollama" ? [{ providerId: "ollama", id: model, name: model, namespace: "Local Ollama", capabilities: ["text generation", "local"], pricingStatus: "unknown", source: "ollama-tags-api", credentialAccess: "not-verified", local: true }]
            : [{ providerId: "openai", id: model, name: "GPT-6 Luna", capabilities: ["text input", "text output"], pricingStatus: "unknown", source: "built-in", credentialAccess: "not-verified" }];
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ provider: requestedProvider, models, refreshedAt: Date.now(), cached: false }) });
    });
    let requestProvider = "";
    await page.route("**/api/chat", async (route) => {
      const request = route.request().postDataJSON() as { provider: string; model: string };
      requestProvider = request.provider;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ text: assistantMarkdownReply, provider: request.provider, model: request.model }) });
    });

    await page.goto("/");
    await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");
    const settingsCard = await selectProviderInSettings(page, name);
    if (provider === "gemini") {
      await page.getByLabel("Gemini session API key").fill("tab-gemini-key");
    }
    if (provider !== "openai") {
      const refresh = settingsCard.getByRole("button", { name: "Save & refresh models" });
      if (await refresh.isVisible().catch(() => false)) await refresh.click();
    }
    await selectSettingsModel(page, model);
    await openWorkspace(page);
    await page.getByRole("textbox", { name: "Message Katalyst" }).fill("Please format **this** answer.");
    await page.getByRole("button", { name: "Send message", exact: true }).click();

    await expect(page.locator(".message.user p")).toHaveText("Please format **this** answer.");
    const response = page.locator(".message.assistant .assistant-markdown");
    await expect(response.getByRole("heading", { name: "Provider response" })).toBeVisible();
    await expect(response.locator("script, img")).toHaveCount(0);
    expect(await page.evaluate(() => (window as Window & { __katalystMarkdownXssProbe?: boolean }).__katalystMarkdownXssProbe)).toBeUndefined();
    await expect(response.locator("strong")).toHaveText("Bold");
    await expect(response.locator("table")).toBeVisible();
    await expect(response.locator(".markdown-code-language")).toHaveText("ts");
    const copyCode = response.getByRole("button", { name: "Copy code" });
    await expect(copyCode).toBeVisible();
    expect(await response.locator(".markdown-code-scroll pre").innerText()).toContain("const answer = 42;");
    if (provider === "openai") {
      const codeOverflow = await response.locator(".markdown-code-scroll").evaluate((element) => element.scrollWidth > element.clientWidth);
      const tableOverflow = await response.locator(".markdown-table-scroll").evaluate((element) => element.scrollWidth > element.clientWidth);
      const pageWidths = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: window.innerWidth }));
      expect(codeOverflow).toBe(true);
      expect(tableOverflow).toBe(true);
      expect(pageWidths.body).toBeLessThanOrEqual(pageWidths.viewport);
    }
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await copyCode.click();
    await expect(response.getByRole("button", { name: "Code copied" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("const answer = 42;");
    expect(requestProvider).toBe(provider);
  });
}

test("starts the C learning path and records progress independently of the workspace", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");
  await expect(page.getByRole("heading", { name: /explore how things work/i })).toBeVisible();
  await expect(page.getByText(/your activity will appear here/i)).toBeVisible();

  const workspaceBefore = await page.evaluate(() => window.localStorage.getItem("katalyst.workspace.v1"));
  await page.getByRole("button", { name: "My Learning", exact: true }).click();
  await expect(page.getByRole("heading", { name: /your learning starts when you do/i })).toBeVisible();
  await page.getByRole("button", { name: "Explore courses", exact: true }).click();
  await ensureCourseDetails(page);
  await expect(page.getByRole("heading", { name: "C Programming Foundations" })).toBeVisible();
  await page.getByRole("button", { name: /start learning/i }).click();
  await expect(page.getByRole("heading", { name: "From source code to output" })).toBeVisible();
  await expect(page.locator(".lesson-copy pre code")).toContainText("int main(void)");
  await page.getByRole("button", { name: /mark lesson complete/i }).click();
  await expect(page.getByRole("button", { name: /lesson completed/i })).toBeVisible();
  await page.getByRole("button", { name: "Progress", exact: true }).click();
  await expect(page.getByText("1 of 123 lessons", { exact: true })).toBeVisible();
  await page.waitForFunction(() => window.localStorage.getItem("katalyst.learning.v1")?.includes("source-to-output") === true);
  expect(await page.evaluate(() => window.localStorage.getItem("katalyst.workspace.v1"))).toBe(workspaceBefore);

  const progressDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export learning progress" }).click();
  const progressDownload = await progressDownloadPromise;
  expect(progressDownload.suggestedFilename()).toMatch(/^katalyst-learning-progress-\d{4}-\d{2}-\d{2}\.json$/);
  const progressFile = await progressDownload.path();
  expect(progressFile).not.toBeNull();
  const exportedProgress = JSON.parse(await readFile(progressFile!, "utf8")) as { version: number; enrollments: Array<{ completedLessons: Array<unknown> }> };
  expect(exportedProgress.version).toBe(1);
  expect(exportedProgress.enrollments).toHaveLength(1);
  expect(exportedProgress.enrollments[0]?.completedLessons).toHaveLength(1);

  await page.reload();
  await page.getByRole("button", { name: "My Learning", exact: true }).click();
  await expect(page.locator(".my-learning-row")).toContainText("1 of 16 lessons complete");
});

test("keeps the integrated lesson workspace and Practice Lab within a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Explore Learning Paths" }).click();
  await ensureCourseDetails(page);
  await expect(page.getByText("16 LESSONS", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "16 lessons. 6 modules." })).toBeVisible();
  const courseDimensions = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(courseDimensions.document).toBeLessThanOrEqual(courseDimensions.viewport);
  await page.getByRole("button", { name: /start learning/i }).click();
  await expect(page.getByRole("heading", { name: "From source code to output" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Learn" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Code" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Kat" })).toBeVisible();
  await page.getByRole("tab", { name: "Code" }).click();
  await expect(page.getByRole("tab", { name: "Code" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByLabel("C source code")).toBeVisible();
  const codeScroller = page.locator(".learning-code-panel.panel-active");
  await codeScroller.evaluate((element) => {
    const spacer = document.createElement("div");
    spacer.setAttribute("aria-hidden", "true");
    spacer.dataset.mobileScrollTestSpacer = "";
    spacer.style.cssText = "height: 1200px; flex: none;";
    element.append(spacer);
  });
  await expectMobileHeaderStableDuringPanelScroll(page, codeScroller);
  await page.getByRole("tab", { name: "Kat" }).click();
  await expect(page.getByRole("tab", { name: "Kat" })).toHaveAttribute("aria-selected", "true");
  const lessonComposer = page.getByRole("region", { name: "AI Tutor Kat" }).locator(".tutor-composer");
  await expect(lessonComposer).toBeVisible();
  const katScroller = page.locator(".learning-kat-panel.panel-active .tutor-scroll-region");
  await katScroller.evaluate((element) => {
    const spacer = document.createElement("div");
    spacer.setAttribute("aria-hidden", "true");
    spacer.dataset.mobileScrollTestSpacer = "";
    spacer.style.cssText = "height: 1200px; flex: none;";
    element.append(spacer);
  });
  await expectMobileHeaderStableDuringPanelScroll(page, katScroller);
  const composerBounds = await lessonComposer.evaluate((element) => ({ top: element.getBoundingClientRect().top, bottom: element.getBoundingClientRect().bottom, viewport: window.innerHeight }));
  expect(composerBounds.top).toBeGreaterThanOrEqual(0);
  expect(composerBounds.bottom).toBeLessThanOrEqual(composerBounds.viewport);
  const tutorPanel = page.locator(".learning-kat-panel .integrated-tutor-panel");
  const tutorPanelBottom = await tutorPanel.evaluate((element) => element.getBoundingClientRect().bottom);
  const tutorFootnoteBottom = await page.getByRole("region", { name: "AI Tutor Kat" }).locator(".tutor-footnote").evaluate((element) => element.getBoundingClientRect().bottom);
  expect(tutorFootnoteBottom).toBeLessThanOrEqual(tutorPanelBottom + 1);
  await expect(page.locator(".learning-view.learning-lesson")).toHaveCSS("overflow-y", "auto");
  const lessonDimensions = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(lessonDimensions.document).toBeLessThanOrEqual(lessonDimensions.viewport);
  await page.screenshot({ path: "work/katalyst-learning-lesson.png", fullPage: true });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Practice Lab" }).click();
  await expect(page.getByRole("heading", { name: /make your thinking/i })).toBeVisible();
  const practiceDimensions = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(practiceDimensions.document).toBeLessThanOrEqual(practiceDimensions.viewport);
});

test("navigates the expanded course and renders exercise metadata and starter code", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore Learning Paths" }).click();
  await ensureCourseDetails(page);
  await expect(page.getByRole("heading", { name: "16 lessons. 6 modules." })).toBeVisible();
  await page.getByRole("button", { name: /start learning/i }).click();
  const pagination = page.getByRole("navigation", { name: "Lesson navigation" });
  for (let index = 0; index < 4; index += 1) await pagination.getByRole("button").last().click();
  await expect(page.getByRole("heading", { name: "Choose a path with if" })).toBeVisible();
  await page.getByText("Course navigation").click();
  await page.getByRole("button", { name: "Work with C strings" }).click();
  await expect(page.getByRole("heading", { name: "Work with C strings" })).toBeVisible();
  await expect(page.locator(".lesson-checkpoint")).toContainText("What marks the end of a C string");
  await page.getByRole("button", { name: "Practice Lab", exact: true }).click();
  await expect(page.locator(".practice-card")).toHaveCount(16);
  await expect(page.locator(".practice-card").filter({ hasText: "Read and report a value" })).toContainText("Practice goal:");
  await expect(page.locator(".practice-card").filter({ hasText: "Read and report a value" }).getByText("View starter code")).toBeVisible();
});

test("switches lesson panels before the three columns become too narrow", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 850 });
  await page.goto("/");
  await page.getByRole("button", { name: "Explore Learning Paths" }).click();
  await ensureCourseDetails(page);
  await page.getByRole("button", { name: /start learning/i }).click();
  await expect(page.getByRole("heading", { name: "From source code to output" })).toBeVisible();
  for (const width of [1200, 1120, 1024]) {
    await page.setViewportSize({ width, height: 850 });
    await expect(page.getByRole("tab", { name: "Learn" })).toBeVisible();
    const dimensions = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
    await page.getByRole("tab", { name: "Learn" }).click();
    await page.getByRole("tab", { name: "Code" }).click();
    await expect(page.getByRole("tab", { name: "Code" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByLabel("C source code")).toBeVisible();
  }
});

test("routes lesson, code, and tutor-style context through integrated Kat without persisting turns", async ({ page }) => {
  await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ defaultProvider: "openai", defaultModel: "gpt-6-luna", providers: { openai: { configured: true }, gemini: { configured: false }, openrouter: { configured: false }, ollama: { configured: false } } }) }));
  let request: { provider: string; model: string; messages: { role: string; content: string }[]; context: string } | undefined;
  await page.route("**/api/chat", async (route) => {
    request = route.request().postDataJSON() as typeof request;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ text: "Start by checking the loop condition." }) });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Explore Learning Paths" }).click();
  await ensureCourseDetails(page);
  await page.getByRole("button", { name: /start learning/i }).click();
  await page.getByRole("button", { name: "Ask Kat", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kat", exact: true })).toBeVisible();
  await expect(page.locator(".tutor-context-note")).toContainText("lesson and coding activity when they help answer your question");
  await page.getByRole("button", { name: "Socratic tutor" }).click();
  await page.getByRole("button", { name: "Explain this code" }).click();
  await expect(page.locator(".tutor-message.assistant")).toContainText("Start by checking the loop condition.");
  await page.screenshot({ path: "work/katalyst-kat-integrated.png", fullPage: false });
  expect(request).toMatchObject({ provider: "openai", model: "gpt-6-luna" });
  expect(request).toMatchObject({ assistantSurface: "kat" });
  expect(request?.messages.at(-1)?.content).toContain("Walk through my current editor code");
  expect(request?.context).toContain("From source code to output");
  expect(request?.context).toContain("Use questions and small hints");
  expect(request?.context).toContain("Explain how C source code becomes a running program.");
  expect(request?.context).toContain("Trace the first program");
  expect(request?.context).toContain("currentEditorCode");
  expect(request?.context).toContain("#include <stdio.h>");
  expect(request?.context).toContain("Do not execute code");
  const workspace = await page.evaluate(() => window.localStorage.getItem("katalyst.workspace.v1") ?? "");
  expect(workspace).not.toContain("Walk through my current editor code");
});

test("keeps a general Kat question primary and applies only enabled skills after opt-in", async ({ page }) => {
  const requests: Array<{ messages: Array<{ role: string; content: string }>; context?: string }> = [];
  await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ defaultProvider: "openai", defaultModel: "gpt-6-luna", providers: { openai: { configured: true }, gemini: { configured: false }, openrouter: { configured: false }, ollama: { configured: false } } }) }));
  await page.route("**/api/chat", async (route) => {
    requests.push(route.request().postDataJSON() as (typeof requests)[number]);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ text: "A bicycle tire holds pressurized air and provides grip and cushioning." }) });
  });
  await page.goto("/");
  await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: /skill library/i }).click();
  await page.getByRole("checkbox", { name: "Enable Clear technical writing" }).check();
  await expect(page.getByRole("checkbox", { name: "Enable Code review" })).not.toBeChecked();
  await page.getByRole("button", { name: "AI Tutor", exact: true }).click();

  const tutor = page.getByRole("region", { name: "AI Tutor Kat" });
  await expect(tutor.getByRole("button", { name: "Explain this code" })).toHaveCount(0);
  await expect(tutor.getByRole("button", { name: "Explain this concept" })).toHaveCount(0);
  const useSkills = tutor.getByRole("checkbox", { name: "Use enabled workspace skills" });
  await expect(useSkills).not.toBeChecked();
  await tutor.getByRole("textbox", { name: "Ask Kat a question" }).fill("How does a bicycle tire work?");
  await tutor.getByRole("button", { name: "Send question to Kat" }).click();
  const assistantMessage = tutor.locator(".tutor-message.assistant").last();
  await expect(assistantMessage).toContainText("bicycle tire");
  await expect(assistantMessage).not.toContainText("OpenAI");
  await expect(assistantMessage).not.toContainText("gpt-6-luna");
  await expect(tutor.locator(".tutor-response-route")).toHaveCount(0);
  const generalContext = JSON.parse(requests[0].context ?? "{}") as Record<string, unknown>;
  expect(requests[0].messages.at(-1)?.content).toBe("How does a bicycle tire work?");
  expect(requests[0]).toMatchObject({ assistantSurface: "kat" });
  expect(generalContext.lessonContent).toBeUndefined();
  expect(generalContext.enabledSkillGuidance).toBeUndefined();

  await useSkills.check();
  await tutor.getByRole("textbox", { name: "Ask Kat a question" }).fill("What is the purpose of main in C?");
  await tutor.getByRole("button", { name: "Send question to Kat" }).click();
  await expect(tutor.locator(".tutor-message.user").last()).toContainText("Skills used: Clear technical writing");
  const skillContext = JSON.parse(requests[1].context ?? "{}") as { enabledSkillGuidance?: string };
  expect(skillContext.enabledSkillGuidance).toContain("Use plain language.");
  expect(skillContext.enabledSkillGuidance).not.toContain("Review the code for correctness");
});

test("answers who created Kat or KATALYST without calling an AI provider", async ({ page }) => {
  let chatRequestCount = 0;
  await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ defaultProvider: "openai", defaultModel: "gpt-6-luna", providers: { openai: { configured: false }, gemini: { configured: false }, openrouter: { configured: false }, ollama: { configured: false } } }) }));
  await page.route("**/api/chat", async (route) => {
    chatRequestCount += 1;
    await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "The creator question should use the local answer." }) });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "AI Tutor", exact: true }).click();
  const tutor = page.getByRole("region", { name: "AI Tutor Kat" });
  await tutor.getByRole("textbox", { name: "Ask Kat a question" }).fill("Who made Kat AI and KATALYST?");
  await tutor.getByRole("button", { name: "Send question to Kat" }).click();
  await expect(tutor.locator(".tutor-message.assistant").last().locator(".assistant-markdown")).toHaveText("KATALYST and its tutor Kat were created by ADITHYA.");
  expect(chatRequestCount).toBe(0);
});

test("keeps Kat's composer below the message scroller and preserves an upward reading position", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ defaultProvider: "openai", defaultModel: "gpt-6-luna", providers: { openai: { configured: true }, gemini: { configured: false }, openrouter: { configured: false }, ollama: { configured: false } } }) }));
  let responseNumber = 0;
  await page.route("**/api/chat", async (route) => {
    responseNumber += 1;
    const paragraphs = Array.from({ length: 24 }, (_, index) => `Response ${responseNumber}, paragraph ${index + 1}. This explanation stays readable while the learner reviews the conversation.`);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ text: paragraphs.join("\n\n") }) });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Explore Learning Paths", exact: true }).click();
  await ensureCourseDetails(page);
  await page.getByRole("button", { name: /start learning/i }).click();
  await page.getByRole("button", { name: "Ask Kat", exact: true }).click();
  const tutor = page.getByRole("region", { name: "AI Tutor Kat" });
  const conversation = tutor.locator(".tutor-scroll-region");
  const input = tutor.getByRole("textbox", { name: "Ask Kat a question" });

  await input.fill("First question");
  await input.press("Shift+Enter");
  await input.type("with a second line");
  const expandedHeight = await input.evaluate((element) => element.getBoundingClientRect().height);
  expect(expandedHeight).toBeGreaterThan(42);
  expect(expandedHeight).toBeLessThanOrEqual(130);
  await input.press("Enter");
  await expect(tutor.locator(".tutor-message.assistant")).toHaveCount(1);
  await expect.poll(() => conversation.evaluate((element) => element.scrollHeight - element.scrollTop - element.clientHeight)).toBeLessThanOrEqual(2);
  const messageBounds = await tutor.locator(".tutor-message.assistant").last().evaluate((element) => ({ bottom: element.getBoundingClientRect().bottom, conversationBottom: document.querySelector(".tutor-scroll-region")!.getBoundingClientRect().bottom }));
  expect(messageBounds.bottom).toBeLessThanOrEqual(messageBounds.conversationBottom);
  const flowBounds = await conversation.evaluate((element) => ({ bottom: element.getBoundingClientRect().bottom, composerTop: element.parentElement!.querySelector(".tutor-composer")!.getBoundingClientRect().top }));
  expect(flowBounds.bottom).toBeLessThanOrEqual(flowBounds.composerTop);

  await conversation.evaluate((element) => { element.scrollTop = 0; });
  await expect.poll(() => conversation.evaluate((element) => element.scrollTop)).toBe(0);
  await input.fill("Second question");
  await input.press("Enter");
  await expect(tutor.locator(".tutor-message.assistant")).toHaveCount(2);
  await expect.poll(() => conversation.evaluate((element) => element.scrollTop)).toBe(0);
});

test("keeps Kat reading position and the top bar steady on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ defaultProvider: "openai", defaultModel: "gpt-6-luna", providers: { openai: { configured: true }, gemini: { configured: false }, openrouter: { configured: false }, ollama: { configured: false } } }) }));
  let responseNumber = 0;
  await page.route("**/api/chat", async (route) => {
    responseNumber += 1;
    const paragraphs = Array.from({ length: 24 }, (_, index) => "Phone response " + responseNumber + ", paragraph " + (index + 1) + ". Keep this explanation readable while the learner reviews older messages.");
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ text: paragraphs.join("\n\n") }) });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Explore Learning Paths", exact: true }).click();
  await ensureCourseDetails(page);
  await page.getByRole("button", { name: /start learning/i }).click();
  await page.getByRole("tab", { name: "Kat", exact: true }).click();

  const tutor = page.getByRole("region", { name: "AI Tutor Kat" });
  const conversation = tutor.locator(".tutor-scroll-region");
  const input = tutor.getByRole("textbox", { name: "Ask Kat a question" });
  const topbar = page.locator(".topbar");
  const initiallyCollapsed = await topbar.evaluate((element) => element.classList.contains("topbar-collapsed"));

  await input.fill("First mobile question");
  await input.press("Enter");
  await expect(tutor.locator(".tutor-message.assistant")).toHaveCount(1);
  await expect.poll(() => conversation.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  await expect.poll(() => conversation.evaluate((element) => element.scrollHeight - element.scrollTop - element.clientHeight)).toBeLessThanOrEqual(2);

  await conversation.evaluate((element) => { element.scrollTop = 0; });
  await expect.poll(() => conversation.evaluate((element) => element.scrollTop)).toBe(0);
  await input.fill("Second mobile question");
  await input.press("Enter");
  await expect(tutor.locator(".tutor-message.assistant")).toHaveCount(2);
  await expect.poll(() => conversation.evaluate((element) => element.scrollTop)).toBe(0);
  if (initiallyCollapsed) await expect(topbar).toHaveClass(/topbar-collapsed/);
  else await expect(topbar).not.toHaveClass(/topbar-collapsed/);
  const composer = tutor.locator(".tutor-composer");
  await expect(composer).toBeVisible();
  const composerBounds = await composer.evaluate((element) => ({ top: element.getBoundingClientRect().top, bottom: element.getBoundingClientRect().bottom, viewport: window.innerHeight }));
  expect(composerBounds.top).toBeGreaterThanOrEqual(0);
  expect(composerBounds.bottom).toBeLessThanOrEqual(composerBounds.viewport);
});

test("loads lesson examples in the integrated editor and preserves drafts across learning views", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore Learning Paths" }).click();
  await ensureCourseDetails(page);
  await page.getByRole("button", { name: /start learning/i }).click();
  await expect(page.getByRole("heading", { name: "Try the idea yourself" })).toBeVisible();
  await page.getByRole("button", { name: /load lesson example/i }).click();
  const source = page.getByLabel("C source code");
  await expect(source).toContainText(/Hello, C!/);
  await expect.poll(() => page.evaluate(() => JSON.parse(window.localStorage.getItem("katalyst.c.playground.v1") ?? "{}").source)).toMatch(/Hello, C!/);
  await source.fill("#include <stdio.h>\nint main(void) { printf(\"Saved\"); return 0; }\n");
  await page.getByRole("button", { name: /next lesson/i }).click();
  await expect(page.getByRole("heading", { name: "Give values a name" })).toBeVisible();
  await expect(page.getByLabel("C source code")).toContainText(/Saved/);
  await page.getByRole("button", { name: "Reset example" }).click();
  await expect(page.getByLabel("C source code")).toContainText(/Hello, C!/);
  const resetDraft = await page.evaluate(() => JSON.parse(window.localStorage.getItem("katalyst.c.playground.v1") ?? "{}"));
  expect(resetDraft.source).toContain("Hello, C!");
  expect(resetDraft.stdin).toBe("");
});

test("initializes the compiler in the background and retries a failed setup", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?failCompilerFirst=1");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Explore Learning Paths" }).click();
  await ensureCourseDetails(page);
  await page.getByRole("button", { name: /start learning/i }).click();
  await expect(page.locator(".c-playground")).toHaveAttribute("data-compiler-state", "failed");
  await expect(page.locator(".c-playground-notice")).toContainText("The C11 compiler could not be prepared.");
  await expect(page.getByRole("heading", { name: "From source code to output" })).toBeVisible();
  await page.getByRole("tab", { name: "Code" }).click();
  await expect(page.getByRole("button", { name: "Retry compiler setup" })).toBeVisible();
  await page.evaluate(() => { (window as Window & { __failCompilerFirst?: boolean }).__failCompilerFirst = false; });
  await page.getByRole("button", { name: "Retry compiler setup" }).click();
  await expect(page.locator(".c-playground")).toHaveAttribute("data-compiler-state", "ready");
  await expect(page.getByRole("button", { name: "Run code" })).toBeEnabled();
  const attempts = await page.evaluate(() => (window as Window & { __compilerAttempts?: number }).__compilerAttempts);
  expect(attempts).toBeGreaterThanOrEqual(3);
});

test("shows compile and runtime failures clearly and reuses the prepared compiler", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore Learning Paths" }).click();
  await ensureCourseDetails(page);
  await page.getByRole("button", { name: /start learning/i }).click();
  const runButton = page.getByRole("button", { name: "Run code" });
  await expect(runButton).toBeEnabled();

  await page.evaluate(() => { (window as Window & { __cPlaygroundOutcome?: string }).__cPlaygroundOutcome = "compile-error"; });
  await runButton.click();
  await expect(page.locator(".c-run-status")).toContainText("Compilation failed.");
  await expect(page.locator(".c-playground-error")).toContainText("The C compiler could not build this program.");
  await expect(page.locator(".c-compiler-diagnostics")).toContainText("expected ';'");

  await page.evaluate(() => { (window as Window & { __cPlaygroundOutcome?: string }).__cPlaygroundOutcome = "runtime-error"; });
  await runButton.click();
  await expect(page.locator(".c-run-status")).toContainText("runtime error");
  await expect(page.locator(".c-playground-error")).toContainText("exited with status 7");
  await expect(page.locator(".c-console-output")).toContainText("mock program output");
  await expect(page.locator(".c-output-stream.stderr")).toContainText("mock runtime stderr");
  await page.getByRole("button", { name: "Clear terminal output" }).click();
  await expect(page.locator(".c-output-stream.stderr")).toHaveCount(0);
  await expect(page.locator(".c-console-output")).toContainText("Run the example to see its output here.");
  const cache = await page.evaluate(() => {
    const testWindow = window as Window & { __compilerPackageDownloads?: number; __wasmerCacheHits?: number; __wasmerCacheNamespace?: string };
    return { downloads: testWindow.__compilerPackageDownloads, hits: testWindow.__wasmerCacheHits, namespace: testWindow.__wasmerCacheNamespace };
  });
  expect(cache.downloads).toBe(1);
  expect(cache.hits).toBeGreaterThan(0);
  expect(cache.namespace).toBe("katalyst-c-playground");
});

test("compiles C and C++17 programs with live stdin in the browser sandbox", async ({ page }) => {
  test.skip(process.env.RUN_C_PLAYGROUND_INTEGRATION !== "1", "first use downloads a large compiler package; run with RUN_C_PLAYGROUND_INTEGRATION=1");
  test.setTimeout(360_000);
  await page.unroute("**/vendor/wasmer-sdk/dist/index.js");
  const browserErrors: string[] = [];
  const registryTraffic: string[] = [];
  const isRegistryUrl = (rawUrl: string) => {
    const host = new URL(rawUrl).hostname;
    return host === "wasmer.io" || host.endsWith(".wasmer.io") || host.endsWith(".wasmer.dev") || host.endsWith(".wasmer.app");
  };
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push("console: " + message.text());
  });
  page.on("request", (request) => {
    if (isRegistryUrl(request.url())) {
      const url = new URL(request.url());
      registryTraffic.push("request " + request.method() + " " + url.origin + url.pathname);
    }
  });
  page.on("response", (response) => {
    if (isRegistryUrl(response.url())) {
      const url = new URL(response.url());
      registryTraffic.push("response " + response.status() + " " + url.origin + url.pathname);
    }
  });
  page.on("requestfailed", (request) => {
    if (isRegistryUrl(request.url())) {
      const url = new URL(request.url());
      registryTraffic.push("failed " + url.origin + url.pathname + ": " + (request.failure()?.errorText ?? "request failed"));
    }
  });
  page.on("requestfailed", (request) => browserErrors.push(`${request.url()}: ${request.failure()?.errorText ?? "request failed"}`));
  await page.goto("/");
  await page.getByRole("button", { name: "Explore Learning Paths" }).click();
  await ensureCourseDetails(page);
  await page.getByRole("button", { name: /start learning/i }).click();
  await expect(page.getByRole("heading", { name: "From source code to output" })).toBeVisible();
  await page.waitForFunction(() => {
    const state = document.querySelector(".c-playground")?.getAttribute("data-compiler-state");
    return state === "ready" || state === "failed";
  }, { timeout: 330_000 });
  if (await page.locator(".c-playground").getAttribute("data-compiler-state") === "failed") {
    const setupError = await page.locator(".c-compiler-failure").innerText().catch(() => "Compiler initialization failed without a visible message.");
    throw new Error("C/C++ compiler setup failed: " + setupError + " | browser errors: " + browserErrors.join(" ; ") + " | registry traffic: " + registryTraffic.join(" ; "));
  }
  await page.getByLabel("C source code").fill("#include <stdio.h>\nint main(void) { int value = 0; scanf(\"%c\", &value); printf(\"Read: %c\\n\", value); return 0; }\n");
  await page.getByRole("button", { name: "Run code", exact: true }).click();
  const terminalInput = page.getByLabel("Terminal standard input");
  await expect(terminalInput).toBeEnabled({ timeout: 330_000 });
  await terminalInput.fill("K");
  await terminalInput.press("Enter");
  const runResult = await Promise.race([
    page.locator(".c-playground-error").waitFor({ state: "visible", timeout: 330_000 }).then(async () => ({ error: await page.locator(".c-playground-error").innerText() })),
    page.locator(".c-console-output").getByText("Read: K").waitFor({ state: "visible", timeout: 330_000 }).then(() => ({ output: "Read: K" })),
  ]);
  if ("error" in runResult) throw new Error(`C compiler integration failed: ${runResult.error}\n${browserErrors.join("\n")}`);
  await expect(page.locator(".c-run-status")).toContainText("finished", { timeout: 10_000 });
  await page.getByRole("button", { name: "Playground", exact: true }).click();
  await page.getByText("Launch C++ Workbench").click();
  await expect(page.locator("#runtime-switcher-select")).toHaveValue("code:cpp", { timeout: 10_000 });
  const cppEditor = page.getByLabel("C++ source code");
  await expect(cppEditor).toContainText("doubleValue");
  await page.getByRole("button", { name: "Run", exact: true }).click();
  const cppInput = page.getByLabel("Terminal standard input");
  try {
    await expect(cppInput).toBeEnabled({ timeout: 15_000 });
  } catch {
    const cppError = await page.locator(".c-playground-error").innerText().catch(() => "");
    throw new Error(`C++17 terminal input did not become available: ${cppError || "no compiler/runtime error was rendered"}\n${browserErrors.join("\n")}`);
  }
  await cppInput.fill("21");
  await cppInput.press("Enter");
  await expect(page.locator(".c-console-output")).toContainText("Twice: 42", { timeout: 10_000 });
  await expect(page.locator(".c-run-status")).toContainText("finished", { timeout: 10_000 });
  const widths = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  await page.screenshot({ path: "work/katalyst-c-playground.png", fullPage: true });
});

test("preserves corrupt browser data until the user explicitly starts a fresh workspace", async ({ page }) => {
  const corruptRecord = "{this is not valid json";
  await page.addInitScript((raw) => window.localStorage.setItem("katalyst.workspace.v1", raw), corruptRecord);
  await page.goto("/");
  await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");
  await expect(page.getByText("Saved workspace needs recovery")).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.getItem("katalyst.workspace.v1"))).toBe(corruptRecord);

  page.on("dialog", (dialog) => dialog.accept());
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download original record" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^katalyst-original-workspace-.*\.txt$/);
  await page.getByRole("button", { name: "Start a new workspace" }).click();
  await expect(page.getByText("Saved workspace needs recovery")).toHaveCount(0);
  const fresh = JSON.parse((await page.evaluate(() => window.localStorage.getItem("katalyst.workspace.v1"))) ?? "null") as { projects: { id: string }[] };
  expect(fresh.projects).toEqual([{ id: "default-project", name: "My workspace", instructions: "", chats: [] }]);
});

test("edits and resends a message, retries the assistant with regeneration, and preserves model metadata", async ({ page }) => {
  await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ defaultProvider: "openai", defaultModel: "gpt-6-luna", providers: { openai: { configured: true }, gemini: { configured: false }, openrouter: { configured: false }, ollama: { configured: false } } }) }));
  let calls = 0;
  await page.route("**/api/chat", (route) => {
    calls += 1;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ text: `Answer ${calls}`, provider: "openai", model: "gpt-6-luna", usage: { inputTokens: 10, outputTokens: 4 } }) });
  });
  await page.goto("/");
  await openWorkspace(page);
  const composer = page.getByRole("textbox", { name: "Message Katalyst" });
  await composer.fill("Original question");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByText("Answer 1")).toBeVisible();
  await expect(page.getByText(/10 input tokens · 4 output tokens/)).toBeVisible();

  await page.getByRole("button", { name: "Edit and resend message" }).click();
  await expect(composer).toHaveValue("Original question");
  await composer.fill("Edited question");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".message.user p").filter({ hasText: "Edited question" })).toBeVisible();
  await expect(page.getByText("Answer 2")).toBeVisible();
  await expect(page.locator(".message.user p").filter({ hasText: "Original question" })).toHaveCount(0);

  await page.getByRole("button", { name: "Regenerate response" }).click();
  await expect(page.getByText("Answer 3")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy message 2" })).toBeVisible();
  await page.getByRole("searchbox", { name: "Search conversations" }).fill("Edited question");
  await expect(page.locator(".chat-link").filter({ hasText: "Edited question" })).toBeVisible();
});

test("retries a failed provider request without duplicating the user turn", async ({ page }) => {
  await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ defaultProvider: "openai", defaultModel: "gpt-6-luna", providers: { openai: { configured: true }, gemini: { configured: false }, openrouter: { configured: false }, ollama: { configured: false } } }) }));
  let calls = 0;
  await page.route("**/api/chat", (route) => {
    calls += 1;
    return route.fulfill(calls === 1
      ? { status: 502, contentType: "application/json", body: JSON.stringify({ error: "Temporary provider outage" }) }
      : { status: 200, contentType: "application/json", body: JSON.stringify({ text: "Recovered response", provider: "openai", model: "gpt-6-luna" }) });
  });
  await page.goto("/");
  await openWorkspace(page);
  await page.getByRole("textbox", { name: "Message Katalyst" }).fill("Please retry this");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".send-error")).toContainText("Temporary provider outage");
  await page.getByRole("button", { name: "Retry request" }).click();
  await expect(page.getByText("Recovered response")).toBeVisible();
  await expect(page.locator(".message.user p")).toHaveCount(1);
  expect(calls).toBe(2);
});

test("exports a secret-free workspace and restores it through validated settings controls", async ({ page, context }) => {
  await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ defaultProvider: "openai", defaultModel: "gpt-6-luna", providers: { openai: { configured: false }, gemini: { configured: false }, openrouter: { configured: false } } }) }));
  await page.addInitScript(() => {
    if (window.sessionStorage.getItem("portable-workspace-seeded") === "true") return;
    window.sessionStorage.setItem("portable-workspace-seeded", "true");
    window.localStorage.setItem("katalyst.workspace.v1", JSON.stringify({
    projects: [{ id: "portable-project", name: "Portable project", instructions: "Keep answers concise.", chats: [{ id: "portable-chat", title: "Portable conversation", updatedAt: 1_792_000_000_000, messages: [{ role: "user", content: "Remember this conversation." }, { role: "assistant", content: "It will be in the backup." }] }] }],
    skills: [{ id: "portable-skill", name: "Portable skill", description: "A saved instruction.", instructions: "Use concrete examples.", source: "imported", sourceName: "portable.md", version: "1.0", author: "Example", license: "MIT", compatibility: ["general-ai-instructions"], installedAt: "2026-11-08T00:00:00.000Z", enabled: true }],
    provider: "openai",
    models: { openai: "gpt-6-luna", gemini: "gemini-3.8-flash", openrouter: "openrouter/free" },
    activeChatId: "portable-chat",
    }));
  });
  await page.goto("/");
  await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");
  await openSettingsCategory(page, "AI Providers");
  await page.getByLabel("OpenAI session API key").fill("secret-session-key-not-exported");
  await page.locator(".settings-card").filter({ has: page.getByRole("heading", { name: "OpenAI", exact: true }) }).getByRole("button", { name: "Save for this tab" }).click();
  await page.getByRole("tab", { name: "Workspace Data" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export workspace" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^katalyst-workspace-.*\.json$/);
  const filePath = await download.path();
  if (!filePath) throw new Error("Workspace download did not produce a file.");
  const backupContents = await readFile(filePath, "utf8");
  const backup = JSON.parse(backupContents) as { format: string; workspace: { projects: { name: string; chats: { title: string }[] }[]; skills: { license: string }[] } };
  expect(backup.format).toBe("katalyst-workspace");
  expect(backup.workspace.projects[0].name).toBe("Portable project");
  expect(backup.workspace.projects[0].chats[0].title).toBe("Portable conversation");
  expect(backup.workspace.skills[0].license).toBe("MIT");
  expect(backupContents).not.toContain("secret-session-key-not-exported");
  expect(backupContents).not.toContain("sessionKeys");

  await context.clearCookies();
  await page.evaluate(() => window.localStorage.removeItem("katalyst.workspace.v1"));
  await page.reload();
  await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");
  await openSettingsCategory(page, "Workspace");
  await page.getByLabel("Choose a KATALYST backup JSON file").setInputFiles({ name: "workspace.json", mimeType: "application/json", buffer: Buffer.from(backupContents) });
  await expect(page.getByRole("status")).toContainText("Import complete");
  await openWorkspace(page);
  await expect(page.locator(".project-link").filter({ hasText: "Portable project" }).first()).toBeVisible();
  const restoredWorkspace = await page.evaluate(() => window.localStorage.getItem("katalyst.workspace.v1"));
  expect(restoredWorkspace).toContain("portable-chat");
  await page.locator(".project-link").filter({ hasText: "Portable project" }).first().click();
  await page.locator(".chat-link").filter({ hasText: "Portable conversation" }).click();
  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  await expect(page.getByText("Remember this conversation.")).toBeVisible();
  const beforeMalformedImport = await page.evaluate(() => window.localStorage.getItem("katalyst.workspace.v1"));
  await openSettingsCategory(page, "Workspace");
  await page.getByLabel("Choose a KATALYST backup JSON file").setInputFiles({ name: "malformed.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ format: "katalyst-workspace", schemaVersion: 1, exportedAt: new Date().toISOString(), workspace: {} })) });
  await expect(page.locator(".backup-card .inline-error")).toContainText("invalid or missing data");
  expect(await page.evaluate(() => window.localStorage.getItem("katalyst.workspace.v1"))).toBe(beforeMalformedImport);
});

test("shows available skill discovery and exports imported skill Markdown", async ({ page }) => {
  await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ defaultProvider: "openai", defaultModel: "gpt-6-luna", providers: { openai: { configured: false }, gemini: { configured: false }, openrouter: { configured: false } } }) }));
  await page.goto("/");
  await page.getByRole("button", { name: /skill library/i }).click();
  await page.getByRole("tab", { name: "Available" }).click();
  await expect(page.getByRole("heading", { name: "Skill Issue" })).toBeVisible();
  await expect(page.getByRole("link", { name: /browse skill issue/i })).toHaveAttribute("href", "https://skill-issue.in/");
  await page.getByRole("tab", { name: /installed/i }).click();
  await page.getByRole("button", { name: /import a skill/i }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "review-ready.md",
    mimeType: "text/markdown",
    buffer: Buffer.from("---\nname: Review ready\ndescription: Explain review findings.\nversion: 1.1\nauthor: Example\nlicense: Apache-2.0\ncompatibility: gemini\n---\n\nLead with correctness and security."),
  });
  await expect(page.getByRole("heading", { name: "Review ready" })).toBeVisible();
  await expect(page.locator(".skill-row").filter({ hasText: "Review ready" })).toContainText("Apache-2.0");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Review ready" }).click();
  const download = await downloadPromise;
  const filePath = await download.path();
  if (!filePath) throw new Error("Skill download did not produce a file.");
  const markdown = await readFile(filePath, "utf8");
  expect(markdown).toContain("license: Apache-2.0");
  expect(markdown).toContain("compatibility: gemini");
  expect(markdown).toContain("Lead with correctness and security.");
});

test("persists the selected theme and keeps guest access clear when Supabase is not configured", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");
  await expect(page.locator(".sidebar-legal-links a[href='/login']")).toHaveCount(0);
  await expect(page.locator(".account-entry")).toHaveCount(0);
  await page.getByRole("button", { name: "Open settings" }).click();
  await expect(page.getByRole("heading", { name: "Appearance" })).toBeVisible();

  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator(".app-shell")).toHaveAttribute("data-theme", "dark");
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.querySelector(".app-shell")!).colorScheme)).toBe("dark");
  const darkBackground = await page.locator(".settings-card").first().evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(darkBackground).not.toBe("rgb(255, 254, 250)");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("katalyst.preferences.v1") ?? "{}").theme)).toBe("dark");

  await page.reload();
  await expect(page.locator(".app-shell")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await expect(page.locator(".app-shell")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "System", exact: true }).click();
  await expect(page.locator(".app-shell")).toHaveAttribute("data-theme", "system");
  await page.getByRole("tab", { name: "Account & Profile" }).click();
  const accountCard = page.locator(".account-settings-card");
  await expect(accountCard).toBeVisible();
  await expect(accountCard.locator("input[type='email']")).toHaveCount(0);
  await expect(accountCard.locator("form")).toHaveCount(0);
  const hasSignInLink = (await accountCard.getByRole("link", { name: "Open the sign-in page" }).count()) > 0;
  if (hasSignInLink) {
    await expect(accountCard).toContainText("Guest · this browser only");
    await expect(accountCard).toContainText("You can keep using KATALYST without registering.");
    await expect(accountCard.getByRole("link", { name: "Open the sign-in page" })).toHaveAttribute("href", "/login");
  } else {
    await expect(accountCard).toContainText("Account service not configured");
    await expect(accountCard).toContainText("Account sign-in and sync are not configured for this deployment");
    await expect(accountCard.getByRole("link", { name: "Open the sign-in page" })).toHaveCount(0);
  }
});

test("manages conversations by renaming, pinning, moving, exporting, and confirming deletion", async ({ page }) => {
  await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ defaultProvider: "openai", defaultModel: "gpt-6-luna", providers: { openai: { configured: true }, gemini: { configured: false }, openrouter: { configured: false }, ollama: { configured: false } } }) }));
  await page.route("**/api/models*", (route) => route.request().url().includes("provider=openai")
    ? route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ models: [{ providerId: "openai", id: "gpt-6-luna", name: "GPT-6 Luna", capabilities: ["text input", "text output"], pricingStatus: "unknown", source: "built-in", credentialAccess: "not-verified" }] }) })
    : route.continue());
  await page.route("**/api/chat", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ text: "A real mocked provider response.", provider: "openai", model: "gpt-6-luna" }) }));
  await page.goto("/");
  await openWorkspace(page);
  await page.getByRole("button", { name: /new conversation/i }).click();
  await page.getByRole("textbox", { name: "Message Katalyst" }).fill("Preserve this conversation");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByText("A real mocked provider response.")).toBeVisible();

  let actions = page.getByRole("button", { name: "Actions for Preserve this conversation" });
  await actions.click();
  await page.getByRole("button", { name: "Rename", exact: true }).click();
  await page.getByRole("textbox", { name: "Rename Preserve this conversation" }).fill("Pinned study notes");
  await page.getByRole("button", { name: "Save conversation name" }).click();
  actions = page.getByRole("button", { name: "Actions for Pinned study notes" });
  await actions.click();
  await page.getByRole("button", { name: "Pin", exact: true }).click();
  await expect(page.locator(".pinned-section")).toContainText("Pinned study notes");

  await page.getByRole("button", { name: "Create project" }).click();
  await page.locator(".pinned-section").getByRole("button", { name: "Actions for Pinned study notes" }).click();
  await page.getByRole("button", { name: "Move to project" }).click();
  await page.locator(".chat-move-targets").getByRole("button", { name: "Workspace 2" }).click();
  await expect(page.locator(".conversation-status")).toContainText("Moved conversation to Workspace 2");

  await page.locator(".pinned-section").getByRole("button", { name: "Actions for Pinned study notes" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Share / export" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("pinned-study-notes-conversation.md");
  const filePath = await download.path();
  if (!filePath) throw new Error("Conversation export did not produce a file.");
  const shareText = await readFile(filePath, "utf8");
  expect(shareText).toContain("A real mocked provider response.");
  expect(shareText).not.toContain("project instructions");

  await page.locator(".pinned-section").getByRole("button", { name: "Actions for Pinned study notes" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.locator(".conversation-status")).toContainText("Conversation deleted");
  await expect(page.locator(".chat-row").filter({ hasText: "Pinned study notes" })).toHaveCount(0);
  const stored = await page.evaluate(() => localStorage.getItem("katalyst.workspace.v1") ?? "");
  expect(stored).not.toContain("A real mocked provider response.");
});

test("records real AI request metadata and reports it in the local Progress dashboard", async ({ page }) => {
  await page.route("**/api/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ defaultProvider: "openai", defaultModel: "gpt-6-luna", providers: { openai: { configured: true }, gemini: { configured: false }, openrouter: { configured: false }, ollama: { configured: false } } }) }));
  await page.route("**/api/models*", (route) => route.request().url().includes("provider=openai")
    ? route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ models: [{ providerId: "openai", id: "gpt-6-luna", name: "GPT-6 Luna", capabilities: ["text input", "text output"], pricingStatus: "unknown", source: "built-in", credentialAccess: "not-verified" }] }) })
    : route.continue());
  await page.route("**/api/chat", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ text: "The provider returned this answer.", provider: "openai", model: "gpt-6-luna", usage: { inputTokens: 18, outputTokens: 6 } }) }));
  await page.goto("/");
  await openWorkspace(page);
  await page.getByRole("button", { name: /new conversation/i }).click();
  await page.getByRole("textbox", { name: "Message Katalyst" }).fill("A prompt that must not be stored in analytics");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByText("The provider returned this answer.")).toBeVisible();
  const activity = await page.evaluate(() => JSON.parse(localStorage.getItem("katalyst.ai-activity.v1") ?? "{}").requests);
  expect(activity).toHaveLength(1);
  expect(activity[0]).toMatchObject({ provider: "openai", model: "gpt-6-luna", outcome: "complete", usage: { inputTokens: 18, outputTokens: 6 } });
  expect(JSON.stringify(activity)).not.toContain("A prompt that must not be stored");

  await page.getByRole("button", { name: "Progress", exact: true }).click();
  await expect(page.getByRole("heading", { name: "See what you have worked through." })).toBeVisible();
  await expect(page.locator(".ai-dashboard-section")).toContainText("1 request recorded");
  await expect(page.locator(".ai-dashboard-section")).toContainText("up to 500 recent requests");
  await expect(page.locator(".ai-dashboard-section")).not.toContainText("OpenAI");
  await expect(page.locator(".ai-dashboard-section")).not.toContainText("gpt-6-luna");
  await expect(page.locator(".ai-dashboard-section")).toContainText("18 input tokens reported in 1 request");
  await expect(page.locator(".ai-dashboard-section")).toContainText("6 output tokens reported in 1 request");
  await expect(page.locator(".dashboard-metrics")).toContainText("0 of 123 lessons");
  await expect(page.getByText("Local analytics · not synced")).toBeVisible();
});

test("keeps AI provider details out of the mobile header and exposes them in Settings", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");
  for (const width of [320, 375, 390]) {
    await page.setViewportSize({ width, height: 812 });
    await expect(page.locator(".topbar .provider-selector, .topbar .model-selector, .topbar .model-managed-label, .ai-quota-pill")).toHaveCount(0);
    const dimensions = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
    await expect(page.getByRole("button", { name: "Open settings", exact: true })).toBeVisible();
  }
  await openSettingsCategory(page, "AI & Kat");
  await selectProviderInSettings(page, "OpenAI");
  await expect(page.locator(".provider-settings-card").first()).toBeVisible();
  await expect(page.getByLabel("Settings selected model")).toBeVisible();
  const signInPrompt = page.getByRole("region", { name: "Optional account sign-in" });
  if (await signInPrompt.isVisible().catch(() => false)) {
    await expect(signInPrompt.getByRole("link", { name: "Sign in or create account" })).toHaveAttribute("href", "/login");
    await signInPrompt.getByRole("button", { name: "Dismiss sign-in prompt" }).click();
    await expect(signInPrompt).toHaveCount(0);
  }
});

test("supports independent panel scrolling and layout in the desktop lesson workspace", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Explore Learning Paths" }).click();
  await ensureCourseDetails(page);
  await page.getByRole("button", { name: /start learning/i }).click();
  await expect(page.getByRole("heading", { name: "From source code to output" })).toBeVisible();
  await expect(page.locator(".c-source-editor-host .cm-editor")).toBeVisible();
  await page.screenshot({ path: "work/katalyst-m16-lesson-desktop.png", fullPage: true });

  const theoryPanel = page.locator(".learning-panel");
  await expect(theoryPanel).toHaveCSS("overflow-y", "auto");
  await expect(page.locator(".learning-code-panel")).toBeVisible();

  // In M17.3, Kat is optional and closed by default (2-panel layout)
  await expect(page.locator(".workspace-splitter")).toHaveCount(1);
  await page.getByRole("button", { name: "Ask Kat", exact: true }).click();

  // With Kat open, 3-panel layout is active
  await expect(page.locator(".learning-kat-panel")).toBeVisible();

  const composer = page.locator(".learning-kat-panel .integrated-tutor-panel .tutor-composer");
  await expect(composer).toBeVisible();
  const tutorPanel = page.locator(".learning-kat-panel .integrated-tutor-panel");
  const tutorPanelBottom = await tutorPanel.evaluate((el) => el.getBoundingClientRect().bottom);
  const composerBottom = await composer.evaluate((el) => el.getBoundingClientRect().bottom);
  expect(composerBottom).toBeLessThanOrEqual(tutorPanelBottom + 2);

  const splitters = page.locator(".workspace-splitter");
  await expect(splitters).toHaveCount(2);
  await expect(splitters.first()).toHaveAttribute("role", "separator");
});

test("isolates admin settings from regular users and guests", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open settings" }).click();
  await expect(page.getByRole("tab", { name: "Admin" })).toHaveCount(0);
  await expect(page.locator(".kill-switch-toggle")).toHaveCount(0);
});

test("displays shared gateway status, credits, and BYOK zero-credit notice in Usage & Credits", async ({ page }) => {
  await page.goto("/");
  await openSettingsCategory(page, "Usage & Credits");
  await expect(page.getByRole("heading", { name: "Usage & Credits" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Shared AI Gateway" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bring Your Own Key (BYOK)" })).toBeVisible();
  await expect(page.getByText("0 credits", { exact: true })).toBeVisible();
});

test("navigates Python Programming Foundations course and verifies 2-panel layout", async ({ page }) => {
  await page.goto("/#katalyst=paths");
  await expect(page.getByRole("heading", { name: "Build a foundation" })).toBeVisible();

  // Select Python course from the choice grid
  await page.getByRole("button", { name: /Python Programming Foundations/i }).click();
  await expect(page.getByRole("heading", { name: "Python Programming Foundations" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "19 lessons. 7 modules." })).toBeVisible();

  await ensureCourseDetails(page);
  await page.getByRole("button", { name: /start learning/i }).click();
  await expect(page.getByRole("heading", { name: "From script to interpreter" })).toBeVisible();

  // In M17.3, Python lessons use the multi-language code sandbox with Pyodide
  await expect(page.locator("#code-panel")).toBeVisible();
  await expect(page.getByRole("button", { name: "Run Python" })).toBeVisible();
  await expect(page.getByRole("tabpanel", { name: "Lesson and course content" })).toBeVisible();

  // Kat AI is optional and togglable
  await page.getByRole("button", { name: "Ask Kat", exact: true }).click();
  await expect(page.getByRole("tabpanel", { name: "Kat AI tutor" })).toBeVisible();

  // Mark lesson complete
  await page.getByRole("button", { name: /mark lesson complete/i }).click();
  await expect(page.getByRole("button", { name: /lesson completed/i })).toBeVisible();
});
