import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = createPageMetadata({ title: "Kat AI Tutor", description: "Ask the KATALYST tutor for help with lessons, engineering questions, and code.", pathname: "/tutor", index: false });

export default function TutorRoute() {
  return null;
}
