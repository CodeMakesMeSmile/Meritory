# The biggest square of tiles

A tiler has `tiles` square tiles, all the same size, and wants to lay one full square that's as big as possible. A square with sides of `s` tiles uses `s * s` of them. Return the biggest `s` the tiles can cover. Don't use a built-in square root.

## Example

With `tiles = 30`, a 5 by 5 square uses 25 tiles, and a 6 by 6 square would need 36, so the answer is 5.

## Limits

- `tiles` is between 0 and 2,147,483,647.
- Aim for O(log n) time.
