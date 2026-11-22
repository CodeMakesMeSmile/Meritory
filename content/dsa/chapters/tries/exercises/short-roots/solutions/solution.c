#include <stdbool.h>
#include <stdlib.h>
#include <string.h>

typedef struct TrieNode {
    // children[letter - 'a'] is the child for that letter, or NULL
    struct TrieNode* children[26];
    // True when a stem ends at this node
    bool isStem;
} TrieNode;

static void nodeFree(TrieNode* node) {
    if (!node) return;
    for (int i = 0; i < 26; i++) nodeFree(node->children[i]);
    free(node);
}

char* shortenWords(char** stems, int stemsSize, char* sentence) {
    TrieNode* root = calloc(1, sizeof(TrieNode));
    for (int k = 0; k < stemsSize; k++) {
        TrieNode* node = root;
        for (int i = 0; stems[k][i]; i++) {
            int slot = stems[k][i] - 'a';
            if (!node->children[slot]) node->children[slot] = calloc(1, sizeof(TrieNode));
            node = node->children[slot];
        }
        node->isStem = true;
    }
    // The answer is never longer than the sentence
    int length = (int)strlen(sentence);
    char* out = malloc(length + 1);
    int written = 0;
    int start = 0;
    while (start < length) {
        int end = start;
        while (end < length && sentence[end] != ' ') end++;
        // Walks down the word and stops at the first stem, which is the shortest
        int keep = end - start;
        TrieNode* node = root;
        for (int i = start; i < end; i++) {
            node = node->children[sentence[i] - 'a'];
            if (!node) break;
            if (node->isStem) {
                keep = i - start + 1;
                break;
            }
        }
        if (written > 0) out[written++] = ' ';
        memcpy(out + written, sentence + start, keep);
        written += keep;
        start = end + 1;
    }
    out[written] = '\0';
    nodeFree(root);
    return out;
}
