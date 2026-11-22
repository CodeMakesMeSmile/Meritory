# The mower's shortest path

A robot mower sits in the top left corner of a courtyard, `yard`, and needs to reach the bottom right corner. Each cell is 0 for grass or 1 for a flower bed, and the mower must never drive onto a flower bed. Each step moves it one cell up, down, left, or right.

Return the fewest steps the mower needs, or -1 if it can't get there. If either corner is a flower bed, return -1.

## Example

```text
[[0, 0, 1],
 [1, 0, 1],
 [1, 0, 0]]
```

The mower goes right, down, down, and right, which is 4 steps.

## Limits

- From 1 to 300 rows and from 1 to 300 columns, with every row the same length.
- Aim for O(rows × cols) time.
