import "server-only";

/**
 * Brevo (formerly Sendinblue) Transactional Email Client
 * Provides server-side, consent-aware transactional messaging.
 * Non-blocking: Failures are logged and never throw or interrupt core user flows.
 */

export type SendEmailOptions = {
  toEmail: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  category?: "welcome" | "quota_alert" | "account" | "feedback";
};

export type EmailDeliveryResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

export function isBrevoConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY?.trim());
}

export async function sendBrevoEmail(options: SendEmailOptions): Promise<EmailDeliveryResult> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) {
    // Graceful skip if Brevo is unconfigured
    return { success: false, error: "Brevo is not configured." };
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim() || "noreply@katalyst.learn";
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || "KATALYST";

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: options.toEmail, name: options.toName || options.toEmail.split("@")[0] }],
    subject: options.subject,
    htmlContent: options.htmlContent,
    textContent: options.textContent,
    tags: options.category ? [options.category] : undefined,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errBody = await response.text().catch(() => "Unknown response body");
      return { success: false, error: `Brevo responded with HTTP ${response.status}: ${errBody.slice(0, 100)}` };
    }

    const resData = (await response.json()) as { messageId?: string };
    return { success: true, messageId: resData.messageId };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error contacting Brevo API.",
    };
  }
}

/**
 * Sends a welcome email when a user registers or first signs in.
 */
export async function sendWelcomeEmail(user: { email: string; name?: string }): Promise<EmailDeliveryResult> {
  return sendBrevoEmail({
    toEmail: user.email,
    toName: user.name,
    subject: "Welcome to KATALYST — Engineering Learning Studio",
    category: "welcome",
    textContent: `Hi ${user.name || "there"},\n\nWelcome to KATALYST! Your account is ready with your monthly shared AI credit allowance. Learn C programming, build with WebAssembly, and ask Kat anytime.\n\nHappy coding,\nThe KATALYST Team`,
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e2022; line-height: 1.5;">
        <h2 style="color: #ea580c; margin-bottom: 16px;">Welcome to KATALYST</h2>
        <p>Hi ${user.name || "there"},</p>
        <p>Your engineering learning account is now active. You have been granted your monthly shared AI credit allowance to study C programming foundations and collaborate with Kat, your AI tutor.</p>
        <p>Start learning anytime at your local workspace.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b;">KATALYST — A local-first engineering learning platform.</p>
      </div>
    `,
  });
}

/**
 * Sends an email notification when user credits fall below 10%.
 */
export async function sendQuotaLowAlert(user: { email: string; name?: string; creditsRemaining: number; resetDate: string }): Promise<EmailDeliveryResult> {
  return sendBrevoEmail({
    toEmail: user.email,
    toName: user.name,
    subject: "KATALYST AI — Credit balance low",
    category: "quota_alert",
    textContent: `Hi ${user.name || "there"},\n\nYour KATALYST shared AI balance is running low (${user.creditsRemaining.toFixed(0)} credits remaining). Your allowance will reset on ${new Date(user.resetDate).toLocaleDateString()}.\n\nYou can also configure your own API keys (Gemini, OpenAI, OpenRouter, or Ollama) anytime in Settings.`,
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e2022; line-height: 1.5;">
        <h3 style="color: #ea580c;">Credit Balance Low</h3>
        <p>Hi ${user.name || "there"},</p>
        <p>You have <strong>${user.creditsRemaining.toFixed(0)} credits</strong> remaining in your monthly KATALYST shared AI allowance.</p>
        <p>Your credits reset on <strong>${new Date(user.resetDate).toLocaleDateString()}</strong>. You can continue uninterrupted by configuring Bring-Your-Own-Key (BYOK) providers in Settings.</p>
      </div>
    `,
  });
}

/**
 * Sends an email notification when monthly credits are completely exhausted.
 */
export async function sendQuotaExhaustedAlert(user: { email: string; name?: string; resetDate: string }): Promise<EmailDeliveryResult> {
  return sendBrevoEmail({
    toEmail: user.email,
    toName: user.name,
    subject: "KATALYST AI — Monthly credit allowance exhausted",
    category: "quota_alert",
    textContent: `Hi ${user.name || "there"},\n\nYour monthly KATALYST shared AI allowance has been exhausted. Your credits will automatically refresh on ${new Date(user.resetDate).toLocaleDateString()}.\n\nIn the meantime, you can continue using Kat by adding your own API key in Settings -> AI Providers.`,
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e2022; line-height: 1.5;">
        <h3 style="color: #b91c1c;">Monthly Credits Exhausted</h3>
        <p>Hi ${user.name || "there"},</p>
        <p>Your monthly shared AI allowance has been exhausted for this period. Your credits will reset on <strong>${new Date(user.resetDate).toLocaleDateString()}</strong>.</p>
        <p>You can continue learning without waiting by selecting a Bring-Your-Own-Key provider (Gemini, OpenAI, OpenRouter, or local Ollama) in Settings.</p>
      </div>
    `,
  });
}
