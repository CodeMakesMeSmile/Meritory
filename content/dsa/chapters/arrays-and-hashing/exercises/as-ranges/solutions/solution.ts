export function asRanges(ids: number[]): number[][] {
  const present = new Set(ids);
  const ranges: number[][] = [];
  for (const start of present) {
    if (present.has(start - 1)) continue;
    let end = start;
    while (present.has(end + 1)) end++;
    ranges.push([start, end]);
  }
  return ranges;
}
