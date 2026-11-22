# The fewest tokens for the fare

An old tram takes tokens instead of cards. Tokens come in the values listed in `tokens`, with no value listed twice, and you have as many of each as you like. The machine gives no change, so the tokens must add up to exactly `fare`.

Return the fewest tokens that make exactly `fare`, or -1 if no mix of tokens can.

## Example

With `tokens = [1, 3, 4]` and `fare = 6`, two tokens of 3 work. Starting with the 4 would need two tokens of 1 after it, which is three tokens, so the answer is 2.

## Limits

- From 1 to 12 token values, each from 1 to 10,000, and no two the same.
- `fare` is from 0 to 10,000. A fare of 0 needs no tokens.
- Aim for O(fare × t) time, where t is the number of token values.
- The reference solution fills a table from 0 up to `fare`, so it doesn't recurse.
