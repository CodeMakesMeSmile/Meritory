export function leastWire(beacons: number[][]): number {
  const n = beacons.length;
  const inNetwork = new Array<boolean>(n).fill(false);
  // reach[i] is the shortest wire from the network to beacon i so far
  const reach = new Array<number>(n).fill(Infinity);
  reach[0] = 0;
  let total = 0;
  // Prim's algorithm with an array, since every pair of beacons is an edge
  for (let step = 0; step < n; step++) {
    // The beacon outside the network with the shortest wire to it joins next
    let pick = -1;
    for (let i = 0; i < n; i++) {
      if (!inNetwork[i] && (pick === -1 || reach[i] < reach[pick])) pick = i;
    }
    inNetwork[pick] = true;
    total += reach[pick];
    // The new beacon may offer a shorter wire to the beacons still outside
    const [x, y] = beacons[pick];
    for (let i = 0; i < n; i++) {
      if (inNetwork[i]) continue;
      const wire = Math.abs(x - beacons[i][0]) + Math.abs(y - beacons[i][1]);
      if (wire < reach[i]) reach[i] = wire;
    }
  }
  return total;
}
