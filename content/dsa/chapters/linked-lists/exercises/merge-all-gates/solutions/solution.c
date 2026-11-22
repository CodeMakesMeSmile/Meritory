#include <stddef.h>

// The runner defines struct ListNode, with int val and struct ListNode* next
static struct ListNode* mergeTwo(struct ListNode* a, struct ListNode* b) {
    struct ListNode dummy = {.val = 0, .next = NULL};
    struct ListNode* tail = &dummy;
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
    tail->next = a != NULL ? a : b;
    return dummy.next;
}

struct ListNode* mergeGates(struct ListNode** gates, int gatesSize) {
    if (gatesSize == 0) return NULL;
    // Each round merges lists step apart, so every node is merged about log k times
    for (int step = 1; step < gatesSize; step *= 2) {
        for (int i = 0; i + step < gatesSize; i += step * 2) {
            gates[i] = mergeTwo(gates[i], gates[i + step]);
        }
    }
    return gates[0];
}
