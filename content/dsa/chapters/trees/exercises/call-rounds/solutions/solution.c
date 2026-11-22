#include <stdlib.h>

// The runner defines struct TreeNode, with int val and struct TreeNode* left and right
static int countNodes(struct TreeNode* node) {
    if (node == NULL) return 0;
    return 1 + countNodes(node->left) + countNodes(node->right);
}

int** callRounds(struct TreeNode* tree, int* returnSize, int** returnColumnSizes) {
    int total = countNodes(tree);
    int room = total > 0 ? total : 1;
    struct TreeNode** queue = malloc(sizeof(struct TreeNode*) * room);
    int** rounds = malloc(sizeof(int*) * room);
    *returnColumnSizes = malloc(sizeof(int) * room);
    *returnSize = 0;
    int head = 0;
    int tail = 0;
    if (tree != NULL) queue[tail++] = tree;
    while (head < tail) {
        // The queue holds exactly one round right now
        int size = tail - head;
        int* round = malloc(sizeof(int) * size);
        for (int i = 0; i < size; i++) {
            struct TreeNode* node = queue[head++];
            round[i] = node->val;
            if (node->left != NULL) queue[tail++] = node->left;
            if (node->right != NULL) queue[tail++] = node->right;
        }
        rounds[*returnSize] = round;
        (*returnColumnSizes)[(*returnSize)++] = size;
    }
    free(queue);
    return rounds;
}
