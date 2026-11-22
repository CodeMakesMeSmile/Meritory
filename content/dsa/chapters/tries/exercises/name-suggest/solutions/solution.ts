export function suggestNames(
  names: string[],
  prefix: string,
  k: number,
): string[] {
  const sorted = [...names].sort();
  // Binary search for the first name that's at least the prefix
  let low = 0;
  let high = sorted.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (sorted[middle] < prefix) low = middle + 1;
    else high = middle;
  }
  // Every name that starts with the prefix sits in one run from there
  const found: string[] = [];
  for (let i = low; i < sorted.length && found.length < k; i++) {
    if (!sorted[i].startsWith(prefix)) break;
    found.push(sorted[i]);
  }
  return found;
}
