# The median after every delivery

A delivery app shows each driver the median of their delivery times so far today, updated after every delivery. Given the `times` in minutes, in the order the deliveries happened, return the median after each one.

The median is the middle time once they're sorted. With an even number of times, it's the mean of the two middle ones, so it can end in .5.

## Example

With `times = [12, 4, 9, 30]`, the medians are 12, then 8, the mean of 4 and 12, then 9, then 10.5, the mean of 9 and 12. The answer is `[12, 8, 9, 10.5]`.

## Limits

- From 0 to 100,000 times, each between 1 and 100,000.
- Aim for O(n log n) time.
