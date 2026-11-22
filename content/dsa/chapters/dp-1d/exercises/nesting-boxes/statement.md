# Boxes that nest

A gift shop wants a window display of boxes that sit one inside the next. `boxes[i]` is `[width, height]` for box `i`. A box fits inside another only when it's strictly narrower and strictly shorter. Boxes can't be turned, so a width always stays a width.

Return the most boxes that can sit one inside the next in a single display.

## Example

With `boxes = [[3, 5], [4, 6], [4, 2], [1, 1], [5, 8]]`, the boxes `[1, 1]`, `[3, 5]`, `[4, 6]`, and `[5, 8]` nest, so the answer is 4. `[4, 2]` can't join them, since it's as wide as `[4, 6]` and shorter than `[3, 5]`.

## Limits

- From 1 to 100,000 boxes, each with a width and a height from 1 to 100,000. The same size can appear more than once.
- Aim for O(n log n) time. An O(n²) answer is too slow for 100,000 boxes.
- The reference solution sorts the boxes and then keeps a list of tails, with no recursion.
