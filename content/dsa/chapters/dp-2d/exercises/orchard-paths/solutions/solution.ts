const MOD = 1_000_000_007;

export function orchardPaths(orchard: number[][]): number {
  const cols = orchard[0].length;
  // Before a row is handled, row[c] holds the paths into the plot above
  const row = new Array<number>(cols).fill(0);
  // One path comes into the gate, as if from above
  row[0] = 1;
  for (const plots of orchard) {
    for (let c = 0; c < cols; c++) {
      if (plots[c] === 1) {
        row[c] = 0;
      } else if (c > 0) {
        // Paths from above are already in row[c], so add the paths from the left
        row[c] = (row[c] + row[c - 1]) % MOD;
      }
    }
  }
  return row[cols - 1];
}
