import { describe, expect, it } from "vitest";
import { passwordInputType, safeLoginDestination } from "@/lib/login-utils";

describe("login navigation and password control helpers", () => {
  it("keeps valid same-origin return routes and their query and hash", () => {
    expect(safeLoginDestination("/courses/c-programming?from=lesson#overview", "https://katalyst.example")).toBe("/courses/c-programming?from=lesson#overview");
    expect(safeLoginDestination("/", "https://katalyst.example")).toBe("/");
  });

  it.each([
    "https://attacker.example/",
    "//attacker.example/",
    "/\\attacker.example/",
    "javascript:alert(1)",
    "courses/c-programming",
  ])("rejects unsafe or non-local login destinations: %s", (destination) => {
    expect(safeLoginDestination(destination, "https://katalyst.example")).toBe("/");
  });

  it("selects the correct password input type", () => {
    expect(passwordInputType(false)).toBe("password");
    expect(passwordInputType(true)).toBe("text");
  });
});
