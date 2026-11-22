#include <limits.h>
#include <stdbool.h>
#include <stddef.h>

// The runner defines struct TreeNode, with int val and struct TreeNode* left and right
// Every number in this branch must be strictly between low and high
static bool valid(struct TreeNode* node, long long low, long long high) {
    if (node == NULL) return true;
    if (node->val <= low || node->val >= high) return false;
    return valid(node->left, low, node->val) && valid(node->right, node->val, high);
}

bool isSearchTree(struct TreeNode* index) {
    // 64-bit limits sit outside every 32-bit number, so they never reject a real one
    return valid(index, LLONG_MIN, LLONG_MAX);
}
