# Packing the market van

A stall holder packs a van for the Saturday market. Crate `i` weighs `weights[i]` kilograms and is expected to bring in `takings[i]` dollars. The van can carry at most `capacity` kilograms, and there's only one of each crate, so each crate is packed once or left behind.

Return the most takings the stall holder can pack into the van.

## Example

With `weights = [4, 3, 2, 5]`, `takings = [50, 40, 25, 60]`, and `capacity = 9`, packing the crates that weigh 4 and 5 brings 110, but the crates that weigh 4, 3, and 2 bring 115, and that's the most. The answer is 115.

## Limits

- From 1 to 100 crates, and `weights` and `takings` have the same length.
- Each crate weighs from 1 to 1,000 kilograms and brings from 0 to 10,000 dollars.
- `capacity` is from 0 to 10,000. A capacity of 0 fits nothing, so the answer is 0.
- Aim for O(n × capacity) time and O(capacity) memory.
- The reference solution keeps one row in loops, so it doesn't recurse.
