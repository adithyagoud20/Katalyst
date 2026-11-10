import { z } from "zod";

export const USER_PREFERENCES_KEY = "katalyst.preferences.v1";

export type ThemePreference = "light" | "dark" | "system";
export type TextDensityPreference = "comfortable" | "compact";
export type UserPreferences = {
  version: 1;
  theme: ThemePreference;
  textDensity: TextDensityPreference;
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  version: 1,
  theme: "system",
  textDensity: "comfortable",
};

const preferencesSchema = z.object({
  version: z.literal(1),
  theme: z.enum(["light", "dark", "system"]),
  textDensity: z.enum(["comfortable", "compact"]),
}).strict();

export type UserPreferencesRead =
  | { kind: "missing"; preferences: UserPreferences }
  | { kind: "valid"; preferences: UserPreferences }
  | { kind: "corrupt"; issue: string }
  | { kind: "unsupported"; issue: string };

export function readUserPreferences(raw: string | null): UserPreferencesRead {
  if (raw === null) return { kind: "missing", preferences: DEFAULT_USER_PREFERENCES };
  if (new TextEncoder().encode(raw).byteLength > 4_000) {
    return { kind: "corrupt", issue: "Saved appearance preferences are larger than the supported limit and were left unchanged." };
  }

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { kind: "corrupt", issue: "Saved appearance preferences are not valid JSON and were left unchanged." };
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { kind: "corrupt", issue: "Saved appearance preferences have an invalid shape and were left unchanged." };
  }
  if ((value as { version?: unknown }).version !== 1) {
    return { kind: "unsupported", issue: "This appearance preference version is not supported and was left unchanged." };
  }

  const parsed = preferencesSchema.safeParse(value);
  return parsed.success
    ? { kind: "valid", preferences: parsed.data }
    : { kind: "corrupt", issue: "Saved appearance preferences have invalid values and were left unchanged." };
}

export function writeUserPreferences(storage: Pick<Storage, "setItem">, preferences: UserPreferences): void {
  const serialized = JSON.stringify(preferencesSchema.parse(preferences));
  if (new TextEncoder().encode(serialized).byteLength > 4_000) throw new Error("Appearance preferences exceeded the supported limit.");
  storage.setItem(USER_PREFERENCES_KEY, serialized);
}
