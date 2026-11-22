#include <stdlib.h>

// The runner defines struct TreeNode, with int val and struct TreeNode* left and right
#define OFFSET 10000

// Builds the subtree whose joints sit in inorder from lo up to but not including hi
static struct TreeNode* build(int* preorder, int* next, int* where, int lo, int hi) {
    if (lo >= hi) return NULL;
    int value = preorder[(*next)++];
    int at = where[value + OFFSET];
    struct TreeNode* node = malloc(sizeof(struct TreeNode));
    node->val = value;
    // Preorder lists the whole left branch before the right, so build the left first
    node->left = build(preorder, next, where, lo, at);
    node->right = build(preorder, next, where, at + 1, hi);
    return node;
}

struct TreeNode* rebuildTree(int* preorder, int preorderSize, int* inorder, int inorderSize) {
    // Joint numbers run from -10,000 to 10,000, so an array maps each one to its inorder position
    int* where = malloc(sizeof(int) * (2 * OFFSET + 1));
    for (int i = 0; i < inorderSize; i++) where[inorder[i] + OFFSET] = i;
    int next = 0;
    struct TreeNode* root = build(preorder, &next, where, 0, preorderSize);
    free(where);
    return root;
}
