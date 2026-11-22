# A tiny stack machine

A toy robot runs a program of `steps` on a stack of whole numbers, which starts empty.

- A whole number, like `5` or `-2`, pushes that number.
- `add`, `sub`, and `mul` pop the top value, then the one under it. They push the one under it plus, minus, or times the top value.
- `dup` pushes a copy of the top value.
- `swap` swaps the top two values.
- `drop` pops the top value and throws it away.

Return the stack after the last step, from bottom to top. Every step has the values it needs, and every value fits in a 32-bit whole number.

## Example

`["4", "dup", "mul", "10", "swap", "sub"]` pushes 4, copies it, and multiplies to get 16. Then it pushes 10 and swaps, leaving 10 under 16. `sub` gives 10 - 16, so the answer is `[-6]`.

## Limits

- Up to 10,000 steps.
- Aim for O(n) time.
