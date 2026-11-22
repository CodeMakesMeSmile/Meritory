export function missingTicket(tickets: number[]): number {
  // Each number but the missing one shows up as an index or n and again as a ticket, so XOR cancels it
  let missing = tickets.length;
  for (let i = 0; i < tickets.length; i++) missing ^= i ^ tickets[i];
  return missing;
}
