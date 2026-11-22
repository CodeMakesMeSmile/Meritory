# The best run at the market stall

A market stall records its `profit` for each day it opens, and a bad day has a negative profit. The owner wants to know the best stretch the stall has had.

Return the highest total profit of any run of one or more days in a row.

## Example

With `profit = [3, -5, 4, -1, 2, 6, -8, 3]`, the run `4, -1, 2, 6` adds up to 11. The bad day of -1 is worth keeping, since the days after it more than make up for it. No other run does better, so the answer is 11.

## Limits

- From 1 to 100,000 days.
- Each day's profit is between -10,000 and 10,000, so every total fits in 32 bits.
- Aim for O(n) time and O(1) extra memory.
