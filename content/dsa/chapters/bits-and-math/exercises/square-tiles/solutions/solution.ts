export function largestTile(width: number, length: number): number {
  let a = width;
  let b = length;
  // Euclid's algorithm: the gcd of a and b is the gcd of b and a % b
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}
