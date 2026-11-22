# Prime house numbers on a long road

On a very long road, the houses are numbered from 1 up to a trillion. A delivery company is testing a route that visits every house from number `low` to number `high`, inclusive, and wants to know how many of those house numbers are prime.

Return how many prime numbers lie between `low` and `high`, inclusive.

## Example

With `low = 10` and `high = 30`, the primes are 11, 13, 17, 19, 23, and 29, so the answer is 6.

## Limits

- 1 ≤ `low` ≤ `high` ≤ 1,000,000,000,000.
- `high - low` is at most 1,000,000.
- A sieve all the way up to `high` would need a trillion entries. Sieve the primes up to the square root of `high`, then use them to cross off composites inside the window from `low` to `high`.
