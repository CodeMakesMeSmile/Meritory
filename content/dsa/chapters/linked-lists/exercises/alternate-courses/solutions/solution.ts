function reverse(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let current = head;
  while (current) {
    const next = current.next;
    current.next = prev;
    prev = current;
    current = next;
  }
  return prev;
}

export function alternateCourses(courses: ListNode | null): void {
  if (!courses) return;
  // Stop on the first middle, the last course of the front half
  let slow = courses;
  let fast = courses;
  while (fast.next?.next) {
    slow = slow.next as ListNode;
    fast = fast.next.next;
  }
  let back = reverse(slow.next);
  // Cut the halves apart so the weave can't make a loop
  slow.next = null;
  let front: ListNode | null = courses;
  while (front && back) {
    const frontNext: ListNode | null = front.next;
    const backNext: ListNode | null = back.next;
    front.next = back;
    back.next = frontNext;
    front = frontNext;
    back = backNext;
  }
}
