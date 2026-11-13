import { describe, expect, it } from "vitest";
import { GET } from "../src/app/api/curriculum/lesson/route";

describe("GET /api/curriculum/lesson API", () => {
  it("returns 200 with full LearningLessonDetail and cache headers for valid IDs", async () => {
    const request = new Request("http://localhost:3000/api/curriculum/lesson?courseId=c-programming-foundations&lessonId=source-to-output");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("public");
    expect(response.headers.get("Cache-Control")).toContain("max-age=3600");

    const data = await response.json();
    expect(data.id).toBe("source-to-output");
    expect(data.title).toBe("From source code to output");
    expect(data.content).toContain("#include <stdio.h>");
    expect(data.exercise).toBeDefined();
    expect(data.checkpoint).toBeDefined();
  });

  it("returns 400 when courseId or lessonId query params are missing", async () => {
    const request = new Request("http://localhost:3000/api/curriculum/lesson?courseId=c-programming-foundations");
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid query parameters");
  });

  it("returns 404 for unknown course or lesson", async () => {
    const request = new Request("http://localhost:3000/api/curriculum/lesson?courseId=c-programming-foundations&lessonId=non-existent-lesson");
    const response = await GET(request);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain("not found");
  });
});
