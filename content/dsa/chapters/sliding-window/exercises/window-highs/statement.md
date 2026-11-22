# Highest price in each window

A market tracks the closing `prices` of a crop each day. For every stretch of `k` days in a row, from the first stretch to the last, return the highest price in that stretch.

## Example

With `prices = [4, 2, 12, 3, 8, 6]` and `k = 3`, the stretches are `[4, 2, 12]`, `[2, 12, 3]`, `[12, 3, 8]`, and `[3, 8, 6]`, so the answer is `[12, 12, 12, 8]`.

## Limits

- From 1 to 100,000 days, each price between -1,000,000,000 and 1,000,000,000.
- `k` is between 1 and the number of days.
- Aim for O(n) time.
