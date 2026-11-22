export function noSongTwice(songs: number[]): number {
  const lastSeen = new Map<number, number>();
  let longest = 0;
  let left = 0;
  for (let right = 0; right < songs.length; right++) {
    const last = lastSeen.get(songs[right]);
    // A last play from before the window isn't a repeat, so left never moves back
    if (last !== undefined) left = Math.max(left, last + 1);
    lastSeen.set(songs[right], right);
    longest = Math.max(longest, right - left + 1);
  }
  return longest;
}
