export function daysUntilBusier(visitors: number[]): number[] {
  const wait = new Array<number>(visitors.length).fill(0);
  // Days still waiting for a busier one, with counts that never rise from bottom to top
  const waiting: number[] = [];
  for (let day = 0; day < visitors.length; day++) {
    while (
      waiting.length > 0 &&
      visitors[waiting[waiting.length - 1]] < visitors[day]
    ) {
      const earlier = waiting.pop() as number;
      wait[earlier] = day - earlier;
    }
    waiting.push(day);
  }
  return wait;
}
