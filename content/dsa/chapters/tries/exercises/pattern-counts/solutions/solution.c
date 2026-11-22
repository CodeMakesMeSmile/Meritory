#include <stdbool.h>
#include <stdlib.h>

typedef struct TrieNode {
    // children[letter - 'a'] is the child for that letter, or NULL
    struct TrieNode* children[26];
    // True when a word ends at this node
    bool isWord;
} TrieNode;

static void nodeFree(TrieNode* node) {
    if (!node) return;
    for (int i = 0; i < 26; i++) nodeFree(node->children[i]);
    free(node);
}

// Counts the words below node that fit the rest of the pattern
static int count(TrieNode* node, const char* pattern) {
    if (!*pattern) return node->isWord ? 1 : 0;
    if (*pattern != '.') {
        TrieNode* next = node->children[*pattern - 'a'];
        return next ? count(next, pattern + 1) : 0;
    }
    // An empty square could be any letter, so add up every child's count
    int total = 0;
    for (int i = 0; i < 26; i++) {
        if (node->children[i]) total += count(node->children[i], pattern + 1);
    }
    return total;
}

int* countFits(char** words, int wordsSize, char** patterns, int patternsSize, int* returnSize) {
    TrieNode* root = calloc(1, sizeof(TrieNode));
    for (int k = 0; k < wordsSize; k++) {
        TrieNode* node = root;
        for (int i = 0; words[k][i]; i++) {
            int slot = words[k][i] - 'a';
            if (!node->children[slot]) node->children[slot] = calloc(1, sizeof(TrieNode));
            node = node->children[slot];
        }
        node->isWord = true;
    }
    int* counts = malloc(sizeof(int) * (patternsSize > 0 ? patternsSize : 1));
    for (int k = 0; k < patternsSize; k++) counts[k] = count(root, patterns[k]);
    nodeFree(root);
    *returnSize = patternsSize;
    return counts;
}
