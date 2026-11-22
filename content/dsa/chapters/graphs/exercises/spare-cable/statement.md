# The first spare cable

A campus has `n` buildings, numbered from 0 to n - 1. Network cables were laid between them in the order listed in `cables`, and each `[a, b]` joins buildings `a` and `b` both ways. A cable is spare if, when it was laid, its two buildings could already reach each other through cables laid before it.

Return the first spare cable, exactly as it appears in `cables`. If no cable was spare, return an empty list.

## Example

With `n = 4` and `cables = [[0, 1], [1, 2], [2, 0], [2, 3]]`, buildings 0 and 2 were already joined through 1 when the cable `[2, 0]` was laid, so the answer is `[2, 0]`.

## Limits

- `n` is between 1 and 10,000, and there are up to 20,000 cables.
- Each cable joins two different buildings. The same pair can be listed twice, and then the second one is spare.
- Aim for close to O(1) time per cable, with union-find, after O(n) to set up.
