# When the buses line up

Every bus route in a town leaves the depot at a fixed gap, and `gaps` lists each route's gap in minutes. All the routes leave together at minute 0.

Return the first minute after 0 when every route leaves the depot at the same time again.

## Example

With `gaps = [4, 6, 10]`, the routes leave together again at minute 60, the smallest number that 4, 6, and 10 all divide.

## Limits

- From 1 to 50 routes, each gap from 1 to 1,000,000.
- The answer is at most 9,007,199,254,740,991, which is 2⁵³ - 1, so it fits in a 64-bit number and is exact in TypeScript.
- The least common multiple of a and b is a divided by their gcd, times b. Divide first, so no step is bigger than the answer.
