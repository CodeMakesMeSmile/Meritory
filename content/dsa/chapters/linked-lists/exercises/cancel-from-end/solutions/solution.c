#include <stddef.h>

// The runner defines struct ListNode, with int val and struct ListNode* next
struct ListNode* cancelFromEnd(struct ListNode* jobs, int n) {
    // The dummy gives trail a node to stop on when the first job is cancelled
    struct ListNode dummy = {.val = 0, .next = jobs};
    struct ListNode* lead = &dummy;
    struct ListNode* trail = &dummy;
    // A gap of n + 1 leaves trail just before the job to cancel
    for (int i = 0; i <= n; i++) lead = lead->next;
    while (lead != NULL) {
        lead = lead->next;
        trail = trail->next;
    }
    trail->next = trail->next->next;
    return dummy.next;
}
