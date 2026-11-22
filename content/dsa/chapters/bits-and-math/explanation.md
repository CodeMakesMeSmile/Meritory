# Bits and math

A few interview questions are really about numbers themselves: how a computer stores them, what the bitwise operators do to them, and a handful of classic number algorithms. They come up less often than arrays or graphs, but when they do, the short answer is usually a trick you either know or don't. This chapter covers those tricks, and the overflow traps that sit under every language's numbers.

## Binary and two's complement

A number in binary is a sum of powers of two. 13 is 8 + 4 + 1, so it's `1101`. Bit 0 is the rightmost, worth 1, and bit i is worth 2ⁱ.

Java's `int`, C's `int` on the usual platforms, and the numbers JavaScript's bitwise operators work on are 32 bits wide. Negative numbers are stored in **two's complement**: the top bit is worth -2³¹ instead of +2³¹, and the other 31 bits add on as usual. So:

- 0 is 32 zeros, and -1 is 32 ones, since -2³¹ plus every other power of two up to 2³⁰ comes to -1.
- To negate a number, flip every bit and add 1. 5 is `0...0101`, flipping gives `1...1010`, and adding 1 gives `1...1011`, which is -5.
- An `int` holds -2,147,483,648 up to 2,147,483,647. There's one more negative value than positive, so negating the smallest `int` has nowhere to go. In Java it comes back as itself.

The reason computers use it: adding works the same way for negative and positive numbers, with no special case.

## The operators

| Operator | Name | Each bit of the result | Example on 12 (`1100`) and 10 (`1010`) |
|---|---|---|---|
| `a & b` | AND | 1 when both bits are 1 | `1000`, which is 8 |
| `a \| b` | OR | 1 when either bit is 1 | `1110`, which is 14 |
| `a ^ b` | XOR | 1 when the bits differ | `0110`, which is 6 |
| `~a` | NOT | The bit flipped | `~12` is -13 |
| `a << k` | Left shift | Moved k places left, zeros in on the right | `12 << 1` is 24 |
| `a >> k` | Right shift | Moved k places right, copies of the sign bit in on the left | `-12 >> 1` is -6 |
| `a >>> k` | Unsigned right shift, in Java and JavaScript | Moved k places right, zeros in on the left | `-1 >>> 28` is 15 |

A few moves come up again and again, for bit `i` of `x`:

- Read it: `(x >> i) & 1`
- Set it: `x | (1 << i)`
- Clear it: `x & ~(1 << i)`
- Flip it: `x ^ (1 << i)`
- Keep only the lowest set bit: `x & -x`

### Bits in each language

The operators look the same everywhere, but the numbers underneath differ, and that's where bugs come from.

- **TypeScript and JavaScript**: every number is a 64-bit float, but the bitwise operators first turn their operands into 32-bit integers in two's complement. Bits above the 32nd are dropped, and the result is a signed 32-bit number, so `1 << 31` is -2,147,483,648. A shift count is taken modulo 32, so `1 << 32` is 1, not 0. To read a result as unsigned, write `x >>> 0`. `BigInt` values have no 32-bit cut, but they can't be mixed with ordinary numbers in one operation, and `>>>` doesn't work on them.
- **Python**: integers have no fixed size. Bitwise operators act as though a number had infinitely many sign bits in front, so -1 is ones forever and `bin(-5)` prints `-0b101`. To see the 32-bit pattern, mask it with `x & 0xFFFFFFFF`. `int.bit_count()` counts set bits.
- **Java**: `int` is 32 bits and `long` is 64. Arithmetic wraps around silently when it overflows. `>>>` shifts in zeros, and `Integer.bitCount` counts set bits.
- **C**: overflow in a signed type is undefined behaviour, which means the compiler may assume it never happens. Use `unsigned int` or `unsigned long long` for bit tricks, since unsigned arithmetic wraps modulo 2ⁿ. Shifting by the type's width or more is undefined too.

## XOR for the odd one out

XOR has three properties that make a neat trick:

- `x ^ x` is 0.
- `x ^ 0` is `x`.
- Order doesn't matter, so `a ^ b ^ a` is `b`.

If every value in a list appears twice except one, XOR them all together. Each pair cancels to 0, and what's left is the value without a partner. That's O(n) time and O(1) space, where a set of values seen would need O(n) space.

```ts
let lone = 0;
for (const value of values) lone ^= value;
return lone;
```

The same idea finds a missing number. If a list should hold 0 to n but one is missing, XOR every index from 0 to n with every value in the list. Each number that's there appears twice and cancels, leaving the missing one. Adding them all up and subtracting works too, but the sum can overflow, and XOR can't.

## Counting set bits

The simple way checks the lowest bit and shifts right, 32 times for a 32-bit number. With a negative number, shift with `>>>` in Java and JavaScript, use an unsigned type in C, or mask with `0xFFFFFFFF` in Python. Otherwise the sign bits keep coming in from the left, and in Python the loop never ends.

A faster way uses `n & (n - 1)`, which clears the lowest set bit. Subtracting 1 turns the lowest 1 into a 0 and every 0 below it into a 1. ANDing with the original keeps everything above and wipes the rest. So this loop runs once per set bit:

```ts
let count = 0;
while (n !== 0) {
  n &= n - 1;
  count++;
}
```

