# A ticket line from two stacks

A help desk hands out numbered tickets and serves them in the order they were taken. Its system only offers stacks, lists where you add and remove at the same end. Build a `TicketQueue` that starts empty, using only two stacks, with these calls.

- `join(ticket)` adds a ticket to the back of the line.
- `serve()` removes the ticket at the front and returns it.
- `front()` returns the ticket at the front without removing it.
- `size()` returns how many tickets are waiting.

Over any run of calls, each call should take O(1) time on average. `serve` and `front` are only called when at least one ticket is waiting.

## Example

After `join(11)`, `join(12)`, and `join(13)`, `serve()` returns 11. Then after `join(14)`, `front()` returns 12 and `size()` returns 3.

## Limits

- Up to 100,000 calls in all.
- Each ticket is between 1 and 1,000,000,000.
