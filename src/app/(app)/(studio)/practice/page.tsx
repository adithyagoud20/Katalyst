import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = createPageMetadata({ title: "Engineering Practice Lab", description: "Work through programming, electronics, data, and engineering practice exercises in KATALYST.", pathname: "/practice", index: false });

export default function PracticeRoute() {
  return null;
}
