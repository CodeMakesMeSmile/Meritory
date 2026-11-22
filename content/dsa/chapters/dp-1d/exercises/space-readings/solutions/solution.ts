const MOD = 1_000_000_007;

export function splitCount(text: string, words: string[]): number {
  const dictionary = new Set(words);
  let longest = 0;
  for (const word of words) longest = Math.max(longest, word.length);
  // ways[i] counts the ways to split the first i letters into words
  const ways = new Array<number>(text.length + 1).fill(0);
  ways[0] = 1;
  for (let i = 1; i <= text.length; i++) {
    // Every word that ends here adds the ways to split what comes before it
    for (let j = Math.max(0, i - longest); j < i; j++) {
      if (ways[j] > 0 && dictionary.has(text.slice(j, i))) {
        ways[i] = (ways[i] + ways[j]) % MOD;
      }
    }
  }
  return ways[text.length];
}
