export function kthQuickest(times: number[], k: number): number {
  const order = [...times];
  const want = k - 1;
  let start = 0;
  let end = order.length - 1;
  while (start < end) {
    const pivot = order[start + Math.floor(Math.random() * (end - start + 1))];
    // Split into below, equal to, and above the pivot, as with three sizes
    let low = start;
    let mid = start;
    let high = end;
    while (mid <= high) {
      if (order[mid] < pivot) {
        [order[low], order[mid]] = [order[mid], order[low]];
        low++;
        mid++;
      } else if (order[mid] > pivot) {
        [order[mid], order[high]] = [order[high], order[mid]];
        high--;
      } else {
        mid++;
      }
    }
    // Keep going only on the side that holds position k
    if (want < low) end = low - 1;
    else if (want > high) start = high + 1;
    else return pivot;
  }
  return order[start];
}
