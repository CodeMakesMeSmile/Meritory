export function lastDigits(
  base: number,
  exponent: number,
  digits: number,
): number {
  const m = 10n ** BigInt(digits);
  let result = 1n;
  let square = BigInt(base) % m;
  // exponent stays below 2^53, so halving it as a number is exact
  let left = exponent;
  while (left > 0) {
    if (left % 2 === 1) result = (result * square) % m;
    square = (square * square) % m;
    left = Math.floor(left / 2);
  }
  return Number(result % m);
}
