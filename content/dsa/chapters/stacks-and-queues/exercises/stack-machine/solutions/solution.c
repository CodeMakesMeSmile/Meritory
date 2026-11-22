#include <stdlib.h>
#include <string.h>

int* runProgram(char** steps, int stepsSize, int* returnSize) {
    // Each step pushes at most one value, so the stack never outgrows the program
    int* stack = malloc(sizeof(int) * (stepsSize > 0 ? stepsSize : 1));
    int top = 0;
    for (int i = 0; i < stepsSize; i++) {
        char* step = steps[i];
        if (strcmp(step, "add") == 0 || strcmp(step, "sub") == 0 || strcmp(step, "mul") == 0) {
            // The top value is the right side
            int right = stack[--top];
            int left = stack[--top];
            if (step[0] == 'a') stack[top++] = left + right;
            else if (step[0] == 's') stack[top++] = left - right;
            else stack[top++] = left * right;
        } else if (strcmp(step, "dup") == 0) {
            stack[top] = stack[top - 1];
            top++;
        } else if (strcmp(step, "swap") == 0) {
            int held = stack[top - 1];
            stack[top - 1] = stack[top - 2];
            stack[top - 2] = held;
        } else if (strcmp(step, "drop") == 0) {
            top--;
        } else {
            stack[top++] = atoi(step);
        }
    }
    *returnSize = top;
    return stack;
}
