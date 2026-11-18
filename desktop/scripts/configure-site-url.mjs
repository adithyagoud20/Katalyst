import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configured = process.env.KATALYST_APP_URL?.trim();
const configuredSupabase = (process.env.KATALYST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim();
if (!configured) {
  console.error("Set KATALYST_APP_URL to the production HTTPS .vercel.app origin before packaging the desktop app.");
  process.exit(1);
}

let url;
try {
  url = new URL(configured);
} catch {
  console.error("KATALYST_APP_URL must be a valid HTTPS .vercel.app origin.");
  process.exit(1);
}

if (url.protocol !== "https:"
  || !url.hostname.toLowerCase().endsWith(".vercel.app")
  || url.username
  || url.password
  || url.pathname !== "/"
  || url.search
  || url.hash) {
  console.error("KATALYST_APP_URL must be the production HTTPS .vercel.app origin with no path, credentials, query, or fragment.");
  process.exit(1);
}

let supabaseUrl;
try {
  supabaseUrl = new URL(configuredSupabase);
} catch {
  console.error("Set KATALYST_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) to the HTTPS origin of the Supabase project used by the site.");
  process.exit(1);
}
if (supabaseUrl.protocol !== "https:"
  || !supabaseUrl.hostname.toLowerCase().endsWith(".supabase.co")
  || supabaseUrl.username
  || supabaseUrl.password
  || supabaseUrl.pathname !== "/"
  || supabaseUrl.search
  || supabaseUrl.hash) {
  console.error("KATALYST_SUPABASE_URL must be an exact HTTPS *.supabase.co origin.");
  process.exit(1);
}

writeFileSync(path.join(directory, "site-config.json"), `${JSON.stringify({ siteUrl: url.origin, supabaseOrigin: supabaseUrl.origin }, null, 2)}\n`, { mode: 0o600 });
console.log("Desktop wrapper configured for the production Vercel origin.");
