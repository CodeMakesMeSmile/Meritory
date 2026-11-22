# Steps to the nearest exit

A floor plan, `plan`, is a grid where each cell is 0 for open floor, 1 for a wall, or 2 for an exit. From any open cell, a person can step up, down, left, or right onto another open cell or an exit.

Return a grid of the same size where each cell holds the fewest steps from that cell to its nearest exit. Exits hold 0. Walls hold -1, and so does any open cell that can't reach an exit at all.

## Example

```text
[[0, 0, 2],
 [0, 1, 0],
 [2, 0, 0]]
```

The answer is `[[2, 1, 0], [1, -1, 1], [0, 1, 2]]`. The top left corner is 2 steps from either exit, and the wall in the middle holds -1.

## Limits

- From 1 to 300 rows and from 1 to 300 columns, with every row the same length.
- Aim for O(rows × cols) time, with one search for the whole plan rather than one per exit.
