# Two gifts under budget

You're buying two different gifts and want to spend as much of your `budget` as you can without going over. The gift `prices` are sorted from lowest to highest. Return the largest total of two different gifts that's at most `budget`, or -1 if every pair costs more.

## Example

With `prices = [5, 12, 20, 31, 40]` and `budget = 50`, the best you can do is 5 + 40 = 45. The pair 20 + 31 = 51 is over budget, so the answer is 45.

## Limits

- Up to 100,000 prices, each between 1 and 1,000,000, sorted from lowest to highest.
- `budget` is between 1 and 2,000,000.
- Aim for O(n) time and O(1) extra memory.
