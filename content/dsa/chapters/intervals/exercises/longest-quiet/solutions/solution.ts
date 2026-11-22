export function longestQuiet(
  rooms: number[][],
  opensAt: number,
  closesAt: number,
): number {
  // Every session from every room, as [start, end]
  const sessions: number[][] = [];
  for (const room of rooms) {
    for (let k = 0; k < room.length; k += 2) {
      sessions.push([room[k], room[k + 1]]);
    }
  }
  sessions.sort((a, b) => a[0] - b[0]);
  let longest = 0;
  // No room is in use from here until the next session starts
  let quiet = opensAt;
  for (const [start, end] of sessions) {
    if (start > quiet)
      longest = Math.max(longest, Math.min(start, closesAt) - quiet);
    quiet = Math.max(quiet, end);
    if (quiet >= closesAt) break;
  }
  if (quiet < closesAt) longest = Math.max(longest, closesAt - quiet);
  return longest;
}
