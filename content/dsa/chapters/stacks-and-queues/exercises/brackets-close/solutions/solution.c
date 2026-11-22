#include <stdbool.h>
#include <stdlib.h>
#include <string.h>

bool bracketsClose(char* text) {
    size_t length = strlen(text);
    char* open = malloc(length > 0 ? length : 1);
    size_t top = 0;
    bool fine = true;
    for (size_t i = 0; i < length && fine; i++) {
        char c = text[i];
        if (c == '(' || c == '[' || c == '{') {
            open[top++] = c;
        } else if (c == ')' || c == ']' || c == '}') {
            char want = c == ')' ? '(' : c == ']' ? '[' : '{';
            // Only the newest open bracket is allowed to close here
            if (top == 0 || open[--top] != want) fine = false;
        }
    }
    bool closed = fine && top == 0;
    free(open);
    return closed;
}
