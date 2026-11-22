export function canMerge(first: string, second: string, tape: string): boolean {
  const n = first.length;
  const m = second.length;
  if (tape.length !== n + m) return false;
  // fits[j] says whether the first i letters of first and the first j of second make the tape's first i + j
  const fits = new Array<boolean>(m + 1).fill(false);
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      if (i === 0 && j === 0) {
        fits[0] = true;
        continue;
      }
      const letter = tape[i + j - 1];
      // Before this update, fits[j] is still the answer with one less letter of first
      const fromFirst = i > 0 && fits[j] && first[i - 1] === letter;
      // fits[j - 1] is already this row's, the answer with one less letter of second
      const fromSecond = j > 0 && fits[j - 1] && second[j - 1] === letter;
      fits[j] = fromFirst || fromSecond;
    }
  }
  return fits[m];
}
