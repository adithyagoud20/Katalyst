import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BookOpen, MonitorDown, Smartphone } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { DownloadApp } from "@/components/download-app";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata = createPageMetadata({ title: "Get the KATALYST App", description: "Install KATALYST on Android, iPhone, Windows, or Linux for a focused app experience with automatic web updates.", pathname: "/download" });

const platforms = [
  {
    name: "Android",
    icon: Smartphone,
    steps: ["Open this page in Chrome.", "Tap Install KATALYST, or open the browser menu and choose Install app."],
    detail: "Updates arrive through the web app when you are online.",
  },
  {
    name: "Windows",
    icon: MonitorDown,
    steps: ["Open this page in Chrome or Edge.", "Use the install icon in the address bar or choose Install KATALYST from the browser menu."],
    detail: "The installed web app updates from the KATALYST site when you are online.",
  },
  {
    name: "Linux",
    icon: MonitorDown,
    steps: ["Open this page in Chrome or Edge.", "Choose Install KATALYST from the browser menu."],
    detail: "No separate compiler setup; supported tools run in the browser.",
  },
  {
    name: "iPhone & iPad",
    icon: Smartphone,
    steps: ["Open this page in Safari.", "Tap Share, then Add to Home Screen."],
    detail: "Apple devices install web apps from Safari’s Share menu.",
  },
];

export default function DownloadPage() {
  return (
    <main className="download-page">
      <header className="download-header">
        <Link className="download-brand" href="/"><BrandMark label="KATALYST" /><span>KATALYST</span></Link>
        <Link className="download-back" href="/"><ArrowLeft size={15} /> Back to learning</Link>
      </header>

      <section className="download-hero" aria-labelledby="download-title">
        <div className="download-hero-copy">
          <span className="eyebrow">KATALYST · WEB APP</span>
          <h1 id="download-title">Your studio, one tap away.</h1>
          <p>Install KATALYST for a focused, app-like workspace. Lessons, browser-based tools, and your local drafts stay connected to the same site.</p>
          <DownloadApp />
          <div className="download-benefits">
            <span><ArrowUpRight size={14} /> Free web updates</span>
            <span><BookOpen size={14} /> Works with guest access</span>
          </div>
        </div>
        <div className="download-mark-stage" aria-hidden="true"><BrandMark className="download-mark-large" /></div>
      </section>

      <section className="download-platforms" aria-labelledby="platforms-title">
        <div className="download-section-heading">
          <span className="eyebrow">INSTALL GUIDE</span>
          <h2 id="platforms-title">Choose your device</h2>
          <p>KATALYST installs from your browser. You do not need to download a separate compiler to use the supported browser tools.</p>
        </div>
        <div className="download-platform-grid">
          {platforms.map(({ name, icon: Icon, steps, detail }) => (
            <article className="download-platform-card" key={name}>
              <div className="download-platform-title"><span><Icon size={17} /></span><h3>{name}</h3></div>
              <ol>{steps.map((step) => <li key={step}>{step}</li>)}</ol>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </section>
      <footer className="download-footer"><span>Updates install automatically after KATALYST is reopened online.</span><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></footer>
    </main>
  );
}
