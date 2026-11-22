# Water pipes to every greenhouse

A farm has `n` greenhouses, numbered from 0 to n - 1, and wants water to reach all of them from any one. Each `[a, b, cost]` in `pipes` is a pipe the farm could lay between greenhouses `a` and `b` for `cost`, and water flows through it both ways.

Choose pipes so that water can get from every greenhouse to every other, through other greenhouses if needed. Return the least total cost. If even laying every pipe can't join them all, return -1. A single greenhouse needs no pipes, so its cost is 0.

## Example

With `n = 4` and `pipes = [[0, 1, 4], [1, 2, 2], [0, 2, 3], [2, 3, 6], [1, 3, 7]]`, lay the pipes costing 2, 3, and 6. That joins all four greenhouses for 11, and no other choice is cheaper.

## Limits

- `n` is between 1 and 10,000, and there are up to 20,000 pipes.
- Each cost is between 1 and 100,000. Each pipe joins two different greenhouses, and the same pair can be listed more than once.
- Aim for O(m log m) time, where m is the number of pipes.
