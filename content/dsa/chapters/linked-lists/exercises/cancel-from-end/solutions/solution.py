from typing import Optional


class Solution:
    def cancelFromEnd(self, jobs: Optional[ListNode], n: int) -> Optional[ListNode]:
        # The dummy gives trail a node to stop on when the first job is cancelled
        dummy = ListNode(0, jobs)
        lead = dummy
        trail = dummy
        # A gap of n + 1 leaves trail just before the job to cancel
        for _ in range(n + 1):
            lead = lead.next
        while lead:
            lead = lead.next
            trail = trail.next
        trail.next = trail.next.next
        return dummy.next
