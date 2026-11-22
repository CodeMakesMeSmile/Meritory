export function mostNested(boxes: number[][]): number {
  // Width going up, and for equal widths, height going down, so equal widths can't both be picked
  const sorted = [...boxes].sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  // tails[k] is the lowest height that can end a stack of k + 1 boxes
  const tails: number[] = [];
  for (const [, height] of sorted) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = lo + Math.floor((hi - lo) / 2);
      if (tails[mid] >= height) hi = mid;
      else lo = mid + 1;
    }
    tails[lo] = height;
  }
  return tails.length;
}
