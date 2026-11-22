// The runner defines ListNode, with int val and ListNode next
class Solution {
    public boolean huntLoops(ListNode clues) {
        ListNode slow = clues;
        ListNode fast = clues;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            // Compare the clues themselves, since two clues can hold the same number
            if (slow == fast) return true;
        }
        return false;
    }
}
