import { createServerClient } from "@supabase/ssr";
import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getCLabRequestOrigin, isCLabRunnerEmbedRoute, resolveCLabRunnerOrigin } from "@/lib/c-lab-runner-config";
import { getCLabRunnerAssetContentSecurityPolicy } from "@/lib/c-lab-runner-security";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const C_LAB_RUNNER_PATH = "/lab-runner/c";

function needsBrowserWasm(pathname: string): boolean {
  return pathname === "/playground"
    || pathname === "/paths"
    || pathname === "/practice"
    || pathname === "/vendor/wasmer-sdk/dist/browser-worker.js";
}

function isPublicCoursePage(pathname: string): boolean {
  return pathname === "/courses" || pathname.startsWith("/courses/");
}

function createCsp(nonce: string, pathname: string, appOrigin = "https://katalyst.invalid"): string {
  const hasBrowserWasm = needsBrowserWasm(pathname);
  const isPublicCourse = isPublicCoursePage(pathname);
  const embedsCLabRunner = isCLabRunnerEmbedRoute(pathname);
  const runnerOrigin = resolveCLabRunnerOrigin(appOrigin);
  const runnerFrameSource = runnerOrigin === appOrigin ? "'self'" : runnerOrigin;
  const wasmConnectSources = hasBrowserWasm
    ? " https://registry.wasmer.io https://cdn.wasmer.io https://cdn.jsdelivr.net"
    : "";
  const labPreviewSources = hasBrowserWasm ? " blob: data:" : "";
  return [
    "default-src 'self'",
    `script-src 'self' https://challenges.cloudflare.com 'nonce-${nonce}' 'strict-dynamic'${hasBrowserWasm ? " 'wasm-unsafe-eval'" : ""}`,
    isPublicCourse ? `style-src 'self' 'nonce-${nonce}'` : "style-src 'self' 'unsafe-inline'",
    ...(isPublicCourse ? ["style-src-attr 'none'"] : []),
    `img-src 'self' data: https:${hasBrowserWasm ? " blob:" : ""}`,
    "font-src 'self' data:",
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com http://localhost:11434 ws://localhost:11434${wasmConnectSources}`,
    // Admin-scheduled launch videos are hosted on the operator's HTTPS media host.
    "media-src 'self' blob: https:",
    `frame-src https://challenges.cloudflare.com${embedsCLabRunner ? ` ${runnerFrameSource}` : ""}${labPreviewSources}`,
    `worker-src 'self'${hasBrowserWasm ? " blob:" : ""}`,
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
  if (request.nextUrl.pathname === C_LAB_RUNNER_PATH) {
    // This document is a stateless runtime shell. Do not inspect app auth cookies.
    return NextResponse.next();
  }
  if (request.nextUrl.pathname.startsWith(`${C_LAB_RUNNER_PATH}/wasmer/`)) {
    // Worker/module assets get eval only under this runner namespace, without refreshing app auth.
    const response = NextResponse.next();
    const runnerOrigin = resolveCLabRunnerOrigin(getCLabRequestOrigin(request));
    response.headers.set("Content-Security-Policy", getCLabRunnerAssetContentSecurityPolicy(runnerOrigin));
    return response;
  }
  const nonce = randomBytes(18).toString("base64");
  const contentSecurityPolicy = createCsp(nonce, request.nextUrl.pathname, request.nextUrl.origin);
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
