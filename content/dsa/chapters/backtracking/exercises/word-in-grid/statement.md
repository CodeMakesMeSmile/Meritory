# Trace a word in the letter grid

A puzzle page prints a grid of letters, and each string in `grid` is one row. You trace a word by starting on any cell that holds its first letter, then stepping up, down, left, or right to a cell that holds the next letter, and so on. Diagonal steps aren't allowed, and a word can't use the same cell twice.

Return `true` if `word` can be traced in the grid, and `false` if it can't.

## Example

```text
p n e
l a t
```

With `grid = ["pne", "lat"]`, `planet` can be traced: start on p, then step down to l, right to a, up to n, right to e, and down to t. `plant` can't, because no t sits next to the n.

## Limits

- From 1 to 6 rows, all the same length, with from 1 to 6 letters each.
- `word` has from 1 to 15 letters. Every letter in the grid and the word is a lowercase letter from a to z.
- The recursion is at most 16 calls deep, so a recursive answer is safe in every language.
- Stop a path as soon as a letter doesn't match.
