import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.KATALYST_E2E_PORT ?? 3000);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("KATALYST_E2E_PORT must be a valid unprivileged TCP port.");
const origin = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  use: { ...devices["Desktop Chrome"], baseURL: origin, headless: true },
  webServer: { command: `AI_PROVIDER=disabled CLOUDFLARE_API_TOKEN= CLOUDFLARE_ACCOUNT_ID= OPENAI_API_KEY= GEMINI_API_KEY= OPENROUTER_API_KEY= PORT=${port} npm run dev`, url: origin, reuseExistingServer: true, timeout: 120_000 },
});
