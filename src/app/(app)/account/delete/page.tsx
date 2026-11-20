import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = createPageMetadata({ title: "Delete a KATALYST Account", description: "How to export or permanently delete a signed-in KATALYST account.", pathname: "/account/delete", index: false });

export default function DeleteAccountPage() {
  return (
    <LegalPage eyebrow="ACCOUNT" title="Export or delete your account" intro="You can export or permanently delete a signed-in KATALYST account from Account settings.">
      <section><h2>Delete a signed-in account</h2><ol><li>Open <Link href="/settings">Settings</Link>, then choose Account &amp; Profile.</li><li>Export your account data first if you want to keep a copy.</li><li>Choose “Delete account and cloud data”, type the confirmation phrase, and confirm. For safety, sign in again if your current session is older than 10 minutes.</li></ol><p>KATALYST deletes the authenticated account using its verified account ID. Account-linked records are removed by the account database&apos;s deletion rules. Copies retained in provider backups follow that provider&apos;s retention schedule. Any guest copy saved separately in this browser remains available.</p></section>
      <section><h2>Guest data</h2><p>Guest workspace and learning data lives in browser storage and is not attached to an account. Remove it by clearing site data for this Katalyst deployment in your browser settings.</p></section>
    </LegalPage>
  );
}
