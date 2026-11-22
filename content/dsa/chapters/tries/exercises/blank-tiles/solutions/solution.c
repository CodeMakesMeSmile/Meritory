#include <stdbool.h>
#include <stdlib.h>

typedef struct TrieNode {
    // children[letter - 'a'] is the child for that letter, or NULL
    struct TrieNode* children[26];
    // True when a word ends at this node
    bool isWord;
} TrieNode;

typedef struct {
    TrieNode* root;
} TileDictionary;

TileDictionary* tileDictionaryCreate(void) {
    TileDictionary* obj = malloc(sizeof(TileDictionary));
    obj->root = calloc(1, sizeof(TrieNode));
    return obj;
}

void tileDictionaryAdd(TileDictionary* obj, char* word) {
    TrieNode* node = obj->root;
    for (int i = 0; word[i]; i++) {
        int slot = word[i] - 'a';
        if (!node->children[slot]) node->children[slot] = calloc(1, sizeof(TrieNode));
        node = node->children[slot];
    }
    node->isWord = true;
}

static bool search(TrieNode* node, const char* pattern) {
    if (!*pattern) return node->isWord;
    if (*pattern != '.') {
        TrieNode* next = node->children[*pattern - 'a'];
        return next && search(next, pattern + 1);
    }
    // A blank could be any letter, so try every child and stop at the first that works
    for (int i = 0; i < 26; i++) {
        if (node->children[i] && search(node->children[i], pattern + 1)) return true;
    }
    return false;
}

bool tileDictionaryMatches(TileDictionary* obj, char* pattern) {
    return search(obj->root, pattern);
}

static void nodeFree(TrieNode* node) {
    if (!node) return;
    for (int i = 0; i < 26; i++) nodeFree(node->children[i]);
    free(node);
}

void tileDictionaryFree(TileDictionary* obj) {
    nodeFree(obj->root);
    free(obj);
}
