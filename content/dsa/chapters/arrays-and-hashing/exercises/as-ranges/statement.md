# Ids as ranges

Given a list of `ids` in no particular order, sometimes repeated, describe them as ranges. Each range is `[start, end]` and stands for every whole number from `start` to `end`. Make each range as long as it can be, so no two ranges overlap or touch.

Return the ranges in any order.

## Example

`[5, 1, 2, 9, 3, 5]` becomes `[[1, 3], [5, 5], [9, 9]]`.

## Limits

- Up to 100,000 ids, each between -1,000,000,000 and 1,000,000,000.
- Aim for O(n) time.
