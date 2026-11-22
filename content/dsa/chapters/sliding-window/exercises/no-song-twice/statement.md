# No song twice

A radio station's log lists the `songs` it played in order, each as a number for the track. Return the length of the longest stretch of songs in a row in which no song played twice, or 0 if the log is empty.

## Example

With `songs = [4, 7, 4, 2, 9, 7, 2]`, the stretch `[4, 2, 9, 7]` has no repeats, and every longer stretch repeats a song, so the answer is 4.

## Limits

- Up to 100,000 songs, each a number between 1 and 100,000.
- Aim for O(n) time.
