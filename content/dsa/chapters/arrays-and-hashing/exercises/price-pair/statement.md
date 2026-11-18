# Two prices for a gift card

You have a gift card worth `target` and a list of item `prices`. Find two different items whose prices add up to exactly `target`, and return their positions as `[i, j]`, with `i` before `j`.

If more than one pair works, return the pair whose second position `j` comes first, and for that `j`, the smallest `i`. If no pair works, return an empty list.

## Example

With `prices = [5, 3, 7, 3]` and `target = 6`, the answer is `[1, 3]`, since 3 + 3 = 6.

## Limits

- Up to 100,000 prices.
- Each price and the target are between -1,000,000,000 and 1,000,000,000.
- Aim for O(n) time.
