# Ways across the stepping stones

A path across a garden pond is a row of stepping stones, numbered from 0 on the near bank to `stones` on the far side. A child starts on stone 0 and hops forward one stone or two stones at a time, always landing on a stone.

Return how many different sequences of hops take the child from stone 0 to exactly stone `stones`.

## Example

With `stones = 4`, there are 5 ways. The child can make four hops of one, make two hops of two, or mix one hop of two with two hops of one, which can happen in 3 different orders.

## Limits

- `stones` is from 1 to 75.
- The count passes 2³¹ at 46 stones, so return a 64-bit number. The largest answer is below 2⁵³, so it's exact in TypeScript too.
- Aim for O(n) time and O(1) memory. The reference solution keeps the last two counts in a loop, so it doesn't recurse.
