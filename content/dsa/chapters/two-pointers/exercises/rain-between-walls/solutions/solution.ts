export function rainBetweenWalls(walls: number[]): number {
  let water = 0;
  let left = 0;
  let right = walls.length - 1;
  let tallestLeft = 0;
  let tallestRight = 0;
  while (left < right) {
    tallestLeft = Math.max(tallestLeft, walls[left]);
    tallestRight = Math.max(tallestRight, walls[right]);
    // The other side already has a taller wall, so the lower one sets the level
    if (tallestLeft < tallestRight) {
      water += tallestLeft - walls[left];
      left++;
    } else {
      water += tallestRight - walls[right];
      right--;
    }
  }
  return water;
}
