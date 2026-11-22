export function readingsOnce(readings: number[]): void {
  let write = 0;
  for (let read = 0; read < readings.length; read++) {
    // Repeats sit side by side, so compare with the last value kept
    if (write === 0 || readings[read] !== readings[write - 1]) {
      readings[write] = readings[read];
      write++;
    }
  }
  for (let i = write; i < readings.length; i++) {
    readings[i] = -1;
  }
}
