# Joining the sand piles

A building site has a row of sand piles, and `piles[i]` is the weight of pile `i` in kilograms. A loader joins them into one pile, but it can only push two piles that sit next to each other in the row into one. Joining two piles burns fuel equal to their combined weight, and the new pile takes their place in the row.

Return the least fuel it takes to join the whole row into one pile. A row of one pile needs no joins, so return 0.

## Example

With `piles = [4, 1, 3, 2]`, joining the 4 and the 1 costs 5, joining the 3 and the 2 costs 5, and joining the two piles of 5 costs 10, for 20 in all. No order does better, so the answer is 20.

## Limits

- From 1 to 100 piles, each weighing from 1 to 1,000,000,000 kilograms.
- The answer can pass 2³¹, so return a 64-bit number. It stays below 2⁵³, so it's exact in TypeScript too.
- Aim for O(n³) time, filling ranges from the shortest up, with prefix sums for the weight of any range.
- The reference solution fills the table in loops, so it doesn't recurse.
