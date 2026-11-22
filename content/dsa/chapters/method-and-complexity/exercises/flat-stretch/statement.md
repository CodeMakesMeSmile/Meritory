# Longest flat stretch

A sensor on a rain barrel records the water level every hour in `levels`. Return the length of the longest stretch of readings in a row that are all equal. A single reading is a stretch of 1, and with no readings the answer is 0.

## Example

With `levels = [3, 3, 5, 5, 5, 2]`, the three readings of 5 make the longest flat stretch, so the answer is 3.

## Limits

- Up to 100,000 readings, each between -1,000,000,000 and 1,000,000,000.
- Aim for O(n) time and O(1) extra space.
- Before you run it, test your code by hand on an empty list, one reading, and a list whose longest stretch is at the very end.
