#include <stdlib.h>

// The runner defines struct TreeNode, with int val and struct TreeNode* left and right
static int countNodes(struct TreeNode* node) {
    if (node == NULL) return 0;
    return 1 + countNodes(node->left) + countNodes(node->right);
}

int* seenFromEast(struct TreeNode* lanterns, int* returnSize) {
    int total = countNodes(lanterns);
    int room = total > 0 ? total : 1;
    struct TreeNode** queue = malloc(sizeof(struct TreeNode*) * room);
    int* seen = malloc(sizeof(int) * room);
    *returnSize = 0;
    int head = 0;
    int tail = 0;
    if (lanterns != NULL) queue[tail++] = lanterns;
    while (head < tail) {
        // The queue holds exactly one level right now
        int size = tail - head;
        for (int i = 0; i < size; i++) {
            struct TreeNode* node = queue[head++];
            // The last lantern taken from a level is the one furthest east
            if (i == size - 1) seen[(*returnSize)++] = node->val;
            if (node->left != NULL) queue[tail++] = node->left;
            if (node->right != NULL) queue[tail++] = node->right;
        }
    }
    free(queue);
    return seen;
}
