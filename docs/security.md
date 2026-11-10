# Secure coding

Every change follows these rules. CI enforces what a tool can catch, and the pull request checklist covers the rest. To report a vulnerability, see [SECURITY.md](../SECURITY.md).

Untrusted data is anything the code didn't create itself: form fields, URL parameters, headers, cookies, rows people wrote, emails, and responses from other services.

## Rules

### 1. Let React escape output

React escapes every value it renders as text or as an attribute. Keep it that way.

- No `dangerouslySetInnerHTML`, `innerHTML`, or `document.write`. If people ever need to write HTML, sanitize it with DOMPurify first.
- No `eval`, `new Function`, or strings passed to `setTimeout` or `setInterval`.
- No `javascript:` URLs. A URL from outside goes into `href` or `src` only after it's checked against the schemes and hosts we allow.
- Build query strings with `URLSearchParams` or `encodeURIComponent`, never by joining strings.
- Don't put untrusted data into `<script>`, `<style>`, inline style strings, or event handler attributes.
- Emails are plain text. If HTML emails arrive, every value in them gets HTML-encoded.

### 2. Bind every SQL value

- Use Drizzle's query builder, or the `sql` template, which turns each `${value}` into a bound parameter.
- Never use `sql.raw()` or a driver's `unsafe()` with anything from outside. Lint fails on both.
- Table names, column names, and sort order come from a fixed map in code. User input picks a key, never the text.
- Escape `%` and `_` before putting user text into a `like` pattern.
- The app's database account gets only the privileges it needs.

### 3. Validate input where it arrives

- Every API route declares a TypeBox schema for its body, query, and params. Fastify rejects anything that doesn't match.
- Check length, format, and allowed values. Validation is a first filter. It never makes a value safe to join into SQL or HTML.
- Names and other short text refuse control characters. Postgres can't store a null byte, and line breaks could forge email headers.
- Send back only the fields the client needs. Build the response object by hand instead of returning a database row.
- Server-only modules import `server-only`, so they can't end up in browser code.

### 4. Redirect only to our own pages

- Redirect to fixed paths, or pass a return path through `nextPath` in `apps/web/lib/next-path.ts`.
- Never redirect to a URL taken straight from a request.
- The phone app's return address is built on the server from its trusted scheme, never from the request body.
- The link back to the phone app carries only a one-time code. It lasts 1 minute, is stored hashed, and is traded for the session only with the verifier the app made for that sign-in (PKCE, RFC 7636).

### 5. Protect state changes

- GET never changes anything.
- Every API route that changes data checks the `Origin` and `Sec-Fetch-Site` headers and rejects other sites.
- Every protected route checks the session on the server. The proxy's cookie check only decides where to send people.
- Check that the signed-in person owns the record they're reading or changing, not only that they're signed in.
- Session cookies stay HttpOnly, SameSite=Lax, and Secure on https.
- Better Auth refuses requests from other sites on its own routes. Its check is set on explicitly, because Better Auth turns it off under tests by default.

### 6. Send security headers

- Web pages: a Content Security Policy with a new nonce on every request, `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and HSTS.
- API: `nosniff` on every response, and `Cache-Control: no-store` on anything personal.
- Nothing sends `X-Powered-By`.

### 7. Keep secrets out of code

- Secrets come from the environment and never appear in code, logs, error messages, or tests.
- Only values meant to be public get the `NEXT_PUBLIC_` prefix.
- Logs never include passwords, tokens, or full email links.
- Queued emails are sealed with AES-256-GCM under `MAIL_JOB_KEY`. Their logs and stored failures carry codes, never the address, text, or link.

### 8. Prove it with tests

Every change that handles input adds tests for what must fail, not only for what must work:

- Attack strings for each field, taken from `@meritory/security-testing`: SQL, HTML, attribute, URL, `javascript:`, and control character payloads.
- For anything shown on a page, a render test that finds only the escaped form.
- For anything stored, a Postgres test that the value is saved exactly and matches nothing else.
- Requests with no session, someone else's session, and another site's `Origin`.
- Each new header or redirect rule.

## What CI checks

| Check | What it catches |
|---|---|
| Biome security rules | `dangerouslySetInnerHTML`, `eval` and its lookalikes, `javascript:` URLs, `target="_blank"` without `rel`, writing `document.cookie`, and secrets in code |
| `tools/biome/no-raw-sql.grit` | `sql.raw()` and `unsafe()` |
| `tools/biome/security-rules.test.ts` | Any of the rules above being turned off |
| CodeQL (security-extended) | Untrusted data reaching SQL, HTML, redirects, the file system, or a shell, plus unsafe GitHub Actions workflows |
| Tests | The failing-path tests from rule 8 |

## Exceptions

An exception needs a `biome-ignore` comment with the reason, a test that shows why it's safe, and a reviewer's sign-off. These are the current ones:

| Where | Why it's safe |
|---|---|
| `apps/web/app/layout.tsx` uses `dangerouslySetInnerHTML` | It writes the theme CSS built from our own design tokens. No outside data reaches it, and a test proves the CSS can't close its style tag. |
| `packages/server/drizzle.config.ts` has a database URL | It's the local Docker database from `docker-compose.yml`. Real environments set `DATABASE_URL`. |
| `packages/contracts/src/me.ts` has the schema name `SignInMethods` | `noSecrets` reads the long name as random text. It's a fixed `$id` that names the schema and holds no secret. |
| `noSecrets` is off in test files and `@meritory/security-testing` | Test data and attack strings look random. Neither ever holds a real secret. |

## Sources

- [OWASP Cross Site Scripting Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [OWASP Next.js Security](https://cheatsheetseries.owasp.org/cheatsheets/Nextjs_Security_Cheat_Sheet.html)
- [OWASP Unvalidated Redirects and Forwards](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)
- [OWASP Cross-Site Request Forgery Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP HTTP Headers](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)
- [Next.js Content Security Policy guide](https://nextjs.org/docs/app/guides/content-security-policy)
- [Drizzle `sql` operator](https://orm.drizzle.team/docs/sql)
- [React `dangerouslySetInnerHTML`](https://react.dev/reference/react-dom/components/common)
- [Biome rules](https://biomejs.dev/linter/javascript/rules/) and [Biome plugins](https://biomejs.dev/linter/plugins/)
- [GitHub CodeQL](https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning-with-codeql)
