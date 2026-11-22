from typing import Optional


class Solution:
    def loopEntry(self, route: Optional[ListNode]) -> int:
        slow = route
        fast = route
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            if slow is fast:
                # The head and the meeting point are the same distance from the loop's start
                walker = route
                position = 0
                while walker is not slow:
                    walker = walker.next
                    slow = slow.next
                    position += 1
                return position
        return -1
