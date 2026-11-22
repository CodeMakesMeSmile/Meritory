export function fillTheBreak(lengths: number[], target: number): number[] {
  let left = 0;
  let right = lengths.length - 1;
  while (left < right) {
    const sum = lengths[left] + lengths[right];
    if (sum === target) return [left, right];
    // A short total means no partner still in play is long enough for the left song
    if (sum < target) left++;
    else right--;
  }
  return [];
}
