import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/protocols/route";

describe("Protocol API Route (/api/protocols)", () => {
  it("returns protocol manifest when no ID is provided", async () => {
    const req = new Request("http://localhost:3000/api/protocols");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("public");
    const data = (await res.json()) as { protocols: unknown[] };
    expect(Array.isArray(data.protocols)).toBe(true);
    expect(data.protocols.length).toBeGreaterThanOrEqual(4);
  });

  it("returns specific scenario when valid ID is provided", async () => {
    const req = new Request("http://localhost:3000/api/protocols?id=tcp-handshake");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string; title: string; steps: unknown[] };
    expect(data.id).toBe("tcp-handshake");
    expect(data.title).toContain("TCP");
    expect(data.steps.length).toBeGreaterThanOrEqual(3);
  });

  it("returns quic-handshake scenario via API", async () => {
    const req = new Request("http://localhost:3000/api/protocols?id=quic-handshake");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string; title: string; steps: unknown[] };
    expect(data.id).toBe("quic-handshake");
    expect(data.title).toContain("QUIC");
    expect(data.steps.length).toBe(4);
  });

  it("returns mqtt-telemetry scenario via API", async () => {
    const req = new Request("http://localhost:3000/api/protocols?id=mqtt-telemetry");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string; title: string; steps: unknown[] };
    expect(data.id).toBe("mqtt-telemetry");
    expect(data.title).toContain("MQTT");
    expect(data.steps.length).toBe(6);
  });

  it("returns 404 for unknown protocol ID", async () => {
    const req = new Request("http://localhost:3000/api/protocols?id=non-existent-protocol");
    const res = await GET(req);

    expect(res.status).toBe(404);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain("not found");
  });
});
