# The k-th quickest delivery

A courier logs each delivery's `times` in minutes, in no particular order. Given a whole number `k`, return the k-th quickest time, where `k = 1` is the quickest of all. Repeated times each count, so in `[5, 3, 3]` the second quickest time is 3.

## Example

With `times = [7, 2, 9, 4, 5]` and `k = 2`, the times in order are 2, 4, 5, 7, and 9, so the answer is 4.

## Limits

- From 1 to 100,000 times, each between 1 and 1,000,000,000.
- `k` is between 1 and the number of times.
- Aim for O(n) time on average, without sorting the whole list.
