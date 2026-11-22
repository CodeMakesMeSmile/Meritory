# How far the news travels

In an office of `n` people, numbered from 0 to n - 1, `tells` lists who passes news on to whom. Each `[a, b]` means that when `a` hears some news, they tell `b`. It only goes that way, so `b` doesn't tell `a` unless the list says so too.

Person `start` hears some news. Return how many people end up hearing it, counting `start`.

## Example

With `n = 5`, `tells = [[0, 1], [1, 2], [3, 0]]`, and `start = 0`, person 0 tells 1, and 1 tells 2. Person 3 would tell 0, but nobody tells 3. The answer is 3.

## Limits

- `n` is between 1 and 10,000, and `tells` holds up to 20,000 pairs.
- Each pair names two different people, and a pair can be listed more than once.
- The news can pass along a chain of everyone, which is too deep for recursion in Python, so the reference solution keeps its own stack.
- Aim for O(n + m) time, where m is the number of pairs.
