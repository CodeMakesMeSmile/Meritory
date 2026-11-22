# Ploughing across the car park

After a storm, a plough clears one lane across a car park laid out in a grid of squares. Clearing the square in row `r` and column `c` takes `snow[r][c]` minutes, since some squares have deeper drifts than others. The plough starts on the top left square and finishes on the bottom right square, moving one square right or one square down each time, and it clears every square it drives over, both ends included.

Return the fewest minutes the lane can take.

## Example

```text
3 1 4
2 8 1
5 2 1
```

With `snow = [[3, 1, 4], [2, 8, 1], [5, 2, 1]]`, the quickest lane goes right to the 1, right to the 4, then down to the 1 and the last 1, for 3 + 1 + 4 + 1 + 1 = 10 minutes.

## Limits

- From 1 to 200 rows and from 1 to 200 columns, every row the same length.
- Each square takes from 0 to 1,000 minutes, so the answer fits in 32 bits.
- Aim for O(rows × columns) time.
- The reference solution fills a table row by row, so it doesn't recurse.
