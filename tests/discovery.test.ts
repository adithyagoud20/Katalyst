import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearModelDiscoveryCache, discoverModels } from "../src/lib/providers/discovery";
import { ProviderError } from "../src/lib/providers/types";

beforeEach(() => clearModelDiscoveryCache());
afterEach(() => vi.unstubAllGlobals());

describe("Gemini model discovery", () => {
  it("excludes preview, deprecated, and non-text models while recommending stable Flash and Pro choices", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ models: [
      { name: "models/gemini-3.8-flash", displayName: "Gemini Flash", outputTokenLimit: 8192, supportedGenerationMethods: ["generateContent"] },
      { name: "models/gemini-3.5-pro-preview", outputTokenLimit: 4096, supportedGenerationMethods: ["generateContent"] },
      { name: "models/gemini-2.0-flash", outputTokenLimit: 4096, supportedGenerationMethods: ["generateContent"] },
      { name: "models/gemini-3.8-audio", outputTokenLimit: 4096, supportedGenerationMethods: ["generateContent"] },
      { name: "models/imagen-4", outputTokenLimit: 4096, supportedGenerationMethods: ["generateContent"] },
      { name: "models/gemini-count-only", outputTokenLimit: 4096, supportedGenerationMethods: ["countTokens"] },
    ] }), { status: 200 })));
    const result = await discoverModels("gemini", "gemini-filter-test-key");
    expect(result.models.map((model) => model.id)).toEqual(["gemini-3.8-flash"]);
    expect(result.models[0]).toMatchObject({ recommended: true, capabilities: ["text input", "text output", "generateContent"] });
  });

  it("paginates and includes only text generation models supported by this key", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ models: [
        { name: "models/gemini-flash", displayName: "Gemini Flash", inputTokenLimit: 32768, outputTokenLimit: 8192, supportedGenerationMethods: ["generateContent"] },
        { name: "models/text-embedding", displayName: "Embedding", outputTokenLimit: 512, supportedGenerationMethods: ["generateContent"] },
        { name: "models/gemini-legacy", outputTokenLimit: 128, supportedGenerationMethods: ["countTokens"] },
      ], nextPageToken: "page-2" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ models: [
        { name: "models/gemini-pro", displayName: "Gemini Pro", outputTokenLimit: 4096, supportedGenerationMethods: ["generateContent"] },
      ] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await discoverModels("gemini", "gemini-session-key");
    expect(result.models.map((model) => model.id)).toEqual(["gemini-flash", "gemini-pro"]);
    expect(result.models[0]).toMatchObject({ providerId: "gemini", contextLimit: 32768, source: "gemini-models-api", credentialAccess: "listed-for-key", pricingStatus: "unknown" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("pageToken=page-2");
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toMatchObject({ "x-goog-api-key": "gemini-session-key" });
  });

  it.each([{ status: 401 }, { status: 429 }])("maps Gemini catalog HTTP $status without exposing key", async ({ status }) => {
    const secret = "private-test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: secret } }), { status })));
    await expect(discoverModels("gemini", secret)).rejects.toMatchObject({ status, message: expect.not.stringContaining(secret) });
  });

  it("classifies a non-JSON authentication response before parsing the body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("upstream gateway page", { status: 401, headers: { "Content-Type": "text/plain" } })));
    await expect(discoverModels("gemini", "private-key")).rejects.toMatchObject({
      status: 401,
      message: "Gemini rejected this key while listing models. Check the key and its API access.",
    });
  });

  it("rejects a successful but structurally invalid model catalog", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ nextPageToken: 3 }), { status: 200 })));
    await expect(discoverModels("gemini", "malformed-payload-key")).rejects.toMatchObject({ status: 502, message: expect.stringContaining("invalid model catalog") });
  });

  it("isolates cache entries by key and supports refresh", async () => {
    const fetchMock = vi.fn().mockImplementation(() => new Response(JSON.stringify({ models: [{ name: "models/gemini-flash", outputTokenLimit: 1, supportedGenerationMethods: ["generateContent"] }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const first = await discoverModels("gemini", "key-a");
    const cached = await discoverModels("gemini", "key-a");
    await discoverModels("gemini", "key-b");
    const refreshed = await discoverModels("gemini", "key-a", { refresh: true });
    expect(first.cached).toBe(false);
    expect(cached.cached).toBe(true);
    expect(refreshed.cached).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("rejects an oversized catalog body while streaming it", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ description: "x".repeat(3_100_000) }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(discoverModels("gemini", "oversize-key")).rejects.toMatchObject({ status: 502, message: expect.stringContaining("too large") });
  });

  it("ignores malformed Gemini catalog entries without failing the whole list", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ models: [null, { name: 42 }, { name: "models/gemini-good", outputTokenLimit: 100, supportedGenerationMethods: ["generateContent"] }] }), { status: 200 })));
    const result = await discoverModels("gemini", "malformed-entry-key");
    expect(result.models.map((model) => model.id)).toEqual(["gemini-good"]);
  });
});

