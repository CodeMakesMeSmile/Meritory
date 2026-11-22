# Pots for the seedlings

A community garden is moving seedlings into pots. Seedling `i` needs a pot at least `seedlings[i]` centimetres across, and pot `j` is `pots[j]` centimetres across. Each pot holds one seedling, and a pot exactly as wide as a seedling needs is fine.

Return the most seedlings that can be potted.

## Example

With `seedlings = [4, 9, 6, 12]` and `pots = [5, 10, 6, 3, 7]`, the seedling needing 4 takes the 5 centimetre pot, the one needing 6 takes the 6, and the one needing 9 takes the 10. No pot is wide enough for the seedling needing 12, so the answer is 3.

## Limits

- From 0 to 100,000 seedlings and from 0 to 100,000 pots.
- Each size is between 1 and 10,000.
- Aim for O(n log n + m log m) time.
