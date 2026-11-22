# As many cakes on time as possible

A cake shop has one oven and a list of `orders`, each as `[bake, due]`. The cake takes `bake` minutes, and it's on time if it comes out of the oven by minute `due`. The oven starts at minute 0, bakes one cake at a time, and can start the next cake the moment one comes out. The shop can turn orders down.

Return the most orders that can come out on time.

## Example

With `orders = [[3, 5], [2, 4], [4, 7], [1, 8]]`, bake the 2 minute cake first, which comes out at minute 2. Then the 3 minute cake comes out at 5, and the 1 minute cake at 6. All three are on time. There's no way to fit the 4 minute cake in as well, so the answer is 3.

## Limits

- From 0 to 10,000 orders.
- Each `bake` is between 1 and 10,000, and each `due` is between 1 and 100,000,000.
- Aim for O(n log n) time.
