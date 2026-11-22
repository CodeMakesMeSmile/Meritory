// The runner defines ListNode, with int val and ListNode next
class Solution {
    public ListNode oddsThenEvens(ListNode guests) {
        if (guests == null) return null;
        ListNode odd = guests;
        ListNode evenHead = guests.next;
        ListNode even = evenHead;
        // Each step moves one guest onto the end of each group
        while (even != null && even.next != null) {
            odd.next = even.next;
            odd = even.next;
            even.next = odd.next;
            even = even.next;
        }
        // The odd group ends where the even group starts
        odd.next = evenHead;
        return guests;
    }
}
