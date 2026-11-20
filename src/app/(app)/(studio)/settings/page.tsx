import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = createPageMetadata({ title: "Settings", description: "Manage KATALYST account, appearance, AI provider, learning, and workspace preferences.", pathname: "/settings", index: false });

export default function SettingsRoute() {
  return null;
}
