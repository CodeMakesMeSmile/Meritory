export function beadPatterns(beads: number[]): number[][] {
  // Sorting puts beads of the same colour side by side
  const sorted = [...beads].sort((a, b) => a - b);
  const patterns: number[][] = [];
  const path: number[] = [];
  const used = new Array<boolean>(sorted.length).fill(false);
  const build = (): void => {
    if (path.length === sorted.length) {
      patterns.push([...path]);
      return;
    }
    for (let i = 0; i < sorted.length; i++) {
      if (used[i]) continue;
      // Beads of one colour go on from left to right, so swapping them never repeats a pattern
      if (i > 0 && sorted[i] === sorted[i - 1] && !used[i - 1]) continue;
      used[i] = true;
      path.push(sorted[i]);
      build();
      path.pop();
      used[i] = false;
    }
  };
  build();
  return patterns;
}
