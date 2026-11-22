# Brackets that close

A spreadsheet checks each formula before it runs it. A formula `text` can hold round `()`, square `[]`, and curly `{}` brackets among its other characters. Return `true` if every bracket is closed by a partner of the same kind, in the reverse order they opened. Return `false` otherwise. Characters that aren't brackets don't matter.

## Example

`"sum(a[1], {b})"` returns `true`.

`"max(a[1)]"` returns `false`, because the round bracket closes while the square one inside it is still open.

## Limits

- Up to 100,000 characters, each a printable ASCII character.
- Aim for O(n) time.
