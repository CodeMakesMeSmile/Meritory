# The earliest the build can finish

A team is building a shed. Task `i` takes `hours[i]` hours, and each `[before, after]` in `needs` means task `after` can't start until task `before` is done. The team has as many people as it needs, so any number of tasks can run at once, and a task starts the moment everything it waits on is done.

Return the fewest hours until every task is done. The pairs never go in a circle, so every task can be done.

## Example

With `hours = [3, 2, 4, 1]` and `needs = [[0, 2], [1, 2], [2, 3]]`, tasks 0 and 1 start at once. Task 2 waits for both, so it starts at hour 3 and ends at hour 7. Task 3 then ends at hour 8. The answer is 8.

## Limits

- From 1 to 10,000 tasks, each taking between 1 and 1,000 hours.
- Up to 20,000 pairs, and a pair can be listed more than once.
- Aim for O(n + m) time, where m is the number of pairs.
