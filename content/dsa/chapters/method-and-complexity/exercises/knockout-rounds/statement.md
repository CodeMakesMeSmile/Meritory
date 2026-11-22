# Rounds in a knockout

A table tennis club runs a knockout tournament for `players` people. In each round, the players still in pair off, and the loser of every game leaves. If an odd number are left, one player sits that round out and goes through to the next.

Return how many rounds it takes until one winner is left.

## Example

With `players = 5`, the first round has two games and one player sitting out, leaving 3. The second round has one game, leaving 2, and the third round leaves the winner. The answer is 3.

## Limits

- `players` is from 1 to 2,147,483,647, the largest 32-bit int. With one player, no rounds are needed.
- Counting down one player at a time is far too slow at this size. Say how many times your loop runs, in Big O.
- Watch the largest value. Adding 1 to it before halving overflows a 32-bit int in Java and C.
