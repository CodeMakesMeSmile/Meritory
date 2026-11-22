#include <stdlib.h>
#include <string.h>

char* smallestWindow(char* text, char* needed) {
    // How many more of each letter the window needs, below 0 when it has spare
    int need[26] = {0};
    int neededLength = (int)strlen(needed);
    for (int i = 0; i < neededLength; i++) need[needed[i] - 'a']++;
    int missing = neededLength;
    int bestStart = 0;
    int bestLength = 0;
    int left = 0;
    for (int right = 0; text[right]; right++) {
        int entering = text[right] - 'a';
        if (need[entering] > 0) missing--;
        need[entering]--;
        while (missing == 0) {
            // Only a strictly shorter stretch replaces one that starts earlier
            int length = right - left + 1;
            if (bestLength == 0 || length < bestLength) {
                bestStart = left;
                bestLength = length;
            }
            int leaving = text[left] - 'a';
            need[leaving]++;
            if (need[leaving] > 0) missing++;
            left++;
        }
    }
    char* window = malloc(bestLength + 1);
    memcpy(window, text + bestStart, bestLength);
    window[bestLength] = '\0';
    return window;
}
