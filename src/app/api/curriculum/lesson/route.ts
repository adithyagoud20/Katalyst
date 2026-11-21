import { NextResponse } from "next/server";
import { z } from "zod";
import { loadCourseDetail } from "@/data/curriculum/course-loader";

const lessonQuerySchema = z.object({
  courseId: z.string().trim().min(1, "courseId is required"),
  lessonId: z.string().trim().min(1, "lessonId is required"),
  mode: z.literal("lesson").default("lesson"),
});

const exercisesQuerySchema = z.object({
  courseId: z.string().trim().min(1, "courseId is required"),
  lessonId: z.string().trim().min(1).optional(),
  mode: z.literal("exercises"),
});

const querySchema = z.discriminatedUnion("mode", [
  lessonQuerySchema,
  exercisesQuerySchema,
]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      courseId: searchParams.get("courseId") ?? undefined,
      lessonId: searchParams.get("lessonId") ?? undefined,
      mode: searchParams.get("mode") ?? "lesson",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { courseId, lessonId, mode } = parsed.data;
    const course = await loadCourseDetail(courseId);
    if (mode === "exercises") {
      if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
      return NextResponse.json({
        exercises: course.modules.flatMap((module) => module.lessons.map((lesson) => ({ lessonId: lesson.id, exercise: lesson.exercise }))),
      }, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
    }
    if (!lessonId) return NextResponse.json({ error: "lessonId is required" }, { status: 400 });
    const lesson = course?.modules.flatMap((module) => module.lessons).find((item) => item.id === lessonId);

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
