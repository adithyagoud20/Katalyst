import { z } from "zod";
import { executeGatewayChat, GatewayError } from "@/lib/ai-gateway/gateway";

const messageSchema = z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(8_000) });
const requestSchema = z.object({
  provider: z.string().min(1).max(64),
  model: z.string().min(1).max(240),
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
      { status: 413 }
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
          { status: 413 }
        );
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    raw = JSON.parse(text);
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: "Check the message, provider, model, or workspace context and try again." }, { status: 400 });
  }

  try {
    const { result, setCookie } = await executeGatewayChat(request, parsed.data);
    const headers = new Headers({ "Content-Type": "application/json" });
    if (setCookie) {
      headers.set("Set-Cookie", setCookie);
    }
    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (err) {
    if (err instanceof GatewayError) {
      return Response.json(
        {
          error: err.message,
          code: err.code,
          errorKind: err.errorKind,
          requiresSignIn: err.requiresSignIn,
          resetDate: err.resetDate,
          creditsRemaining: err.creditsRemaining,
        },
        { status: err.status }
      );
    }
    return Response.json({ error: "An unexpected error occurred while processing the request." }, { status: 500 });
  }
}
