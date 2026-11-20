import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = createPageMetadata({ title: "Browser Code Playground", description: "Write and run C, C++, Python, JavaScript, SQL, HTML, and circuit examples in the KATALYST browser playground.", pathname: "/playground", index: false });

export default function PlaygroundRoute() {
  return null;
}
