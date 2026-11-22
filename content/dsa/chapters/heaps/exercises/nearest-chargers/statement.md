# The nearest chargers to the van

An electric van is parked at `[0, 0]` on a city map. Each charger in `chargers` is at a spot `[x, y]`, and no two chargers share a spot. Return the `k` chargers nearest the van, measured in a straight line, in any order.

The cases never tie between the k-th nearest charger and the next one, so there's always one right set.

## Example

With `chargers = [[3, 4], [1, -1], [-2, 2], [6, 0]]` and `k = 2`, the chargers are 5, about 1.4, about 2.8, and 6 away, so the answer is `[[1, -1], [-2, 2]]`.

## Limits

- From 1 to 100,000 chargers, with `x` and `y` each between -10,000 and 10,000.
- `k` is between 1 and the number of chargers.
- Aim for O(n log k) time.
