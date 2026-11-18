import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main className="legal-page">
      <div className="legal-page-shell">
        <header className="legal-page-header">
          <Link href="/" className="legal-brand" aria-label="Katalyst home">
            <BrandMark className="brand-mark" />
            <span>Katalyst</span>
          </Link>
          <Link className="legal-back-link" href="/">Back to the app</Link>
        </header>
        <article className="legal-content">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p className="legal-intro">{intro}</p>
          <div className="legal-prose">{children}</div>
        </article>
        <footer className="legal-footer">
          <span>© {new Date().getFullYear()} Katalyst</span>
          <nav aria-label="Legal">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/account/delete">Account deletion</Link>
            <Link href="/sitemap">Sitemap</Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}
