# How long the price held

A market stall tracks the price of apples each day in `prices`. A day's span is how many days in a row, ending with that day and counting it, had a price no higher than that day's price.

Return the span of every day.

## Example

With `prices = [30, 25, 28, 28, 35, 20]`, day 0's span is 1. Day 1's span is 1, since 30 came just before it. Day 2's span is 2, covering 25 and 28. Day 3's span is 3, since the 28 before it ties. Day 4's price of 35 is the highest yet, so its span is 5. Day 5's span is 1. The answer is `[1, 1, 2, 3, 5, 1]`.

## Limits

- Up to 100,000 days, each price between 1 and 1,000,000.
- Aim for O(n) time.
