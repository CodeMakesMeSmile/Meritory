export function hiddenRearrangements(text: string, word: string): number[] {
  const need = new Array<number>(26).fill(0);
  const have = new Array<number>(26).fill(0);
  for (const letter of word) need[letter.charCodeAt(0) - 97]++;
  // How many of the 26 letters have exactly the count the word needs
  let matched = need.filter((count) => count === 0).length;
  const change = (letter: number, by: number) => {
    if (have[letter] === need[letter]) matched--;
    have[letter] += by;
    if (have[letter] === need[letter]) matched++;
  };
  const starts: number[] = [];
  const size = word.length;
  for (let right = 0; right < text.length; right++) {
    change(text.charCodeAt(right) - 97, 1);
    if (right >= size) change(text.charCodeAt(right - size) - 97, -1);
    if (right >= size - 1 && matched === 26) starts.push(right - size + 1);
  }
  return starts;
}
