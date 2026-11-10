import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { getDefaultModel } from "@/lib/providers/catalog";
import { DEFAULT_USER_PREFERENCES } from "@/lib/user-preferences";
import { GET as getSnapshot, PUT as putSnapshot } from "@/app/api/account/snapshot/route";
import { GET as exportAccount } from "@/app/api/account/export/route";
import { POST as deleteAccount } from "@/app/api/account/delete/route";

const { requireAccountUser, createAdminClient } = vi.hoisted(() => ({ requireAccountUser: vi.fn(), createAdminClient: vi.fn() }));
vi.mock("@/lib/account-server", () => ({
  requireAccountUser,
  sameOriginMutation: (request: NextRequest) => request.headers.get("origin") === request.nextUrl.origin,
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: createAdminClient }));

function request(body: unknown) {
  return new NextRequest("http://localhost/api/account/snapshot", {
    method: "PUT",
    headers: { Origin: "http://localhost", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const snapshot = {
  workspace: {
    projects: [{ id: "owned-project", name: "Owned", instructions: "", chats: [] }], skills: [], provider: "cloudflare",
    models: { cloudflare: "", openai: getDefaultModel("openai"), gemini: getDefaultModel("gemini"), openrouter: getDefaultModel("openrouter"), ollama: "" }, activeChatId: null,
  },
  learningProgress: { version: 1, enrollments: [] },
  preferences: DEFAULT_USER_PREFERENCES,
};

describe("account persistence route authorization", () => {
  const rpc = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    rpc.mockResolvedValue({ data: [{ status: "saved", revision: 1, updated_at: "2026-11-10T00:00:00.000Z" }], error: null });
    requireAccountUser.mockResolvedValue({
      ok: true,
      user: { id: "authenticated-user", email: "learner@example.test", user_metadata: {} },
      supabase: { rpc, auth: { signOut: vi.fn().mockResolvedValue({ error: null }) }, from: vi.fn(() => ({ select: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) })) })) },
    });
    createAdminClient.mockReturnValue({ auth: { admin: { deleteUser: vi.fn().mockResolvedValue({ error: null }) } } });
  });

  afterEach(() => vi.unstubAllEnvs());

  it("does not read data for an unauthenticated request", async () => {
    requireAccountUser.mockResolvedValue({ ok: false, status: 401, error: "Sign in to access account data." });
    const response = await getSnapshot();
    expect(response.status).toBe(401);
  });

  it("rejects caller-supplied ownership fields instead of accepting another user ID", async () => {
    const response = await putSnapshot(request({ snapshot, expectedRevision: 0, userId: "another-user" }));
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("derives ownership from the verified session and never passes a user ID to the save RPC", async () => {
    const response = await putSnapshot(request({ snapshot, expectedRevision: 0 }));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("save_account_snapshot", expect.objectContaining({
      p_expected_revision: 0,
      p_workspace: snapshot.workspace,
    }));
    expect(rpc.mock.calls[0][1]).not.toHaveProperty("user_id");
    expect(rpc.mock.calls[0][1]).not.toHaveProperty("userId");
  });

  it("returns conflicts without replacing the current account revision", async () => {
    rpc.mockResolvedValue({ data: [{ status: "conflict", revision: 4, updated_at: null }], error: null });
    const response = await putSnapshot(request({ snapshot, expectedRevision: 2 }));
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ status: "conflict", revision: 4 });
  });

  it("exports only the verified user's validated snapshot as a private download", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { workspace: snapshot.workspace, learning_progress: snapshot.learningProgress, preferences: snapshot.preferences, revision: 3, updated_at: "2026-11-10T00:00:00.000Z" },
      error: null,
    });
    const from = vi.fn(() => ({ select: vi.fn(() => ({ maybeSingle })) }));
    requireAccountUser.mockResolvedValueOnce({
      ok: true,
      user: { id: "authenticated-user", email: "learner@example.test", user_metadata: {} },
      supabase: { from },
    });

    const response = await exportAccount();
    const body = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-disposition")).toContain("katalyst-account-");
    expect(JSON.parse(body)).toMatchObject({ userId: "authenticated-user", revision: 3, snapshot: { workspace: snapshot.workspace } });
    expect(body).not.toMatch(/api.?key|session.?key|authorization/i);
  });

  it("rejects a caller-supplied account ID when confirming deletion", async () => {
    const response = await deleteAccount(request({ confirmation: "delete my account", userId: "another-user" }));
    expect(response.status).toBe(400);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("deletes only the user verified from the server session", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-example");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "server-only-test-secret");
    const deleteUser = vi.fn().mockResolvedValue({ error: null });
    createAdminClient.mockReturnValue({ auth: { admin: { deleteUser } } });
    const response = await deleteAccount(request({ confirmation: "delete my account" }));
    expect(response.status).toBe(200);
    expect(deleteUser).toHaveBeenCalledWith("authenticated-user");
    expect(deleteUser).not.toHaveBeenCalledWith("another-user");
  });
});
