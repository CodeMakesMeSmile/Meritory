# A hunt that never ends

A scavenger hunt app stores its clues as a linked list, with `clues` as the first clue, and each clue points to the next one. The last clue should point to nothing, which ends the hunt. A mistake in the editor can make the last clue point back to an earlier clue instead, and then players go round forever.

Return `true` if following the clues from the first one never ends, and `false` if it does.

In the cases, `loopsTo` is the position, counting from 0, of the clue the last one points back to, or -1 if the hunt ends. It's only there to build the list. Your function receives just the first clue.

## Example

With clues `3 -> 1 -> 4 -> 1 -> 5` and `loopsTo = 1`, the last clue points back to the second one, so the answer is `true`. With `loopsTo = -1`, the answer is `false`.

Two clues can hold the same number, so the numbers alone can't tell you whether you've been somewhere before.

## Limits

- From 0 to 10,000 clues, each holding a number between 1 and 100,000.
- `loopsTo` is -1, or a position in the list.
- Aim for O(n) time and O(1) extra memory.
