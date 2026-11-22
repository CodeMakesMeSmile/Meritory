export function canSplit(text: string, words: string[]): boolean {
  const dictionary = new Set(words);
  let longest = 0;
  for (const word of words) longest = Math.max(longest, word.length);
  // ok[i] says whether the first i letters split into words
  const ok = new Array<boolean>(text.length + 1).fill(false);
  ok[0] = true;
  for (let i = 1; i <= text.length; i++) {
    // The last word starts at j, and no word is longer than the longest
    for (let j = Math.max(0, i - longest); j < i && !ok[i]; j++) {
      ok[i] = ok[j] && dictionary.has(text.slice(j, i));
    }
  }
  return ok[text.length];
}
