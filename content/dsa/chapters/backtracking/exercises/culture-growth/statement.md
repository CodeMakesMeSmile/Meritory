# How big the culture grows

A lab starts a culture with one cell. Every hour, each cell splits into `factor` cells, so after `hours` hours the culture has `factor` multiplied by itself `hours` times. That number gets huge, so return it modulo 1,000,000,007.

## Example

With `factor = 3` and `hours = 5`, the culture has 3, 9, 27, 81, and then 243 cells, so the answer is 243.

## Limits

- `factor` is from 1 to 1,000,000,000, and `hours` is from 0 to 1,000,000,000.
- After 0 hours there's still the one cell the lab started with.
- Multiplying one hour at a time is far too slow for a billion hours. Aim for O(log hours) time. A recursive answer that halves `hours` at each step is about 31 calls deep, which is safe in every language.
- Take the modulo after every multiplication. Two numbers below 1,000,000,007 can multiply to more than 2⁵³, so TypeScript needs `BigInt` for the product, and Java and C need a 64-bit type.
