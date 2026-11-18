import type { MetadataRoute } from "next";
import { publishedLearningCourses } from "@/data/curriculum/manifests";
import { getSiteOrigin } from "@/lib/site-origin";

const siteUrl = new URL(getSiteOrigin());

export default function sitemap(): MetadataRoute.Sitemap {
  if (process.env.VERCEL_ENV === "preview") return [];
  const paths = ["/", "/login", "/courses", "/sitemap", "/privacy", "/terms", "/account/delete", ...publishedLearningCourses.map((course) => "/courses/" + course.id)];
  return paths.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency: path === "/" || path.startsWith("/courses") ? "weekly" : "yearly",
    priority: path === "/" ? 1 : path.startsWith("/courses/") ? 0.8 : path === "/courses" ? 0.9 : 0.3,
  }));
}
