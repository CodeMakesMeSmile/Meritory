# Light, rich, light, rich

A tasting menu is stored as a linked list of course numbers, from the lightest course to the richest, with `courses` as the first. The chef wants the menu to swing back and forth instead: the lightest, then the richest, then the second lightest, then the second richest, and so on toward the middle.

Rearrange the nodes in place into that order. The first course stays first. Return nothing. The list is checked from `courses` after your function runs.

## Example

`1 -> 2 -> 3 -> 4 -> 5 -> 6` becomes `1 -> 6 -> 2 -> 5 -> 3 -> 4`.

`1 -> 2 -> 3 -> 4 -> 5` becomes `1 -> 5 -> 2 -> 4 -> 3`.

The order comes from where each course sits in the list, not from its number.

## Limits

- From 0 to 100,000 courses, each numbered between 1 and 1,000,000. Numbers can repeat.
- The reference solution uses loops, since that's too deep for one recursive call per course.
- Aim for O(n) time and O(1) extra memory, so relink the nodes rather than copying them into an array.
