export function fewKinds(jars: number[], k: number): number {
  const counts = new Map<number, number>();
  let longest = 0;
  let left = 0;
  for (let right = 0; right < jars.length; right++) {
    counts.set(jars[right], (counts.get(jars[right]) ?? 0) + 1);
    // The map holds only kinds still in the window, so its size is the kinds
    while (counts.size > k) {
      const leaving = (counts.get(jars[left]) ?? 0) - 1;
      if (leaving === 0) counts.delete(jars[left]);
      else counts.set(jars[left], leaving);
      left++;
    }
    longest = Math.max(longest, right - left + 1);
  }
  return longest;
}
