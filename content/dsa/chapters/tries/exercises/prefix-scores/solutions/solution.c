#include <stdlib.h>

typedef struct TrieNode {
    // children[letter - 'a'] is the child for that letter, or NULL
    struct TrieNode* children[26];
    // How many words start with the prefix this node stands for
    int passing;
} TrieNode;

static void nodeFree(TrieNode* node) {
    if (!node) return;
    for (int i = 0; i < 26; i++) nodeFree(node->children[i]);
    free(node);
}

int* prefixScores(char** words, int wordsSize, int* returnSize) {
    TrieNode* root = calloc(1, sizeof(TrieNode));
    for (int k = 0; k < wordsSize; k++) {
        TrieNode* node = root;
        for (int i = 0; words[k][i]; i++) {
            int slot = words[k][i] - 'a';
            if (!node->children[slot]) node->children[slot] = calloc(1, sizeof(TrieNode));
            node = node->children[slot];
            node->passing++;
        }
    }
    // A word's score adds up the counts on its own path
    int* scores = calloc(wordsSize > 0 ? wordsSize : 1, sizeof(int));
    for (int k = 0; k < wordsSize; k++) {
        TrieNode* node = root;
        for (int i = 0; words[k][i]; i++) {
            node = node->children[words[k][i] - 'a'];
            scores[k] += node->passing;
        }
    }
    nodeFree(root);
    *returnSize = wordsSize;
    return scores;
}
