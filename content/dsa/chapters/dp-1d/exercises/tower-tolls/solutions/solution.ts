export function cheapestClimb(tolls: number[]): number {
  // The least paid to stand on the landing two below and the landing one below
  let before = tolls[0];
  let last = tolls[1];
  for (let i = 2; i < tolls.length; i++) {
    // Reach landing i from one or two landings below, then pay its toll
    const next = tolls[i] + Math.min(before, last);
    before = last;
    last = next;
  }
  // The roof can be reached from either of the top two landings
  return Math.min(before, last);
}
