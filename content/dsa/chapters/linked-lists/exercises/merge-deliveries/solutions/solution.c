#include <stddef.h>

// The runner defines struct ListNode, with int val and struct ListNode* next
struct ListNode* mergeDeliveries(struct ListNode* north, struct ListNode* south) {
    // The dummy gives the schedule a place to start
    struct ListNode dummy = {.val = 0, .next = NULL};
    struct ListNode* tail = &dummy;
    struct ListNode* a = north;
    struct ListNode* b = south;
    while (a != NULL && b != NULL) {
        if (a->val <= b->val) {
            tail->next = a;
            tail = a;
            a = a->next;
        } else {
            tail->next = b;
            tail = b;
            b = b->next;
        }
    }
    // Whatever is left is already sorted and linked
    tail->next = a != NULL ? a : b;
    return dummy.next;
}
