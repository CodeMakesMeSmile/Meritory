# Rowing over the flooded field

A field, shown as a grid of ground heights in `field`, is slowly flooding. At hour 0 the water is at height 0, and it rises by 1 every hour. A rowing boat can sit in a cell once the water there is at least as high as the ground.

The boat starts in the top left corner and wants to reach the bottom right corner, moving one cell up, down, left, or right at a time. Rowing takes no time at all, so the only wait is for the water. Return the earliest hour when the boat can get across. The boat needs water in the starting cell too.

## Example

```text
[[0, 2],
 [1, 3]]
```

The bottom right corner is 3 high, so the boat can't arrive before hour 3. By then every cell is covered, so the answer is 3.

## Limits

- From 1 to 100 rows and from 1 to 100 columns, with every row the same length.
- Each height is between 0 and 1,000,000, and heights can repeat.
- Aim for O(rows × cols × log(rows × cols)) time.
