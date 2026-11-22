#include <stddef.h>

// The runner defines struct ListNode, with int val and struct ListNode* next
struct ListNode* lastToFront(struct ListNode* cards, int k) {
    if (cards == NULL || k == 0) return cards;
    struct ListNode* lead = cards;
    for (int i = 0; i < k; i++) lead = lead->next;
    // Moving every card leaves the deck as it was
    if (lead == NULL) return cards;
    // Keep the gap of k until lead is on the last card, so trail ends on the new last card
    struct ListNode* trail = cards;
    while (lead->next != NULL) {
        lead = lead->next;
        trail = trail->next;
    }
    struct ListNode* top = trail->next;
    trail->next = NULL;
    lead->next = cards;
    return top;
}
