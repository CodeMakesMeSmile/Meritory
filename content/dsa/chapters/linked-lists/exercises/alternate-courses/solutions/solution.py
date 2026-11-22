from typing import Optional


def reverse(head: Optional[ListNode]) -> Optional[ListNode]:
    prev = None
    current = head
    while current:
        following = current.next
        current.next = prev
        prev = current
        current = following
    return prev


class Solution:
    def alternateCourses(self, courses: Optional[ListNode]) -> None:
        if not courses:
            return
        # Stop on the first middle, the last course of the front half
        slow = courses
        fast = courses
        while fast.next and fast.next.next:
            slow = slow.next
            fast = fast.next.next
        back = reverse(slow.next)
        # Cut the halves apart so the weave can't make a loop
        slow.next = None
        front = courses
        while front and back:
            front_next = front.next
            back_next = back.next
            front.next = back
            back.next = front_next
            front = front_next
            back = back_next
