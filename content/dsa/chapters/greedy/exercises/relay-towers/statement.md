# The fewest relays to the far tower

A message starts at tower 0 of a line of radio towers in the hills, and it has to reach the last tower. Tower `i` can send it to any tower up to `power[i]` towers farther down the line. Each send is one relay. A tower with a `power` of 0 can't send at all.

Return the fewest relays that get the message to the last tower, or -1 if it can't get there. With only one tower, the message is already there, so the answer is 0.

## Example

With `power = [3, 1, 4, 1, 1, 2, 1]`, tower 0 can send to tower 2, and tower 2 can send 4 towers on, to tower 6, the last one. Tower 0 can't reach tower 6 in one relay, so the answer is 2.

## Limits

- From 1 to 100,000 towers.
- Each `power` is between 0 and 100,000.
- Aim for O(n) time and O(1) extra memory.
