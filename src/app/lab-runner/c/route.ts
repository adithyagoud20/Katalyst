import { getCLabRequestOrigin, resolveCLabParentOrigin, resolveCLabRunnerOrigin } from "@/lib/c-lab-runner-config";
import { getCLabRunnerContentSecurityPolicy } from "@/lib/c-lab-runner-security";

export const dynamic = "force-dynamic";

function escapeHtml(value: string): string {
  return value.replace(/[&"<>']/g, (character) => ({
    "&": "&amp;",
    '"': "&quot;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
  })[character] ?? character);
}

export async function GET(request: Request): Promise<Response> {
  const requestOrigin = getCLabRequestOrigin(request);
  const runnerOrigin = resolveCLabRunnerOrigin(requestOrigin);
  const parentOrigin = resolveCLabParentOrigin(runnerOrigin);
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,nofollow,noarchive">
    <meta name="c-lab-parent-origin" content="${escapeHtml(parentOrigin)}">
    <title>KATALYST C Runtime</title>
    <script type="module" src="/lab-runner/c/runner.js"></script>
  </head>
  <body><p role="status">Starting the isolated C runtime…</p></body>
</html>`;

  const responseHeaders: Record<string, string> = {
    "Cache-Control": "no-store, max-age=0",
    "Content-Security-Policy": getCLabRunnerContentSecurityPolicy(parentOrigin, runnerOrigin),
    "Content-Type": "text/html; charset=utf-8",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  };
  if (parentOrigin === runnerOrigin) responseHeaders["X-Frame-Options"] = "SAMEORIGIN";

  return new Response(html, {
    headers: {
      ...responseHeaders,
    },
  });
}
