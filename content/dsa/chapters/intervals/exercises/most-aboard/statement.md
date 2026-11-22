# The most riders on the bus

A bus runs one way along a route with its stops numbered from 0. Each of the `riders` is `[board, leave]`, the stop where they get on and the stop where they get off. At every stop, everyone getting off leaves before anyone new gets on. So a rider who leaves at stop 5 and one who boards at stop 5 are never on the bus together.

Return the most riders on the bus at once.

## Example

With `riders = [[0, 4], [1, 3], [3, 6], [4, 7], [2, 5]]`, three riders are aboard after stop 2. At stop 3 one gets off before another gets on, and the same happens at stop 4, so the count never reaches 4. The answer is 3.

## Limits

- From 0 to 100,000 riders.
- Each rider has `0 <= board < leave <= 1,000,000`.
- Aim for O(n log n) time.
