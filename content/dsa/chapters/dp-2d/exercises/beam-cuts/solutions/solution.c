#include <limits.h>
#include <stdlib.h>

static int compareInts(const void* a, const void* b) {
    int x = *(const int*)a;
    int y = *(const int*)b;
    return (x > y) - (x < y);
}

long long cheapestCuts(int length, int* marks, int marksSize) {
    // Both ends of the beam and every mark, in order along the beam
    int count = marksSize + 2;
    long long* points = malloc(sizeof(long long) * count);
    int* sorted = malloc(sizeof(int) * (marksSize > 0 ? marksSize : 1));
    for (int i = 0; i < marksSize; i++) sorted[i] = marks[i];
    qsort(sorted, marksSize, sizeof(int), compareInts);
    points[0] = 0;
    for (int i = 0; i < marksSize; i++) points[i + 1] = sorted[i];
    points[count - 1] = length;
    // cost[i * count + j] is the least cost to cut at every mark strictly between points i and j
    long long* cost = calloc(count * count, sizeof(long long));
    // Points next to each other have no mark between them, so those ranges stay at 0
    for (int span = 2; span < count; span++) {
        for (int i = 0; i + span < count; i++) {
            int j = i + span;
            // Try every mark between them as the first cut in this piece
            long long cheapest = LLONG_MAX;
            for (int k = i + 1; k < j; k++) {
                long long split = cost[i * count + k] + cost[k * count + j];
                if (split < cheapest) cheapest = split;
            }
            // The first cut costs the whole piece
            cost[i * count + j] = cheapest + points[j] - points[i];
        }
    }
    long long answer = cost[count - 1];
    free(points);
    free(sorted);
    free(cost);
    return answer;
}
