# Clearing the fewest snowdrifts

A snowplough sits in the top left corner of a yard, `field`, and needs to reach the bottom right corner. Each cell is 0 when it's clear or 1 when there's a snowdrift. Each move takes the plough one cell up, down, left, or right, and it clears any drift in a cell it enters.

Return the fewest drifts the plough has to clear. A drift in either corner counts, since the plough has to clear it too. There's always a way across, since any drift can be cleared.

## Example

```text
[[0, 1, 0, 0],
 [0, 1, 0, 1],
 [0, 0, 0, 1],
 [1, 1, 1, 0]]
```

The plough goes down two cells, then right two cells to the clear patch in the middle. Every way into the bottom right corner from there passes a drift, so the answer is 1.

## Limits

- From 1 to 300 rows and from 1 to 300 columns, with every row the same length.
- Aim for O(rows × cols) time.
