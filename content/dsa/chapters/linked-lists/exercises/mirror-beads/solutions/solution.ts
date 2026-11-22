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

export function readsBothWays(beads: ListNode | null): boolean {
  if (!beads) return true;
  // Stop on the first middle, the last bead of the front half
  let slow = beads;
  let fast = beads;
  while (fast.next?.next) {
    slow = slow.next as ListNode;
    fast = fast.next.next;
  }
  const back = reverse(slow.next);
  let front: ListNode | null = beads;
  let mirror = back;
  let same = true;
  while (mirror && front) {
    if (front.val !== mirror.val) {
      same = false;
      break;
    }
    front = front.next;
    mirror = mirror.next;
  }
  // Turn the back half around again so the strand is as it was
  slow.next = reverse(back);
  return same;
}
