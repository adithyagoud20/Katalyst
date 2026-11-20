"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { makeApplicationPathFromLessonRoutes, readApplicationHash } from "@/lib/learning-navigation";

export function LegacyHashRedirect() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const redirectLegacyLocation = async () => {
      const hash = window.location.hash;
      const legacyLocation = readApplicationHash(hash);
      if (!legacyLocation) return;

      const routes = legacyLocation.view === "lesson"
        ? (await import("@/data/curriculum/course-summaries")).publishedLessonRouteParams
        : [];
      if (cancelled) return;

      const destination = makeApplicationPathFromLessonRoutes(hash, routes);
      if (destination) router.replace(destination, { scroll: false });
    };

    void redirectLegacyLocation();
    window.addEventListener("hashchange", redirectLegacyLocation);
    return () => {
      cancelled = true;
      window.removeEventListener("hashchange", redirectLegacyLocation);
    };
  }, [router]);

  return null;
}
