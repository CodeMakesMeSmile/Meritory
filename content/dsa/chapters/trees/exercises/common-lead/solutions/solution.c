#include <stddef.h>

// The runner defines struct TreeNode, with int val and struct TreeNode* left and right
// Returns a, b, or their closest shared lead, whichever this branch turns up, or NULL
static struct TreeNode* lowest(struct TreeNode* node, int a, int b) {
    if (node == NULL || node->val == a || node->val == b) return node;
    struct TreeNode* left = lowest(node->left, a, b);
    struct TreeNode* right = lowest(node->right, a, b);
    // One found on each side means their paths split here
    if (left != NULL && right != NULL) return node;
    return left != NULL ? left : right;
}

int commonLead(struct TreeNode* team, int a, int b) {
    return lowest(team, a, b)->val;
}
