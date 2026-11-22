export function peakLoad(appliances: number[][]): number {
  const events: number[][] = [];
  for (const [on, off, watts] of appliances) {
    // Drawing through minute off is the same as stopping as minute off + 1 starts
    events.push([on, watts], [off + 1, -watts]);
  }
  // At the same minute, switching off comes first
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let load = 0;
  let peak = 0;
  for (const [, change] of events) {
    load += change;
    peak = Math.max(peak, load);
  }
  return peak;
}
