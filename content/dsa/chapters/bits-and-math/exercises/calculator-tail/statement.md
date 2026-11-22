# The last digits of a huge power

A pocket calculator's screen is too small for big numbers, so it shows only the last `digits` digits of each answer. A student types `base` to the power `exponent`.

Return the number the screen shows: `base` to the power `exponent`, modulo 10 to the power `digits`. Leading zeros on the screen don't count, so a screen showing `024` is the number 24.

## Example

With `base = 2`, `exponent = 10`, and `digits = 3`, 2 to the power 10 is 1,024, and the screen shows `024`, so the answer is 24.

## Limits

- `base` is from 0 to 1,000,000,000, and `digits` is from 1 to 9.
- `exponent` is from 0 to 1,000,000,000,000,000. Anything to the power 0 is 1, including 0.
- Aim for O(log exponent) multiplications. Each product can pass 2⁵³, so use `BigInt` in TypeScript and a 64-bit integer in Java and C.
