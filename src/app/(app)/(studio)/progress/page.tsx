import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = createPageMetadata({ title: "Learning Progress", description: "Review course completion, exercise activity, and learning streaks saved in this browser.", pathname: "/progress", index: false });

export default function ProgressRoute() {
  return null;
}
