# Pairs a set gap apart

Given a list of `scores` and a whole number `gap` that's 0 or more, count the pairs of positions `i` and `j`, with `i` before `j`, where the two scores differ by exactly `gap`.

Pairs are counted by position, so a repeated score can be part of several pairs.

## Example

With `scores = [1, 5, 3, 5]` and `gap = 2`, the answer is 3: the 1 and the 3, the first 5 and the 3, and the 3 and the second 5.

## Limits

- Up to 100,000 scores, each between -1,000,000,000 and 1,000,000,000.
- `gap` is between 0 and 1,000,000,000.
- The count can be larger than a 32-bit number holds, so return a 64-bit one.
- Aim for O(n) time.
