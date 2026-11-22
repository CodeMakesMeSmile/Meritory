# Rain held between walls

A garden has a row of stone walls, each one unit wide, and `walls[i]` is the height of wall `i`. After heavy rain, water settles in the dips.

The water level over a position is the lower of the tallest wall on its left and the tallest wall on its right. The position holds that level minus its own wall's height, or nothing if its own wall reaches the level. The first and last walls hold nothing, since water past them runs away.

Return the total units of water the garden holds.

## Example

With `walls = [3, 0, 2, 0, 4]`, the water level over positions 1 to 3 is 3, the lower of the walls at the two ends. Position 1 holds 3, position 2 holds 1 above its wall of 2, and position 3 holds 3, so the answer is 7.

## Limits

- Up to 100,000 walls, each between 0 and 10,000 units tall.
- Aim for O(n) time and O(1) extra memory.
