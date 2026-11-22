export function shelfSlot(ids: number[], newId: number): number {
  // Every position before lo holds a smaller number, and every one from hi on holds newId or more
  let lo = 0;
  let hi = ids.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (ids[mid] >= newId) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
