#include <stdio.h>
#include <stdlib.h>

// The runner defines struct TreeNode, with int val and struct TreeNode* left and right
static int countNodes(struct TreeNode* node) {
    if (node == NULL) return 0;
    return 1 + countNodes(node->left) + countNodes(node->right);
}

static void writeNode(struct TreeNode* node, char* text, int* length) {
    const char* comma = *length > 0 ? "," : "";
    // A marker for each missing child shows where a branch ends
    if (node == NULL) {
        *length += sprintf(text + *length, "%s#", comma);
        return;
    }
    *length += sprintf(text + *length, "%s%d", comma, node->val);
    writeNode(node->left, text, length);
    writeNode(node->right, text, length);
}

char* packTree(struct TreeNode* story) {
    // There are 2n + 1 parts, and each takes at most 12 characters with its comma
    int parts = 2 * countNodes(story) + 1;
    char* text = malloc((size_t)parts * 12 + 1);
    int length = 0;
    text[0] = '\0';
    writeNode(story, text, &length);
    return text;
}
