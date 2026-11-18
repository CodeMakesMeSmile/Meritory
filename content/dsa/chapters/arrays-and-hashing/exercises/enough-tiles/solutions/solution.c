#include <stdbool.h>

// The keys are 26 letters, so an array of counts is the whole table
bool enoughTiles(char* word, char* tiles) {
    int counts[26] = {0};
    for (int i = 0; tiles[i]; i++) counts[tiles[i] - 'a']++;
    for (int i = 0; word[i]; i++) {
        int letter = word[i] - 'a';
        if (counts[letter] == 0) return false;
        counts[letter]--;
    }
    return true;
}
