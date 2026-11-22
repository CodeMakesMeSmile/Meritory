# The cheapest way up the tower

A lookout tower charges a toll on each landing of its stairs, and `tolls[i]` is the toll for landing `i`. You pay the toll of every landing you stand on. You can start on landing 0 or landing 1, and from any landing you climb up one or two landings. The roof is one landing above the last one, and it's free.

Return the least you can pay to reach the roof.

## Example

With `tolls = [8, 2, 9, 1, 5, 7]`, start on landing 1 and pay 2, climb two to landing 3 and pay 1, climb one to landing 4 and pay 5, then climb two to the roof. That's 8 in all, and no climb costs less.

## Limits

- From 2 to 1,000 landings, each with a toll from 0 to 999.
- Aim for O(n) time and O(1) extra memory. The reference solution keeps the last two costs in a loop, so it doesn't recurse.
