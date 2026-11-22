# Walking against the one way streets

An old town has `n` junctions, numbered from 0 to n - 1. Each `[a, b]` in `streets` is a one way street that cars and bikes can only ride from junction `a` to junction `b`.

A courier on a bike wants to get from junction `start` to junction `goal`. Riding along a street the right way is fine. Going the wrong way is allowed only on foot, pushing the bike, which is slow. Return the fewest streets the courier has to walk along the wrong way. If no streets join the two junctions at all, even walking, return -1.

## Example

With `n = 4`, `streets = [[1, 0], [1, 2], [3, 2]]`, `start = 0`, and `goal = 3`, the courier walks from 0 to 1 against the first street, rides from 1 to 2, then walks from 2 to 3 against the last street. The answer is 2.

## Limits

- `n` is between 1 and 10,000, and there are up to 20,000 streets.
- Each street joins two different junctions, and a pair can be listed more than once, even both ways.
- `start` and `goal` can be the same junction, and then the answer is 0.
- Aim for O(n + m) time, where m is the number of streets.
