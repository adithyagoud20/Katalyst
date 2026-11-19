import { createServerClient } from "@supabase/ssr";
import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

function createCsp(nonce: string, allowWasmerWorkerEval = false): string {
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' https://challenges.cloudflare.com 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'${isDev || allowWasmerWorkerEval ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://registry.wasmer.io https://cdn.wasmer.io https://cdn.jsdelivr.net https://challenges.cloudflare.com http://localhost:11434 ws://localhost:11434",
    // Admin-scheduled launch videos are hosted on the operator's HTTPS media host.
    "media-src 'self' blob: https:",
    "frame-src 'self' blob: data: https://challenges.cloudflare.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export function getContentSecurityPolicy(nonce: string, pathname: string): string {
  const isWasmerRuntimeWorker = pathname === "/vendor/wasmer-sdk/dist/browser-worker.js";
  return createCsp(nonce, isWasmerRuntimeWorker);
}

export async function proxy(request: NextRequest) {
  const nonce = randomBytes(18).toString("base64");
  const contentSecurityPolicy = getContentSecurityPolicy(nonce, request.nextUrl.pathname);
  const createResponse = () => {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);
    const nextResponse = NextResponse.next({ request: { headers: requestHeaders } });
    nextResponse.headers.set("Content-Security-Policy", contentSecurityPolicy);
    return nextResponse;
  };

  const config = getSupabaseConfig();
  if (!config) return createResponse();

  let response = createResponse();
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = createResponse();
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // Refresh cookie-backed sessions. Authorization remains the responsibility of each server route.
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
