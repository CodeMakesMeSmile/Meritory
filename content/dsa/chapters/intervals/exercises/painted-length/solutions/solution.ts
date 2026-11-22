export function paintedLength(stretches: number[][]): number {
  const byStart = [...stretches].sort((a, b) => a[0] - b[0]);
  let total = 0;
  // The merged stretch being built, empty to begin with
  let groupStart = -1;
  let groupEnd = -1;
  for (const [from, to] of byStart) {
    if (from > groupEnd) {
      // A gap, so the stretch so far is finished
      total += groupEnd - groupStart;
      groupStart = from;
      groupEnd = to;
    } else {
      groupEnd = Math.max(groupEnd, to);
    }
  }
  return total + groupEnd - groupStart;
}
