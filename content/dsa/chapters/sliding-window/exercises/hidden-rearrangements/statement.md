# Hidden rearrangements

Given a `text` and a `word`, both made of the lowercase letters a to z, find every position in `text` where a rearrangement of `word` starts. A rearrangement uses the same letters the same number of times, in any order, and `word` itself counts as one.

Return the starting positions from lowest to highest, or an empty list if there are none.

## Example

With `text = "dogodgxgod"` and `word = "god"`, the stretches "dog", "god", "odg", and "god" start at positions 0, 2, 3, and 7, so the answer is `[0, 2, 3, 7]`.

## Limits

- `text` has from 0 to 100,000 letters, and `word` has from 1 to 100,000.
- Aim for O(n) time, where n is the length of `text`.