describe("Cloudflare Workers AI model discovery", () => {
  const accountId = "0123456789abcdef0123456789abcdef";
  const envelope = (result: unknown[], resultInfo?: unknown) => ({ success: true, errors: [], messages: [], result, ...(resultInfo ? { result_info: resultInfo } : {}) });

  it("keeps model IDs from Cloudflare's catalog and filters mixed task metadata", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, result: [
      { id: "internal-catalog-id", name: "@cf/acme/compatible-model", display_name: "Compatible model", task: { name: "Text Generation" } },
      { name: "@cf/acme/model-without-task", description: "A chat model." },
      { id: "@cf/baai/bge-base-en-v1.5", display_name: "Embedding", task: { name: "Text Embeddings" } },
      { name: "@cf/acme/image-generator", description: "Image generation model." },
      null,
    ], errors: [], messages: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await discoverModels("cloudflare", "cf-test-token", { accountId });
    expect(result.provider).toBe("cloudflare");
    expect(result.models.map((model) => model.id)).toEqual(expect.arrayContaining(["@cf/acme/compatible-model", "@cf/acme/model-without-task"]));
    expect(result.models.find((model) => model.id === "@cf/acme/compatible-model")).toMatchObject({ name: "Compatible model", source: "cloudflare-models-api", namespace: "Cloudflare Workers AI", credentialAccess: "listed-for-key" });
    expect(result.diagnostic).toMatchObject({ sourceCount: 5, compatibleCount: 2, excludedCount: 3 });
    const [url, request] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(String(url)).toContain(`/accounts/${accountId}/ai/models/search`);
    expect(url.searchParams.get("page")).toBe("1");
    expect(url.searchParams.get("per_page")).toBe("100");
    expect(url.searchParams.has("task")).toBe(false);
    expect(url.searchParams.get("hide_experimental")).toBe("true");
    expect(request.headers).toMatchObject({ Authorization: "Bearer cf-test-token" });
  });

  it("paginates account results using result_info and retains multiple dynamic model IDs", async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => ({ name: `@cf/acme/model-${index}`, task: { name: "Text Generation" } }));
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(envelope(firstPage, { page: 1, per_page: 100, total_count: 101 })), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(envelope([{ name: "@cf/acme/model-100", task: "Text Generation" }], { page: 2, per_page: 100, total_count: 101 })), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await discoverModels("cloudflare", "page-token", { accountId });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("page=2");
    expect(result.models).toHaveLength(101);
    expect(result.diagnostic).toMatchObject({ sourceCount: 101, compatibleCount: 101, excludedCount: 0 });
  });

  it("distinguishes an empty catalog from a non-empty catalog with no compatible models", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(envelope([])), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(envelope([{ name: "@cf/vendor/embedder", task: { name: "Text Embeddings" } }])), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const empty = await discoverModels("cloudflare", "empty-token", { accountId });
    const incompatible = await discoverModels("cloudflare", "non-text-token", { accountId });
    expect(empty.diagnostic).toMatchObject({ sourceCount: 0, compatibleCount: 0, excludedCount: 0, message: expect.stringContaining("empty model catalog") });
    expect(incompatible.diagnostic).toMatchObject({ sourceCount: 1, compatibleCount: 0, excludedCount: 1, message: expect.stringContaining("1 catalog entries") });
  });

  it("rejects malformed envelopes and Cloudflare API errors on HTTP 200", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, result: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: false, errors: [{ code: 1003, message: "Unknown account" }], messages: [], result: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response("not json", { status: 200 })));
    await expect(discoverModels("cloudflare", "malformed-token", { accountId })).rejects.toMatchObject({ status: 502, kind: "invalid-response" });
    await expect(discoverModels("cloudflare", "api-error-token", { accountId })).rejects.toMatchObject({ status: 400, kind: "account", message: expect.stringContaining("account") });
    await expect(discoverModels("cloudflare", "invalid-json-token", { accountId })).rejects.toMatchObject({ status: 502, kind: "invalid-response" });
  });

  it("reports missing and malformed Cloudflare credentials before network access", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(discoverModels("cloudflare", undefined, { accountId })).rejects.toMatchObject({ status: 503, kind: "configuration", message: expect.stringContaining("Configure server credentials or enter a session key") });
    await expect(discoverModels("cloudflare", "token with spaces", { accountId })).rejects.toMatchObject({ status: 400, kind: "configuration", message: expect.stringContaining("token format is invalid") });
    await expect(discoverModels("cloudflare", "valid-token", { accountId: "invalid" })).rejects.toMatchObject({ status: 400, kind: "configuration", message: expect.stringContaining("32-character") });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("isolates cached catalogs by both account and key and validates account IDs", async () => {
    const fetchMock = vi.fn().mockImplementation(() => new Response(JSON.stringify(envelope([{ name: "@cf/acme/model", display_name: "Model", task: "Text Generation" }])), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const first = await discoverModels("cloudflare", "key-a", { accountId });
    const cached = await discoverModels("cloudflare", "key-a", { accountId });
    await discoverModels("cloudflare", "key-a", { accountId: "abcdef0123456789abcdef0123456789" });
    await discoverModels("cloudflare", "key-b", { accountId });
    expect(first.cached).toBe(false);
    expect(cached.cached).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    await expect(discoverModels("cloudflare", "key-a", { accountId: "not-an-account" })).rejects.toMatchObject({ status: 400, message: expect.stringContaining("32-character") });
  });

  it("maps authentication and rate-limit errors without returning provider detail", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ success: false, errors: [{ message: "private token detail" }], messages: [], result: [] }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: false, errors: [{ message: "private permission detail" }], messages: [], result: [] }), { status: 403 }))
      .mockResolvedValueOnce(new Response("{}", { status: 429 })));
    await expect(discoverModels("cloudflare", "secret-token", { accountId })).rejects.toMatchObject({ status: 401, kind: "authentication", message: expect.not.stringContaining("private token detail") });
    await expect(discoverModels("cloudflare", "secret-token", { accountId, refresh: true })).rejects.toMatchObject({ status: 403, kind: "permission", message: expect.not.stringContaining("private permission detail") });
    await expect(discoverModels("cloudflare", "secret-token", { accountId, refresh: true })).rejects.toMatchObject({ status: 429, kind: "rate-limit", message: expect.stringContaining("rate limited") });
  });
});

