import { createServerClient } from "@supabase/ssr";
import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

function isBrowserLabShell(pathname: string): boolean {
  // Legacy hash navigation keeps the app shell on `/` while opening labs.
  return pathname === "/"
    || pathname === "/playground"
    || pathname === "/paths"
    || pathname === "/practice";
}

function isPublicLessonPage(pathname: string): boolean {
  return /^\/courses\/[^/]+\/[^/]+$/.test(pathname);
}

function needsBrowserWasm(pathname: string): boolean {
  const [, , courseId] = pathname.split("/");
  const isWasmCourse = (courseId === "python-programming-foundations" || courseId === "c-programming-foundations") && isPublicLessonPage(pathname);
  return isBrowserLabShell(pathname) || isWasmCourse || pathname.startsWith("/vendor/c-toolchain/");
}

function isPublicCoursePage(pathname: string): boolean {
  return pathname === "/courses" || pathname.startsWith("/courses/");
}

function createCsp(nonce: string, pathname: string): string {
  const hasBrowserWasm = needsBrowserWasm(pathname);
  const hasLabPreview = isBrowserLabShell(pathname);
  const needsBlobWorker = hasLabPreview || isPublicLessonPage(pathname);
  const isPublicCourse = isPublicCoursePage(pathname);
  const wasmConnectSources = hasBrowserWasm ? " https://cdn.jsdelivr.net" : "";
  const labPreviewSources = hasLabPreview ? " blob: data:" : "";
  return [
    "default-src 'self'",
    `script-src 'self' https://challenges.cloudflare.com 'nonce-${nonce}' 'strict-dynamic'${hasBrowserWasm ? " 'wasm-unsafe-eval'" : ""}`,
    isPublicCourse ? `style-src 'self' 'nonce-${nonce}'` : "style-src 'self' 'unsafe-inline'",
    ...(isPublicCourse ? ["style-src-attr 'none'"] : []),
    `img-src 'self' data: https:${hasLabPreview ? " blob:" : ""}`,
    "font-src 'self' data:",
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com http://localhost:11434 ws://localhost:11434${wasmConnectSources}`,
    // Admin-scheduled launch videos are hosted on the operator's HTTPS media host.
    "media-src 'self' blob: https:",
    `frame-src https://challenges.cloudflare.com${labPreviewSources}`,
    `worker-src 'self'${needsBlobWorker ? " blob:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export function getContentSecurityPolicy(nonce: string, pathname: string): string {
  return createCsp(nonce, pathname);
}

export async function proxy(request: NextRequest) {
  const nonce = randomBytes(18).toString("base64");
  const contentSecurityPolicy = createCsp(nonce, request.nextUrl.pathname);
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
