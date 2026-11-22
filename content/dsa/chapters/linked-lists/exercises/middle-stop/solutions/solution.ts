export function middleStop(stops: ListNode | null): number {
  let slow = stops as ListNode;
  let fast = stops;
  // fast moves two stops for each one slow moves, so slow ends halfway
  while (fast?.next) {
    slow = slow.next as ListNode;
    fast = fast.next.next;
  }
  return slow.val;
}
