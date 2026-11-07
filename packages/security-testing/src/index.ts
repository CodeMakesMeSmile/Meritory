/** Tries to change a query's meaning if it were joined into SQL */
export const SQL_ATTACKS = [
  "' OR '1'='1",
  "' OR 1=1 --",
  "'; DROP TABLE users; --",
  '" OR ""="',
  "1; SELECT pg_sleep(5)",
  "admin'/*",
  "\\'; --",
  "' UNION SELECT id, email FROM users --",
  // Wildcards that would match everything in a like pattern
  "%",
  "_",
] as const;

/** Tries to run script if it were put into a page as HTML */
export const HTML_ATTACKS = [
  "<script>alert(1)</script>",
  "<img src=x onerror=alert(1)>",
  '"><svg onload=alert(1)>',
  "'><script>alert(1)</script>",
  "</style><script>alert(1)</script>",
  "<a href=javascript:alert(1)>x</a>",
  "&lt;script&gt;alert(1)&lt;/script&gt;",
] as const;

/** Tries to leave the site or run script if used as a link or header */
export const URL_ATTACKS = [
  "javascript:alert(1)",
  "JaVaScRiPt:alert(1)",
  "data:text/html,<script>alert(1)</script>",
  "//evil.example",
  "/\\evil.example",
  "https://evil.example",
  "x%0d%0aSet-Cookie:%20session=stolen",
] as const;

/** Characters no name or label needs, which databases and email headers mishandle */
export const CONTROL_ATTACKS = [
  "a\u0000b",
  "a\r\nBcc: someone@evil.example",
  "a\u001b[31mb",
  "a\u007fb",
] as const;

/** Every attack string, for fields that take free text */
export const ATTACKS = [...SQL_ATTACKS, ...HTML_ATTACKS, ...URL_ATTACKS];

/** Valid email addresses that carry SQL, so they get past format checks */
export const EMAIL_ATTACKS = [
  "o'reilly'--@meritory.test",
  "x'+or+'1@meritory.test",
  "admin'--@meritory.test",
  "_@meritory.test",
] as const;

/** How React writes text into HTML, so tests can look for the safe form */
export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;");
}
