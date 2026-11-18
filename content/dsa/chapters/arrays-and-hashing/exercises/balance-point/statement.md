# Balance point

Given a list of `weights`, return the first position where the weights to its left add up to the same as the weights to its right. The weight at that position counts on neither side, and a side with no weights adds up to 0. Return -1 if there's no such position.

## Example

With `weights = [2, 7, 1, 4, 5]`, position 2 has 2 + 7 = 9 on its left and 4 + 5 = 9 on its right, so the answer is 2.

## Limits

- Up to 100,000 weights, each between -1,000 and 1,000.
- Aim for O(n) time.
