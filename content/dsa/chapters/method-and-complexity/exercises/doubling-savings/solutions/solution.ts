export function doublingNights(start: number, goal: number): number {
  let coins = start;
  let nights = 0;
  // Each night doubles the coins, so this runs about log(goal / start) times
  while (coins < goal) {
    coins *= 2;
    nights++;
  }
  return nights;
}
