# Fewest ferry rides

A group of `n` islands, numbered from 0 to n - 1, is linked by ferry `routes`. Each `[a, b]` is a ferry that runs both ways between islands `a` and `b`.

Return the fewest ferry rides it takes to get from island `start` to island `goal`. If you're already there, that's 0 rides. If no chain of ferries links them, return -1.

## Example

With `n = 6`, `routes = [[0, 1], [1, 2], [2, 5], [0, 3], [3, 4], [4, 5], [0, 4]]`, `start = 0`, and `goal = 5`, riding from 0 to 4 and then from 4 to 5 takes 2 rides. Every other way takes 3, so the answer is 2.

## Limits

- `n` is between 1 and 10,000, and there are up to 20,000 routes.
- Each route joins two different islands.
- Aim for O(n + m) time, where m is the number of routes.
