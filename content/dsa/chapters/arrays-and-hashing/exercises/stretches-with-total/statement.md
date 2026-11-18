# Stretches with a total

A bank account's daily `changes` are whole numbers, positive for money in and negative for money out. Count the stretches of one or more days in a row whose changes add up to exactly `total`.

## Example

With `changes = [3, -1, 1, 2]` and `total = 3`, the answer is 3: `[3]`, `[3, -1, 1]`, and `[1, 2]`.

## Limits

- Up to 100,000 days, each change between -1,000 and 1,000.
- `total` is between -100,000,000 and 100,000,000.
- The count can be larger than a 32-bit number holds, so return a 64-bit one.
- Aim for O(n) time.
