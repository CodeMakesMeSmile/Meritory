# The most scenic way down the mountain

A ski area has `n` huts, numbered from 0 to n - 1. Each `[from, to, views]` in `runs` is a ski run from hut `from` down to hut `to`, with a score for how good its views are. Every run goes downhill, so there's no way to ski in a circle.

A skier starts at hut `start` and wants to end at hut `goal`, taking any runs on the way. Return the highest total views score of any way down from `start` to `goal`. If no runs lead from `start` to `goal`, return -1. If `start` is `goal`, the skier is already there, and the answer is 0.

## Example

With `n = 5`, `runs = [[0, 1, 3], [0, 2, 7], [1, 3, 8], [2, 3, 2], [3, 4, 4], [1, 4, 6]]`, `start = 0`, and `goal = 4`, going through huts 1 and 3 scores 3 + 8 + 4 = 15. That beats going through huts 2 and 3 for 13, and through hut 1 alone for 9. The answer is 15.

## Limits

- `n` is between 1 and 10,000, and there are up to 20,000 runs.
- Each views score is between 1 and 1,000, and two runs can join the same pair of huts.
- Aim for O(n + m) time, where m is the number of runs.
