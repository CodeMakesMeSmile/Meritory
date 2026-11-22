// Counts the stretches with at most k rainy days
function atMost(rainy: boolean[], k: number): number {
  if (k < 0) return 0;
  let wet = 0;
  let stretches = 0;
  let left = 0;
  for (let right = 0; right < rainy.length; right++) {
    if (rainy[right]) wet++;
    while (wet > k) {
      if (rainy[left]) wet--;
      left++;
    }
    // Every start from left to right gives a stretch with at most k rainy days
    stretches += right - left + 1;
  }
  return stretches;
}

export function rainyStretches(rainy: boolean[], k: number): number {
  return atMost(rainy, k) - atMost(rainy, k - 1);
}
