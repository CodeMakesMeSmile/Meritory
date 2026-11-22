// The runner defines ListNode, with int val and ListNode next
class Solution {
    public ListNode lastToFront(ListNode cards, int k) {
        if (cards == null || k == 0) return cards;
        ListNode lead = cards;
        for (int i = 0; i < k; i++) {
            lead = lead.next;
        }
        // Moving every card leaves the deck as it was
        if (lead == null) return cards;
        // Keep the gap of k until lead is on the last card, so trail ends on the new last card
        ListNode trail = cards;
        while (lead.next != null) {
            lead = lead.next;
            trail = trail.next;
        }
        ListNode top = trail.next;
        trail.next = null;
        lead.next = cards;
        return top;
    }
}
