#include <stdbool.h>
#include <stddef.h>

// The runner defines struct ListNode, with int val and struct ListNode* next
bool huntLoops(struct ListNode* clues) {
    struct ListNode* slow = clues;
    struct ListNode* fast = clues;
    while (fast != NULL && fast->next != NULL) {
        slow = slow->next;
        fast = fast->next->next;
        // Compare the clues themselves, since two clues can hold the same number
        if (slow == fast) return true;
    }
    return false;
}
