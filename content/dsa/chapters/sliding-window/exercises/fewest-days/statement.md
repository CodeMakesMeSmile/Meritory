# Fewest days to the goal

You put some money aside every day, and `savings[i]` is what you saved on day `i`, always at least 1. Return the fewest days in a row whose savings add up to at least `goal`, or 0 if no stretch of days gets there.

## Example

With `savings = [2, 1, 5, 2, 3, 2]` and `goal = 7`, the two days `[5, 2]` add up to 7, and no single day does, so the answer is 2.

## Limits

- Up to 100,000 days, each with savings between 1 and 10,000.
- `goal` is between 1 and 1,000,000,000.
- Aim for O(n) time.
