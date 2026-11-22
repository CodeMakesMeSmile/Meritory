# Drill pairs with a set total

A coach wants to pair players for a drill so that each pair's skill `ratings` add up to exactly `target`. The ratings are in no particular order, and players can share a rating.

Return every different pair of ratings `[a, b]`, with `a` at most `b`, that two different players could make. List each pair of ratings only once, even when more than one pair of players makes it. Return the pairs in any order.

## Example

With `ratings = [4, 1, 3, 2, 3, 5, 1]` and `target = 6`, the pairs are 1 and 5, 2 and 4, and 3 and 3, since two players are rated 3. The answer is `[[1, 5], [2, 4], [3, 3]]`. Two players are rated 1, but the pair 1 and 5 is listed once.

## Limits

- Up to 100,000 ratings, each between -1,000,000 and 1,000,000.
- `target` is between -2,000,000 and 2,000,000.
- Aim for O(n log n) time.
