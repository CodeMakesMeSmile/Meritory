# Stickers for prime lockers

A school's lockers are numbered from 1 to `lockers`. For maths week, every locker whose number is prime gets a sticker.

Return how many lockers get a sticker.

## Example

With `lockers = 10`, the prime numbers are 2, 3, 5, and 7, so 4 lockers get a sticker. Locker 1 doesn't, since 1 isn't prime.

## Limits

- `lockers` is from 0 to 5,000,000.
- Testing each number by trial division is too slow at this size. Use a sieve, and say its time and space.
