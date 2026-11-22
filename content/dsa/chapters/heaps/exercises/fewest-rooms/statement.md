# Rooms for every tutoring session

A tutoring centre books `sessions`, each as `[start, end]` in minutes from the start of the week. Two sessions can't share a room at the same time, but a session that ends at a given minute frees its room for one that starts at that same minute.

Return the fewest rooms that fit every session.

## Example

With `sessions = [[540, 600], [560, 620], [600, 660]]`, the first two overlap, so they need two rooms. The third starts at minute 600, just as the first one ends, so it takes that room. The answer is 2.

## Limits

- From 0 to 10,000 sessions, in no particular order.
- Each session has `0 <= start < end <= 10,080`.
- Aim for O(n log n) time.
