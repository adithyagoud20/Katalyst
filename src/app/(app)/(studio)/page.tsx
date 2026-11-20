import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Interactive Engineering Learning Studio",
  description: "Learn programming, hardware, circuits, data, and AI through structured lessons and browser-based engineering tools.",
  pathname: "/",
});

export default function HomeRoute() {
  return null;
}
