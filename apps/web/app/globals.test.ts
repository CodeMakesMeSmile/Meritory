import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

describe("global styles", () => {
  it("gives open dropdown lists the card behind the ink, so dark mode stays readable", () => {
    const rule = css.match(/select,\s*option\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(rule).toContain("background-color: var(--color-bg-card)");
    expect(rule).toContain("color: var(--color-text-primary)");
  });
});
