# Weeks with no repeated dinner

A family gives each dish they cook a number, and `dinners[i]` is the dish they had on night `i`. Count the stretches of exactly `k` nights in a row in which no dish was served twice.

## Example

With `dinners = [1, 2, 1, 3, 4, 3]` and `k = 3`, the stretches are `[1, 2, 1]`, `[2, 1, 3]`, `[1, 3, 4]`, and `[3, 4, 3]`. The middle two have no repeats, so the answer is 2.

## Limits

- Up to 100,000 nights, and each dish is a number between 1 and 100,000.
- `k` is between 1 and 100,000. If `k` is more than the number of nights, there are no stretches.
- Aim for O(n) time.
