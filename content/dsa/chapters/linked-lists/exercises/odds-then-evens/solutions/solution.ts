export function oddsThenEvens(guests: ListNode | null): ListNode | null {
  if (!guests) return null;
  let odd = guests;
  const evenHead = guests.next;
  let even = evenHead;
  // Each step moves one guest onto the end of each group
  while (even?.next) {
    odd.next = even.next;
    odd = even.next;
    even.next = odd.next;
    even = even.next;
  }
  // The odd group ends where the even group starts
  odd.next = evenHead;
  return guests;
}
