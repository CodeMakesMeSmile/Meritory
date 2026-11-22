# Where the robot starts looping

A warehouse robot follows a route stored as a linked list of shelf numbers, with `route` as the first stop. At each stop it moves on to the next one. If the last stop points back to an earlier stop, the robot goes round that part of the route forever.

Return the position, counting from 0, of the first stop the robot reaches a second time. That's the stop where the loop starts. If the route ends, return -1.

In the cases, `loopsTo` is the position of the stop the last one points back to, or -1 if the route ends. It's only there to build the list. Your function receives just the first stop.

## Example

With the route `12 -> 7 -> 30 -> 7 -> 18 -> 25` and `loopsTo = 2`, the last stop sends the robot back to the stop holding 30, so the answer is 2. The shelf number 7 comes up twice, but those are two different stops.

## Limits

- From 0 to 10,000 stops, each holding a shelf number between 1 and 100,000.
- `loopsTo` is -1, or a position in the list.
- Aim for O(n) time and O(1) extra memory, without changing the list.
