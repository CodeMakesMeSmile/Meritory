export function steadyStretch(temperatures: number[], limit: number): number {
  // Positions with readings falling from front to back, so the front is the highest
  const highs: number[] = [];
  // Positions with readings rising from front to back, so the front is the lowest
  const lows: number[] = [];
  let highFront = 0;
  let lowFront = 0;
  let longest = 0;
  let left = 0;
  for (let right = 0; right < temperatures.length; right++) {
    const reading = temperatures[right];
    while (
      highs.length > highFront &&
      temperatures[highs[highs.length - 1]] <= reading
    ) {
      highs.pop();
    }
    highs.push(right);
    while (
      lows.length > lowFront &&
      temperatures[lows[lows.length - 1]] >= reading
    ) {
      lows.pop();
    }
    lows.push(right);
    // Shrink until the highest and lowest readings are close enough
    while (
      temperatures[highs[highFront]] - temperatures[lows[lowFront]] >
      limit
    ) {
      left++;
      if (highs[highFront] < left) highFront++;
      if (lows[lowFront] < left) lowFront++;
    }
    longest = Math.max(longest, right - left + 1);
  }
  return longest;
}
