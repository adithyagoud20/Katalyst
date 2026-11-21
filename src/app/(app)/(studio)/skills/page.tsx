import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = createPageMetadata({ title: "Engineering Skills Library", description: "Explore reusable engineering guides and learning skills in the KATALYST studio.", pathname: "/skills", index: false });

export default function SkillsRoute() {
  return null;
}
