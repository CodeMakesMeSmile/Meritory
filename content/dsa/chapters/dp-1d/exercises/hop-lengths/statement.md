# Jumps of set lengths

A board game piece starts on square 0 of a track and moves toward square `distance`. Each move, it jumps forward by one of the lengths in `hops`. The order of the jumps matters, so jumping 1 and then 3 is different from jumping 3 and then 1.

Return how many different sequences of jumps take the piece from square 0 to exactly square `distance`, modulo 1,000,000,007. If no sequence lands exactly on it, return 0.

## Example

With `distance = 5` and `hops = [1, 3]`, there are 4 sequences. The piece can make five jumps of 1, or one jump of 3 and two of 1, with the 3 first, in the middle, or last.

## Limits

- `distance` is from 1 to 10,000.
- From 1 to 20 hop lengths, each from 1 to 1,000, and no two the same.
- Aim for O(distance × h) time, where h is the number of hop lengths.
- The reference solution fills a table from square 0 up. A top-down recursion with a memo would go up to 10,000 calls deep, which is too deep for Python's default limit.
- Take the modulo after every addition, and add in a 64-bit type in Java and C.
