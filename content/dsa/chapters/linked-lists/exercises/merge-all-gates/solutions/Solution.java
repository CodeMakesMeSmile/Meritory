// The runner defines ListNode, with int val, ListNode next, and a ListNode() constructor
class Solution {
    public ListNode mergeGates(ListNode[] gates) {
        if (gates.length == 0) return null;
        // Each round merges lists step apart, so every node is merged about log k times
        for (int step = 1; step < gates.length; step *= 2) {
            for (int i = 0; i + step < gates.length; i += step * 2) {
                gates[i] = mergeTwo(gates[i], gates[i + step]);
            }
        }
        return gates[0];
    }

    private static ListNode mergeTwo(ListNode a, ListNode b) {
        ListNode dummy = new ListNode();
        ListNode tail = dummy;
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
        tail.next = a != null ? a : b;
        return dummy.next;
    }
}
