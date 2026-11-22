export function cancelFromEnd(
  jobs: ListNode | null,
  n: number,
): ListNode | null {
  // The dummy gives trail a node to stop on when the first job is cancelled
  const dummy = new ListNode(0, jobs);
  let lead: ListNode | null = dummy;
  let trail = dummy;
  // A gap of n + 1 leaves trail just before the job to cancel
  for (let i = 0; i <= n; i++) lead = (lead as ListNode).next;
  while (lead) {
    lead = lead.next;
    trail = trail.next as ListNode;
  }
  trail.next = (trail.next as ListNode).next;
  return dummy.next;
}
