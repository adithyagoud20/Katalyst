import { describe, expect, it } from "vitest";
import { GET } from "../src/app/api/health/route";

describe("GET /api/health", () => {
  it("returns healthy status with accurate coursesCount and service readiness", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({
      ok: true,
      status: "healthy",
      coursesCount: 19,
      services: {
        cloudflareConfigured: expect.any(Boolean),
        supabaseConfigured: expect.any(Boolean),
      },
    });
    // Ensure no secrets are leaked
    const jsonStr = JSON.stringify(data);
    expect(jsonStr).not.toContain("token");
    expect(jsonStr).not.toContain("secret");
    expect(jsonStr).not.toContain("key");
  });
});
