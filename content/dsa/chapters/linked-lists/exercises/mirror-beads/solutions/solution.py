from typing import Optional


def reverse(head: Optional[ListNode]) -> Optional[ListNode]:
    prev = None
    current = head
    while current:
        following = current.next
        current.next = prev
        prev = current
        current = following
    return prev


class Solution:
    def readsBothWays(self, beads: Optional[ListNode]) -> bool:
        if not beads:
            return True
        # Stop on the first middle, the last bead of the front half
        slow = beads
        fast = beads
        while fast.next and fast.next.next:
            slow = slow.next
            fast = fast.next.next
        back = reverse(slow.next)
        front = beads
        mirror = back
        same = True
        while mirror:
            if front.val != mirror.val:
                same = False
                break
            front = front.next
            mirror = mirror.next
        # Turn the back half around again so the strand is as it was
        slow.next = reverse(back)
        return same
