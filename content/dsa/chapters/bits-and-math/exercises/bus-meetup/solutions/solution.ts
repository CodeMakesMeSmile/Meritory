function gcd(first: number, second: number): number {
  let a = first;
  let b = second;
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

export function busMeetup(gaps: number[]): number {
  let meet = 1;
  for (const gap of gaps) {
    // Divide before multiplying, so nothing passes the final answer
    meet = (meet / gcd(meet, gap)) * gap;
  }
  return meet;
}
