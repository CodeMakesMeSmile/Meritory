const ORIGIN = "https://meritory.invalid";

/** Where to go after signing in. Only paths on this site are allowed. */
export function nextPath(value: string | string[] | undefined): string {
  if (typeof value !== "string" || !value.startsWith("/")) return "/";
  // URL reads "//host", "/\host", and hidden tabs the same way browsers do
  const url = new URL(value, ORIGIN);
  const path = `${url.pathname}${url.search}${url.hash}`;
  // "/..//host" only becomes "//host" once the dots are resolved
  return url.origin === ORIGIN && !path.startsWith("//") ? path : "/";
}
