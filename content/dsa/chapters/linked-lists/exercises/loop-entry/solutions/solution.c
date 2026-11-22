#include <stddef.h>

// The runner defines struct ListNode, with int val and struct ListNode* next
int loopEntry(struct ListNode* route) {
    struct ListNode* slow = route;
    struct ListNode* fast = route;
    while (fast != NULL && fast->next != NULL) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) {
            // The head and the meeting point are the same distance from the loop's start
            struct ListNode* walker = route;
            int position = 0;
            while (walker != slow) {
                walker = walker->next;
                slow = slow->next;
                position++;
            }
            return position;
        }
    }
    return -1;
}
