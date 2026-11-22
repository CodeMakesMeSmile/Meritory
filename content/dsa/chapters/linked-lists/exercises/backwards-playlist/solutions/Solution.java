// The runner defines ListNode, with int val and ListNode next
class Solution {
    public ListNode reversePlaylist(ListNode songs) {
        ListNode prev = null;
        ListNode current = songs;
        while (current != null) {
            // Save the way forward before turning this pointer around
            ListNode next = current.next;
            current.next = prev;
            prev = current;
            current = next;
        }
        return prev;
    }
}
