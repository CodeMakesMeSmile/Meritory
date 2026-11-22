# Every way to pack the bag

A hiker has laid out her gear for a day walk, and `items` lists each piece by its weight in grams. No two pieces weigh the same. List every set of pieces she could pack, from packing nothing at all to packing everything.

Write each set with its weights in the same order they appear in `items`. Return the sets in any order.

## Example

With `items = [4, 7, 2]`, there are 8 sets: `[]`, `[4]`, `[7]`, `[2]`, `[4, 7]`, `[4, 2]`, `[7, 2]`, and `[4, 7, 2]`. Writing `[2, 4]` instead of `[4, 2]` would be wrong, because 4 comes before 2 in `items`.

## Limits

- From 0 to 10 items, so there are at most 1,024 sets. With no items, the only set is the empty one.
- Each weight is between 1 and 1,000, and no two are the same.
- The recursion is at most 11 calls deep, so a recursive answer is safe in every language.
- Aim for O(n × 2ⁿ) time.
