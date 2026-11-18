import "server-only";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from "@/lib/legal-versions";

export const LEGAL_CONSENT_COOKIE = "katalyst_legal_consent";
export const LEGAL_CONSENT_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export type LegalConsentMethod = "google" | "email-sign-in" | "email-sign-up";
export type LegalConsentPayload = {
  termsVersion: string;
  privacyVersion: string;
  acceptedAt: number;
  method: LegalConsentMethod;
};

function signingSecret(): string | null {
  return process.env.GUEST_SESSION_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
}

export function signLegalConsent(payload: LegalConsentPayload): string {
  const secret = signingSecret();
  if (!secret) throw new Error("Legal consent signing is not configured on the server.");
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyLegalConsent(token: string | null | undefined, now = Date.now()): LegalConsentPayload | null {
  if (!token || token.length > 2_048) return null;
  try {
    const [encoded, signature, extra] = token.split(".");
    const secret = signingSecret();
    if (!encoded || !signature || extra || !secret) return null;
    const expected = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<LegalConsentPayload>;
    if (payload.termsVersion !== CURRENT_TERMS_VERSION || payload.privacyVersion !== CURRENT_PRIVACY_VERSION) return null;
    if (!Number.isSafeInteger(payload.acceptedAt) || (payload.acceptedAt as number) > now || now - (payload.acceptedAt as number) > LEGAL_CONSENT_MAX_AGE_SECONDS * 1_000) return null;
    if (!(payload.method === "google" || payload.method === "email-sign-in" || payload.method === "email-sign-up")) return null;
    return payload as LegalConsentPayload;
  } catch {
    return null;
  }
}

export async function recordLegalConsent(userId: string, token: string | null | undefined): Promise<boolean> {
  const consent = verifyLegalConsent(token);
  if (!consent) return false;
  const config = getSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!config || !serviceRoleKey) throw new Error("Consent records require the server-side Supabase service key.");
  const admin = createClient(config.url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  const { error } = await admin.from("legal_consent_records").upsert({
    user_id: userId,
    terms_version: consent.termsVersion,
    privacy_version: consent.privacyVersion,
    accepted_at: new Date(consent.acceptedAt).toISOString(),
    consent_method: consent.method,
  }, { onConflict: "user_id,terms_version,privacy_version", ignoreDuplicates: true });
  if (error) throw new Error("The legal consent record could not be saved.");
  return true;
}
