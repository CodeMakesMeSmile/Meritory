# Two songs for the break

A radio host has a break of `target` seconds to fill with exactly two different songs. The song `lengths`, in seconds, are sorted from shortest to longest. Find two songs whose lengths add up to exactly `target`, and return their positions as `[i, j]`, with `i` before `j`.

If more than one pair works, return the one with the smallest `i`, and for that `i`, the largest `j`. If no pair works, return an empty list.

## Example

With `lengths = [100, 150, 180, 210, 260]` and `target = 360`, both 100 + 260 and 150 + 210 fill the break. The first pair has the smaller `i`, so the answer is `[0, 4]`.

## Limits

- Up to 100,000 lengths, each between 1 and 1,000,000, sorted from shortest to longest.
- `target` is between 1 and 2,000,000.
- Aim for O(n) time and O(1) extra memory.
