export function LegalOperatorDetails() {
  const legalEntity = process.env.NEXT_PUBLIC_LEGAL_ENTITY?.trim();
  const jurisdiction = process.env.NEXT_PUBLIC_LEGAL_JURISDICTION?.trim();
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  const configured = Boolean(legalEntity && jurisdiction && supportEmail);

  return (
    <aside className="legal-operator-details" aria-label="KATALYST service contact">
      <h2>Service provider and contact</h2>
      <dl>
        <div><dt>Legal entity</dt><dd>{legalEntity || "Not configured for this deployment"}</dd></div>
        <div><dt>Jurisdiction</dt><dd>{jurisdiction || "Not configured for this deployment"}</dd></div>
        <div><dt>Contact</dt><dd>{supportEmail ? <a href={`mailto:${supportEmail}`}>{supportEmail}</a> : "No support address configured"}</dd></div>
      </dl>
      {!configured && <p role="note">The service provider&apos;s legal name, governing jurisdiction, and monitored privacy contact must be supplied before accepting public users. These details are intentionally not guessed.</p>}
    </aside>
  );
}
