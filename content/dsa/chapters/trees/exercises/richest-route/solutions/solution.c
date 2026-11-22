#include <stddef.h>

// The runner defines struct TreeNode, with int val and struct TreeNode* left and right
// Returns the best value of a route that starts here and only goes down
static int gain(struct TreeNode* node, int* best) {
    if (node == NULL) return 0;
    // A side that only costs is better left off
    int left = gain(node->left, best);
    int right = gain(node->right, best);
    if (left < 0) left = 0;
    if (right < 0) right = 0;
    // A route that bends here can use both sides, but a parent can only extend one
    if (node->val + left + right > *best) *best = node->val + left + right;
    return node->val + (left > right ? left : right);
}

int richestRoute(struct TreeNode* mine) {
    int best = mine->val;
    gain(mine, &best);
    return best;
}
