export function smallestWindow(text: string, needed: string): string {
  // How many more of each letter the window needs, below 0 when it has spare
  const need = new Array<number>(26).fill(0);
  for (const letter of needed) need[letter.charCodeAt(0) - 97]++;
  let missing = needed.length;
  let bestStart = 0;
  let bestLength = Infinity;
  let left = 0;
  for (let right = 0; right < text.length; right++) {
    const entering = text.charCodeAt(right) - 97;
    if (need[entering] > 0) missing--;
    need[entering]--;
    while (missing === 0) {
      // Only a strictly shorter stretch replaces one that starts earlier
      if (right - left + 1 < bestLength) {
        bestStart = left;
        bestLength = right - left + 1;
      }
      const leaving = text.charCodeAt(left) - 97;
      need[leaving]++;
      if (need[leaving] > 0) missing++;
      left++;
    }
  }
  return bestLength === Infinity
    ? ""
    : text.slice(bestStart, bestStart + bestLength);
}
