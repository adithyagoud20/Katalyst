import type { MetadataRoute } from "next";
import { publishedCourseSummaries, publishedLessonRouteParams } from "@/data/curriculum/course-summaries";
import { getSiteOrigin } from "@/lib/site-origin";

const siteUrl = new URL(getSiteOrigin());

export default function sitemap(): MetadataRoute.Sitemap {
  if (process.env.VERCEL_ENV === "preview") return [];
  const lastModified = new Date();
  const publicPaths = ["/", "/paths", "/courses", "/sitemap", "/privacy", "/terms", "/download"];
  const entries: MetadataRoute.Sitemap = publicPaths.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified,
    changeFrequency: path === "/" || path === "/paths" || path.startsWith("/courses") ? "weekly" : "yearly",
    priority: path === "/" ? 1 : path === "/courses" ? 0.9 : path.startsWith("/courses/") ? 0.8 : 0.3,
  }));
  for (const course of publishedCourseSummaries) {
    entries.push({
      url: new URL(`/courses/${course.slug}`, siteUrl).toString(),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }
  for (const lesson of publishedLessonRouteParams) {
    entries.push({
      url: new URL(`/courses/${lesson.courseId}/${lesson.lessonSlug}`, siteUrl).toString(),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }
  return entries;
}
