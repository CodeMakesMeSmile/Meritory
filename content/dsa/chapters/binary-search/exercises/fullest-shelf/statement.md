# The fullest shelf

A storeroom has rows of `shelves`, and each shelf is a row of slots, 0 for empty and 1 for full. Every shelf is packed from the right, so its 0s all come before its 1s. Return the number of the shelf with the most full slots. If shelves tie, return the lowest number. If every slot is empty, return -1.

## Example

With `shelves = [[0, 0, 1, 1], [0, 1, 1, 1], [0, 0, 0, 1]]`, shelf 1 has three full slots, more than any other, so the answer is 1.

## Limits

- From 1 to 1,000 shelves, each with the same number of slots, from 1 to 1,000.
- Aim for O(rows × log cols) time.
