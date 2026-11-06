import {
  type ColorMode,
  colors,
  controlHeight,
  radius,
  space,
  textStyles,
} from "./tokens.ts";

const kebab = (name: string) =>
  name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/** CSS custom properties for one color mode */
export function colorVariables(mode: ColorMode): string {
  return Object.entries(colors[mode])
    .map(([name, value]) => `--color-${kebab(name)}: ${value};`)
    .join(" ");
}

/** Spacing, radius, control, and focus ring custom properties */
export function layoutVariables(): string {
  const spacing = Object.entries(space).map(
    ([step, px]) => `--space-${step}: ${px}px;`,
  );
  const radii = Object.entries(radius).map(
    ([name, px]) => `--radius-${name}: ${px}px;`,
  );
  return [
    ...spacing,
    ...radii,
    `--control-height: ${controlHeight}px;`,
    // A gap in the surface color, then an ink ring. The only shadow allowed.
    "--focus-ring: 0 0 0 2px var(--color-bg-card), 0 0 0 4px var(--color-accent-default);",
  ].join(" ");
}

/** Text style custom properties */
export function typeVariables(): string {
  return Object.entries(textStyles)
    .map(([name, style]) => {
      const prefix = `--type-${kebab(name)}`;
      const lineHeight =
        style.lineHeight === null ? "normal" : `${style.lineHeight}px`;
      return [
        `${prefix}-size: ${style.size}px;`,
        `${prefix}-line-height: ${lineHeight};`,
        `${prefix}-letter-spacing: ${style.letterSpacing}em;`,
        `${prefix}-weight: ${style.weight};`,
      ].join(" ");
    })
    .join(" ");
}

/**
 * A stylesheet with light values on :root and dark values for both the
 * system setting and an explicit dark theme
 */
export function themeStylesheet(): string {
  const light = colorVariables("light");
  const dark = colorVariables("dark");
  return [
    `:root { ${layoutVariables()} ${typeVariables()} ${light} color-scheme: light; }`,
    `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ${dark} color-scheme: dark; } }`,
    `:root[data-theme="dark"] { ${dark} color-scheme: dark; }`,
  ].join("\n");
}
