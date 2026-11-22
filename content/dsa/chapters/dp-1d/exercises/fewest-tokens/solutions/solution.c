#include <stdlib.h>

int fewestTokens(int* tokens, int tokensSize, int fare) {
    // No answer uses more than fare tokens, so fare + 1 stands for none
    int none = fare + 1;
    // fewest[a] is the fewest tokens that make exactly a
    int* fewest = malloc(sizeof(int) * (fare + 1));
    fewest[0] = 0;
    for (int a = 1; a <= fare; a++) {
        fewest[a] = none;
        for (int k = 0; k < tokensSize; k++) {
            // The last token could be any value that fits
            if (tokens[k] <= a && fewest[a - tokens[k]] + 1 < fewest[a]) {
                fewest[a] = fewest[a - tokens[k]] + 1;
            }
        }
    }
    int answer = fewest[fare] >= none ? -1 : fewest[fare];
    free(fewest);
    return answer;
}
