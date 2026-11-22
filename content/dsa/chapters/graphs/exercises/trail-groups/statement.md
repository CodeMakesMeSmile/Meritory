# Groups of campsites

A park has `n` campsites, numbered from 0 to n - 1, and a list of `trails`. Each `[a, b]` is a footpath between campsites `a` and `b`, and it can be walked either way. Campers can walk from one campsite to another when some chain of trails joins them.

Return how many separate groups of campsites there are. Campers can walk between any two campsites in the same group, but never from one group to another. A campsite with no trails is a group by itself.

## Example

With `n = 6` and `trails = [[0, 1], [1, 2], [3, 4]]`, the groups are 0, 1, and 2, then 3 and 4, then 5 alone. The answer is 3.

## Limits

- `n` is between 1 and 10,000, and there are up to 20,000 trails.
- Each trail joins two different campsites, and the same trail can be listed more than once.
- One group can be a chain of every campsite, which is too deep for recursion in Python, so the reference solution keeps its own stack.
- Aim for O(n + m) time, where m is the number of trails.
