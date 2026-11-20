import { expect, test } from "@playwright/test";

test("isolated C runner cannot access app data and has route-only framing policy", async ({ page }) => {
  await page.addInitScript(() => {
    const host = window as Window & { __cLabRunnerMessages?: unknown[] };
    host.__cLabRunnerMessages = [];
    window.addEventListener("message", (event) => {
      if (event.data && typeof event.data === "object" && event.data.type === "READY") {
        host.__cLabRunnerMessages?.push(event.data);
      }
    });
  });

  await page.goto("/courses/c-programming-foundations/source-to-output");
  const runner = page.locator('iframe[title="Isolated C runtime runner"]');
  await expect(runner).toHaveAttribute("sandbox", "allow-scripts");
  await expect(runner).toBeAttached();
  await expect.poll(() => page.evaluate(() => {
    const host = window as Window & { __cLabRunnerMessages?: unknown[] };
    return host.__cLabRunnerMessages?.length ?? 0;
  })).toBeGreaterThan(0);

  const runnerFrame = page.frames().find((frame) => frame.url().includes("/lab-runner/c"));
  expect(runnerFrame).toBeDefined();
  const init = await page.evaluate(() => {
    const host = window as Window & { __cLabRunnerMessages?: Array<{ token?: string; requestId?: string }> };
    return host.__cLabRunnerMessages?.at(-1) ?? null;
  });
  expect(init?.token).toBeTruthy();
  expect(init?.requestId).toBeTruthy();

  const parentOrigin = new URL(page.url()).origin;
  const isolation = await runnerFrame!.evaluate(() => ({
    crossOriginIsolated: window.crossOriginIsolated,
    sharedArrayBuffer: typeof SharedArrayBuffer === "function",
  }));
  expect(isolation).toEqual({ crossOriginIsolated: true, sharedArrayBuffer: true });
  const runnerAccess = await runnerFrame!.evaluate(async (origin) => {
    const result = { parentLocalStorage: false, parentCookie: false, authenticatedApi: false };
    try { void window.parent.localStorage.length; result.parentLocalStorage = true; } catch { /* opaque origin denies access */ }
    try { void window.parent.document.cookie; result.parentCookie = true; } catch { /* cross-origin WindowProxy denies access */ }
    try {
      await fetch(`${origin}/api/account/me`, { credentials: "include" });
      result.authenticatedApi = true;
    } catch { /* runner connect-src intentionally excludes the app origin */ }
    return result;
  }, parentOrigin);
  expect(runnerAccess).toEqual({ parentLocalStorage: false, parentCookie: false, authenticatedApi: false });
  await runnerFrame!.evaluate(() => {
    const host = window as Window & { __runnerCspViolations?: string[] };
    host.__runnerCspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      host.__runnerCspViolations?.push(`${event.violatedDirective} blocked ${event.blockedURI}`);
    });
  });
  const blobWorkerProbe = await runnerFrame!.evaluate(async () => {
    const objectUrl = URL.createObjectURL(new Blob(["postMessage({ ready: true });"], { type: "text/javascript" }));
    const worker = new Worker(objectUrl);
    try {
      return await new Promise<{ ready?: boolean; error?: string }>((resolve) => {
        worker.addEventListener("message", (event) => resolve(event.data), { once: true });
        worker.addEventListener("error", (event) => resolve({ error: `worker load failed: ${event.message}` }), { once: true });
        window.setTimeout(() => resolve({ error: "worker load timed out" }), 5_000);
      });
    } finally {
      worker.terminate();
      URL.revokeObjectURL(objectUrl);
    }
  });
  expect(blobWorkerProbe).toEqual({ ready: true });

  const moduleBlobWorkerProbe = await runnerFrame!.evaluate(async () => {
    const objectUrl = URL.createObjectURL(new Blob(["postMessage({ ready: true });"], { type: "text/javascript" }));
    const worker = new Worker(objectUrl);
    try {
      return await new Promise<{ ready?: boolean; error?: string }>((resolve) => {
        worker.addEventListener("message", (event) => resolve(event.data), { once: true });
        worker.addEventListener("error", (event) => resolve({ error: `module worker load failed: ${event.message}` }), { once: true });
        window.setTimeout(() => resolve({ error: "module worker load timed out" }), 5_000);
      });
    } finally {
      worker.terminate();
      URL.revokeObjectURL(objectUrl);
    }
  });
  expect(moduleBlobWorkerProbe).toEqual({ ready: true });

  const moduleWorkerProbe = await runnerFrame!.evaluate(async () => {
    const workerUrl = new URL("/lab-runner/c/wasmer/dist/browser-worker.js", location.href).href;
    const source = `import(${JSON.stringify(workerUrl)}).then(() => postMessage({ ready: true })).catch((error) => postMessage({ error: String(error) }));`;
    const objectUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
    const worker = new Worker(objectUrl);
    try {
      return await new Promise<{ ready?: boolean; error?: string }>((resolve) => {
        worker.addEventListener("message", (event) => resolve(event.data), { once: true });
        worker.addEventListener("error", (event) => resolve({ error: `worker load failed: ${event.message} ${event.filename}:${event.lineno}` }), { once: true });
        window.setTimeout(() => resolve({ error: "worker load timed out" }), 5_000);
      });
    } finally {
      worker.terminate();
      URL.revokeObjectURL(objectUrl);
    }
  });
  const runnerCspViolations = await runnerFrame!.evaluate(() => (window as Window & { __runnerCspViolations?: string[] }).__runnerCspViolations ?? []);
  expect(moduleWorkerProbe, `runner CSP: ${runnerCspViolations.join("; ")}`).toEqual({ ready: true });

  const compilerState = await page.locator(".c-playground").getAttribute("data-compiler-state");
  const runnerStatus = await page.locator(".c-run-status").innerText().catch(() => "");
  const wrongToken = `wrong-token-${"x".repeat(40)}`;
  await runnerFrame!.evaluate(({ token, requestId }) => {
    window.parent.postMessage({ version: 1, type: "COMPILER_STATE", state: "failed", message: "forged", token, requestId }, "*");
  }, { token: wrongToken, requestId: init!.requestId! });
  await page.evaluate(({ token, requestId }) => {
    window.postMessage({ version: 1, type: "COMPILER_STATE", state: "failed", message: "forged", token, requestId }, "*");
  }, { token: init!.token!, requestId: init!.requestId! });
  await page.waitForTimeout(100);
  await expect(page.locator(".c-playground")).toHaveAttribute("data-compiler-state", compilerState ?? "idle");
  if (runnerStatus) await expect(page.locator(".c-run-status")).toHaveText(runnerStatus);

  const runnerResponse = await page.request.get("/lab-runner/c");
  const runnerHeaders = runnerResponse.headers();
  const runnerHtml = await runnerResponse.text();
  expect(runnerHeaders["content-security-policy"]).toContain("'unsafe-eval'");
  expect(runnerHeaders["content-security-policy"]).toContain("sandbox allow-scripts");
  expect(runnerHeaders["content-security-policy"]).toContain("frame-ancestors 'self'");
  expect(runnerHeaders["content-security-policy"]).not.toContain("connect-src 'self'");
  expect(runnerHeaders["x-frame-options"]).toBe("SAMEORIGIN");
  expect(runnerHtml).toContain('/lab-runner/c/runner.js');
  expect(runnerHtml).not.toContain("/_next/");

  const runnerWorker = await page.request.get("/lab-runner/c/wasmer/dist/browser-worker.js");
  expect(runnerWorker.ok()).toBeTruthy();
  expect(runnerWorker.headers()["content-security-policy"]).toContain("'unsafe-eval'");
  expect(runnerWorker.headers()["content-security-policy"]).not.toContain("connect-src 'self'");
  const sharedSdk = await page.request.get("/vendor/wasmer-sdk/dist/browser-worker.js");
  expect(sharedSdk.ok()).toBeTruthy();
  expect(sharedSdk.headers()["content-security-policy"]).not.toContain("'unsafe-eval'");

  const settings = await page.request.get("/settings");
  const settingsHeaders = settings.headers();
  const settingsHtml = await settings.text();
  expect(settingsHeaders["x-frame-options"]).toBe("DENY");
  expect(settingsHeaders["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(settingsHeaders["content-security-policy"]).not.toContain("'unsafe-eval'");
  expect(settingsHtml).toMatch(/<meta[^>]+name="robots"[^>]+noindex/i);

  const arduino = await page.request.get("/courses/arduino-embedded/arduino-sketch-lifecycle");
  expect(arduino.ok()).toBeTruthy();
  expect(arduino.headers()["content-security-policy"]).not.toContain("frame-src https://challenges.cloudflare.com 'self'");
  expect(arduino.headers()["content-security-policy"]).not.toContain("'unsafe-eval'");

  const sitemap = await page.request.get("/sitemap.xml");
  const sitemapXml = await sitemap.text();
  expect((sitemapXml.match(/<url>/g) ?? []).length).toBe(144);
});
