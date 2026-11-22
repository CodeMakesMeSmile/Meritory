# Longest steady stretch

A greenhouse logs its `temperatures` every hour. Return the length of the longest stretch of readings in a row where the highest and lowest readings differ by at most `limit`, or 0 if there are no readings.

## Example

With `temperatures = [20, 22, 27, 25, 24, 30]` and `limit = 3`, the stretch `[27, 25, 24]` stays within 3 degrees, and no longer stretch does, so the answer is 3.

## Limits

- Up to 100,000 readings, each between -1,000,000 and 1,000,000.
- `limit` is between 0 and 2,000,000.
- Aim for O(n) time.
