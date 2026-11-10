import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../src/app/api/chat/route";
import { GET } from "../src/app/api/status/route";
import { SESSION_KEY_HEADER } from "../src/lib/providers/credentials";
import { CLOUDFLARE_ACCOUNT_HEADER, OLLAMA_URL_HEADER } from "../src/lib/providers/constants";

afterEach(() => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.CLOUDFLARE_API_TOKEN;
  delete process.env.CLOUDFLARE_ACCOUNT_ID;
  delete process.env.AI_PROVIDER;
  delete process.env.AI_MODEL;
  vi.unstubAllGlobals();
});

function chatRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("POST /api/chat", () => {
  it("rejects malformed input", async () => {
    const response = await POST(new Request("http://localhost/api/chat", { method: "POST", body: "{}" }));
    expect(response.status).toBe(400);
  });

  it("accepts only the recognized assistant surface metadata", async () => {
    const response = await POST(chatRequest({ provider: "openai", model: "gpt-6-luna", assistantSurface: "untrusted persona", messages: [{ role: "user", content: "Hello" }] }));
    expect(response.status).toBe(400);
  });

  it("offers Ollama as a local initial provider without requiring cloud credentials", async () => {
    process.env.AI_PROVIDER = "ollama";
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ defaultProvider: "ollama", defaultModel: "", providers: { ollama: { configured: false } } });
  });

  it("does not invent model output when the selected provider has no key", async () => {
    const response = await POST(chatRequest({ provider: "openai", model: "gpt-6-luna", messages: [{ role: "user", content: "Hello" }] }));
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain("OPENAI_API_KEY");
  });

  it("shows Gemini setup guidance when its key is missing", async () => {
    const response = await POST(chatRequest({ provider: "gemini", model: "gemini-3.8-flash", assistantSurface: "kat", messages: [{ role: "user", content: "Hello" }] }));
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain("GEMINI_API_KEY");
  });

  it("requires an OpenRouter key even when the free router is selected", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(chatRequest({ provider: "openrouter", model: "openrouter/free", messages: [{ role: "user", content: "Hello" }] }));
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain("OPENROUTER_API_KEY");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("routes Cloudflare selection using a tab-only token and account ID", async () => {
    const secret = "cf-tab-only-token";
    const accountId = "0123456789abcdef0123456789abcdef";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, errors: [], messages: [], result: [{ name: "@cf/google/gemma-4-26b-a4b-it", task: { name: "Text Generation" } }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: "Cloudflare answer" } }], usage: { prompt_tokens: 7, completion_tokens: 4 } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", [SESSION_KEY_HEADER]: secret, [CLOUDFLARE_ACCOUNT_HEADER]: accountId },
      body: JSON.stringify({ provider: "cloudflare", model: "@cf/google/gemma-4-26b-a4b-it", messages: [{ role: "user", content: "Hello" }] }),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ text: "Cloudflare answer", usage: { inputTokens: 7, outputTokens: 4 }, provider: "cloudflare", model: "@cf/google/gemma-4-26b-a4b-it" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(`/accounts/${accountId}/ai/models/search`);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(`/accounts/${accountId}/ai/v1/chat/completions`);
    expect((fetchMock.mock.calls[1]?.[1] as RequestInit).headers).toMatchObject({ Authorization: `Bearer ${secret}` });
  });

  it("reports a real Cloudflare inference permission failure without exposing upstream details", async () => {
    const secret = "cf-private-token";
    const accountId = "0123456789abcdef0123456789abcdef";
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, errors: [], messages: [], result: [{ name: "@cf/acme/dynamic-model", task: "Text Generation" }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: secret } }), { status: 403 })));
    const response = await POST(new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", [SESSION_KEY_HEADER]: secret, [CLOUDFLARE_ACCOUNT_HEADER]: accountId },
      body: JSON.stringify({ provider: "cloudflare", model: "@cf/acme/dynamic-model", messages: [{ role: "user", content: "Reply only OK." }] }),
    }));
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ errorKind: "permission", error: expect.not.stringContaining(secret) });
  });

  it("rejects a Cloudflare account header when another provider is selected", async () => {
    const response = await POST(chatRequest({ provider: "openai", model: "gpt-6-luna", messages: [{ role: "user", content: "Hello" }] }, { [CLOUDFLARE_ACCOUNT_HEADER]: "0123456789abcdef0123456789abcdef" }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("only be used with Cloudflare");
  });

  it("routes Gemini selection end to end and returns normalized text", async () => {
    process.env.GEMINI_API_KEY = "route-test-key";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ models: [{ name: "models/gemini-3.8-flash", displayName: "Gemini Flash", outputTokenLimit: 1, supportedGenerationMethods: ["generateContent"] }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "Gemini answer" }] } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(chatRequest({ provider: "gemini", model: "gemini-3.8-flash", assistantSurface: "kat", messages: [{ role: "user", content: "Hello" }] }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ text: "Gemini answer", provider: "gemini", model: "gemini-3.8-flash" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const generation = JSON.parse(String((fetchMock.mock.calls[1]?.[1] as RequestInit).body)) as { systemInstruction: { parts: [{ text: string }] } };
    expect(generation.systemInstruction.parts[0].text).toContain('"provider":"Gemini"');
    expect(generation.systemInstruction.parts[0].text).toContain('"assistantSurface":"kat"');
    expect(generation.systemInstruction.parts[0].text).toContain('"selectedModelId":"gemini-3.8-flash"');
  });

  it("rejects a model that is not in the selected provider catalog", async () => {
    process.env.GEMINI_API_KEY = "route-test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ models: [{ name: "models/gemini-flash", outputTokenLimit: 1, supportedGenerationMethods: ["generateContent"] }] }), { status: 200 })));
    const response = await POST(chatRequest({ provider: "gemini", model: "gpt-6-luna", messages: [{ role: "user", content: "Hello" }] }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("not in the current Gemini catalog");
  });

  it("routes OpenRouter and keeps a BYOK secret out of the request body and response", async () => {
    const secret = "router-session-secret";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: "Routed answer" } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(new Request("https://katalyst.example/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", [SESSION_KEY_HEADER]: secret },
      body: JSON.stringify({ provider: "openrouter", model: "openrouter/free", messages: [{ role: "user", content: "Hello" }] }),
    }));
    const result = await response.json();
    expect(response.status).toBe(200);
    expect(result).toEqual({ text: "Routed answer", provider: "openrouter", model: "openrouter/free" });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(request.headers).toMatchObject({ Authorization: `Bearer ${secret}` });
    expect(String(request.body)).not.toContain(secret);
    expect(JSON.stringify(result)).not.toContain(secret);
  });

  it("rejects OpenRouter IDs missing from the discovered catalog", async () => {
    process.env.OPENROUTER_API_KEY = "route-invalid-model-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [
      { id: "publisher/listed", name: "Listed", architecture: { input_modalities: ["text"], output_modalities: ["text"] }, pricing: { prompt: "0.000001", completion: "0.000002" } },
    ] }), { status: 200 })));
    const response = await POST(chatRequest({ provider: "openrouter", model: "publisher/not-listed", messages: [{ role: "user", content: "Hello" }] }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("not in the current OpenRouter catalog");
  });

  it("rejects oversized declared bodies before parsing", async () => {
    const response = await POST(new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Length": "193000" },
      body: "{}",
    }));
    expect(response.status).toBe(413);
  });

  it("enforces the aggregate message and context limit", async () => {
    const response = await POST(chatRequest({
      provider: "openai",
      model: "gpt-6-luna",
      messages: [{ role: "user", content: "x".repeat(8_000) }, { role: "assistant", content: "x".repeat(8_000) }, { role: "user", content: "x".repeat(8_000) }, { role: "assistant", content: "x".repeat(8_000) }, { role: "user", content: "x".repeat(8_000) }, { role: "assistant", content: "x".repeat(8_000) }],
      context: "x".repeat(24_000),
    }));
    expect(response.status).toBe(413);
  });

  it("maps provider network failures and timeouts to readable route errors", async () => {
    process.env.GEMINI_API_KEY = "route-test-key";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new TypeError("Network unavailable")));
    const networkResponse = await POST(chatRequest({ provider: "gemini", model: "gemini-3.8-flash", messages: [{ role: "user", content: "Hello" }] }));
    expect(networkResponse.status).toBe(502);
    expect((await networkResponse.json()).error).toContain("Could not reach Gemini");

    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new DOMException("Timeout", "TimeoutError")));
    const timeoutResponse = await POST(chatRequest({ provider: "gemini", model: "gemini-3.8-flash", messages: [{ role: "user", content: "Hello" }] }));
    expect(timeoutResponse.status).toBe(504);
  });

  it("blocks Ollama from public KATALYST hosts before any local request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(new Request("https://katalyst.example/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "ollama", model: "qwen2.5:7b", messages: [{ role: "user", content: "Hello" }] }),
    }));
    expect(response.status).toBe(403);
    expect((await response.json()).error).toContain("only from a local KATALYST instance");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("discovers and uses a configured loopback Ollama model, returning local token counts", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ models: [{ name: "qwen2.5:7b", size: 4_681_000_000, details: { parameter_size: "7B", quantization_level: "Q4_K_M" } }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: { content: "Local answer" }, done: true, prompt_eval_count: 17, eval_count: 6 }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", [OLLAMA_URL_HEADER]: "http://localhost:11434" },
      body: JSON.stringify({ provider: "ollama", model: "qwen2.5:7b", messages: [{ role: "user", content: "Hello" }] }),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ text: "Local answer", usage: { inputTokens: 17, outputTokens: 6 }, provider: "ollama", model: "qwen2.5:7b" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:11434/api/tags");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("http://localhost:11434/api/chat");
  });
});

