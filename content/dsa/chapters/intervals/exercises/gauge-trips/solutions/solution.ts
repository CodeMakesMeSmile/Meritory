export function fewestTrips(windows: number[][]): number {
  const byClose = [...windows].sort((a, b) => a[1] - b[1]);
  let trips = 0;
  // The minute of the last trip, before any window opens
  let lastTrip = -1;
  for (const [open, close] of byClose) {
    // This window opened after the last trip, so that trip missed it
    if (open > lastTrip) {
      trips++;
      // As late as this window allows, which reads every window open by then
      lastTrip = close;
    }
  }
  return trips;
}
