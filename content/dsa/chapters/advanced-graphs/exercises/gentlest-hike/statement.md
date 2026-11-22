# The gentlest route across the ridge

A hiker crosses a ridge shown as a grid, `heights`, from the top left corner to the bottom right corner. Each cell holds the ground's height, and each step goes one cell up, down, left, or right.

The strain of a step is the difference in height between the two cells, whether it climbs or drops. The strain of a route is its single hardest step. Return the least strain of any route across. One cell on its own needs no steps, so its strain is 0.

## Example

```text
[[1, 3, 2],
 [6, 8, 3],
 [5, 9, 4]]
```

Going right, right, down, and down passes heights 1, 3, 2, 3, and 4. Its hardest step is from 1 to 3, a strain of 2. The first step out of the corner goes to a 3 or a 6, so no route can do better, and the answer is 2.

## Limits

- From 1 to 100 rows and from 1 to 100 columns, with every row the same length.
- Each height is between 1 and 1,000,000.
- Aim for O(rows × cols × log(rows × cols)) time.
