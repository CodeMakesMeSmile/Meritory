# The middle stop

A bus route is stored as a linked list of stop numbers, and `stops` is the first stop. Drivers swap over at the middle stop of the route. When the route has an even number of stops, there are two middle stops, and the swap happens at the later one.

Return the number of the stop where the drivers swap.

## Example

With `stops = 4 -> 8 -> 15 -> 16 -> 23`, the middle stop is 15.

With `stops = 4 -> 8 -> 15 -> 16 -> 23 -> 42`, the two middle stops are 15 and 16, so the answer is 16.

## Limits

- From 1 to 100,000 stops, each numbered between 1 and 1,000,000. Numbers can repeat.
- Aim for one pass, without counting the stops first, and O(1) extra memory.
