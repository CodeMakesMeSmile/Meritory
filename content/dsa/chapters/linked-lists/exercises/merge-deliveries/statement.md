# Two depots, one schedule

A courier has a north depot and a south depot. Each keeps its delivery times as a linked list of minutes after midnight, sorted from earliest to latest. `north` and `south` are the first deliveries of each.

Merge them into one list sorted from earliest to latest, by relinking the nodes you're given, and return its first node.

## Example

With `north = 60 -> 180 -> 300` and `south = 120 -> 240 -> 360`, the merged schedule is `60 -> 120 -> 180 -> 240 -> 300 -> 360`.

## Limits

- From 0 to 50,000 deliveries at each depot, each time between 0 and 1,439.
- Aim for O(n + m) time and O(1) extra memory.
