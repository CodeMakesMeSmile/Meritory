# The middle reading so far

A weather station sends temperature readings one at a time. Build a `MedianBoard` that starts empty, with these calls.

- `record(reading)` adds one reading.
- `median()` returns the median of every reading so far.

The median is the middle reading once they're sorted. With an even number of readings, it's the mean of the two middle ones, so it can end in .5. `median` is only called after at least one reading.

## Example

After `record(5)`, `median()` returns 5. After `record(15)`, it returns 10. After `record(1)`, it returns 5, and after `record(3)`, it returns 4, the mean of 3 and 5.

## Limits

- Up to 100,000 calls in all.
- Each reading is between -1,000,000 and 1,000,000.
- Aim for O(log n) time per `record` and O(1) per `median`.
