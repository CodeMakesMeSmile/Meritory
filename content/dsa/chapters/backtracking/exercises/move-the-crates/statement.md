# Move the crate stack

A warehouse has three bays, numbered 1, 2, and 3. Bay `start` holds a stack of `count` crates, each a different size, with every crate smaller than the one below it. A forklift moves one crate at a time, from the top of one bay to the top of another, and it can never put a crate on top of a smaller one.

Move the whole stack to bay `goal` in the fewest moves. Return the moves in order, each as `[from, to]`. There's only one shortest list of moves, so the answer is exactly that list.

## Example

With `count = 2`, `start = 1`, and `goal = 3`, the small crate goes to bay 2, the big crate goes to bay 3, and the small crate goes back on top of it. The answer is `[[1, 2], [1, 3], [2, 3]]`.

## Limits

- `count` is from 0 to 10, so there are at most 1,023 moves. With no crates, there are no moves.
- `start` and `goal` are two different bays from 1 to 3.
- The recursion is at most 11 calls deep, so a recursive answer is safe in every language.
- n crates always take 2ⁿ - 1 moves, so aim for O(2ⁿ) time, with constant work per move.
