export function reopenStretch(
  closures: number[][],
  reopened: number[],
): number[][] {
  const [from, to] = reopened;
  const left: number[][] = [];
  for (const [start, end] of closures) {
    // Keep whatever sticks out before the reopened stretch, and after it
    if (start < from) left.push([start, Math.min(end, from)]);
    if (end > to) left.push([Math.max(start, to), end]);
  }
  return left;
}
