#include <stdlib.h>
#include <string.h>

typedef struct TrieNode {
    // children[letter - 'a'] is the child for that letter, or NULL
    struct TrieNode* children[26];
    // How many items start with the prefix this node stands for
    int passing;
} TrieNode;

static void nodeFree(TrieNode* node) {
    if (!node) return;
    for (int i = 0; i < 26; i++) nodeFree(node->children[i]);
    free(node);
}

char** shortCodes(char** items, int itemsSize, int* returnSize) {
    TrieNode* root = calloc(1, sizeof(TrieNode));
    for (int k = 0; k < itemsSize; k++) {
        TrieNode* node = root;
        for (int i = 0; items[k][i]; i++) {
            int slot = items[k][i] - 'a';
            if (!node->children[slot]) node->children[slot] = calloc(1, sizeof(TrieNode));
            node = node->children[slot];
            node->passing++;
        }
    }
    char** codes = malloc(sizeof(char*) * (itemsSize > 0 ? itemsSize : 1));
    for (int k = 0; k < itemsSize; k++) {
        // The code ends at the first node on the item's path that only this item passes through
        int length = (int)strlen(items[k]);
        TrieNode* node = root;
        for (int i = 0; i < length; i++) {
            node = node->children[items[k][i] - 'a'];
            if (node->passing == 1) {
                length = i + 1;
                break;
            }
        }
        codes[k] = malloc(length + 1);
        memcpy(codes[k], items[k], length);
        codes[k][length] = '\0';
    }
    nodeFree(root);
    *returnSize = itemsSize;
    return codes;
}
