export function fewestDays(savings: number[], goal: number): number {
  let fewest = Infinity;
  let total = 0;
  let left = 0;
  for (let right = 0; right < savings.length; right++) {
    total += savings[right];
    // Record while the window still reaches the goal, then try a shorter one
    while (total >= goal) {
      fewest = Math.min(fewest, right - left + 1);
      total -= savings[left];
      left++;
    }
  }
  return fewest === Infinity ? 0 : fewest;
}
