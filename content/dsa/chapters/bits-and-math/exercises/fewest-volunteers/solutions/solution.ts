export function fewestVolunteers(skills: number[], needed: number): number {
  const n = skills.length;
  let fewest = -1;
  // Each mask is one group, with bit i meaning volunteer i is in it
  for (let mask = 0; mask < 1 << n; mask++) {
    let covered = 0;
    let size = 0;
    for (let i = 0; i < n; i++) {
      if ((mask >> i) & 1) {
        covered |= skills[i];
        size++;
      }
    }
    // The group works when every needed bit is also covered
    if ((covered & needed) === needed && (fewest === -1 || size < fewest)) {
      fewest = size;
    }
  }
  return fewest;
}
