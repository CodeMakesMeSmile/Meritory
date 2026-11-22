#include <stddef.h>

// The runner defines struct ListNode, with int val and struct ListNode* next
struct ListNode* reversePlaylist(struct ListNode* songs) {
    struct ListNode* prev = NULL;
    struct ListNode* current = songs;
    while (current != NULL) {
        // Save the way forward before turning this pointer around
        struct ListNode* next = current->next;
        current->next = prev;
        prev = current;
        current = next;
    }
    return prev;
}
