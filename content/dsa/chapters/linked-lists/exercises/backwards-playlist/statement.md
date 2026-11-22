# Play it backwards

A music app stores a playlist as a linked list of song ids. `songs` is the first song, and each song points to the one that plays after it. A listener wants to hear the playlist from the last song to the first.

Turn the list around by changing its pointers, and return the new first song.

## Example

The playlist `3 -> 8 -> 1 -> 6 -> 4` becomes `4 -> 6 -> 1 -> 8 -> 3`, so you return the song with id 4.

## Limits

- From 0 to 100,000 songs, each id between 1 and 1,000,000,000.
- That's too deep for one recursive call per song, so the reference solution walks the list with a loop.
- Aim for O(n) time and O(1) extra memory.
