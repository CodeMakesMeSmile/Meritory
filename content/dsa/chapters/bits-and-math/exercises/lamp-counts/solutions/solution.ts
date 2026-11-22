export function lampCounts(n: number): number[] {
  const counts = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    // i & (i - 1) is i with its lowest 1 cleared, a smaller number already counted
    counts[i] = counts[i & (i - 1)] + 1;
  }
  return counts;
}
