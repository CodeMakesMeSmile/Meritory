# Every bead pattern, once

A jeweller threads all of `beads` onto a string, where each number is a bead's colour. Beads of the same colour look exactly alike, so two strings that only swap beads of the same colour look the same.

Return every different pattern, each as the list of colours from one end of the string to the other. List each pattern once, and return the patterns in any order.

## Example

With `beads = [1, 1, 2]`, the patterns are `[1, 1, 2]`, `[1, 2, 1]`, and `[2, 1, 1]`. Swapping the two beads of colour 1 doesn't make a new pattern.

## Limits

- From 0 to 7 beads, so there are at most 5,040 patterns. With no beads, there's one pattern, the empty one.
- Each colour is a number from 1 to 20.
- The recursion is at most 8 calls deep, so a recursive answer is safe in every language.
- Aim for O(n² × p) time, where p is the number of patterns, which means never building the same pattern twice.
