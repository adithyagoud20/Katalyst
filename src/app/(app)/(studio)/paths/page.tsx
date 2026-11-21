import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Engineering Learning Paths",
  description: "Browse KATALYST learning paths in programming, AI, databases, embedded systems, circuits, and digital media.",
  pathname: "/paths",
});

export default function PathsRoute() {
  return null;
}