describe("OpenRouter model discovery", () => {
  it("preserves model IDs and namespaces and normalizes prices and capabilities", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [
      { id: "acme/model-v1:free", name: "Acme Free", context_length: 8192, architecture: { input_modalities: ["text"], output_modalities: ["text"] }, pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "response_format"] },
      { id: "vendor/paid-model", name: "Paid", context_length: 16000, architecture: { input_modalities: ["text"], output_modalities: ["text"] }, pricing: { prompt: "0.000002", completion: "0.000004" }, supported_parameters: [] },
      { id: "vendor/image-only", name: "Image", architecture: { input_modalities: ["image"], output_modalities: ["image"] }, pricing: { prompt: "0", completion: "0" } },
    ] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await discoverModels("openrouter", "router-test-key");
    expect(String(fetchMock.mock.calls[0][0])).toContain("input_modalities=text");
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toMatchObject({ Authorization: "Bearer router-test-key" });
    expect(result.models.map((model) => model.id)).toEqual(["openrouter/free", "acme/model-v1:free", "vendor/paid-model"]);
    expect(result.models[1]).toMatchObject({ namespace: "acme", pricingStatus: "free", capabilities: ["text input", "text output", "tool calling", "structured output"], credentialAccess: "not-verified" });
    expect(result.models[2].pricing).toEqual({ inputPerMillion: 2, outputPerMillion: 4 });
    expect(result.models[2].pricingStatus).toBe("paid");
  });

  it("exposes the documented free router option without a key and maps catalog auth errors", async () => {
    await expect(discoverModels("openrouter", undefined)).resolves.toMatchObject({ models: [{ id: "openrouter/free", freeRouting: true, pricingStatus: "free" }] });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));
    await expect(discoverModels("openrouter", "bad-key", { refresh: true })).rejects.toMatchObject<Partial<ProviderError>>({ status: 401 });
  });
});

describe("Ollama model discovery", () => {
  it("lists locally installed models without a cloud key and refreshes each time", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ models: [{ name: "gemma3:4b", size: 3_300_000_000, details: { parameter_size: "4B", quantization_level: "Q4_K_M" } }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ models: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const first = await discoverModels("ollama", undefined, { baseUrl: "http://localhost:11434" });
    const second = await discoverModels("ollama", undefined, { baseUrl: "http://localhost:11434" });
    expect(first).toMatchObject({ provider: "ollama", cached: false, models: [{ id: "gemma3:4b", sizeBytes: 3_300_000_000, parameterSize: "4B", quantization: "Q4_K_M", local: true }] });
    expect(second.models).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects unsafe endpoints before making a network call", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(discoverModels("ollama", undefined, { baseUrl: "http://169.254.169.254/latest/meta-data" })).rejects.toMatchObject({ status: 400 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
