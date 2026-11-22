# Exactly k kinds of bird

A birdwatcher logs each of their `sightings` in order, as a number for the kind of bird. Count the stretches of one or more sightings in a row that include exactly `k` different kinds.

## Example

With `sightings = [1, 2, 1, 3]` and `k = 2`, the stretches with exactly two kinds are `[1, 2]`, `[2, 1]`, `[1, 2, 1]`, and `[1, 3]`, so the answer is 4.

## Limits

- Up to 100,000 sightings, each kind a number between 1 and 100,000.
- `k` is between 1 and 100,000.
- The count can be larger than a 32-bit number holds, so return a 64-bit one.
- Aim for O(n) time.
