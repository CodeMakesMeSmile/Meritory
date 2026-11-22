# Build steps that wait in a circle

A software build has `n` steps, numbered from 0 to n - 1. Each pair `[a, b]` in `waits` means step `a` can't start until step `b` is done. If some steps wait on each other in a circle, the build can never finish.

Return `true` if the waits go in a circle anywhere, and `false` if every step can run sooner or later.

Two waits that lead to the same step aren't a circle. If step 0 waits on steps 1 and 2, and both of those wait on step 3, every step can still run.

## Example

With `n = 4` and `waits = [[0, 1], [1, 2], [2, 0], [3, 2]]`, step 0 waits on 1, 1 waits on 2, and 2 waits on 0, so none of those three can ever start. The answer is `true`. Step 3 is stuck too, but only because it waits on the circle.

## Limits

- `n` is between 1 and 10,000, and there are up to 20,000 pairs.
- A step can wait on itself, which counts as a circle.
- Aim for O(n + m) time, where m is the number of pairs.
