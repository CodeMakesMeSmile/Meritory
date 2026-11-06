// Mirrors the variables and text styles in the Figma prototype

export type ColorMode = "light" | "dark";

export const colors = {
  light: {
    bgDesk: "#f5f5f1",
    bgRail: "#edede8",
    bgCard: "#ffffff",
    bgSunken: "#f2f2ee",
    bgTrack: "#dcdcd5",
    textPrimary: "#191a19",
    textSecondary: "#5b5d59",
    textOnAccent: "#ffffff",
    textOnHighlight: "#191a19",
    textAccent: "#7a5c00",
    accentDefault: "#191a19",
    accentStrong: "#000000",
    borderDefault: "#191a19",
    borderSubtle: "#e2e2db",
    highlightDue: "#f2f2ee",
    highlightSoft: "#f2f2ee",
    statusDue: "#c86a00",
    statusWarning: "#8a5a00",
    statusDanger: "#d0362a",
    statusSuccess: "#2f6b45",
  },
  dark: {
    bgDesk: "#121416",
    bgRail: "#0e1012",
    bgCard: "#171a1d",
    bgSunken: "#1d2124",
    bgTrack: "#2a2f34",
    textPrimary: "#e6e7e2",
    textSecondary: "#9da19e",
    textOnAccent: "#121416",
    textOnHighlight: "#e6e7e2",
    textAccent: "#d8c3a0",
    accentDefault: "#e6e7e2",
    accentStrong: "#ffffff",
    borderDefault: "#6f767c",
    borderSubtle: "#1f2327",
    highlightDue: "#1d2124",
    highlightSoft: "#1d2124",
    statusDue: "#f0a43a",
    statusWarning: "#f0b44c",
    statusDanger: "#ff6b5e",
    statusSuccess: "#7fd19b",
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
  control: 2,
  item: 2,
  card: 0,
  full: 999,
} as const;

/** Every control is this tall, on web and phone */
export const controlHeight = 44;

export const fontFamily = {
  sans: "Host Grotesk",
  mono: "IBM Plex Mono",
} as const;

interface TextStyle {
  family: keyof typeof fontFamily;
  weight: 400 | 500 | 600;
  size: number;
  /** Null follows the font's own line height */
  lineHeight: number | null;
  letterSpacing: number;
  uppercase?: boolean;
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
  link: {
    family: "sans",
    weight: 600,
    size: 13,
    lineHeight: 24,
    letterSpacing: 0,
  },
  label: {
    family: "sans",
    weight: 600,
    size: 12,
    lineHeight: 16,
    letterSpacing: 0.06,
    uppercase: true,
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
  note: {
    family: "mono",
    weight: 400,
    size: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
  tag: {
    family: "mono",
    weight: 500,
    size: 11,
    lineHeight: null,
    letterSpacing: 0,
  },
} as const satisfies Record<string, TextStyle>;
