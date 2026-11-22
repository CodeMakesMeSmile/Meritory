#include <stdbool.h>
#include <stddef.h>

// The runner defines struct TreeNode, with int val and struct TreeNode* left and right
// Each call carries the gold gathered on the way down to this room
static bool search(struct TreeNode* node, int sum, int target) {
    if (node == NULL) return false;
    int total = sum + node->val;
    if (node->left == NULL && node->right == NULL) return total == target;
    return search(node->left, total, target) || search(node->right, total, target);
}

bool coinRoute(struct TreeNode* rooms, int target) {
    return search(rooms, 0, target);
}
