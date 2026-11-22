#include <stddef.h>

// The runner defines struct ListNode, with int val and struct ListNode* next
int middleStop(struct ListNode* stops) {
    struct ListNode* slow = stops;
    struct ListNode* fast = stops;
    // fast moves two stops for each one slow moves, so slow ends halfway
    while (fast != NULL && fast->next != NULL) {
        slow = slow->next;
        fast = fast->next->next;
    }
    return slow->val;
}
