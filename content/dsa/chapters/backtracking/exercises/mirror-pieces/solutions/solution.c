#include <stdbool.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char*** ways;
    int* sizes;
    int count;
    int capacity;
} Found;

static bool readsBothWays(const char* word, int from, int to) {
    for (int i = from, j = to; i < j; i++, j--) {
        if (word[i] != word[j]) return false;
    }
    return true;
}

static char* copyText(const char* text, int length) {
    char* copy = malloc(length + 1);
    memcpy(copy, text, length);
    copy[length] = '\0';
    return copy;
}

// Saves a copy of every piece, doubling the room when it's full
static void save(Found* found, char** pieces, int size) {
    if (found->count == found->capacity) {
        found->capacity *= 2;
        found->ways = realloc(found->ways, sizeof(char**) * found->capacity);
        found->sizes = realloc(found->sizes, sizeof(int) * found->capacity);
    }
    char** way = malloc(sizeof(char*) * size);
    for (int i = 0; i < size; i++) way[i] = copyText(pieces[i], (int)strlen(pieces[i]));
    found->ways[found->count] = way;
    found->sizes[found->count++] = size;
}

// pieces[0] to pieces[size - 1] hold the pieces cut so far
static void build(const char* word, int n, int start, char** pieces, int size, Found* found) {
    if (start == n) {
        save(found, pieces, size);
        return;
    }
    for (int end = start; end < n; end++) {
        // A piece that doesn't mirror can't be part of any answer
        if (!readsBothWays(word, start, end)) continue;
        pieces[size] = copyText(word + start, end - start + 1);
        build(word, n, end + 1, pieces, size + 1, found);
        free(pieces[size]);
    }
}

char*** mirrorSplits(char* word, int* returnSize, int** returnColumnSizes) {
    int n = (int)strlen(word);
    Found found = {malloc(sizeof(char**) * 16), malloc(sizeof(int) * 16), 0, 16};
    char** pieces = malloc(sizeof(char*) * n);
    build(word, n, 0, pieces, 0, &found);
    free(pieces);
    *returnSize = found.count;
    *returnColumnSizes = found.sizes;
    return found.ways;
}
