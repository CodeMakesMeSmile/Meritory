# Peaks that keep getting higher

A long ridge walk passes a series of high points, and `heights` lists their heights in the order the walk reaches them. A photographer wants to photograph some of them so that each photo shows a point strictly higher than the one before. She can skip any points she likes, but she can't go back.

Return the most points she can photograph.

## Example

With `heights = [5, 2, 8, 6, 3, 6, 9, 7]`, she can photograph 2, 3, 6, and 9, which is 4 points. No 5 of them keep rising, so the answer is 4.

## Limits

- From 1 to 2,500 heights, each from -10,000 to 10,000, since part of the walk is below sea level.
- Two points of the same height don't count as rising.
- Aim for O(n²) time. As a stretch, solve it in O(n log n).
- The reference solution uses the O(n log n) list of tails, with no recursion.
