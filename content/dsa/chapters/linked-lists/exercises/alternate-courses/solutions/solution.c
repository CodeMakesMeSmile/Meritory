#include <stddef.h>

// The runner defines struct ListNode, with int val and struct ListNode* next
static struct ListNode* reverse(struct ListNode* head) {
    struct ListNode* prev = NULL;
    struct ListNode* current = head;
    while (current != NULL) {
        struct ListNode* next = current->next;
        current->next = prev;
        prev = current;
        current = next;
    }
    return prev;
}

void alternateCourses(struct ListNode* courses) {
    if (courses == NULL) return;
    // Stop on the first middle, the last course of the front half
    struct ListNode* slow = courses;
    struct ListNode* fast = courses;
    while (fast->next != NULL && fast->next->next != NULL) {
        slow = slow->next;
        fast = fast->next->next;
    }
    struct ListNode* back = reverse(slow->next);
    // Cut the halves apart so the weave can't make a loop
    slow->next = NULL;
    struct ListNode* front = courses;
    while (front != NULL && back != NULL) {
        struct ListNode* frontNext = front->next;
        struct ListNode* backNext = back->next;
        front->next = back;
        back->next = frontNext;
        front = frontNext;
        back = backNext;
    }
}
