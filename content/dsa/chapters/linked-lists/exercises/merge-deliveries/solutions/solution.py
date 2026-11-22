from typing import Optional


class Solution:
    def mergeDeliveries(
        self, north: Optional[ListNode], south: Optional[ListNode]
    ) -> Optional[ListNode]:
        # The dummy gives the schedule a place to start
        dummy = ListNode()
        tail = dummy
        a = north
        b = south
        while a and b:
            if a.val <= b.val:
                tail.next = a
                tail = a
                a = a.next
            else:
                tail.next = b
                tail = b
                b = b.next
        # Whatever is left is already sorted and linked
        tail.next = a if a else b
        return dummy.next
