from typing import Optional


class Solution:
    def oddsThenEvens(self, guests: Optional[ListNode]) -> Optional[ListNode]:
        if not guests:
            return None
        odd = guests
        even_head = guests.next
        even = even_head
        # Each step moves one guest onto the end of each group
        while even and even.next:
            odd.next = even.next
            odd = even.next
            even.next = odd.next
            even = even.next
        # The odd group ends where the even group starts
        odd.next = even_head
        return guests
