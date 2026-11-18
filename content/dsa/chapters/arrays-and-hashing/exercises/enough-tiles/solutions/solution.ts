export function enoughTiles(word: string, tiles: string): boolean {
  const counts = new Array<number>(26).fill(0);
  for (let i = 0; i < tiles.length; i++) counts[tiles.charCodeAt(i) - 97]++;
  for (let i = 0; i < word.length; i++) {
    const letter = word.charCodeAt(i) - 97;
    if (counts[letter] === 0) return false;
    counts[letter]--;
  }
  return true;
}
