import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { sameOriginMutation, requireAdminUser } = vi.hoisted(() => ({
  sameOriginMutation: vi.fn((request: NextRequest) => request.headers.get("origin") === request.nextUrl.origin),
  requireAdminUser: vi.fn(),
}));

vi.mock("@/lib/account-server", () => ({ sameOriginMutation }));
vi.mock("@/lib/ai-gateway/admin", () => ({
  requireAdminUser,
  recordAdminAuditLog: vi.fn(),
}));

import { PUT as updateAdminConfig } from "@/app/api/admin/config/route";
import { POST as updateKillSwitch } from "@/app/api/admin/kill-switch/route";

describe("admin mutation origin checks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a cross-origin configuration update before admin work", async () => {
    const request = new NextRequest("https://katalyst.example/api/admin/config", {
      method: "PUT",
      headers: { origin: "https://attacker.example", "content-type": "application/json" },
      body: JSON.stringify({ system: { killSwitchActive: true } }),
    });

    const response = await updateAdminConfig(request);

    expect(response.status).toBe(403);
    expect(requireAdminUser).not.toHaveBeenCalled();
  });

  it("rejects a cross-origin kill-switch update before admin work", async () => {
    const request = new NextRequest("https://katalyst.example/api/admin/kill-switch", {
      method: "POST",
      headers: { origin: "https://attacker.example", "content-type": "application/json" },
      body: JSON.stringify({ active: true }),
    });

    const response = await updateKillSwitch(request);

    expect(response.status).toBe(403);
    expect(requireAdminUser).not.toHaveBeenCalled();
  });
});
