# Postfix calculator

A pocket calculator takes its input in postfix order, where each operator comes after the two values it works on. `tokens` holds whole numbers, which can be negative like `-4`, and the operators `+`, `-`, `*`, and `/`. An operator takes the two most recent values still waiting, with the earlier one on its left, and its result waits in their place. Division cuts toward zero, so -7 / 2 is -3.

Return the value of the expression. The tokens always make one valid expression, nothing is ever divided by 0, and every value along the way fits in a 32-bit whole number.

## Example

`["6", "2", "3", "+", "*"]` means 6 * (2 + 3), so the answer is 30.

## Limits

- From 1 to 10,000 tokens.
- Aim for O(n) time.
