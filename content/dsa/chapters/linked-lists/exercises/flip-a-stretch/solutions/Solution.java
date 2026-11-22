// The runner defines ListNode, with int val, ListNode next, and a ListNode(int val, ListNode next) constructor
class Solution {
    public ListNode turnCars(ListNode train, int first, int last) {
        ListNode dummy = new ListNode(0, train);
        // Walk to the car just before the run, which is the dummy when first is 1
        ListNode before = dummy;
        for (int i = 1; i < first; i++) {
            before = before.next;
        }
        ListNode start = before.next;
        ListNode prev = null;
        ListNode current = start;
        for (int i = first; i <= last; i++) {
            ListNode next = current.next;
            current.next = prev;
            prev = current;
            current = next;
        }
        // The run's old first car now ends it, so join it to the cars after the run
        before.next = prev;
        start.next = current;
        return dummy.next;
    }
}
