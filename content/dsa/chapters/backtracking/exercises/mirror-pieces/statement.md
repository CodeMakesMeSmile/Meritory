# Cut a word into mirror pieces

A word game asks you to cut `word` into pieces that each read the same forwards and backwards, like `noon`, `aba`, or any single letter. The pieces stay in order, and together they spell the whole word.

Return every way to cut the word, each as its list of pieces from left to right. Return the ways in any order.

## Example

`word = "noon"` can be cut three ways: `["n", "o", "o", "n"]`, `["n", "oo", "n"]`, and `["noon"]`.

## Limits

- `word` has from 1 to 12 lowercase letters, so there are at most 2,048 ways.
- The recursion is at most 13 calls deep, so a recursive answer is safe in every language.
- Only cut off a piece that reads the same both ways, so no dead end goes any deeper.
