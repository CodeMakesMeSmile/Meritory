# The best paying shifts

A café posts a row of shifts for the coming weeks, and `pay[i]` is what shift `i` pays. A student wants to pick some of them, but never two shifts next to each other in the row, so there's always a rest in between.

Return the most pay they can earn. Picking no shifts at all is allowed.

## Example

With `pay = [6, 2, 3, 9, 4]`, picking the shifts that pay 6 and 9 earns 15. Picking 6, 3, and 4 only earns 13, so the answer is 15.

## Limits

- From 0 to 100,000 shifts, each paying from 0 to 10,000, so the most pay always fits in 32 bits.
- Aim for O(n) time and O(1) extra memory. The reference solution keeps the last two best totals in a loop, so it doesn't recurse.
