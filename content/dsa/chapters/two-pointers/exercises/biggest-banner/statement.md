# Biggest banner between two posts

A row of fence posts stands one metre apart, and `heights[i]` is the height of post `i` in metres. You can hang a rectangular banner between any two posts. It's as wide as the distance between them, and as tall as the shorter of the two.

Return the largest banner area you can hang, or 0 if there are fewer than two posts.

## Example

With `heights = [3, 1, 6, 4, 5, 2]`, the posts at positions 0 and 4 are 4 metres apart, and the shorter one is 3 metres tall, so the banner is 12 square metres. No other pair does better, so the answer is 12.

## Limits

- Up to 100,000 posts, each between 0 and 10,000 metres tall.
- Aim for O(n) time and O(1) extra memory.
