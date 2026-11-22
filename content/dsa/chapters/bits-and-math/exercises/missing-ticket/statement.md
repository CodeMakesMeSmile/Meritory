# The missing raffle ticket

A school raffle printed tickets numbered from 0 up to n, one of each. One ticket went missing, and `tickets` holds the n that are left, in no particular order.

Return the number on the missing ticket.

## Example

With `tickets = [3, 0, 1]`, there are 3 tickets left, so the raffle printed 0 to 3. Ticket 2 is the one that's missing.

## Limits

- `tickets` holds from 0 to 100,000 numbers, all different, each from 0 to n, where n is the number of tickets left.
- Aim for O(n) time and O(1) extra space.
- Adding the numbers up works here, but say what would happen to the sum with far more tickets in a 32-bit language, and how XOR avoids it.
