export function fewestEdits(typed: string, word: string): number {
  const n = typed.length;
  const m = word.length;
  // edits[i][j] turns the first i letters of typed into the first j letters of word
  const edits = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  // From i letters to none is i removals, and from none to j letters is j additions
  for (let i = 0; i <= n; i++) edits[i][0] = i;
  for (let j = 0; j <= m; j++) edits[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (typed[i - 1] === word[j - 1]) {
        // The last letters already match, so they cost nothing
        edits[i][j] = edits[i - 1][j - 1];
      } else {
        // Change the last letter, remove it, or add the word's last letter
        edits[i][j] =
          1 + Math.min(edits[i - 1][j - 1], edits[i - 1][j], edits[i][j - 1]);
      }
    }
  }
  return edits[n][m];
}
