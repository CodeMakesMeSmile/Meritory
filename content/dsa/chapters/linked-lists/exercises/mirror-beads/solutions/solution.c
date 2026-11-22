#include <stdbool.h>
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

bool readsBothWays(struct ListNode* beads) {
    if (beads == NULL) return true;
    // Stop on the first middle, the last bead of the front half
    struct ListNode* slow = beads;
    struct ListNode* fast = beads;
    while (fast->next != NULL && fast->next->next != NULL) {
        slow = slow->next;
        fast = fast->next->next;
    }
    struct ListNode* back = reverse(slow->next);
    struct ListNode* front = beads;
    struct ListNode* mirror = back;
    bool same = true;
    while (mirror != NULL) {
        if (front->val != mirror->val) {
            same = false;
            break;
        }
        front = front->next;
        mirror = mirror->next;
    }
    // Turn the back half around again so the strand is as it was
    slow->next = reverse(back);
    return same;
}
