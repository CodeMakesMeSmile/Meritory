# How much of the fence is painted

Volunteers paint a long fence along a park. Each one reports the stretch they painted as `[from, to]`, in metres from the gate, in no particular order. Some stretches overlap, where two volunteers painted the same part.

A stretch covers from `from` up to `to`, so `[2, 5]` is 3 metres. Stretches that only touch, like `[2, 5]` and `[5, 8]`, don't overlap and leave no gap, so together they cover 6 metres.

Return how many metres of fence are painted at least once.

## Example

With `stretches = [[0, 4], [2, 6], [10, 12], [11, 15]]`, the first two cover the fence from 0 to 6, which is 6 metres, and the last two cover it from 10 to 15, which is 5 more. The answer is 11.

## Limits

- From 0 to 10,000 stretches.
- Each stretch has `0 <= from < to <= 1,000,000`, so the answer fits in 32 bits.
- Aim for O(n log n) time.
