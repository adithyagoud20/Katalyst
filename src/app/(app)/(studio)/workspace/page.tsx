import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = createPageMetadata({ title: "AI Workspace", description: "Work with projects and conversations in your private KATALYST workspace.", pathname: "/workspace", index: false });

export default function WorkspaceRoute() {
  return null;
}
