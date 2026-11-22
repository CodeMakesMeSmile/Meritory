from typing import Optional


class Solution:
    def lastToFront(self, cards: Optional[ListNode], k: int) -> Optional[ListNode]:
        if not cards or k == 0:
            return cards
        lead = cards
        for _ in range(k):
            lead = lead.next
        # Moving every card leaves the deck as it was
        if not lead:
            return cards
        # Keep the gap of k until lead is on the last card, so trail ends on the new last card
        trail = cards
        while lead.next:
            lead = lead.next
            trail = trail.next
        top = trail.next
        trail.next = None
        lead.next = cards
        return top
