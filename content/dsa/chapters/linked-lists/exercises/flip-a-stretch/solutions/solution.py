from typing import Optional


class Solution:
    def turnCars(self, train: Optional[ListNode], first: int, last: int) -> Optional[ListNode]:
        dummy = ListNode(0, train)
        # Walk to the car just before the run, which is the dummy when first is 1
        before = dummy
        for _ in range(first - 1):
            before = before.next
        start = before.next
        prev = None
        current = start
        for _ in range(last - first + 1):
            following = current.next
            current.next = prev
            prev = current
            current = following
        # The run's old first car now ends it, so join it to the cars after the run
        before.next = prev
        start.next = current
        return dummy.next
