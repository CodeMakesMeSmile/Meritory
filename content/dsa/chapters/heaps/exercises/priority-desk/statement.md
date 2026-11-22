# The most urgent repair first

A repair desk gives every job an urgency number, and a lower number means more urgent. Build a `RepairDesk` that starts empty, with these calls.

- `add(urgency)` adds a job.
- `next()` removes the most urgent job and returns its urgency.
- `peek()` returns the most urgent job's urgency without removing it.
- `size()` returns how many jobs are waiting.

Keep the jobs in a binary heap stored in an array, and write sift up and sift down yourself, so that `add` and `next` each take O(log n). In Python and Java, try it without `heapq` or `PriorityQueue`. `next` and `peek` are only called when at least one job is waiting.

## Example

After `add(5)`, `add(2)`, and `add(8)`, `peek()` returns 2. Then `next()` returns 2, the next `next()` returns 5, and `size()` returns 1.

## Limits

- Up to 100,000 calls in all.
- Each urgency is between 0 and 1,000,000,000, and urgencies can repeat.
