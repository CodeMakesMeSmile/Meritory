from typing import Optional


class Solution:
    def middleStop(self, stops: Optional[ListNode]) -> int:
        slow = stops
        fast = stops
        # fast moves two stops for each one slow moves, so slow ends halfway
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
        return slow.val
