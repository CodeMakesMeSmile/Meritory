# Three entries that balance

A ledger lists `amounts`, positive for money in and negative for money out, in no particular order. Find every set of three entries, at three different positions, whose amounts add up to exactly 0.

Return each set as its three amounts sorted from lowest to highest. List each set of amounts only once, even when more than one choice of positions makes it. Return the sets in any order.

## Example

With `amounts = [3, -1, -2, 1, 0, -1]`, two sets balance: -2, -1, and 3, and -1, 0, and 1. The answer is `[[-2, -1, 3], [-1, 0, 1]]`. The two entries of -1 can each make the second set, but it's listed once.

## Limits

- Up to 3,000 amounts, each between -100,000 and 100,000.
- Aim for O(n²) time.
