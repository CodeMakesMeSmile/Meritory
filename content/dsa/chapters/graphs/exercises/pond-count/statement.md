# Ponds in the marsh

A survey photo of a marsh is a grid, `marsh`, where 1 is water and 0 is dry ground. Water cells that touch on a side, up, down, left, or right, are part of the same pond. Cells that only touch at a corner aren't.

Return how many ponds there are.

## Example

```text
[[1, 1, 0, 0],
 [0, 1, 0, 1],
 [1, 0, 0, 1]]
```

The three water cells at the top left make one pond, and the two on the right make another. The cell at the bottom left only touches the first pond at a corner, so it's a pond of its own. The answer is 3.

## Limits

- From 1 to 300 rows and from 1 to 300 columns, with every row the same length.
- One pond can cover the whole marsh, which is too deep for recursion in Python, so the reference solution keeps its own stack.
- Aim for O(rows × cols) time.
