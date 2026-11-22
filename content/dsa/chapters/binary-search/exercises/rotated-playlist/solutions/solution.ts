export function findTrack(tracks: number[], target: number): number {
  const last = tracks[tracks.length - 1];
  // Find where the loop wraps, the first track no higher than the last one
  let lo = 0;
  let hi = tracks.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (tracks[mid] <= last) hi = mid;
    else lo = mid + 1;
  }
  const wrap = lo;
  // Tracks up to the last one sit from wrap to the end, and higher ones sit before it
  if (target <= last) {
    lo = wrap;
    hi = tracks.length;
  } else {
    lo = 0;
    hi = wrap;
  }
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (tracks[mid] >= target) hi = mid;
    else lo = mid + 1;
  }
  return lo < tracks.length && tracks[lo] === target ? lo : -1;
}
