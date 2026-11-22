#include <stddef.h>

// The runner defines struct TreeNode, with int val and struct TreeNode* left and right
// Returns how many junctions deep this branch goes, and records the best bend on the way
static int depth(struct TreeNode* node, int* best) {
    if (node == NULL) return 0;
    int left = depth(node->left, best);
    int right = depth(node->right, best);
    if (left + right > *best) *best = left + right;
    return 1 + (left > right ? left : right);
}

int longestTrail(struct TreeNode* trails) {
    int best = 0;
    depth(trails, &best);
    return best;
}
