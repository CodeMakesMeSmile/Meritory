export function sameLetters(first: string, second: string): boolean {
  if (first.length !== second.length) return false;
  const counts = new Array<number>(26).fill(0);
  for (let i = 0; i < first.length; i++) {
    counts[first.charCodeAt(i) - 97]++;
    counts[second.charCodeAt(i) - 97]--;
  }
  return counts.every((count) => count === 0);
}
