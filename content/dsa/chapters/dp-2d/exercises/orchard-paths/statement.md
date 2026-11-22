# Paths through the orchard

An orchard is planted in a grid of plots. `orchard[r][c]` is 1 where a tree stands in row `r` and column `c`, and 0 where the plot is clear. A picker starts at the gate in the top left plot and walks to the shed in the bottom right plot, moving one plot right or one plot down at each step, and never onto a tree.

Count the different paths from the gate to the shed. Return the count modulo 1,000,000,007. If a tree stands on the gate or the shed, there are no paths, so return 0.

## Example

```text
0 0 0
0 1 0
0 0 0
```

With `orchard = [[0, 0, 0], [0, 1, 0], [0, 0, 0]]`, there are 2 paths: right along the top and then down the right side, or down the left side and then right along the bottom.

## Limits

- From 1 to 100 rows and from 1 to 100 columns, every row the same length, and every plot 0 or 1.
- A grid of one plot has one path if it's clear, the path with no steps.
- Aim for O(rows × columns) time. Keeping one row of counts is enough.
- The reference solution keeps one row in a loop, so it doesn't recurse.
- Take the modulo after every addition, and add in a 64-bit type in Java and C.
