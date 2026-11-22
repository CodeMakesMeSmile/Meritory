#include <stddef.h>

// The runner defines struct TreeNode, with int val and struct TreeNode* left and right
// Each call carries the highest station on the way down from the base
static int count(struct TreeNode* node, int highest) {
    if (node == NULL) return 0;
    int clear = node->val >= highest ? 1 : 0;
    int next = node->val > highest ? node->val : highest;
    return clear + count(node->left, next) + count(node->right, next);
}

int countLookouts(struct TreeNode* stations) {
    return stations == NULL ? 0 : count(stations, stations->val);
}
