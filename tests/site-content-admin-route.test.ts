import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { sameOriginMutation, requireAdminUser, recordAdminAuditLog, readSiteContent, writeSiteContent } = vi.hoisted(() => ({
  sameOriginMutation: vi.fn((request: NextRequest) => request.headers.get("origin") === request.nextUrl.origin),
  requireAdminUser: vi.fn(),
  recordAdminAuditLog: vi.fn(),
  readSiteContent: vi.fn(),
  writeSiteContent: vi.fn(),
}));

vi.mock("@/lib/account-server", () => ({ sameOriginMutation }));
vi.mock("@/lib/ai-gateway/admin", () => ({ requireAdminUser, recordAdminAuditLog }));
vi.mock("@/lib/site-content-service", () => ({ readSiteContent, writeSiteContent }));

import { GET, PUT } from "@/app/api/admin/site-content/route";
import { emptySiteContent } from "@/lib/site-content-schema";

const adminAuth = { ok: true as const, user: { id: "admin-id", email: "admin@example.test" }, supabase: {} as never };

describe("admin site-content API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminUser.mockResolvedValue(adminAuth);
    readSiteContent.mockResolvedValue(emptySiteContent);
    writeSiteContent.mockResolvedValue(emptySiteContent);
    recordAdminAuditLog.mockResolvedValue(true);
  });

  it("does not expose content through the admin endpoint to a non-admin", async () => {
    requireAdminUser.mockResolvedValue({ ok: false, status: 403, error: "Administrator privileges required." });
    const response = await GET();
    expect(response.status).toBe(403);
    expect(readSiteContent).not.toHaveBeenCalled();
  });

  it("rejects a cross-origin save before admin or storage work", async () => {
    const request = new NextRequest("https://katalyst.example/api/admin/site-content", {
      method: "PUT",
      headers: { origin: "https://attacker.example", "content-type": "application/json" },
      body: JSON.stringify(emptySiteContent),
    });
    const response = await PUT(request);
    expect(response.status).toBe(403);
    expect(requireAdminUser).not.toHaveBeenCalled();
    expect(writeSiteContent).not.toHaveBeenCalled();
  });

  it("rejects unsafe video URLs and invalid schedules", async () => {
    const content = structuredClone(emptySiteContent);
    content.launchEvent.enabled = true;
    content.launchEvent.title = "Launch";
    content.launchEvent.message = "Welcome";
    content.launchEvent.videoUrl = "javascript:alert(1)";
    content.launchEvent.startsAt = "2026-11-18T09:00:00.000Z";
    content.launchEvent.endsAt = "2026-11-18T18:00:00.000Z";
    const request = new NextRequest("https://katalyst.example/api/admin/site-content", {
      method: "PUT",
      headers: { origin: "https://katalyst.example", "content-type": "application/json" },
      body: JSON.stringify(content),
    });
    const response = await PUT(request);
    expect(response.status).toBe(400);
    expect(writeSiteContent).not.toHaveBeenCalled();
  });

  it("stores only validated content and records the admin action", async () => {
    const request = new NextRequest("https://katalyst.example/api/admin/site-content", {
      method: "PUT",
      headers: { origin: "https://katalyst.example", "content-type": "application/json" },
      body: JSON.stringify(emptySiteContent),
    });
    const response = await PUT(request);
    expect(response.status).toBe(200);
    expect(writeSiteContent).toHaveBeenCalledWith(emptySiteContent, "admin-id");
    expect(recordAdminAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "update_public_site_content", actorId: "admin-id" }));
    await expect(response.json()).resolves.toMatchObject({ auditLogged: true });
  });

  it("reports an audit-log outage without hiding the saved content", async () => {
    recordAdminAuditLog.mockResolvedValue(false);
    const request = new NextRequest("https://katalyst.example/api/admin/site-content", {
      method: "PUT",
      headers: { origin: "https://katalyst.example", "content-type": "application/json" },
      body: JSON.stringify(emptySiteContent),
    });
    const response = await PUT(request);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ success: true, auditLogged: false });
  });

  it("rejects declared oversized payloads before reading content", async () => {
    const request = new NextRequest("https://katalyst.example/api/admin/site-content", {
      method: "PUT",
      headers: { origin: "https://katalyst.example", "content-type": "application/json", "content-length": "20000" },
      body: JSON.stringify(emptySiteContent),
    });
    const response = await PUT(request);
    expect(response.status).toBe(413);
    expect(writeSiteContent).not.toHaveBeenCalled();
  });

  it("rejects oversized streamed bodies even without a content-length header", async () => {
    const request = new NextRequest("https://katalyst.example/api/admin/site-content", {
      method: "PUT",
      headers: { origin: "https://katalyst.example", "content-type": "application/json" },
      body: `{"padding":"${"x".repeat(17_000)}"}`,
    });
    const response = await PUT(request);
    expect(response.status).toBe(413);
    expect(writeSiteContent).not.toHaveBeenCalled();
  });

  it("requires a JSON content type", async () => {
    const request = new NextRequest("https://katalyst.example/api/admin/site-content", {
      method: "PUT",
      headers: { origin: "https://katalyst.example", "content-type": "text/plain" },
      body: JSON.stringify(emptySiteContent),
    });
    const response = await PUT(request);
    expect(response.status).toBe(415);
    expect(writeSiteContent).not.toHaveBeenCalled();
  });
});
