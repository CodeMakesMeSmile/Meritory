export function firstFailing(builds: boolean[]): number {
  // Every build before lo passed, and every build from hi on failed
  let lo = 0;
  let hi = builds.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (!builds[mid]) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
