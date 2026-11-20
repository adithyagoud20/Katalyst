import { describe, expect, it } from "vitest";
import { cLabParentMessageSchema, cLabRunnerMessageSchema } from "@/lib/c-lab-runner-protocol";
import { getCLabRequestOrigin } from "@/lib/c-lab-runner-config";

describe("C runner message bounds", () => {
  const base = { version: 1 as const, token: "t".repeat(64), requestId: "request-1" };

  it("accepts bounded C runs and rejects source/stdin beyond the UTF-8 byte limits", () => {
    expect(cLabParentMessageSchema.safeParse({
      ...base,
      type: "RUN",
      language: "c",
      code: "int main(void) { return 0; }",
      stdin: "",
      closeStdin: false,
    }).success).toBe(true);

    expect(cLabParentMessageSchema.safeParse({
      ...base,
      type: "RUN",
      language: "c",
      code: "🧪".repeat(3_001),
      stdin: "",
      closeStdin: false,
    }).success).toBe(false);
    expect(cLabParentMessageSchema.safeParse({
      ...base,
      type: "INPUT",
      value: "🧪".repeat(501),
    }).success).toBe(false);
  });

  it("rejects runner output that exceeds its UTF-8 byte limit or has extra fields", () => {
    expect(cLabRunnerMessageSchema.safeParse({
      ...base,
      type: "OUTPUT",
      channel: "stdout",
      text: "🧪".repeat(16_001),
    }).success).toBe(false);
    expect(cLabRunnerMessageSchema.safeParse({
      ...base,
      type: "READY",
      extra: "ignored fields are not allowed",
    }).success).toBe(false);
  });
});

describe("C runner public request origin", () => {
  it("uses the external host and protocol forwarded by the web server", () => {
    const request = new Request("http://localhost:3000/lab-runner/c", {
      headers: { host: "internal-next:3000", "x-forwarded-host": "katalyst.example", "x-forwarded-proto": "https" },
    });
    expect(getCLabRequestOrigin(request)).toBe("https://katalyst.example");
  });

  it("falls back to the request host when forwarding headers are absent", () => {
    const request = new Request("http://localhost:3000/lab-runner/c", {
      headers: { host: "127.0.0.1:3222" },
    });
    expect(getCLabRequestOrigin(request)).toBe("http://127.0.0.1:3222");
  });
});