describe("GET /api/status", () => {
  it("uses Cloudflare as the hosted default and reports token/account readiness separately", async () => {
    process.env.AI_PROVIDER = "disabled";
    process.env.CLOUDFLARE_API_TOKEN = "cf-secret";
    process.env.CLOUDFLARE_ACCOUNT_ID = "not-valid";
    const response = await GET();
    const body = await response.json();
    expect(body.defaultProvider).toBe("cloudflare");
    expect(body.providers.cloudflare).toEqual({ configured: false, tokenConfigured: true, accountConfigured: false });
    expect(JSON.stringify(body)).not.toContain("cf-secret");
  });

  it("reports provider readiness and the configured default without returning secrets", async () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.AI_MODEL = "gemini-3.7-flash";
    process.env.GEMINI_API_KEY = "secret-for-test";
    const response = await GET();
    const body = await response.json();
    expect(body).toMatchObject({
      defaultProvider: "gemini",
      defaultModel: "",
      providers: { openai: { configured: false }, gemini: { configured: true }, openrouter: { configured: false } },
    });
    expect(JSON.stringify(body)).not.toContain("secret-for-test");
  });

  it("treats whitespace and the example placeholder as missing credentials", async () => {
    process.env.OPENAI_API_KEY = "   ";
    process.env.GEMINI_API_KEY = "your_api_key_here";
    process.env.CLOUDFLARE_API_TOKEN = "your_api_key_here";
    process.env.CLOUDFLARE_ACCOUNT_ID = " 0123456789abcdef0123456789abcdef ";
    const response = await GET();
    const body = await response.json();
    expect(body.providers).toMatchObject({
      openai: { configured: false },
      gemini: { configured: false },
      cloudflare: { configured: false, tokenConfigured: false, accountConfigured: true },
    });
    expect(JSON.stringify(body)).not.toContain("your_api_key_here");
  });
});
