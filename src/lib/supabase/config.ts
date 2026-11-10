export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key || /your[-_ ]?project/i.test(url) || /^your[-_ ]?(?:publishable[-_ ]?)?key(?:[-_ ]?here)?$/i.test(key)) return null;
  try {
    const parsed = new URL(url);
    const local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "[::1]";
    if ((parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) || parsed.username || parsed.password) return null;
    return { url: parsed.origin, key };
  } catch {
    return null;
  }
}
