export function fullestShelf(shelves: number[][]): number {
  let best = -1;
  let mostFull = 0;
  for (let row = 0; row < shelves.length; row++) {
    const slots = shelves[row];
    // Every slot before lo is empty, and every slot from hi on is full
    let lo = 0;
    let hi = slots.length;
    while (lo < hi) {
      const mid = lo + Math.floor((hi - lo) / 2);
      if (slots[mid] === 1) hi = mid;
      else lo = mid + 1;
    }
    const full = slots.length - lo;
    if (full > mostFull) {
      mostFull = full;
      best = row;
    }
  }
  return best;
}
