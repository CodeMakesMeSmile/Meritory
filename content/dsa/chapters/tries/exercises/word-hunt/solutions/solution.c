#include <stdbool.h>
#include <stdlib.h>
#include <string.h>

static const int STEPS[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

typedef struct TrieNode {
    // children[letter - 'a'] is the child for that letter, or NULL
    struct TrieNode* children[26];
    // The listed word that ends at this node, until it's found, or NULL
    char* word;
} TrieNode;

typedef struct {
    char** grid;
    int rows;
    int cols;
    bool* used;
    char** found;
    int count;
} Hunt;

static void nodeFree(TrieNode* node) {
    if (!node) return;
    for (int i = 0; i < 26; i++) nodeFree(node->children[i]);
    free(node);
}

// Moves into cell (r, c) from the trie node for the letters so far
static void explore(Hunt* h, int r, int c, TrieNode* node) {
    if (h->used[r * h->cols + c]) return;
    TrieNode* next = node->children[h->grid[r][c] - 'a'];
    // No listed word starts with these letters, so stop here
    if (!next) return;
    if (next->word) {
        h->found[h->count++] = next->word;
        // Clearing it means a word in two places is reported once
        next->word = NULL;
    }
    h->used[r * h->cols + c] = true;
    for (int k = 0; k < 4; k++) {
        int nr = r + STEPS[k][0];
        int nc = c + STEPS[k][1];
        if (nr >= 0 && nc >= 0 && nr < h->rows && nc < h->cols) explore(h, nr, nc, next);
    }
    // Clearing the mark lets other paths use this cell
    h->used[r * h->cols + c] = false;
}

char** wordHunt(char** grid, int gridSize, char** words, int wordsSize, int* returnSize) {
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
    int cols = (int)strlen(grid[0]);
    // Each word is found at most once, so wordsSize slots are always enough
    Hunt h = {grid, gridSize, cols, calloc(gridSize * cols, sizeof(bool)),
              malloc(sizeof(char*) * (wordsSize > 0 ? wordsSize : 1)), 0};
    for (int r = 0; r < gridSize; r++) {
        for (int c = 0; c < cols; c++) explore(&h, r, c, root);
    }
    free(h.used);
    nodeFree(root);
    *returnSize = h.count;
    return h.found;
}
