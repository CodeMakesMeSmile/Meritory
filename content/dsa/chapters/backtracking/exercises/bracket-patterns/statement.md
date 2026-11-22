# Brackets that close properly

A code editor's tests need every way to write `pairs` pairs of round brackets that close properly. A string closes properly when, reading from left to right, there are never more `)` than `(` so far, and the two counts are equal at the end.

Return every string of exactly `pairs` opening and `pairs` closing brackets that closes properly, in any order.

## Example

With `pairs = 3`, there are five strings: `((()))`, `(()())`, `(())()`, `()(())`, and `()()()`.

## Limits

- `pairs` is from 0 to 8, so there are at most 1,430 strings. With 0 pairs, there's one string, the empty one.
- The recursion is at most 17 calls deep, so a recursive answer is safe in every language.
- Only build strings that can still close properly, rather than building all 2²ⁿ strings of brackets and checking each one.
