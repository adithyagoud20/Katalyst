/**
 * Remove only old, standalone credential entries. KATALYST's versioned records
 * are intentionally left untouched so their schemas and recovery paths remain
 * stable.
 */
export function purgeLegacyStandaloneCredentials(storage: Pick<Storage, "length" | "key" | "removeItem">): string[] {
  const legacyCredentialNames = [
    ["cloudflare", "api", "token"],
    ["cloudflare", "account", "id"],
    ["supabase", "service", "role", "key"],
    ["guest", "session", "secret"],
    ["openai", "api", "key"],
    ["gemini", "api", "key"],
    ["openrouter", "api", "key"],
  ].map((parts) => parts.join(""));
  const removed: string[] = [];

  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);
    if (!key || key.startsWith("katalyst.")) continue;
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!legacyCredentialNames.includes(normalized)) continue;
    storage.removeItem(key);
    removed.push(key);
  }

  return removed;
}
