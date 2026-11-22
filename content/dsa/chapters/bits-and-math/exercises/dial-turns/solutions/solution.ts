export function dialPosition(
  factor: number,
  turns: number,
  size: number,
): number {
  const m = BigInt(size);
  // Starting at 1 % m makes a one-position dial start at 0
  let position = 1n % m;
  let square = BigInt(factor) % m;
  // turns stays below 2^53, so halving it as a number is exact
  let left = turns;
  while (left > 0) {
    if (left % 2 === 1) position = (position * square) % m;
    square = (square * square) % m;
    left = Math.floor(left / 2);
  }
  return Number(position);
}
