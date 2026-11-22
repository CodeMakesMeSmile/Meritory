#include <stdlib.h>
#include <string.h>

char* sharedStart(char** names, int namesSize) {
    const char* first = names[0];
    int length = (int)strlen(first);
    // Check one column at a time, and stop where a name runs out or a letter differs
    int shared = length;
    for (int at = 0; at < shared; at++) {
        for (int k = 0; k < namesSize; k++) {
            // A name that runs out has '\0' here, which never matches a letter
            if (names[k][at] != first[at]) {
                shared = at;
                break;
            }
        }
    }
    char* answer = malloc(shared + 1);
    memcpy(answer, first, shared);
    answer[shared] = '\0';
    return answer;
}
