export function mergeTimetables(first: number[], second: number[]): number[] {
  const merged: number[] = [];
  let i = 0;
  let j = 0;
  while (i < first.length && j < second.length) {
    if (first[i] <= second[j]) merged.push(first[i++]);
    else merged.push(second[j++]);
  }
  // One list has run out, so the rest of the other is already in order
  while (i < first.length) merged.push(first[i++]);
  while (j < second.length) merged.push(second[j++]);
  return merged;
}
