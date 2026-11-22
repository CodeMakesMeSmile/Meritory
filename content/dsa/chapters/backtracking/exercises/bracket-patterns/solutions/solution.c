#include <stdlib.h>
#include <string.h>

typedef struct {
    char** strings;
    int count;
    int capacity;
} Found;

// path[0] to path[open + closed - 1] holds the brackets so far
static void build(int pairs, int open, int closed, char* path, Found* found) {
    int length = open + closed;
    if (closed == pairs) {
        if (found->count == found->capacity) {
            found->capacity *= 2;
            found->strings = realloc(found->strings, sizeof(char*) * found->capacity);
        }
        char* copy = malloc(length + 1);
        memcpy(copy, path, length);
        copy[length] = '\0';
        found->strings[found->count++] = copy;
        return;
    }
    // Writing at path[length] means the next choice overwrites this one, which is the undo
    // Open another pair only while some are left to open
    if (open < pairs) {
        path[length] = '(';
        build(pairs, open + 1, closed, path, found);
    }
    // Close only when something is open, so the string never goes wrong
    if (closed < open) {
        path[length] = ')';
        build(pairs, open, closed + 1, path, found);
    }
}

char** bracketPatterns(int pairs, int* returnSize) {
    Found found = {malloc(sizeof(char*) * 16), 0, 16};
    char* path = malloc(2 * pairs + 1);
    build(pairs, 0, 0, path, &found);
    free(path);
    *returnSize = found.count;
    return found.strings;
}
