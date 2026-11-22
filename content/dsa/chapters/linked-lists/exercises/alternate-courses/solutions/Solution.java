// The runner defines ListNode, with int val and ListNode next
class Solution {
    public void alternateCourses(ListNode courses) {
        if (courses == null) return;
        // Stop on the first middle, the last course of the front half
        ListNode slow = courses;
        ListNode fast = courses;
        while (fast.next != null && fast.next.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        ListNode back = reverse(slow.next);
        // Cut the halves apart so the weave can't make a loop
        slow.next = null;
        ListNode front = courses;
        while (front != null && back != null) {
            ListNode frontNext = front.next;
            ListNode backNext = back.next;
            front.next = back;
            back.next = frontNext;
            front = frontNext;
            back = backNext;
        }
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
