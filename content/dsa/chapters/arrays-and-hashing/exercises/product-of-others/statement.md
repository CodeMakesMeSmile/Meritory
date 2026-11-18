# Product of the others

Given a list of `nums`, return a list where each position holds the product of every number except the one at that position. Don't use division.

The product of no numbers is 1, so a list of one number gives `[1]`.

## Example

`[2, 3, 4]` becomes `[12, 8, 6]`, and `[1, 0, 3]` becomes `[0, 3, 0]`.

## Limits

- From 1 to 100,000 numbers, each between -30 and 30.
- The product of any stretch of the numbers fits in a 32-bit signed integer.
- Aim for O(n) time, and O(1) extra memory besides the answer.
