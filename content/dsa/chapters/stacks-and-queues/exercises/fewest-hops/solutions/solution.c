#include <stdlib.h>

int fewestHops(int* stones, int stonesSize) {
    int last = stonesSize - 1;
    // hops[i] stays -1 until stone i is first reached, which is by the fewest hops
    int* hops = malloc(sizeof(int) * stonesSize);
    for (int i = 0; i < stonesSize; i++) hops[i] = -1;
    hops[0] = 0;
    // Each stone joins the queue at most once, so n slots are enough
    int* queue = malloc(sizeof(int) * stonesSize);
    int head = 0;
    int tail = 0;
    queue[tail++] = 0;
    int answer = -1;
    while (head < tail) {
        int at = queue[head++];
        if (at == last) {
            answer = hops[at];
            break;
        }
        int moves[2] = {at + stones[at], at - stones[at]};
        for (int m = 0; m < 2; m++) {
            int next = moves[m];
            if (next >= 0 && next <= last && hops[next] == -1) {
                hops[next] = hops[at] + 1;
                queue[tail++] = next;
            }
        }
    }
    free(hops);
    free(queue);
    return answer;
}
