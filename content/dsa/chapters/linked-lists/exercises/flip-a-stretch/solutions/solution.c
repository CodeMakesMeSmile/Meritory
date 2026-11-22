#include <stddef.h>

// The runner defines struct ListNode, with int val and struct ListNode* next
struct ListNode* turnCars(struct ListNode* train, int first, int last) {
    struct ListNode dummy = {.val = 0, .next = train};
    // Walk to the car just before the run, which is the dummy when first is 1
    struct ListNode* before = &dummy;
    for (int i = 1; i < first; i++) before = before->next;
    struct ListNode* start = before->next;
    struct ListNode* prev = NULL;
    struct ListNode* current = start;
    for (int i = first; i <= last; i++) {
        struct ListNode* next = current->next;
        current->next = prev;
        prev = current;
        current = next;
    }
    // The run's old first car now ends it, so join it to the cars after the run
    before->next = prev;
    start->next = current;
    return dummy.next;
}
