import { describe, expect, it } from "vitest";
import { makeApplicationHash, readApplicationHash } from "../src/lib/learning-navigation";

describe("learning navigation history state", () => {
  it("encodes and restores a selected lesson or the playground lesson context", () => {
    const lessonHash = makeApplicationHash("lesson", "source-to-output");
    expect(readApplicationHash(lessonHash)).toEqual({ view: "lesson", lessonId: "source-to-output" });
    const playgroundHash = makeApplicationHash("playground", "source-to-output");
    expect(readApplicationHash(playgroundHash)).toEqual({ view: "playground", lessonId: "source-to-output" });
  });

  it("ignores unknown routes, malformed identifiers, and unrelated page anchors", () => {
    expect(readApplicationHash("#main-content")).toBeNull();
    expect(readApplicationHash("#katalyst=not-a-view")).toBeNull();
    expect(readApplicationHash("#katalyst=lesson&lesson=../../settings")).toBeNull();
    expect(readApplicationHash("#katalyst=home&lesson=source-to-output")).toEqual({ view: "home" });
  });
});
