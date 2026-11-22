export function freeOnBoth(first: number[], second: number[]): number[] {
  const shared: number[] = [];
  let i = 0;
  let j = 0;
  while (i < first.length && j < second.length) {
    if (first[i] < second[j]) {
      i++;
    } else if (first[i] > second[j]) {
      j++;
    } else {
      // Repeats sit side by side, so only add a day the answer doesn't end with
      if (shared.length === 0 || shared[shared.length - 1] !== first[i]) {
        shared.push(first[i]);
      }
      i++;
      j++;
    }
  }
  return shared;
}
