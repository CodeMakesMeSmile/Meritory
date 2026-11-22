export function turnCars(
  train: ListNode | null,
  first: number,
  last: number,
): ListNode | null {
  const dummy = new ListNode(0, train);
  // Walk to the car just before the run, which is the dummy when first is 1
  let before = dummy;
  for (let i = 1; i < first; i++) before = before.next as ListNode;
  const start = before.next as ListNode;
  let prev: ListNode | null = null;
  let current: ListNode | null = start;
  for (let i = first; i <= last; i++) {
    const node = current as ListNode;
    const next = node.next;
    node.next = prev;
    prev = node;
    current = next;
  }
  // The run's old first car now ends it, so join it to the cars after the run
  before.next = prev;
  start.next = current;
  return dummy.next;
}
