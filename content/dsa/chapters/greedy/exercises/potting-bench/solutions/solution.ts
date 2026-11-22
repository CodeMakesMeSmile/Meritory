export function mostPotted(seedlings: number[], pots: number[]): number {
  const needs = [...seedlings].sort((a, b) => a - b);
  const sizes = [...pots].sort((a, b) => a - b);
  let potted = 0;
  for (const size of sizes) {
    // The smallest seedling still waiting takes the smallest pot that fits it
    if (potted < needs.length && size >= needs[potted]) potted++;
  }
  return potted;
}
