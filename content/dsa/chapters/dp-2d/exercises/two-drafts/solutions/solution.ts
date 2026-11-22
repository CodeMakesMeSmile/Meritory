export function fewestDeletions(first: string, second: string): number {
  const n = first.length;
  const m = second.length;
  // kept[j] is the longest common subsequence of the first i letters of first and the first j of second
  const kept = new Array<number>(m + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    // The entry up and to the left, saved before the update overwrites it
    let diagonal = 0;
    for (let j = 1; j <= m; j++) {
      const above = kept[j];
      if (first[i - 1] === second[j - 1]) {
        kept[j] = diagonal + 1;
      } else {
        kept[j] = Math.max(above, kept[j - 1]);
      }
      diagonal = above;
    }
  }
  // Every letter outside the longest shared part has to go
  return n + m - 2 * kept[m];
}
