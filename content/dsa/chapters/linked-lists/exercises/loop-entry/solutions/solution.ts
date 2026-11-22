export function loopEntry(route: ListNode | null): number {
  let slow = route;
  let fast = route;
  while (fast?.next) {
    slow = (slow as ListNode).next;
    fast = fast.next.next;
    if (slow === fast) {
      // The head and the meeting point are the same distance from the loop's start
      let walker = route as ListNode;
      let position = 0;
      while (walker !== slow) {
        walker = walker.next as ListNode;
        slow = (slow as ListNode).next;
        position++;
      }
      return position;
    }
  }
  return -1;
}
