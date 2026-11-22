# Joining cables for the least work

A stage crew has pieces of cable with the given `lengths`, and needs them joined into one long cable. They join two pieces at a time, and a join takes as many minutes as the two pieces' total length. A joined piece can be joined again.

Return the fewest minutes it can take to join every piece into one. A single piece needs no joins.

## Example

With `lengths = [4, 3, 2, 6]`, join 2 and 3 in 5 minutes, then 4 and that 5 in 9 minutes, then 6 and that 9 in 15 minutes. That's 29 minutes, and no other order is quicker.

## Limits

- From 1 to 10,000 pieces, each between 1 and 1,000,000,000 long.
- The answer can be too big for 32 bits, so it's a 64-bit number.
- Aim for O(n log n) time.
