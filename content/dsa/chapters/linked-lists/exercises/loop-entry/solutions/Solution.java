// The runner defines ListNode, with int val and ListNode next
class Solution {
    public int loopEntry(ListNode route) {
        ListNode slow = route;
        ListNode fast = route;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) {
                // The head and the meeting point are the same distance from the loop's start
                ListNode walker = route;
                int position = 0;
                while (walker != slow) {
                    walker = walker.next;
                    slow = slow.next;
                    position++;
                }
                return position;
            }
        }
        return -1;
    }
}
