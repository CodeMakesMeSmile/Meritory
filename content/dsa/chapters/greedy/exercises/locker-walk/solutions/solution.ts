export function leastWalking(runners: number[], lockers: number[]): number {
  const people = [...runners].sort((a, b) => a - b);
  const spots = [...lockers].sort((a, b) => a - b);
  let total = 0;
  // Two walks that cross can always be uncrossed without adding distance, so pair in order
  for (let i = 0; i < people.length; i++) {
    total += Math.abs(people[i] - spots[i]);
  }
  return total;
}
