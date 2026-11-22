export function cheapestRepaint(
  current: string,
  wanted: string,
  addCost: number,
  removeCost: number,
  repaintCost: number,
): number {
  const n = current.length;
  const m = wanted.length;
  // before[j] is the cheapest way from the first i - 1 letters of current to the first j of wanted
  let before = new Array<number>(m + 1);
  // From nothing, every letter of wanted is painted in
  for (let j = 0; j <= m; j++) before[j] = j * addCost;
  for (let i = 1; i <= n; i++) {
    const row = new Array<number>(m + 1);
    // Down to nothing, every letter of current is painted out
    row[0] = i * removeCost;
    for (let j = 1; j <= m; j++) {
      if (current[i - 1] === wanted[j - 1]) {
        row[j] = before[j - 1];
      } else {
        row[j] = Math.min(
          before[j - 1] + repaintCost,
          before[j] + removeCost,
          row[j - 1] + addCost,
        );
      }
    }
    before = row;
  }
  return before[m];
}
