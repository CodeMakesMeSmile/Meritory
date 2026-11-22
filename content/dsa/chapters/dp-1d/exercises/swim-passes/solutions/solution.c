#include <stdbool.h>
#include <stdlib.h>

static int smaller(int a, int b) {
    return a < b ? a : b;
}

int cheapestSwims(int* days, int daysSize, int* prices, int pricesSize) {
    int lastDay = days[daysSize - 1];
    bool* swims = calloc(lastDay + 1, sizeof(bool));
    for (int i = 0; i < daysSize; i++) swims[days[i]] = true;
    // spent[d] is the least spent so every planned day up to day d is covered
    int* spent = calloc(lastDay + 1, sizeof(int));
    for (int d = 1; d <= lastDay; d++) {
        if (!swims[d]) {
            // Nothing new to cover today
            spent[d] = spent[d - 1];
            continue;
        }
        // A 1, 7, or 30 day pass ending today, plus the best for the days before it
        int day = spent[d - 1] + prices[0];
        int week = spent[d - 7 > 0 ? d - 7 : 0] + prices[1];
        int month = spent[d - 30 > 0 ? d - 30 : 0] + prices[2];
        spent[d] = smaller(day, smaller(week, month));
    }
    int answer = spent[lastDay];
    free(swims);
    free(spent);
    return answer;
}
