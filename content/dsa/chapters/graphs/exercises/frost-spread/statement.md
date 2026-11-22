# When the frost reaches every seedling

A greenhouse tray is a grid, `tray`, where each cell is 0 for empty, 1 for a healthy seedling, or 2 for a seedling touched by frost. Every hour, the frost spreads from each frosted seedling to the healthy seedlings directly up, down, left, and right of it. It can't cross an empty cell, and it doesn't spread across corners.

Return how many hours it takes until no healthy seedlings are left. If there are none to begin with, that's 0 hours. If some healthy seedling will never be reached, return -1.

## Example

```text
[[1, 1, 0, 2],
 [0, 1, 1, 1],
 [0, 0, 1, 1]]
```

The frost starts at the top right. It reaches the seedling below that after 1 hour, and the seedling in the top left corner last, after 5 hours. The answer is 5.

## Limits

- From 1 to 300 rows and from 1 to 300 columns, with every row the same length.
- Aim for O(rows × cols) time, with one search for the whole tray.
