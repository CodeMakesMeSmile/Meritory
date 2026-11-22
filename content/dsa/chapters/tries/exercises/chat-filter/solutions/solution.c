#include <stdlib.h>

typedef struct TrieNode {
    // children[letter - 'a'] is the child for that letter, or NULL
    struct TrieNode* children[26];
    // The flagged word that ends at this node, until it's found, or NULL
    char* word;
} TrieNode;

static void nodeFree(TrieNode* node) {
    if (!node) return;
    for (int i = 0; i < 26; i++) nodeFree(node->children[i]);
    free(node);
}

char** flaggedWords(char* message, char** words, int wordsSize, int* returnSize) {
    TrieNode* root = calloc(1, sizeof(TrieNode));
    for (int k = 0; k < wordsSize; k++) {
        TrieNode* node = root;
        for (int i = 0; words[k][i]; i++) {
            int slot = words[k][i] - 'a';
            if (!node->children[slot]) node->children[slot] = calloc(1, sizeof(TrieNode));
            node = node->children[slot];
        }
        node->word = words[k];
    }
    // Each word is found at most once, so wordsSize slots are always enough
    char** found = malloc(sizeof(char*) * (wordsSize > 0 ? wordsSize : 1));
    int count = 0;
    for (int start = 0; message[start]; start++) {
        // Walk down the trie while the letters match, and a space ends the walk
        TrieNode* node = root;
        for (int at = start; message[at] && message[at] != ' '; at++) {
            node = node->children[message[at] - 'a'];
            if (!node) break;
            if (node->word) {
                found[count++] = node->word;
                // Clearing it means a word seen twice is reported once
                node->word = NULL;
            }
        }
    }
    nodeFree(root);
    *returnSize = count;
    return found;
}
