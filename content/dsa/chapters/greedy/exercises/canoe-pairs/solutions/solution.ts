export function fewestCanoes(weights: number[], limit: number): number {
  const sorted = [...weights].sort((a, b) => a - b);
  let light = 0;
  let heavy = sorted.length - 1;
  let canoes = 0;
  while (light <= heavy) {
    // The heaviest camper needs a canoe, and if anyone fits with them, the lightest does
    if (sorted[light] + sorted[heavy] <= limit) light++;
    heavy--;
    canoes++;
  }
  return canoes;
}
