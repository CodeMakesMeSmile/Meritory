#include <stddef.h>

// The runner defines struct ListNode, with int val and struct ListNode* next
struct ListNode* oddsThenEvens(struct ListNode* guests) {
    if (guests == NULL) return NULL;
    struct ListNode* odd = guests;
    struct ListNode* evenHead = guests->next;
    struct ListNode* even = evenHead;
    // Each step moves one guest onto the end of each group
    while (even != NULL && even->next != NULL) {
        odd->next = even->next;
        odd = even->next;
        even->next = odd->next;
        even = even->next;
    }
    // The odd group ends where the even group starts
    odd->next = evenHead;
    return guests;
}
