import { NextResponse } from "next/server";
import { z } from "zod";
import { getProtocolManifest, loadProtocolScenario } from "@/data/protocols/loader";

const querySchema = z.object({
  id: z.string().trim().min(1).max(64).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      id: searchParams.get("id") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { id } = parsed.data;

    // Return manifest if no ID is specified
    if (!id) {
      const manifest = await getProtocolManifest();
      return NextResponse.json(
        { protocols: manifest },
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
          },
        }
      );
    }

    const scenario = await loadProtocolScenario(id);
    if (!scenario) {
      return NextResponse.json(
        { error: `Protocol scenario '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(scenario, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error retrieving protocol",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
