const RUNNER_PATH = "/lab-runner/c";

function parseOrigin(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value);
    if ((url.protocol !== "https:" && url.protocol !== "http:")
      || url.username
      || url.password
      || (url.pathname !== "/" && url.pathname !== "")
      || url.search
      || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function getCLabRequestOrigin(request: Request): string {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",", 1)[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.split(",", 1)[0]?.trim();
  if (!host) return requestUrl.origin;

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",", 1)[0]?.trim().toLowerCase();
  const protocol = forwardedProto === "https" || forwardedProto === "http"
    ? forwardedProto
    : requestUrl.protocol.slice(0, -1);
  try {
    return new URL(`${protocol}://${host}`).origin;
  } catch {
    return requestUrl.origin;
  }
}

export function resolveCLabRunnerOrigin(appOrigin: string, configuredOrigin = process.env.NEXT_PUBLIC_C_LAB_RUNNER_ORIGIN): string {
  return parseOrigin(configuredOrigin) ?? appOrigin;
}

export function resolveCLabParentOrigin(requestOrigin: string, configuredOrigin = process.env.C_LAB_PARENT_ORIGIN): string {
  return parseOrigin(configuredOrigin) ?? requestOrigin;
}

export function getCLabRunnerUrl(appOrigin?: string): string {
  const configuredOrigin = parseOrigin(process.env.NEXT_PUBLIC_C_LAB_RUNNER_ORIGIN);
  if (configuredOrigin) return new URL(RUNNER_PATH, configuredOrigin).toString();
  return appOrigin ? new URL(RUNNER_PATH, appOrigin).toString() : RUNNER_PATH;
}

export function isCLabRunnerEmbedRoute(pathname: string): boolean {
  return pathname === "/playground"
    || pathname.startsWith("/courses/c-programming-foundations/")
    || pathname.startsWith("/courses/cpp-programming/");
}
