# The top scores of quiz night

At the end of quiz night, every team's total is in `scores`. Wrong answers cost points, so a total can be negative. Return the `k` highest totals, from highest to lowest. Totals that repeat each count.

## Example

With `scores = [55, 80, 62, 91, 70]` and `k = 3`, the answer is `[91, 80, 70]`.

## Limits

- From 1 to 100,000 scores, each between -1,000,000 and 1,000,000.
- `k` is between 1 and the number of scores.
- Aim for O(n log k) time and O(k) extra memory.
