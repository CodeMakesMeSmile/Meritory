# A song hidden in the bird calls

A bird watcher records the calls she hears at dawn as letters in `calls`, one letter for each kind of call. A species is known for a short song, `song`, and she wants to know how strongly the song shows up in the recording. The song is heard when some of the calls, taken in order but not necessarily side by side, spell out the song exactly.

Count the different ways to pick calls that spell the song. Two ways are different when they pick a different set of positions in `calls`. Return the count modulo 1,000,000,007.

## Example

With `calls = "abcbc"` and `song = "abc"`, there are 3 ways: positions 0, 1, and 2, positions 0, 1, and 4, and positions 0, 3, and 4.

## Limits

- `calls` has from 1 to 1,000 lowercase letters, and `song` has from 1 to 100.
- If `song` is longer than `calls`, there are no ways, so return 0.
- Aim for O(n × m) time and O(m) memory, where n and m are the lengths of `calls` and `song`.
- The reference solution keeps one row in loops, so it doesn't recurse.
- Take the modulo after every addition, and add in a 64-bit type in Java and C.
