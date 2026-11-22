export function addBooking(diary: number[][], booking: number[]): number[][] {
  const result: number[][] = [];
  let [start, end] = booking;
  let i = 0;
  // Busy times that end before the booking starts stay as they are
  while (i < diary.length && diary[i][1] < start) {
    result.push([diary[i][0], diary[i][1]]);
    i++;
  }
  // Every busy time that overlaps or touches the booking joins it
  while (i < diary.length && diary[i][0] <= end) {
    start = Math.min(start, diary[i][0]);
    end = Math.max(end, diary[i][1]);
    i++;
  }
  result.push([start, end]);
  // The rest start after the booking ends
  while (i < diary.length) {
    result.push([diary[i][0], diary[i][1]]);
    i++;
  }
  return result;
}