Two more uses of the same idea:

- `n > 0 && (n & (n - 1)) === 0` is true exactly when n is a power of two, which has a single set bit.
- To count the bits of every number from 0 to n, reuse smaller answers: `bits[i] = bits[i & (i - 1)] + 1`, since `i & (i - 1)` is smaller than i and has one bit fewer. That's O(n) for the whole list.

## Bitmasks for subsets

With n items, a whole number from 0 to 2ⁿ - 1 can stand for a subset: bit i is 1 when item i is in. Counting through every number in that range visits every subset once.

```ts
for (let mask = 0; mask < 1 << n; mask++) {
  let total = 0;
  for (let i = 0; i < n; i++) {
    if ((mask >> i) & 1) total += prices[i];
  }
  // total is the sum of this subset
}
```

That's O(2ⁿ · n) time, which fits for n up to about 20. The backtracking chapter lists subsets with recursion instead. Masks shine when a set has to be stored or combined: `a | b` is the union of two sets, `a & b` is what they share, and checking `(have & need) === need` asks whether `have` covers everything in `need`. Past 30 or so items, a mask no longer fits in a 32-bit number, and in JavaScript `1 << 31` is already negative, so keep n small.

## The greatest common divisor

The greatest common divisor, or gcd, of two numbers is the largest number that divides both. Euclid's algorithm finds it with one fact: any number that divides a and b also divides `a % b`. So the gcd of a and b is the gcd of b and `a % b`, and the gcd of a and 0 is a.

```ts
function gcd(a: number, b: number): number {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}
```

The numbers shrink fast. Every two steps at least halve the larger one, so it takes O(log min(a, b)) steps.

The least common multiple, the smallest number both divide, is `a / gcd(a, b) * b`. Divide first. Multiplying first can overflow even when the answer fits.

## Fast powers with a modulo

Many questions ask for a huge count "modulo 1,000,000,007", because the real answer has too many digits. Two facts make that work:

- You can take the modulo after every step: `(a * b) % m` equals `((a % m) * (b % m)) % m`.
- You can raise to a power in O(log e) multiplications by squaring. Read the exponent's bits from the lowest. Keep a value that's the base, then its square, then its fourth power, and so on, and multiply it into the result whenever the matching bit is 1.

```ts
function powMod(base: number, exponent: number, mod: number): number {
  const m = BigInt(mod);
  let result = 1n % m;
  let square = BigInt(base) % m;
  while (exponent > 0) {
    if (exponent % 2 === 1) result = (result * square) % m;
    square = (square * square) % m;
    exponent = Math.floor(exponent / 2);
  }
  return Number(result);
}
```

Mind the size of each product. Two numbers below about 2³¹ multiply to just under 2⁶², which fits in a Java `long` or a C `long long`, though not in an `int`. In TypeScript a number is only exact up to 2⁵³ - 1, so a product past that is quietly rounded. Use `BigInt` for the multiply and the modulo, as above, then turn the result back into a number at the end. Another way is to split one factor into a high and a low half and multiply each part separately, so no product passes 2⁵³. Python's integers never overflow, and its built-in `pow(base, exponent, mod)` does all of this for you.

Start the result at `1 % m`, not 1. When m is 1, every number modulo 1 is 0, including the answer for an exponent of 0.

## A sieve for primes

To test one number for being prime, try dividing it by every number up to its square root. If it has a factor bigger than that, it also has one smaller, so that's enough. For all the primes up to n, the **sieve of Eratosthenes** is much faster:

```ts
const composite = new Uint8Array(n + 1);
for (let p = 2; p * p <= n; p++) {
  if (composite[p]) continue;
  for (let q = p * p; q <= n; q += p) composite[q] = 1;
}
// Every number from 2 to n that isn't marked is prime
```

Crossing off starts at p², because every smaller multiple of p has a smaller prime factor and was already crossed off. The whole sieve takes O(n log log n) time, which is close to O(n), and O(n) space, so it fits n up to a few million.

To find the primes in a window far from zero, like from a trillion to a trillion and a million, you can't build an array up to a trillion. You don't need to. Any number in the window that isn't prime has a prime factor no bigger than the square root of the top of the window. Sieve the primes up to that square root, then for each one, cross off its multiples inside the window, starting at the first multiple that's at least the bottom of the window. This is a **segmented sieve**, and its memory is the size of the window plus the square root.

## Overflow

Every language has a point where numbers stop behaving, and interviewers like to see that you know where it is.

| Language | What happens past the limit | What to do |
|---|---|---|
| Java | `int` wraps past 2,147,483,647 to a negative number, silently | Use `long` before the product, as in `(long) a * b` |
| C | Signed overflow is undefined behaviour | Use `long long`, or unsigned types for wrapping on purpose |
| TypeScript | Numbers past 2⁵³ - 1 lose their last digits, and bitwise operators cut to 32 bits | Use `BigInt` for big products, and convert back at the end |
| Python | Integers grow as needed and never overflow | Nothing, though huge numbers are slower |

The cast has to come before the multiply. `(long) (a * b)` multiplies two `int` values first, overflows, and only then widens the wrong answer. The same care shows up in binary search, where `lo + (hi - lo) / 2` avoids the overflow that `(lo + hi) / 2` can hit.
