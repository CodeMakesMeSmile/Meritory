# Odd seats first

A wedding planner keeps the guest list as a linked list of guest numbers, with `guests` as the first. Guests in odd positions, counting from 1, sit at the top table, and guests in even positions sit at the side table. The planner wants the list grouped that way: every guest in an odd position first, then every guest in an even position, each group in its old order.

Relink the nodes into that order and return the new first guest.

## Example

`1 -> 2 -> 3 -> 4 -> 5` becomes `1 -> 3 -> 5 -> 2 -> 4`.

`9 -> 3 -> 8 -> 1 -> 7` becomes `9 -> 8 -> 7 -> 3 -> 1`. The groups come from positions, not from the guest numbers.

## Limits

- From 0 to 100,000 guests, each numbered between 1 and 1,000,000. Numbers can repeat.
- Aim for one pass, O(n) time, and O(1) extra memory, so relink the nodes rather than copying them into an array.
