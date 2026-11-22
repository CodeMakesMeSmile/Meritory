# Lamps lit for every number

A science museum has a row of lamps that shows a number in binary, with a lamp on for each 1 bit. A guide wants to know, for every number from 0 up to `n`, how many lamps are on when it's shown.

Return a list of `n + 1` counts, where the count at index i is the number of 1 bits in i.

## Example

With `n = 5`, the numbers 0 to 5 are `0`, `1`, `10`, `11`, `100`, and `101` in binary, so the answer is `[0, 1, 1, 2, 1, 2]`.

## Limits

- `n` is from 0 to 100,000.
- Counting each number's bits from scratch is O(n log n). Aim for O(n) by building each count from a smaller number's count.
