// The runner defines ListNode, with int val and ListNode next
class Solution {
    public boolean readsBothWays(ListNode beads) {
        if (beads == null) return true;
        // Stop on the first middle, the last bead of the front half
        ListNode slow = beads;
        ListNode fast = beads;
        while (fast.next != null && fast.next.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        ListNode back = reverse(slow.next);
        ListNode front = beads;
        ListNode mirror = back;
        boolean same = true;
        while (mirror != null) {
            if (front.val != mirror.val) {
                same = false;
                break;
            }
            front = front.next;
            mirror = mirror.next;
        }
        // Turn the back half around again so the strand is as it was
        slow.next = reverse(back);
        return same;
    }

    private static ListNode reverse(ListNode head) {
        ListNode prev = null;
        ListNode current = head;
        while (current != null) {
            ListNode next = current.next;
            current.next = prev;
            prev = current;
            current = next;
        }
        return prev;
    }
}
