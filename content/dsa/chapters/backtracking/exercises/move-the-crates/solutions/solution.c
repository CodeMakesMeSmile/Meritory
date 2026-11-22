#include <stdlib.h>

// Moves the top n crates from one bay to another, using the third as a spare
static void move(int n, int from, int to, int** moves, int* made) {
    if (n == 0) return;
    // The bays add up to 6, so the spare is what's left
    int spare = 6 - from - to;
    move(n - 1, from, spare, moves, made);
    int* step = malloc(sizeof(int) * 2);
    step[0] = from;
    step[1] = to;
    moves[(*made)++] = step;
    move(n - 1, spare, to, moves, made);
}

int** moveCrates(int count, int start, int goal, int* returnSize, int** returnColumnSizes) {
    // n crates always take 2^n - 1 moves
    int total = (1 << count) - 1;
    int room = total > 0 ? total : 1;
    int** moves = malloc(sizeof(int*) * room);
    *returnColumnSizes = malloc(sizeof(int) * room);
    *returnSize = 0;
    move(count, start, goal, moves, returnSize);
    for (int i = 0; i < *returnSize; i++) (*returnColumnSizes)[i] = 2;
    return moves;
}
