#include <stdbool.h>
#include <stdlib.h>

int rumourReach(int n, int** tells, int tellsSize, int* tellsColSize, int start) {
    // The adjacency list as one array: person i tells everyone from first[i] to first[i + 1]
    int* first = calloc(n + 1, sizeof(int));
    for (int i = 0; i < tellsSize; i++) first[tells[i][0] + 1]++;
    for (int i = 0; i < n; i++) first[i + 1] += first[i];
    int* fill = malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) fill[i] = first[i];
    // News only goes one way, so each pair is listed under the teller alone
    int* tellsTo = malloc(sizeof(int) * (tellsSize > 0 ? tellsSize : 1));
    for (int i = 0; i < tellsSize; i++) tellsTo[fill[tells[i][0]]++] = tells[i][1];
    bool* heard = calloc(n, sizeof(bool));
    heard[start] = true;
    int count = 1;
    // Our own stack instead of recursion, since the news can pass along a chain of everyone
    int* stack = malloc(sizeof(int) * n);
    int top = 0;
    stack[top++] = start;
    while (top > 0) {
        int at = stack[--top];
        for (int j = first[at]; j < first[at + 1]; j++) {
            int next = tellsTo[j];
            if (!heard[next]) {
                heard[next] = true;
                count++;
                stack[top++] = next;
            }
        }
    }
    free(first);
    free(fill);
    free(tellsTo);
    free(heard);
    free(stack);
    return count;
}
