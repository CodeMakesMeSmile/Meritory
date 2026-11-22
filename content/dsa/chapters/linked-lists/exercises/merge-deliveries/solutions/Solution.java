// The runner defines ListNode, with int val, ListNode next, and a ListNode() constructor
class Solution {
    public ListNode mergeDeliveries(ListNode north, ListNode south) {
        // The dummy gives the schedule a place to start
        ListNode dummy = new ListNode();
        ListNode tail = dummy;
        ListNode a = north;
        ListNode b = south;
        while (a != null && b != null) {
            if (a.val <= b.val) {
                tail.next = a;
                tail = a;
                a = a.next;
            } else {
                tail.next = b;
                tail = b;
                b = b.next;
            }
        }
        // Whatever is left is already sorted and linked
        tail.next = a != null ? a : b;
        return dummy.next;
    }
}
