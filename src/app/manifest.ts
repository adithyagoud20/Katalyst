import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "KATALYST — Interactive Learning Studio",
    short_name: "KATALYST",
    description: "A browser-first studio for lessons and practical exploration across software, hardware, circuits, data, AI, and creative technology.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    categories: ["education", "developer", "utilities"],
    icons: [
      { src: "/icons/katalyst-favicon.png", sizes: "64x64", type: "image/png", purpose: "any" },
      { src: "/icons/katalyst-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/katalyst-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/katalyst-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
