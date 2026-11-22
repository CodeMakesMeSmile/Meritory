# Lockers for the runners

Before a race, runners wait along a corridor at the positions in `runners`, in metres from the door. Lockers sit along the same corridor at the positions in `lockers`, one for each runner, so both lists have the same length. Each runner walks to a different locker, and two runners can wait at the same spot.

Return the least total distance the runners walk.

## Example

With `runners = [8, 1, 15]` and `lockers = [10, 3, 4]`, the runner at 1 takes the locker at 3, the runner at 8 takes the one at 4, and the runner at 15 takes the one at 10. They walk 2, 4, and 5 metres, so the answer is 11. Every other way of sharing out the lockers adds up to more.

## Limits

- From 0 to 100,000 runners.
- Each position is between 0 and 1,000,000,000.
- The answer can be too big for 32 bits, so it's a 64-bit number.
- Aim for O(n log n) time.
