export function loneSock(socks: number[]): number {
  // Each pair XORs to 0, so only the lone pattern is left
  let lone = 0;
  for (const sock of socks) lone ^= sock;
  return lone;
}
