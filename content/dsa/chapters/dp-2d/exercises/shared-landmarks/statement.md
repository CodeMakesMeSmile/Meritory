# Landmarks both hikers passed

Two hikers took different routes through the same park, and each one's watch logged the landmarks they passed, in order, as numbers. `first` is one hiker's log and `second` is the other's. A landmark can show up more than once in a log, if a hiker passed it twice.

Return the length of the longest list of landmarks that both hikers passed in that same order. The landmarks in the list don't have to come one right after another in either log.

## Example

With `first = [4, 7, 2, 9, 5]` and `second = [7, 4, 9, 1, 5]`, both hikers passed 7, then 9, then 5, so the answer is 3. They also both passed 4, 9, and 5 in that order. No list of 4 landmarks works.

## Limits

- Each log has from 1 to 1,000 landmarks, and each landmark is a number from 1 to 1,000,000.
- Aim for O(n × m) time, where n and m are the lengths of the two logs.
- The reference solution fills a table row by row, so it doesn't recurse.
