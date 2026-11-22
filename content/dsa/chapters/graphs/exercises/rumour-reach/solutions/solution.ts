export function rumourReach(
  n: number,
  tells: number[][],
  start: number,
): number {
  // News only goes one way, so each pair is listed under the teller alone
  const tellsTo: number[][] = Array.from({ length: n }, () => []);
  for (const [from, to] of tells) tellsTo[from].push(to);
  const heard = new Array<boolean>(n).fill(false);
  heard[start] = true;
  let count = 1;
  // Our own stack instead of recursion, since the news can pass along a chain of everyone
  const stack = [start];
  while (stack.length > 0) {
    const at = stack.pop() as number;
    for (const next of tellsTo[at]) {
      if (!heard[next]) {
        heard[next] = true;
        count++;
        stack.push(next);
      }
    }
  }
  return count;
}
