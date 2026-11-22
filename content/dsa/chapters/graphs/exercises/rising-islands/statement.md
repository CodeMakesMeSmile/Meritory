# Islands rising from the sea

A stretch of sea is a grid of `rows` by `cols` cells, all water to begin with. One at a time, the cells in `raised` rise up and become land, each given as `[row, col]`. Land cells that touch up, down, left, or right are part of the same island, and corners don't count. A cell can rise more than once, and after the first time it changes nothing.

After each cell rises, count the islands. Return the counts in order.

## Example

With `rows = 3`, `cols = 3`, and `raised = [[0, 0], [0, 1], [2, 2], [1, 2], [0, 2]]`, the counts are 1, 1, 2, and 2. Then the last cell joins the island at the top left to the one on the right, so the count drops to 1. The answer is `[1, 1, 2, 2, 1]`.

## Limits

- `rows` and `cols` are each between 1 and 1,000, and `rows × cols` is at most 100,000.
- Up to 10,000 cells rise.
- Counting the islands from scratch after every cell is too slow. Aim for O(rows × cols + k) time, where k is the number of cells that rise, using union-find with path compression and union by rank.
