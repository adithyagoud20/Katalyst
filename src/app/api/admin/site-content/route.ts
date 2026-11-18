import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { sameOriginMutation } from "@/lib/account-server";
import { recordAdminAuditLog, requireAdminUser } from "@/lib/ai-gateway/admin";
import { siteContentSchema } from "@/lib/site-content-schema";
import { readSiteContent, writeSiteContent } from "@/lib/site-content-service";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16_384;

async function readBoundedJson(request: NextRequest): Promise<{ ok: true; body: unknown } | { ok: false; status: 400 | 413 | 415 }> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) return { ok: false, status: 415 };
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) return { ok: false, status: 413 };

  const reader = request.body?.getReader();
  if (!reader) return { ok: false, status: 400 };
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > MAX_BODY_BYTES) {
        await reader.cancel();
        return { ok: false, status: 413 };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400 };
  } finally {
    reader.releaseLock();
  }

  try {
    const bytes = new Uint8Array(byteLength);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { ok: true, body: JSON.parse(new TextDecoder().decode(bytes)) as unknown };
  } catch {
    return { ok: false, status: 400 };
  }
}

export async function GET() {
  const adminAuth = await requireAdminUser();
  if (!adminAuth.ok) return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.status, headers: { "Cache-Control": "no-store" } });
  try {
    return NextResponse.json({ content: await readSiteContent() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Site content storage is unavailable. Apply the site-content migration and check server credentials." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function PUT(request: NextRequest) {
  if (!sameOriginMutation(request)) {
    return NextResponse.json({ error: "This change must come from the KATALYST site." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  const adminAuth = await requireAdminUser();
  if (!adminAuth.ok) return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.status, headers: { "Cache-Control": "no-store" } });

  const decoded = await readBoundedJson(request);
  if (!decoded.ok) {
    const error = decoded.status === 413 ? "Site content is too large." : decoded.status === 415 ? "Send site content as JSON." : "Invalid JSON payload.";
    return NextResponse.json({ error }, { status: decoded.status, headers: { "Cache-Control": "no-store" } });
  }
  const parsed = siteContentSchema.safeParse(decoded.body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Review the content, public HTTPS URLs, and schedule fields.", issues: parsed.error.issues }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const previous = await readSiteContent();
    const content = await writeSiteContent(parsed.data, adminAuth.user.id);
    const auditLogged = await recordAdminAuditLog({
      actorId: adminAuth.user.id,
      actorEmail: adminAuth.user.email || "admin",
      action: "update_public_site_content",
      previousState: previous as unknown as Record<string, unknown>,
      newState: content as unknown as Record<string, unknown>,
      ipAddress: null,
    });
    return NextResponse.json({ success: true, auditLogged, content }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Site content could not be saved. Check the database migration and try again." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
