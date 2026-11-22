# Longest climb

A cyclist's bike computer logs the height of the road every minute in `heights`. Return the length of the longest stretch of readings in a row where each reading is strictly higher than the one before it. A single reading is a climb of 1, and with no readings the answer is 0.

## Example

With `heights = [5, 6, 8, 8, 9, 10, 11, 3]`, the readings 8, 9, 10, and 11 make the longest climb, so the answer is 4. The two readings of 8 don't climb, so they split the stretch.

## Limits

- Up to 100,000 readings, each between -1,000,000,000 and 1,000,000,000.
- Aim for O(n) time and O(1) extra space.
- Before you run it, test your code by hand on an empty list, a flat list, and a list whose longest climb is at the very end.
