# Lanterns around the pond

Lanterns stand in a ring around a park pond, and `glow[i]` is how bright lantern `i` is. The last lantern stands next to the first. To save power, the park lights only some of them, and never two lanterns that stand next to each other, since their light would overlap.

Return the most total brightness the park can light.

## Example

With `glow = [3, 10, 3, 1, 2]`, lighting the lanterns with 10 and 2 gives 12. Those two aren't neighbours, since the 2 is next to the 1 and to the first 3.

## Limits

- From 1 to 100,000 lanterns, each with a brightness from 0 to 10,000.
- A ring of one lantern can light it, since it has no other lantern next to it.
- Aim for O(n) time and O(1) extra memory. The reference solution solves a straight row twice in a loop, so it doesn't recurse.
