import { describe, expect, it } from "vitest";
import { DEFAULT_USER_PREFERENCES, readUserPreferences, USER_PREFERENCES_KEY, writeUserPreferences } from "../src/lib/user-preferences";

describe("local appearance preferences", () => {
  it("defaults to system theme and comfortable reading without inventing a stored value", () => {
    expect(readUserPreferences(null)).toEqual({ kind: "missing", preferences: DEFAULT_USER_PREFERENCES });
  });

  it("round-trips light, dark, system, and density selections under a separate key", () => {
    let key = "";
    let value = "";
    const storage = { setItem(nextKey: string, nextValue: string) { key = nextKey; value = nextValue; } };
    writeUserPreferences(storage as Storage, { version: 1, theme: "dark", textDensity: "compact" });
    expect(key).toBe(USER_PREFERENCES_KEY);
    expect(readUserPreferences(value)).toEqual({ kind: "valid", preferences: { version: 1, theme: "dark", textDensity: "compact" } });
  });

  it("preserves malformed and unsupported preference records", () => {
    expect(readUserPreferences("{").kind).toBe("corrupt");
    expect(readUserPreferences(JSON.stringify({ version: 2, theme: "dark", textDensity: "compact" })).kind).toBe("unsupported");
    expect(readUserPreferences(JSON.stringify({ version: 1, theme: "ultraviolet", textDensity: "compact" })).kind).toBe("corrupt");
  });
});
