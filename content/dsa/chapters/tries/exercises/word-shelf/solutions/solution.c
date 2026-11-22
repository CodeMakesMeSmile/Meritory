#include <stdbool.h>
#include <stdlib.h>

typedef struct TrieNode {
    // children[letter - 'a'] is the child for that letter, or NULL
    struct TrieNode* children[26];
    // True when an added word ends at this node
    bool isWord;
} TrieNode;

typedef struct {
    TrieNode* root;
} WordShelf;

static TrieNode* nodeCreate(void) {
    return calloc(1, sizeof(TrieNode));
}

// Follows the letters from the root, or returns NULL if the path stops
static TrieNode* walk(WordShelf* obj, const char* text) {
    TrieNode* node = obj->root;
    for (int i = 0; text[i] && node; i++) {
        node = node->children[text[i] - 'a'];
    }
    return node;
}

WordShelf* wordShelfCreate(void) {
    WordShelf* obj = malloc(sizeof(WordShelf));
    obj->root = nodeCreate();
    return obj;
}

void wordShelfAdd(WordShelf* obj, char* word) {
    TrieNode* node = obj->root;
    for (int i = 0; word[i]; i++) {
        int slot = word[i] - 'a';
        if (!node->children[slot]) node->children[slot] = nodeCreate();
        node = node->children[slot];
    }
    node->isWord = true;
}

bool wordShelfHas(WordShelf* obj, char* word) {
    // The path existing isn't enough, a word must end here
    TrieNode* node = walk(obj, word);
    return node && node->isWord;
}

bool wordShelfHasPrefix(WordShelf* obj, char* prefix) {
    return walk(obj, prefix) != NULL;
}

static void nodeFree(TrieNode* node) {
    if (!node) return;
    for (int i = 0; i < 26; i++) nodeFree(node->children[i]);
    free(node);
}

void wordShelfFree(WordShelf* obj) {
    nodeFree(obj->root);
    free(obj);
}
