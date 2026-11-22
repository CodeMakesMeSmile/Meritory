#include <stdlib.h>

typedef struct TrieNode {
    // children[letter - 'a'] is the child for that letter, or NULL
    struct TrieNode* children[26];
    // How many saved copies pass through this node
    int passing;
    // How many saved copies end at this node
    int ending;
} TrieNode;

typedef struct {
    TrieNode* root;
} PrefixTally;

PrefixTally* prefixTallyCreate(void) {
    PrefixTally* obj = malloc(sizeof(PrefixTally));
    obj->root = calloc(1, sizeof(TrieNode));
    return obj;
}

// Adds by to every count on the word's path, making nodes as needed
static void change(PrefixTally* obj, const char* word, int by) {
    TrieNode* node = obj->root;
    for (int i = 0; word[i]; i++) {
        int slot = word[i] - 'a';
        if (!node->children[slot]) node->children[slot] = calloc(1, sizeof(TrieNode));
        node = node->children[slot];
        node->passing += by;
    }
    node->ending += by;
}

// Follows the letters from the root, or returns NULL if the path stops
static TrieNode* walk(PrefixTally* obj, const char* text) {
    TrieNode* node = obj->root;
    for (int i = 0; text[i] && node; i++) {
        node = node->children[text[i] - 'a'];
    }
    return node;
}

void prefixTallyAdd(PrefixTally* obj, char* word) {
    change(obj, word, 1);
}

void prefixTallyRemove(PrefixTally* obj, char* word) {
    change(obj, word, -1);
}

int prefixTallyCountStarting(PrefixTally* obj, char* prefix) {
    TrieNode* node = walk(obj, prefix);
    return node ? node->passing : 0;
}

int prefixTallyCountExact(PrefixTally* obj, char* word) {
    TrieNode* node = walk(obj, word);
    return node ? node->ending : 0;
}

static void nodeFree(TrieNode* node) {
    if (!node) return;
    for (int i = 0; i < 26; i++) nodeFree(node->children[i]);
    free(node);
}

void prefixTallyFree(PrefixTally* obj) {
    nodeFree(obj->root);
    free(obj);
}
