# Every finishing time in one list

A fun run starts in waves. Each wave's finishing times, in seconds, are sorted from fastest to slowest, and `waves` holds each wave's list. A wave where nobody finished has an empty list.

Return every finishing time in one list, sorted from fastest to slowest.

## Example

With `waves = [[301, 340, 412], [298, 355], [320, 333, 400]]`, the answer is `[298, 301, 320, 333, 340, 355, 400, 412]`.

## Limits

- From 0 to 1,000 waves, with up to 100,000 times in all, each between 1 and 100,000.
- Aim for O(N log k) time, where N is the number of times and k is the number of waves.
