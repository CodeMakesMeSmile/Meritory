// Counts the stretches with at most k kinds
function atMost(sightings: number[], k: number): number {
  const counts = new Map<number, number>();
  let stretches = 0;
  let left = 0;
  for (let right = 0; right < sightings.length; right++) {
    counts.set(sightings[right], (counts.get(sightings[right]) ?? 0) + 1);
    while (counts.size > k) {
      const leaving = (counts.get(sightings[left]) ?? 0) - 1;
      if (leaving === 0) counts.delete(sightings[left]);
      else counts.set(sightings[left], leaving);
      left++;
    }
    // Every start from left to right gives a stretch with at most k kinds
    stretches += right - left + 1;
  }
  return stretches;
}

export function exactKinds(sightings: number[], k: number): number {
  return atMost(sightings, k) - atMost(sightings, k - 1);
}
