# Bits that disagree

Two sensors on a bridge each send a reading as a 32-bit int, `first` and `second`. To check whether they agree, an engineer compares the two readings bit by bit, across all 32 bits of their two's complement form.

Return how many of the 32 bit positions differ.

## Example

With `first = 1` and `second = 4`, the low bits are `001` and `100`, so 2 positions differ. With `first = -1` and `second = 0`, every one of the 32 bits differs, so the answer is 32.

## Limits

- `first` and `second` can each be any 32-bit int, negative ones included.
- Aim for a loop that runs once per differing bit.
- Negative numbers are where answers go wrong. In Python, an int has no fixed width, so keep only the low 32 bits before you count.
