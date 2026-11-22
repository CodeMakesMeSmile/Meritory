#include <stdlib.h>
#include <string.h>

int cheapestRepaint(char* current, char* wanted, int addCost, int removeCost, int repaintCost) {
    int n = (int)strlen(current);
    int m = (int)strlen(wanted);
    // before[j] is the cheapest way from the first i - 1 letters of current to the first j of wanted
    int* before = malloc(sizeof(int) * (m + 1));
    int* row = malloc(sizeof(int) * (m + 1));
    // From nothing, every letter of wanted is painted in
    for (int j = 0; j <= m; j++) before[j] = j * addCost;
    for (int i = 1; i <= n; i++) {
        // Down to nothing, every letter of current is painted out
        row[0] = i * removeCost;
        for (int j = 1; j <= m; j++) {
            if (current[i - 1] == wanted[j - 1]) {
                row[j] = before[j - 1];
            } else {
                int repaint = before[j - 1] + repaintCost;
                int remove = before[j] + removeCost;
                int add = row[j - 1] + addCost;
                int low = repaint < remove ? repaint : remove;
                row[j] = low < add ? low : add;
            }
        }
        // The row just filled becomes the row before, and the old one is reused
        int* held = before;
        before = row;
        row = held;
    }
    int answer = before[m];
    free(before);
    free(row);
    return answer;
}
