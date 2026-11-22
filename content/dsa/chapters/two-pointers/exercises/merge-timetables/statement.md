# Two timetables in one

Two bus routes stop at the same corner. The departure times for each route, `first` and `second`, are in minutes after midnight and sorted from earliest to latest. Return one list of every departure from both routes, sorted from earliest to latest. When both routes leave at the same minute, list the time twice.

## Example

With `first = [5, 20, 40]` and `second = [10, 20, 55]`, the answer is `[5, 10, 20, 20, 40, 55]`.

## Limits

- Up to 100,000 times in each list, each between 0 and 1,439.
- Aim for O(n + m) time, without sorting the combined list.
