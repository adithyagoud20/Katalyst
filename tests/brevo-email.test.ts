import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  sendBrevoEmail,
  sendWelcomeEmail,
  sendQuotaLowAlert,
  sendQuotaExhaustedAlert,
  isBrevoConfigured,
} from "@/lib/email/brevo";

describe("Brevo Email Service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("gracefully reports unconfigured state when BREVO_API_KEY is missing", async () => {
    vi.stubEnv("BREVO_API_KEY", "");
    expect(isBrevoConfigured()).toBe(false);

    const result = await sendBrevoEmail({
      toEmail: "test@example.com",
      subject: "Test",
      htmlContent: "<p>test</p>",
      textContent: "test",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Brevo is not configured");
    vi.unstubAllEnvs();
  });

  it("successfully dispatches transactional email when configured", async () => {
    vi.stubEnv("BREVO_API_KEY", "xkeysib-mock-api-key");
    vi.stubEnv("BREVO_SENDER_EMAIL", "team@katalyst.learn");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messageId: "<20261110.12345@smtp-relay.brevo.com>" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendWelcomeEmail({
      email: "learner@university.edu",
      name: "Engineering Learner",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe("<20261110.12345@smtp-relay.brevo.com>");
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, requestInit] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(requestInit.headers["api-key"]).toBe("xkeysib-mock-api-key");

    const body = JSON.parse(requestInit.body);
    expect(body.sender.email).toBe("team@katalyst.learn");
    expect(body.to[0].email).toBe("learner@university.edu");
    expect(body.subject).toContain("Welcome to KATALYST");

    vi.unstubAllEnvs();
  });

  it("handles network failure without throwing exceptions to callers", async () => {
    vi.stubEnv("BREVO_API_KEY", "xkeysib-mock-api-key");

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Brevo connection timeout")));

    const result = await sendQuotaLowAlert({
      email: "learner@university.edu",
      creditsRemaining: 45,
      resetDate: "2026-12-01T00:00:00.000Z",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Brevo connection timeout");

    vi.unstubAllEnvs();
  });

  it("renders valid quota exhausted alert email payload", async () => {
    vi.stubEnv("BREVO_API_KEY", "xkeysib-mock-api-key");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messageId: "<msg-999@brevo.com>" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendQuotaExhaustedAlert({
      email: "learner@university.edu",
      resetDate: "2026-12-01T00:00:00.000Z",
    });

    expect(result.success).toBe(true);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.subject).toContain("Monthly credit allowance exhausted");
    expect(body.htmlContent).toContain("Bring-Your-Own-Key");

    vi.unstubAllEnvs();
  });
});
