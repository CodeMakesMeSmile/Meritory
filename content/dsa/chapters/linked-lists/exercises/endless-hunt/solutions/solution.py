from typing import Optional


class Solution:
    def huntLoops(self, clues: Optional[ListNode]) -> bool:
        slow = clues
        fast = clues
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            # Compare the clues themselves, since two clues can hold the same number
            if slow is fast:
                return True
        return False
