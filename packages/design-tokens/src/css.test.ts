import { describe, expect, it } from "vitest";
import {
  colorVariables,
  layoutVariables,
  themeStylesheet,
  typeVariables,
} from "./css.ts";
import { colors } from "./tokens.ts";

describe("design tokens", () => {
  it("defines the same color tokens in light and dark", () => {
    expect(Object.keys(colors.dark).sort()).toEqual(
      Object.keys(colors.light).sort(),
    );
  });

  it("names CSS variables after the Figma variables", () => {
    expect(colorVariables("light")).toContain("--color-bg-desk: #f5f5f1;");
    expect(colorVariables("light")).toContain("--color-text-accent: #7a5c00;");
    expect(colorVariables("dark")).toContain(
      "--color-text-on-accent: #121416;",
    );
  });

  it("uses ink for the accent, not a brand color", () => {
    expect(colors.light.accentDefault).toBe(colors.light.textPrimary);
    expect(colors.dark.accentDefault).toBe(colors.dark.textPrimary);
  });

  it("keeps cards square and controls 44px tall", () => {
    expect(layoutVariables()).toContain("--radius-card: 0px;");
    expect(layoutVariables()).toContain("--radius-control: 2px;");
    expect(layoutVariables()).toContain("--control-height: 44px;");
  });

  it("exposes text styles as CSS variables", () => {
    expect(typeVariables()).toContain("--type-display-size: 28px;");
    expect(typeVariables()).toContain("--type-body-strong-weight: 600;");
    expect(typeVariables()).toContain("--type-link-line-height: 24px;");
    expect(typeVariables()).toContain("--type-tag-weight: 500;");
    expect(typeVariables()).toContain("--type-tag-line-height: normal;");
  });

  it("lets an explicit light theme override a dark system setting", () => {
    expect(themeStylesheet()).toContain(':root:not([data-theme="light"])');
    expect(themeStylesheet()).toContain(':root[data-theme="dark"]');
  });
});
