#include <stdlib.h>

typedef struct TrieNode {
    // children[letter - 'a'] is the child for that letter, so they're in letter order
    struct TrieNode* children[26];
    // The product that ends at this node, or NULL
    char* name;
} TrieNode;

static void nodeFree(TrieNode* node) {
    if (!node) return;
    for (int i = 0; i < 26; i++) nodeFree(node->children[i]);
    free(node);
}

// A node's own name comes before every longer name below it, then children go a to z
static void collect(TrieNode* node, int k, char** found, int* count) {
    if (*count == k) return;
    if (node->name) found[(*count)++] = node->name;
    for (int i = 0; i < 26; i++) {
        if (node->children[i]) collect(node->children[i], k, found, count);
    }
}

char*** typeAhead(char** products, int productsSize, char* typed, int k, int* returnSize,
                  int** returnColumnSizes) {
    TrieNode* root = calloc(1, sizeof(TrieNode));
    for (int p = 0; p < productsSize; p++) {
        TrieNode* node = root;
        for (int i = 0; products[p][i]; i++) {
            int slot = products[p][i] - 'a';
            if (!node->children[slot]) node->children[slot] = calloc(1, sizeof(TrieNode));
            node = node->children[slot];
        }
        node->name = products[p];
    }
    int letters = 0;
    while (typed[letters]) letters++;
    char*** suggestions = malloc(sizeof(char**) * letters);
    *returnColumnSizes = malloc(sizeof(int) * letters);
    TrieNode* node = root;
    for (int i = 0; i < letters; i++) {
        // Once the walk falls off the trie, nothing typed after can match
        node = node ? node->children[typed[i] - 'a'] : NULL;
        suggestions[i] = malloc(sizeof(char*) * k);
        int count = 0;
        if (node) collect(node, k, suggestions[i], &count);
        (*returnColumnSizes)[i] = count;
    }
    nodeFree(root);
    *returnSize = letters;
    return suggestions;
}
