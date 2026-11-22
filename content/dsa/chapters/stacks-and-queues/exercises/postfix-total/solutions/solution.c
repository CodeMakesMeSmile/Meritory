#include <stdlib.h>
#include <string.h>

int postfixTotal(char** tokens, int tokensSize) {
    int* values = malloc(sizeof(int) * tokensSize);
    int top = 0;
    for (int i = 0; i < tokensSize; i++) {
        char* token = tokens[i];
        // A lone sign is an operator, and anything longer is a number like -4
        if (strlen(token) == 1 && strchr("+-*/", token[0]) != NULL) {
            // The value pushed last is the right side
            int right = values[--top];
            int left = values[--top];
            int result;
            if (token[0] == '+') result = left + right;
            else if (token[0] == '-') result = left - right;
            else if (token[0] == '*') result = left * right;
            else result = left / right;
            values[top++] = result;
        } else {
            values[top++] = atoi(token);
        }
    }
    int total = values[0];
    free(values);
    return total;
}
