import { NextResponse, type NextRequest } from "next/server";
import { getVerifiedSupabaseUser } from "@/lib/supabase/server";
import { getOrCreateGuestIdentity, GUEST_COOKIE_NAME } from "@/lib/ai-gateway/guest";
import { getAuthenticatedUserCreditStatus } from "@/lib/ai-gateway/credits";
import { getAiCreditPolicies, getAiSystemConfig } from "@/lib/ai-gateway/config";
import { consumeGuestNetworkLimit } from "@/lib/ai-gateway/guest-network-limit";
import { checkIsAppAdmin } from "@/lib/ai-gateway/admin";

export async function GET(request: NextRequest) {
  const authUser = await getVerifiedSupabaseUser();
  const sysConfig = await getAiSystemConfig();

  if (authUser.user) {
    const userId = authUser.user.id;
    const creditStatus = await getAuthenticatedUserCreditStatus(userId);
    const isAdmin = await checkIsAppAdmin(userId, authUser.user.email);

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: userId,
          email: authUser.user.email,
        },
        creditStatus,
        isAdmin,
        system: {
          sharedAiEnabled: sysConfig.sharedAiEnabled,
          killSwitchActive: sysConfig.killSwitchActive,
        },
      },
      {
        headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
      }
    );
  }

  // Guest flow
  const policies = await getAiCreditPolicies();
  let networkLimit: Awaited<ReturnType<typeof consumeGuestNetworkLimit>>;
  try {
    networkLimit = await consumeGuestNetworkLimit(request, policies);
  } catch {
    return NextResponse.json(
      { error: "Guest AI is temporarily unavailable. Please try again shortly." },
      { status: 503, headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" } }
    );
  }
  if (!networkLimit.allowed) {
    return NextResponse.json(
      { error: "Too many AI requests are coming from this network. Please wait before trying again." },
      {
        status: 429,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          "Retry-After": String(networkLimit.retryAfterSeconds ?? 1),
        },
      }
    );
  }

  const cookieHeader = request.cookies.get(GUEST_COOKIE_NAME)?.value;
  const guestData = await getOrCreateGuestIdentity(request, cookieHeader);

  const response = NextResponse.json(
    {
      authenticated: false,
      user: null,
      creditStatus: guestData.status,
      isAdmin: false,
      system: {
        sharedAiEnabled: sysConfig.sharedAiEnabled,
        killSwitchActive: sysConfig.killSwitchActive,
      },
    },
    {
      headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
    }
  );

  response.cookies.set(GUEST_COOKIE_NAME, guestData.cookieToken, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
  });

  return response;
}
