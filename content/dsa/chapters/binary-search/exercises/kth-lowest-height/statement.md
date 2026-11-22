# The k-th lowest point on the hill

A survey maps the ground on a hillside as a grid of `heights`. The hill rises toward the bottom right, so heights never go down as you move right along a row or down a column. Some points are below sea level, so heights can be negative.

Return the k-th lowest height in the grid, where `k = 1` is the lowest. Repeated heights each count.

## Example

With `heights = [[-3, 1, 4], [0, 2, 7], [5, 6, 9]]` and `k = 4`, the heights in order are -3, 0, 1, 2, 4, 5, 6, 7, and 9, so the answer is 2.

## Limits

- From 1 to 300 rows, each with the same number of columns, from 1 to 300.
- Each height is between -1,000,000,000 and 1,000,000,000.
- `k` is between 1 and rows × cols.
- Aim for O((rows + cols) × log m) time, where m is the gap between the lowest and highest heights.
