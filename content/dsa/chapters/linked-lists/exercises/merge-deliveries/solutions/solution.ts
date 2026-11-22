export function mergeDeliveries(
  north: ListNode | null,
  south: ListNode | null,
): ListNode | null {
  // The dummy gives the schedule a place to start
  const dummy = new ListNode();
  let tail = dummy;
  let a = north;
  let b = south;
  while (a && b) {
    if (a.val <= b.val) {
      tail.next = a;
      tail = a;
      a = a.next;
    } else {
      tail.next = b;
      tail = b;
      b = b.next;
    }
  }
  // Whatever is left is already sorted and linked
  tail.next = a ?? b;
  return dummy.next;
}
