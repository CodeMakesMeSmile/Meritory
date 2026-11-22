# Where the dial stops

A puzzle box has a dial with `size` positions, numbered from 0 to `size - 1`. The dial starts at position 1, or at 0 if the dial has only one position. Each turn moves it from position p to position (p × `factor`) modulo `size`.

Return the position after `turns` turns.

## Example

With `factor = 3`, `turns = 4`, and `size = 7`, the dial goes 1, 3, 2, 6, and then 4, so the answer is 4. That's 3 to the power 4, which is 81, modulo 7.

## Limits

- `factor` is from 0 to 2,147,483,647, and `size` is from 1 to 2,147,483,647.
- `turns` is from 0 to 1,000,000,000,000,000, so one turn at a time is far too slow. Aim for O(log turns).
- A product of two positions can reach almost 2⁶², which fits a 64-bit integer but not an exact TypeScript number, so use `BigInt` there.
