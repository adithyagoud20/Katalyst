import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Geist, JetBrains_Mono } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import { getSiteOrigin } from "@/lib/site-origin";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

const siteOrigin = getSiteOrigin();
const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "KATALYST",
    url: siteOrigin,
    description: "An interactive technical learning studio across software, hardware, circuits, data, AI, and digital media.",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "KATALYST",
    url: siteOrigin,
    description: "An interactive technical learning studio for engineering topics and browser-based tools.",
    publisher: { "@type": "EducationalOrganization", name: "KATALYST", url: siteOrigin },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "KATALYST",
    url: siteOrigin,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any modern web browser",
    description: "Learn technical disciplines through structured lessons and interactive browser-based tools.",
  },
];

export const metadata: Metadata = {
  title: { default: "KATALYST — Interactive Technical Studio", template: "%s | KATALYST" },
  description: "Understand, experiment, and build with structured engineering lessons, practical tools, and a configurable AI tutor.",
  metadataBase: new URL(siteOrigin),
  applicationName: "KATALYST",
  icons: {
    icon: [{ url: "/icons/katalyst-favicon.png", type: "image/png", sizes: "64x64" }],
    apple: [{ url: "/icons/katalyst-apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
  keywords: ["technical learning", "engineering education", "embedded systems", "circuits", "programming", "databases", "AI", "digital media"],
  alternates: { canonical: "/" },
  creator: "KATALYST",
  publisher: "KATALYST",
  robots: process.env.VERCEL_ENV === "preview"
    ? { index: false, follow: false, noarchive: true }
    : { index: true, follow: true },
  openGraph: {
    type: "website",
    url: siteOrigin,
    title: "KATALYST — Interactive Technical Studio",
    description: "Learn software, hardware, circuits, data, AI, and visual media through focused lessons and interactive tools.",
    siteName: "KATALYST",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "KATALYST — Interactive Technical Studio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "KATALYST — Interactive Technical Studio",
    description: "Learn software, hardware, circuits, data, AI, and visual media through focused lessons and interactive tools.",
    images: ["/opengraph-image.png"],
  },
};

export const viewport: Viewport = {
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
};

const themeInitializer = `(function() {
  try {
    var raw = localStorage.getItem("katalyst.preferences.v1");
    var theme = "system";
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && (parsed.theme === "light" || parsed.theme === "dark" || parsed.theme === "system")) {
        theme = parsed.theme;
      }
    }
    var resolved = theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
    document.documentElement.dataset.theme = resolved;
  } catch (e) {}
})();`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en" className={`${geist.variable} ${jetBrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeInitializer }} />
        {structuredData.map((item) => <script nonce={nonce} key={item["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(item).replace(/</g, "\\u003c") }} />)}
      </head>
      <body>{children}<PwaRegister /></body>
    </html>
  );
}

