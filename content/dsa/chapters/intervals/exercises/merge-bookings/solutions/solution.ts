export function mergeBookings(bookings: number[][]): number[][] {
  const byStart = [...bookings].sort((a, b) => a[0] - b[0]);
  const merged: number[][] = [];
  for (const [start, end] of byStart) {
    const last = merged[merged.length - 1];
    // A booking that overlaps or touches the stretch so far joins it
    if (last !== undefined && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}
