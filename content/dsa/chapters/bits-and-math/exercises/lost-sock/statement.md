# The sock without a partner

After laundry day, every sock in the basket has a matching partner except one. Each sock is written as its pattern number in `socks`. Every pattern number appears exactly twice, except the lone sock's, which appears once.

Return the lone sock's pattern number.

## Example

With `socks = [4, 1, 2, 1, 2]`, the 1s and 2s pair up, so the answer is 4.

## Limits

- From 1 to 99,999 socks, always an odd number.
- Each pattern number can be any 32-bit int, negative ones included.
- Aim for O(n) time and O(1) extra space, so no set or map of the socks you've seen.
