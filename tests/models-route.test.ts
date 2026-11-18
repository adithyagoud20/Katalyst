import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../src/app/api/models/route";
import { CLOUDFLARE_ACCOUNT_HEADER, OLLAMA_URL_HEADER } from "../src/lib/providers/constants";

afterEach(() => vi.unstubAllGlobals());

describe("GET /api/models for Ollama", () => {
  it("returns installed local model metadata without cloud credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ models: [{ name: "gemma3:4b", size: 3_300_000_000, details: { parameter_size: "4B", quantization_level: "Q4_K_M" } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await GET(new Request("http://localhost/api/models?provider=ollama", { headers: { [OLLAMA_URL_HEADER]: "http://localhost:11434" } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ provider: "ollama", models: [{ id: "gemma3:4b", local: true, sizeBytes: 3_300_000_000, quantization: "Q4_K_M" }] });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("blocks public hosts and remote or malformed local endpoints", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const publicResponse = await GET(new Request("https://katalyst.example/api/models?provider=ollama"));
    expect(publicResponse.status).toBe(403);
    const unsafeResponse = await GET(new Request("http://localhost/api/models?provider=ollama", { headers: { [OLLAMA_URL_HEADER]: "http://169.254.169.254/latest/meta-data" } }));
    expect(unsafeResponse.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/models for Cloudflare Workers AI", () => {
  it("does not expose the shared model through the BYOK model catalog", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await GET(new Request("http://localhost/api/models?provider=cloudflare&mode=platform"));
    expect(response.status).toBe(403);
    expect((await response.json()).error).toContain("Kat AI");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns account-compatible models using the session token and account ID", async () => {
    const accountId = "0123456789abcdef0123456789abcdef";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, errors: [], messages: [], result: [{ name: "@cf/acme/model", display_name: "Catalog Model", task: { name: "Text Generation" } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await GET(new Request("http://localhost/api/models?provider=cloudflare&mode=byok", { headers: { "x-katalyst-provider-key": "session-token", [CLOUDFLARE_ACCOUNT_HEADER]: accountId } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ provider: "cloudflare", models: [{ id: "@cf/acme/model", source: "cloudflare-models-api" }], diagnostic: { sourceCount: 1, compatibleCount: 1, excludedCount: 0 } });
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).headers).toMatchObject({ Authorization: "Bearer session-token" });
  });
});
