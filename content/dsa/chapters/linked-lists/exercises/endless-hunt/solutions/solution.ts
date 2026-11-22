export function huntLoops(clues: ListNode | null): boolean {
  let slow = clues;
  let fast = clues;
  while (fast?.next) {
    slow = (slow as ListNode).next;
    fast = fast.next.next;
    // Compare the clues themselves, since two clues can hold the same number
    if (slow === fast) return true;
  }
  return false;
}
