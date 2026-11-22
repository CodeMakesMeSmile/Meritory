// The runner defines ListNode, with int val and ListNode next
class Solution {
    public int middleStop(ListNode stops) {
        ListNode slow = stops;
        ListNode fast = stops;
        // fast moves two stops for each one slow moves, so slow ends halfway
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        return slow.val;
    }
}
