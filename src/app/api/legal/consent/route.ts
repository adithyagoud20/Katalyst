import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAccountUser, sameOriginMutation } from "@/lib/account-server";
import { LEGAL_CONSENT_COOKIE, LEGAL_CONSENT_MAX_AGE_SECONDS, recordLegalConsent, signLegalConsent } from "@/lib/legal-consent";
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from "@/lib/legal-versions";

const prepareSchema = z.object({
  action: z.literal("prepare"),
  accepted: z.literal(true),
  termsVersion: z.literal(CURRENT_TERMS_VERSION),
  privacyVersion: z.literal(CURRENT_PRIVACY_VERSION),
  method: z.enum(["google", "email-sign-in", "email-sign-up"]),
}).strict();
const completeSchema = z.object({ action: z.literal("complete") }).strict();
const bodySchema = z.discriminatedUnion("action", [prepareSchema, completeSchema]);

export async function POST(request: NextRequest) {
  if (!sameOriginMutation(request)) return NextResponse.json({ error: "This consent action must come from the KATALYST site." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Consent could not be recorded. Try again." }, { status: 400 }); }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Accept the current Terms and Privacy notice to continue." }, { status: 400 });

  if (parsed.data.action === "prepare") {
    try {
      const token = signLegalConsent({
        termsVersion: parsed.data.termsVersion,
        privacyVersion: parsed.data.privacyVersion,
        acceptedAt: Date.now(),
        method: parsed.data.method,
      });
      const response = NextResponse.json({ prepared: true }, { headers: { "Cache-Control": "no-store" } });
      response.cookies.set(LEGAL_CONSENT_COOKIE, token, {
        httpOnly: true,
        secure: request.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: LEGAL_CONSENT_MAX_AGE_SECONDS,
      });
      return response;
    } catch {
      return NextResponse.json({ error: "Consent recording is unavailable. Please try again later." }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
  }

  const auth = await requireAccountUser();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const token = request.cookies.get(LEGAL_CONSENT_COOKIE)?.value;
  const response = NextResponse.json({ recorded: true }, { headers: { "Cache-Control": "no-store" } });
  try {
    const recorded = await recordLegalConsent(auth.user.id, token);
    if (!recorded) return NextResponse.json({ error: "Current consent was not found. Accept the Terms and Privacy notice again." }, { status: 403, headers: { "Cache-Control": "no-store" } });
    response.cookies.set(LEGAL_CONSENT_COOKIE, "", { httpOnly: true, secure: request.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Consent could not be recorded.";
    return NextResponse.json({ error: message }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
