## What changed

## Security

Checked against [docs/security.md](../docs/security.md):

- [ ] Output is escaped by React, with no new `dangerouslySetInnerHTML`, `eval`, or `javascript:` URLs
- [ ] SQL values are bound, with no `sql.raw` or string-built queries
- [ ] Input is validated where it arrives, and responses return only the fields the client needs
- [ ] Redirects go to fixed paths or through `nextPath`
- [ ] State changes aren't on GET, and they check the session, the owner, and the `Origin`
- [ ] No secrets in code, logs, or tests
- [ ] Tests cover what must fail, including attack strings where input is handled
- [ ] Any exception is listed in docs/security.md with its reason

## Testing
