# A number in the printed catalogue

A library prints its catalogue numbers in a table, `grid`, read left to right along each row and then on to the start of the next row. Every number is bigger than the one before it in that reading order. Return `true` if `target` is in the table, and `false` if it isn't.

## Example

With `grid = [[2, 5, 9], [14, 20, 23], [31, 40, 48]]`, `target = 20` gives `true`, and `target = 21` gives `false`.

## Limits

- From 1 to 1,000 rows, each with the same number of columns, from 1 to 1,000.
- Each number is between -1,000,000,000 and 1,000,000,000.
- Aim for O(log(rows × cols)) time.
