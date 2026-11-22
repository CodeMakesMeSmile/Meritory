# Walking times to every stall

A night market has `n` stalls, numbered from 0 to n - 1. Each `[a, b, minutes]` in `paths` is a footpath between stalls `a` and `b` that takes `minutes` to walk, in either direction.

You start at stall `start`. Return a list with the fewest minutes it takes to walk to each stall, in stall order. The time to `start` itself is 0, and a stall you can't walk to at all gets -1.

## Example

With `n = 5`, `paths = [[0, 1, 4], [0, 2, 1], [2, 1, 2], [1, 3, 5], [2, 3, 8]]`, and `start = 0`, stall 2 is 1 minute away. Stall 1 is 3 minutes away through stall 2, which beats the direct path of 4. Stall 3 is 8 minutes away through stall 1. No path reaches stall 4. The answer is `[0, 3, 1, 8, -1]`.

## Limits

- `n` is between 1 and 10,000, and there are up to 20,000 paths.
- Each path takes between 1 and 1,000 minutes. Each joins two different stalls, and the same pair can be listed more than once.
- Aim for O((n + m) log m) time, where m is the number of paths.
