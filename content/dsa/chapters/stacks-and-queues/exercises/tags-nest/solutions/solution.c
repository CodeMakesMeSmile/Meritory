#include <stdlib.h>
#include <string.h>

int firstBadTag(char** tags, int tagsSize) {
    char** open = malloc(sizeof(char*) * (tagsSize > 0 ? tagsSize : 1));
    int top = 0;
    int bad = -1;
    for (int i = 0; i < tagsSize && bad == -1; i++) {
        char* tag = tags[i];
        if (tag[0] != '/') {
            open[top++] = tag;
        } else if (top == 0 || strcmp(open[--top], tag + 1) != 0) {
            // Nothing was open, or the newest open tag has another name
            bad = i;
        }
    }
    if (bad == -1 && top > 0) bad = tagsSize;
    free(open);
    return bad;
}
