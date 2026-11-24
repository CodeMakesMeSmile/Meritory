// The theme lives in a cookie, so the server paints the right one on the first frame

export type Theme = "system" | "light" | "dark";

export const THEME_COOKIE = "meritory.theme";

const YEAR_SECONDS = 365 * 24 * 60 * 60;

/** A cookie value as a theme, with anything else meaning Match system */
export function readTheme(value: string | undefined): Theme {
  return value === "light" || value === "dark" ? value : "system";
}

/** Saves the pick for this browser and repaints now */
export function setTheme(theme: Theme) {
  // biome-ignore lint/suspicious/noDocumentCookie: cookieStore is missing from Safari before 18.4, and this cookie only holds a theme name
  document.cookie =
    theme === "system"
      ? `${THEME_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
      : `${THEME_COOKIE}=${theme}; Path=/; Max-Age=${YEAR_SECONDS}; SameSite=Lax`;
  if (theme === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}

/** What this browser picked, read from the cookie */
export function currentTheme(): Theme {
  const match = /(?:^|;\s*)meritory\.theme=([^;]*)/.exec(document.cookie);
  return readTheme(match?.[1]);
}
