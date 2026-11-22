export function mismatchedBits(first: number, second: number): number {
  // A bit of the XOR is 1 exactly where the readings differ
  let diff = first ^ second;
  let count = 0;
  while (diff !== 0) {
    // Clears the lowest set bit, and the operators keep it within 32 bits
    diff &= diff - 1;
    count++;
  }
  return count;
}
