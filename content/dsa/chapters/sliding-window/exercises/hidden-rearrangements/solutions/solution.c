#include <stdlib.h>
#include <string.h>

static void change(int* have, const int* need, int* matched, int letter, int by) {
    if (have[letter] == need[letter]) (*matched)--;
    have[letter] += by;
    if (have[letter] == need[letter]) (*matched)++;
}

int* hiddenRearrangements(char* text, char* word, int* returnSize) {
    int length = (int)strlen(text);
    int size = (int)strlen(word);
    int need[26] = {0};
    int have[26] = {0};
    for (int i = 0; i < size; i++) need[word[i] - 'a']++;
    // How many of the 26 letters have exactly the count the word needs
    int matched = 0;
    for (int i = 0; i < 26; i++) {
        if (need[i] == 0) matched++;
    }
    int most = length - size + 1;
    int* starts = malloc(sizeof(int) * (most > 0 ? most : 1));
    *returnSize = 0;
    for (int right = 0; right < length; right++) {
        change(have, need, &matched, text[right] - 'a', 1);
        if (right >= size) change(have, need, &matched, text[right - size] - 'a', -1);
        if (right >= size - 1 && matched == 26) starts[(*returnSize)++] = right - size + 1;
    }
    return starts;
}
