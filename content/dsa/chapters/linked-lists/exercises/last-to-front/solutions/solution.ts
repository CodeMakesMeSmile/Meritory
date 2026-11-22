export function lastToFront(
  cards: ListNode | null,
  k: number,
): ListNode | null {
  if (!cards || k === 0) return cards;
  let lead: ListNode | null = cards;
  for (let i = 0; i < k; i++) lead = (lead as ListNode).next;
  // Moving every card leaves the deck as it was
  if (!lead) return cards;
  // Keep the gap of k until lead is on the last card, so trail ends on the new last card
  let trail = cards;
  while (lead.next) {
    lead = lead.next;
    trail = trail.next as ListNode;
  }
  const top = trail.next;
  trail.next = null;
  lead.next = cards;
  return top;
}
