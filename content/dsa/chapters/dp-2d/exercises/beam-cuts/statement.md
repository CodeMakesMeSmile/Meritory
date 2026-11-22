# Cutting the beam at the sawmill

A sawmill cuts a wooden beam `length` centimetres long at every mark in `marks`, where each mark is a distance from the left end. The saw cuts one piece at a time, and a cut costs the length of the piece it cuts, whatever is left of the beam at that point. The marks can be cut in any order, and the order changes the total.

Return the least total cost to cut at every mark. With no marks, nothing is cut, so return 0.

## Example

With `length = 10` and `marks = [7, 2, 4]`, cutting at 2, then 4, then 7 costs 10, then 8, then 6, for 24. Cutting at 4 first costs 10, then the left piece of 4 is cut at 2 for 4 and the right piece of 6 is cut at 7 for 6, for 20. No order does better, so the answer is 20.

## Limits

- `length` is from 2 to 1,000,000,000.
- From 0 to 100 marks, in any order, with no mark listed twice. Each one is strictly between 0 and `length`.
- The answer can pass 2³¹, so return a 64-bit number. It stays below 2⁵³, so it's exact in TypeScript too.
- Aim for O(m³) time for m marks.
- The reference solution fills a table over ranges of points in loops, shortest first, so it doesn't recurse.
