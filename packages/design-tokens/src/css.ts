import { type ColorMode, colors, radius, space, textStyles } from "./tokens.ts";

const kebab = (name: string) =>
  name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/** CSS custom properties for one color mode */
export function colorVariables(mode: ColorMode): string {
  return Object.entries(colors[mode])
    .map(([name, value]) => `--color-${kebab(name)}: ${value};`)
    .join(" ");
}

/** Spacing and radius custom properties */
export function layoutVariables(): string {
  const spacing = Object.entries(space).map(
    ([step, px]) => `--space-${step}: ${px}px;`,
  );
  const radii = Object.entries(radius).map(
    ([name, px]) => `--radius-${name}: ${px}px;`,
  );
  return [...spacing, ...radii].join(" ");
}

/** Text style custom properties */
export function typeVariables(): string {
  return Object.entries(textStyles)
    .map(([name, style]) => {
      const prefix = `--type-${kebab(name)}`;
      return [
        `${prefix}-size: ${style.size}px;`,
        `${prefix}-line-height: ${style.lineHeight}px;`,
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
