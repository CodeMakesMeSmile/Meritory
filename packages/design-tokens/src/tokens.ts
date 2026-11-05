// Mirrors the variables and text styles in the Figma prototype

export const primitives = {
  sage50: "#f5f7f3",
  sage100: "#eef0eb",
  sage150: "#e6e9e3",
  sage200: "#dfe3dd",
  sage250: "#d6dbd4",
  sage300: "#cdd3cc",
  sage500: "#5a625c",
  sage900: "#1f2421",
  white: "#ffffff",
  ink990: "#101311",
  ink950: "#141715",
  ink900: "#1b1f1c",
  ink850: "#222724",
  ink800: "#2a302c",
  ink700: "#3a413c",
  ink300: "#a7afa9",
  ink100: "#e7eae5",
  navy200: "#bfd0ea",
  navy300: "#9db3d6",
  navy500: "#27466f",
  navy600: "#1e3757",
  navy950: "#10203a",
  highlight100: "#f6f0c8",
  highlight400: "#f5df5b",
  highlight800: "#6b5d17",
  highlight900: "#3a3518",
  amber300: "#e3b65c",
  amber700: "#8a5a00",
  red300: "#e58c7e",
  red700: "#a3372a",
  green300: "#8cc5a0",
  green700: "#2f6b45",
} as const;

const p = primitives;

export type ColorMode = "light" | "dark";

export const colors = {
  light: {
    bgDesk: p.sage100,
    bgRail: p.sage150,
    bgCard: p.white,
    bgSunken: p.sage50,
    bgTrack: p.sage250,
    textPrimary: p.sage900,
    textSecondary: p.sage500,
    textOnAccent: p.white,
    textAccent: p.navy500,
    accentDefault: p.navy500,
    accentStrong: p.navy600,
    borderDefault: p.sage300,
    borderSubtle: p.sage200,
    highlightDue: p.highlight400,
    highlightSoft: p.highlight100,
    statusWarning: p.amber700,
    statusDanger: p.red700,
    statusSuccess: p.green700,
  },
  dark: {
    bgDesk: p.ink950,
    bgRail: p.ink990,
    bgCard: p.ink900,
    bgSunken: p.ink850,
    bgTrack: p.ink800,
    textPrimary: p.ink100,
    textSecondary: p.ink300,
    textOnAccent: p.navy950,
    textAccent: p.navy300,
    accentDefault: p.navy300,
    accentStrong: p.navy200,
    borderDefault: p.ink700,
    borderSubtle: p.ink800,
    highlightDue: p.highlight800,
    highlightSoft: p.highlight900,
    statusWarning: p.amber300,
    statusDanger: p.red300,
    statusSuccess: p.green300,
  },
} as const satisfies Record<ColorMode, Record<string, string>>;

export type ColorToken = keyof (typeof colors)["light"];

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
} as const;

export const radius = {
  control: 8,
  item: 10,
  card: 14,
  full: 999,
} as const;

export const fontFamily = {
  sans: "Host Grotesk",
  mono: "IBM Plex Mono",
} as const;

interface TextStyle {
  family: keyof typeof fontFamily;
  weight: 400 | 600;
  size: number;
  lineHeight: number;
  letterSpacing: number;
}

export const textStyles = {
  display: {
    family: "sans",
    weight: 600,
    size: 28,
    lineHeight: 34,
    letterSpacing: -0.01,
  },
  heading2: {
    family: "sans",
    weight: 600,
    size: 20,
    lineHeight: 26,
    letterSpacing: -0.005,
  },
  heading3: {
    family: "sans",
    weight: 600,
    size: 16,
    lineHeight: 22,
    letterSpacing: 0,
  },
  prompt: {
    family: "sans",
    weight: 400,
    size: 19,
    lineHeight: 28,
    letterSpacing: 0,
  },
  body: {
    family: "sans",
    weight: 400,
    size: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodyStrong: {
    family: "sans",
    weight: 600,
    size: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  small: {
    family: "sans",
    weight: 400,
    size: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  smallStrong: {
    family: "sans",
    weight: 600,
    size: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  label: {
    family: "sans",
    weight: 600,
    size: 12,
    lineHeight: 16,
    letterSpacing: 0.06,
  },
  code: {
    family: "mono",
    weight: 400,
    size: 13,
    lineHeight: 20,
    letterSpacing: 0,
  },
  numeric: {
    family: "mono",
    weight: 400,
    size: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
} as const satisfies Record<string, TextStyle>;
