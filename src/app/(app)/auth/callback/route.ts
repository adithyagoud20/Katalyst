import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LEGAL_CONSENT_COOKIE, recordLegalConsent } from "@/lib/legal-consent";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const supabase = await createSupabaseServerClient();
  if (!code || !supabase) return NextResponse.redirect(new URL("/login?account=sign-in-failed", request.url));

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(new URL("/login?account=sign-in-failed", request.url));

  const response = NextResponse.redirect(new URL("/?account=signed-in", request.url));
  try {
    const recorded = await recordLegalConsent(data.user.id, request.cookies.get(LEGAL_CONSENT_COOKIE)?.value);
    if (!recorded) {
      await supabase.auth.signOut();
      response.headers.set("location", new URL("/login?account=consent-required", request.url).toString());
    }
  } catch {
    await supabase.auth.signOut();
    response.headers.set("location", new URL("/login?account=consent-unavailable", request.url).toString());
  }
  response.cookies.set(LEGAL_CONSENT_COOKIE, "", { httpOnly: true, secure: request.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
