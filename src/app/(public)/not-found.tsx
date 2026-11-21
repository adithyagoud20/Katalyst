import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

export const metadata: Metadata = {
  title: "Page Not Found — KATALYST",
  description: "The requested course or lesson could not be found.",
  robots: { index: false, follow: true },
};

export default function PublicNotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <Link href="/courses" className="legal-brand"><BrandMark className="brand-mark" /><span>KATALYST</span></Link>
        <span className="not-found-code">404 / CONTENT NOT FOUND</span>
        <h1>This course page is unavailable.</h1>
        <p>The course or lesson may have moved. Browse the published catalog to continue.</p>
        <nav aria-label="Helpful destinations">
          <Link className="primary-button" href="/courses"><ArrowLeft size={15} /> Browse courses</Link>
          <Link className="secondary-button" href="/"><ArrowRight size={15} /> Learning home</Link>
        </nav>
      </div>
    </main>
  );
}
