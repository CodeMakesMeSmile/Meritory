from typing import Optional


class Solution:
    def reversePlaylist(self, songs: Optional[ListNode]) -> Optional[ListNode]:
        prev = None
        current = songs
        while current:
            # Save the way forward before turning this pointer around
            following = current.next
            current.next = prev
            prev = current
            current = following
        return prev
