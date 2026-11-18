import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { LegalOperatorDetails } from "@/components/legal-operator-details";

export const metadata: Metadata = {
  title: "Terms — Katalyst",
  description: "Terms for using Katalyst’s engineering lessons, browser tools, and AI tutor.",
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="TERMS" title="Terms of use" intro="These terms cover your use of KATALYST's technical lessons, browser tools, account features, and optional AI tutor.">
      <section><h2>Learning content and tools</h2><p>Katalyst provides educational material, practice activities, browser-based programming tools, and an optional AI tutor. Content and generated responses are for learning and may contain errors. Verify important technical decisions before relying on them.</p></section>
      <section><h2>Your code and materials</h2><p>You are responsible for code and other material you enter. Do not use the tools to violate the rights of others, bypass security controls, or run harmful activity. Browser execution tools are provided for experimentation; review code before using it elsewhere.</p></section>
      <section><h2>AI services</h2><p>Shared Kat AI uses a Cloudflare Workers AI model selected by a KATALYST administrator and consumes the displayed Kat AI credit allowance. Shared model access is limited to Kat. You may choose BYOK and provide a personal provider credential for your own requests; provider usage, billing, terms, and privacy practices then apply directly to your provider account. AI responses can be incomplete or inaccurate and are not guaranteed to be available.</p></section>
      <section><h2>Accounts and stored data</h2><p>Guest data is stored in your browser. Before sign-in or account creation, you must actively accept the current Terms and Privacy notice. KATALYST records the versions, time, and method of acceptance with your account. Keep your own backup of information you need. Account export and deletion steps are described on the <Link href="/account/delete">account deletion page</Link>.</p></section>
      <section><h2>Availability and changes</h2><p>KATALYST may update, suspend, or remove features to maintain or improve the service. It is provided for educational use without a guarantee that every lesson, runtime, or provider connection will be available at all times.</p><LegalOperatorDetails /></section>
    </LegalPage>
  );
}
