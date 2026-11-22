# A strand that mirrors

A bracelet maker strings beads on a thread and records the pattern as a linked list of colour codes, with `beads` as the first bead. A pattern looks right on the wrist when it reads the same from either end.

Return `true` if the colour codes read the same forward and backward, and `false` otherwise. You may change pointers while you check, but put the list back the way it was before you return.

## Example

`1 -> 2 -> 2 -> 1` and `3 -> 1 -> 4 -> 1 -> 3` both return `true`.

`1 -> 2 -> 3 -> 1` returns `false`. The ends match, but 2 and 3 don't.

## Limits

- From 1 to 100,000 beads, each colour code between 0 and 9.
- The reference solution uses loops, since that's too deep for one recursive call per bead.
- Aim for O(n) time and O(1) extra memory, so no copying the codes into an array.
