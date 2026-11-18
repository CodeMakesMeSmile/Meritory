export function stretchesWithTotal(changes: number[], total: number): number {
  const seen = new Map<number, number>([[0, 1]]);
  let sum = 0;
  let stretches = 0;
  for (const change of changes) {
    sum += change;
    stretches += seen.get(sum - total) ?? 0;
    seen.set(sum, (seen.get(sum) ?? 0) + 1);
  }
  return stretches;
}
