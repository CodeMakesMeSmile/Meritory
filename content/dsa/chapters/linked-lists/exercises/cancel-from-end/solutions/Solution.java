// The runner defines ListNode, with int val, ListNode next, and a ListNode(int val, ListNode next) constructor
class Solution {
    public ListNode cancelFromEnd(ListNode jobs, int n) {
        // The dummy gives trail a node to stop on when the first job is cancelled
        ListNode dummy = new ListNode(0, jobs);
        ListNode lead = dummy;
        ListNode trail = dummy;
        // A gap of n + 1 leaves trail just before the job to cancel
        for (int i = 0; i <= n; i++) {
            lead = lead.next;
        }
        while (lead != null) {
            lead = lead.next;
            trail = trail.next;
        }
        trail.next = trail.next.next;
        return dummy.next;
    }
}
