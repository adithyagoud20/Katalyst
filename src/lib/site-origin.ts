function verifiedVercelOrigin(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    if (url.protocol !== "https:"
      || !url.hostname.toLowerCase().endsWith(".vercel.app")
      || url.username
      || url.password
      || (url.pathname !== "/" && url.pathname !== "")
      || url.search
      || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** Keep canonical URLs on the Vercel project host; an explicit .vercel.app origin takes precedence. */
export function getSiteOrigin(): string {
  const configured = verifiedVercelOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  if (configured) return configured;

  const productionAlias = verifiedVercelOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (productionAlias) return productionAlias;

  if (process.env.VERCEL === "1" && process.env.VERCEL_ENV === "preview") {
    const deploymentAlias = verifiedVercelOrigin(process.env.VERCEL_URL);
    if (deploymentAlias) return deploymentAlias;
  }

  if (process.env.VERCEL === "1") {
    throw new Error("Set NEXT_PUBLIC_SITE_URL to the production .vercel.app origin, or remove the custom production domain so Vercel selects its project alias.");
  }

  return "http://127.0.0.1:3000";
}
