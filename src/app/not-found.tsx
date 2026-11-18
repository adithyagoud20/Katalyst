import Link from "next/link";
import { ArrowLeft, ArrowRight, Terminal } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <Link href="/" className="legal-brand"><BrandMark className="brand-mark" /><span>KATALYST</span></Link>
        <span className="not-found-code">404 / ROUTE NOT FOUND</span>
        <h1>This route is outside the map.</h1>
        <p>The link may be outdated or the page may have moved. Return to the studio or choose a place to continue.</p>
        <nav aria-label="Helpful destinations">
          <Link className="primary-button" href="/#katalyst=home"><ArrowLeft size={15} /> Back to Learning Home</Link>
          <Link className="secondary-button" href="/courses">Explore courses <ArrowRight size={15} /></Link>
          <Link className="secondary-button" href="/#katalyst=playground"><Terminal size={15} /> Open Playground</Link>
        </nav>
      </div>
    </main>
  );
}
