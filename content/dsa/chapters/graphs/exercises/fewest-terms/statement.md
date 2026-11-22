# The fewest terms to finish a course

A course has `n` modules, numbered from 0 to n - 1. Each pair `[before, after]` in `prerequisites` means `before` must be passed in an earlier term than `after`. A student can take any number of modules in one term, as long as each one's prerequisites were all passed in earlier terms.

Return the fewest terms it takes to pass every module. If the prerequisites go in a circle, so some module can never be taken, return -1.

## Example

With `n = 5` and `prerequisites = [[0, 2], [1, 2], [2, 3], [1, 4]]`, modules 0 and 1 go in the first term, 2 and 4 in the second, and 3 in the third. The answer is 3.

## Limits

- `n` is between 1 and 10,000, and there are up to 20,000 pairs.
- A pair can be listed more than once. A module can even list itself, which means it can never be taken.
- Aim for O(n + m) time, where m is the number of pairs.
