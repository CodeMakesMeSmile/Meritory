# Minutes both stations were on air

Two community radio stations share a transmitter, and each keeps a log of its broadcasts, `first` and `second`, as `[start, end]` in minutes. Each log is sorted by start, and within one log no two broadcasts overlap or touch. A broadcast covers its start and runs up to its end.

Return the total number of minutes when both stations were on air. Broadcasts that only touch, like one that ends at 60 and one that starts at 60, add nothing.

## Example

With `first = [[0, 30], [45, 90]]` and `second = [[20, 50], [60, 120]]`, both stations were on air from 20 to 30, from 45 to 50, and from 60 to 90. That's 10, 5, and 30 minutes, so the answer is 45.

## Limits

- From 0 to 10,000 broadcasts in each log.
- Each broadcast has `0 <= start < end <= 1,000,000`, so the answer fits in 32 bits.
- Aim for O(n + m) time and O(1) extra memory.
