import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Katalyst — Engineering learning studio",
  description: "Understand, experiment, and build with structured engineering lessons, practical tools, and a configurable AI tutor.",
};

export const viewport: Viewport = { themeColor: "#f5f1e8" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
