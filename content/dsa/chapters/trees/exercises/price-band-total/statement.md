# Prices in a band

A market stall keeps its prices in cents as a binary search tree, with `prices` as the root. Every price in a node's left branch is lower than the node's price, every price in its right branch is higher, and no price appears twice.

Return the total of every price from `low` to `high`, including both ends. Use the order of the tree to skip branches that can't hold any price in the band.

## Example

```text
[40, 20, 60, 10, 30, 50, 70]

        40
       /  \
     20    60
    /  \   / \
   10  30 50  70
```

With `low = 25` and `high = 55`, the prices in the band are 30, 40, and 50, so the answer is 120. 20 is below the band, so nothing on its left can be in it, and 60 is above it, so nothing on its right can be. 10 and 70 never need a look.

## Limits

- From 0 to 10,000 prices, each between 1 and 100,000, all different.
- `1 <= low <= high <= 100,000`.
- The tree is at most 500 levels deep, so a recursive answer is safe in every language.
- Aim to visit only the nodes that can lead to a price in the band.
