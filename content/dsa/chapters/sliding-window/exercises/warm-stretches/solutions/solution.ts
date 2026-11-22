export function warmStretches(
  temperatures: number[],
  k: number,
  limit: number,
): number {
  // An average of at least limit is a total of at least limit times k
  const needed = limit * k;
  let total = 0;
  let count = 0;
  for (let right = 0; right < temperatures.length; right++) {
    total += temperatures[right];
    if (right >= k) total -= temperatures[right - k];
    if (right >= k - 1 && total >= needed) count++;
  }
  return count;
}
