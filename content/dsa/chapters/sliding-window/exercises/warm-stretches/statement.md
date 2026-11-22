# Warm stretches

A weather station logs the `temperatures` at noon each day, in whole degrees. Count the stretches of exactly `k` days in a row whose average temperature is at least `limit`.

## Example

With `temperatures = [18, 22, 25, 19, 30, 14]`, `k = 3`, and `limit = 22`, the four stretches of three days have totals 65, 66, 74, and 63. A total of at least 66 means an average of at least 22, so two stretches count and the answer is 2.

## Limits

- From 1 to 100,000 days, each between -50 and 50 degrees.
- `k` is between 1 and the number of days.
- `limit` is between -50 and 50.
- Aim for O(n) time.
