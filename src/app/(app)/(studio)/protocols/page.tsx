import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Interactive Protocol & Network Explorer",
  description: "Explore real-world network protocols on the wire with animated topology maps, Wireshark sequence diagrams, and byte-level packet inspectors.",
  pathname: "/protocols",
  index: false,
});

export default function ProtocolsRoute() {
  return null;
}
