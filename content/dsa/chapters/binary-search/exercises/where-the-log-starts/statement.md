# Where the log starts

A turnstile records its running total of visitors in a ring of slots, writing each new total over the oldest one. Totals only grow, so reading the slots from the oldest entry to the end, then on from the start, gives totals that rise. Given the slots as `totals`, return the position of the oldest entry, which holds the smallest total.

## Example

With `totals = [520, 610, 700, 130, 290, 400]`, the oldest entry is at position 3, so the answer is 3. If the ring hasn't wrapped yet, like `[5, 9, 14]`, the oldest entry is at position 0.

## Limits

- From 1 to 100,000 slots, all different, each between 1 and 1,000,000,000.
- Aim for O(log n) time.
