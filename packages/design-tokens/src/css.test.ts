import { describe, expect, it } from "vitest";
import { colorVariables, themeStylesheet, typeVariables } from "./css.ts";
import { colors } from "./tokens.ts";

describe("design tokens", () => {
  it("defines the same color tokens in light and dark", () => {
    expect(Object.keys(colors.dark).sort()).toEqual(
      Object.keys(colors.light).sort(),
    );
  });

  it("names CSS variables after the Figma variables", () => {
    expect(colorVariables("light")).toContain("--color-bg-desk: #eef0eb;");
    expect(colorVariables("dark")).toContain(
      "--color-text-on-accent: #10203a;",
    );
  });

  it("exposes text styles as CSS variables", () => {
    expect(typeVariables()).toContain("--type-display-size: 28px;");
    expect(typeVariables()).toContain("--type-body-strong-weight: 600;");
  });

  it("lets an explicit light theme override a dark system setting", () => {
    expect(themeStylesheet()).toContain(':root:not([data-theme="light"])');
    expect(themeStylesheet()).toContain(':root[data-theme="dark"]');
  });
});
