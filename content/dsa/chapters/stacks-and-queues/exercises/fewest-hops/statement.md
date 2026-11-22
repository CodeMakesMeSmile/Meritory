# Fewest hops across the pond

A frog crosses a pond on a row of stepping stones. It starts on stone 0 and wants to reach the last stone. From stone `i`, it can hop exactly `stones[i]` stones forward or exactly `stones[i]` stones back, as long as it lands on a stone in the row. A stone marked 0 is a dead end, since the frog can't hop from it.

Return the fewest hops the frog needs to reach the last stone, or -1 if it can't get there.

## Example

With `stones = [2, 4, 1, 1, 3, 2]`, the frog can hop from stone 0 to stone 2, back to stone 1, then forward 4 to stone 5. That's 3 hops, and there's no way to do it in fewer, so the answer is 3.

## Limits

- From 1 to 100,000 stones, each between 0 and 100,000.
- Aim for O(n) time.
