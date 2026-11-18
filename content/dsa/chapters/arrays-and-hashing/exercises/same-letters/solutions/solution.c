#include <stdbool.h>
#include <string.h>

// The keys are 26 letters, so an array of counts is the whole table
bool sameLetters(char* first, char* second) {
    if (strlen(first) != strlen(second)) return false;
    int counts[26] = {0};
    for (int i = 0; first[i]; i++) {
        counts[first[i] - 'a']++;
        counts[second[i] - 'a']--;
    }
    for (int i = 0; i < 26; i++) {
        if (counts[i] != 0) return false;
    }
    return true;
}
