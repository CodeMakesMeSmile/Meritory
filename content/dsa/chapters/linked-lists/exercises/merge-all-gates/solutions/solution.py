from typing import Optional


def merge_two(a: Optional[ListNode], b: Optional[ListNode]) -> Optional[ListNode]:
    dummy = ListNode()
    tail = dummy
    while a and b:
        if a.val <= b.val:
            tail.next = a
            tail = a
            a = a.next
        else:
            tail.next = b
            tail = b
            b = b.next
    tail.next = a if a else b
    return dummy.next


class Solution:
    def mergeGates(self, gates: list[Optional[ListNode]]) -> Optional[ListNode]:
        if not gates:
            return None
        # Each round merges lists step apart, so every node is merged about log k times
        step = 1
        while step < len(gates):
            for i in range(0, len(gates) - step, step * 2):
                gates[i] = merge_two(gates[i], gates[i + step])
            step *= 2
        return gates[0]
