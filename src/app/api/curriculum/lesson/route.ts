import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerLesson } from "@/data/curriculum/server-catalog";

const querySchema = z.object({
  courseId: z.string().trim().min(1, "courseId is required"),
  lessonId: z.string().trim().min(1, "lessonId is required"),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      courseId: searchParams.get("courseId"),
      lessonId: searchParams.get("lessonId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { courseId, lessonId } = parsed.data;
    const lesson = getServerLesson(courseId, lessonId);

    if (!lesson) {
      return NextResponse.json(
        { error: `Lesson '${lessonId}' not found in course '${courseId}'` },
        { status: 404 }
      );
    }

    return NextResponse.json(lesson, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error retrieving lesson",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
