import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-origin";

export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === "preview") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/paths", "/courses/", "/privacy", "/terms"],
      disallow: [
        "/api/",
        "/lab-runner/",
        "/auth/",
        "/account/",
        "/delete-account",
        "/login",
        "/signin",
        "/playground",
        "/practice",
        "/tutor",
        "/workspace",
        "/skills",
        "/progress",
        "/settings",
        "/my-learning",
      ],
    },
    sitemap: new URL("/sitemap.xml", getSiteOrigin()).toString(),
  };
}
