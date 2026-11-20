import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = createPageMetadata({ title: "My Learning", description: "Review your locally saved KATALYST course enrollments and continue your lessons.", pathname: "/my-learning", index: false });

export default function MyLearningRoute() {
  return null;
}
