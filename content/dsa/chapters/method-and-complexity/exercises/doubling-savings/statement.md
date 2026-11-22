# Nights until the jar is full

A magic savings jar holds `start` coins. Every night, the number of coins in it doubles.

Return how many nights pass before the jar holds at least `goal` coins. If it already does, the answer is 0.

## Example

With `start = 3` and `goal = 20`, the jar holds 6 after one night, 12 after two, and 24 after three. The answer is 3.

## Limits

- `start` and `goal` are each from 1 to 2,147,483,647, the largest 32-bit int.
- Say how many times your loop runs, in Big O, and why that's fast even for the largest goal.
- The jar can pass the largest 32-bit int on the night it reaches the goal, so use a 64-bit number for it in Java and C.
