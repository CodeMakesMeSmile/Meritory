# Where to start the scooter tour

A scooter tour goes round a ring of docks, numbered from 0, and after the last dock it rides back to dock 0. At dock `i` the scooter picks up `charge[i]` units of battery, and the ride from dock `i` to the next dock uses `drain[i]`. The battery starts empty and has no upper limit.

The scooter can't start a ride without enough battery for it, but arriving with exactly 0 left is fine. Return the first dock where the scooter can start and ride the whole way round, back to that dock. If no dock works, return -1.

## Example

With `charge = [1, 5, 2, 3]` and `drain = [3, 2, 4, 1]`, starting at dock 0 fails at once, since 1 unit isn't enough for a ride that uses 3. Starting at dock 1, the battery holds 3 after the first ride, then 1, then 3, then 1 back at dock 1. The answer is 1.

## Limits

- From 1 to 100,000 docks, and `charge` and `drain` have the same length.
- Each value is between 0 and 10,000.
- Aim for O(n) time and O(1) extra memory.
