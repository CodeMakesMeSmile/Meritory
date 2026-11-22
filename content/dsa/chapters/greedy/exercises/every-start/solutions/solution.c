#include <stdbool.h>
#include <stdlib.h>

int* everyStart(int** depots, int depotsSize, int* depotsColSize, int* returnSize) {
    int n = depotsSize;
    // salt[i] is the running total of load minus spread over the depots before i
    long long* salt = malloc(sizeof(long long) * (n + 1));
    salt[0] = 0;
    for (int i = 0; i < n; i++) {
        salt[i + 1] = salt[i] + depots[i][0] - depots[i][1];
    }
    long long total = salt[n];
    // lowAfter[s] is the lowest running total from s + 1 up to n
    long long* lowAfter = malloc(sizeof(long long) * (n + 1));
    lowAfter[n] = salt[n];
    for (int s = n - 1; s >= 0; s--) {
        lowAfter[s] = salt[s + 1] < lowAfter[s + 1] ? salt[s + 1] : lowAfter[s + 1];
    }
    int* starts = malloc(sizeof(int) * n);
    int count = 0;
    // The lowest running total from 1 up to s, for the roads after the loop wraps
    long long lowBefore = 0;
    for (int s = 0; s < n; s++) {
        // From depot s the plough holds salt[j] - salt[s], plus the total once it wraps
        bool aheadOk = lowAfter[s] >= salt[s];
        bool wrapOk = s == 0 || total + lowBefore >= salt[s];
        if (aheadOk && wrapOk) starts[count++] = s;
        lowBefore = s == 0 || salt[s + 1] < lowBefore ? salt[s + 1] : lowBefore;
    }
    free(salt);
    free(lowAfter);
    *returnSize = count;
    return starts;
}
