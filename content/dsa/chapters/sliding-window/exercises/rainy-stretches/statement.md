# Stretches with k rainy days

A town's weather log has one entry per day, and `rainy[i]` is `true` if it rained on day `i`. Count the stretches of one or more days in a row with exactly `k` rainy days.

## Example

With `rainy = [false, true, false]` and `k = 1`, every stretch that includes day 1 has exactly one rainy day. Those are `[false, true]`, `[true]`, `[true, false]`, and `[false, true, false]`, so the answer is 4.

## Limits

- Up to 100,000 days.
- `k` is between 0 and 100,000.
- The count can be larger than a 32-bit number holds, so return a 64-bit one.
- Aim for O(n) time.
