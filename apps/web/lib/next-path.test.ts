import { describe, expect, it } from "vitest";
import { nextPath } from "./next-path.ts";

describe("nextPath", () => {
  it("keeps paths on this site", () => {
    expect(nextPath("/practice?track=dsa#top")).toBe("/practice?track=dsa#top");
  });

  it.each([
    "//evil.example",
    "/\\evil.example",
    "/\t/evil.example",
    "/..//evil.example",
    "/a/../..//evil.example",
    "https://evil.example",
    "javascript:alert(1)",
    "evil.example",
  ])("sends %j home instead of off the site", (value) => {
    expect(nextPath(value)).toBe("/");
  });

  it("ignores a missing or repeated value", () => {
    expect(nextPath(undefined)).toBe("/");
    expect(nextPath(["/a", "/b"])).toBe("/");
  });
});
