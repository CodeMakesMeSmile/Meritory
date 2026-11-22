# The fewest trips to read the gauges

A technician reads water gauges along a canal. Each gauge has to be read once, at any minute inside its window `[open, close]`, and the window includes both `open` and `close`. On a trip at a given minute, the technician reads every gauge whose window includes that minute. So windows `[10, 20]` and `[20, 30]` can share one trip at minute 20.

Return the fewest trips that read every gauge.

## Example

With `windows = [[1, 6], [2, 8], [7, 12], [10, 16]]`, a trip at minute 6 reads the first two gauges, and a trip at minute 12 reads the last two. One trip can't read them all, since the first window closes before the third opens. The answer is 2.

## Limits

- From 0 to 10,000 gauges.
- Each window has `0 <= open <= close <= 1,000,000`, so a window can be a single minute.
- Aim for O(n log n) time.
