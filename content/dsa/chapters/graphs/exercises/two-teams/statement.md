# Two teams with no rivals together

A charity match needs `n` players, numbered from 0 to n - 1, split into two teams. Some players are rivals, listed in `rivals` as pairs `[a, b]`, and rivals must play on different teams. Everyone plays, and a team can be any size.

Return `true` if the players can be split this way, and `false` if they can't.

## Example

With `n = 4` and `rivals = [[0, 1], [1, 2], [2, 3]]`, players 0 and 2 can be one team, and 1 and 3 the other, so the answer is `true`. Adding the pair `[2, 0]` would make it `false`, since 0, 1, and 2 would all need different teams.

## Limits

- `n` is between 1 and 10,000, and `rivals` holds up to 20,000 pairs.
- Each pair names two different players, and a pair can be listed more than once.
- The reference solution keeps its own stack, since a chain of rivals can be too deep for recursion in Python.
- Aim for O(n + m) time, where m is the number of pairs.
