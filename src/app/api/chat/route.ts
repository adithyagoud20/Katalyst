import "server-only";
import { z } from "zod";
import { executeGatewayChat, GatewayError } from "@/lib/ai-gateway/gateway";

export const maxDuration = 60;

const messageSchema = z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(8_000) });
const requestSchema = z.object({
  provider: z.string().min(1).max(64),
  model: z.string().min(1).max(240),
  cloudflareMode: z.enum(["platform", "byok"]).optional(),
  assistantSurface: z.enum(["workspace", "kat"]).optional(),
  messages: z.array(messageSchema).min(1).max(20),
  context: z.string().max(24_000).optional(),
});

export async function POST(request: Request) {
  const maxBytes = 192_000;
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maxBytes) {
    return Response.json(
      { error: "Request is too large. Shorten the message or reduce selected skill instructions." },
      { status: 413, headers: { "Cache-Control": "no-store" } }
    );
  }

  let raw: unknown;
  try {
    if (!request.body) throw new Error("Missing body");
    const reader = request.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    let bytes = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        return Response.json(
          { error: "Request is too large. Shorten the message or reduce selected skill instructions." },
          { status: 413, headers: { "Cache-Control": "no-store" } }
        );
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    raw = JSON.parse(text);
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: "Check the message, provider, model, or workspace context and try again." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const { result, setCookie } = await executeGatewayChat(request, parsed.data);
    const headers = new Headers({ "Content-Type": "application/json", "Cache-Control": "no-store" });
    if (setCookie) {
      headers.set("Set-Cookie", setCookie);
    }
    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (err) {
    if (err instanceof GatewayError) {
      return Response.json(
        {
          error: redactSecrets(err.message, request),
          code: err.code,
          errorKind: err.errorKind,
          requiresSignIn: err.requiresSignIn,
          resetDate: err.resetDate,
          creditsRemaining: err.creditsRemaining,
        },
        { status: err.status, headers: { "Cache-Control": "no-store" } }
      );
    }
    return Response.json({ error: "An unexpected error occurred while processing the request." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

function redactSecrets(message: string, request: Request): string {
  let safe = message;
  const requestSecrets = [
    request.headers.get("x-katalyst-provider-key"),
    request.headers.get("x-katalyst-cloudflare-account-id"),
  ].filter((value): value is string => Boolean(value));
  const environmentSecrets = Object.entries(process.env)
    .filter(([name, value]) => value && /(?:api.?key|token|secret|service.?role|account.?id)/i.test(name))
    .map(([, value]) => value!);
  for (const secret of [...requestSecrets, ...environmentSecrets]) {
    if (secret.length >= 4) safe = safe.split(secret).join("[redacted]");
  }
  return safe.replace(/(?:bearer\s+)[a-z0-9._-]{8,}/gi, "Bearer [redacted]");
}
