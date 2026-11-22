#include <stddef.h>

// The runner defines struct TreeNode, with int val and struct TreeNode* left and right
int meetingHub(struct TreeNode* hubs, int a, int b) {
    struct TreeNode* node = hubs;
    while (node != NULL) {
        // Both routes go the same way from here, so the split is further down
        if (a < node->val && b < node->val) node = node->left;
        else if (a > node->val && b > node->val) node = node->right;
        else return node->val;
    }
    return -1;
}
