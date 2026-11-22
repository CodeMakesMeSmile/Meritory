#include <stdlib.h>

#define MAX_SONG 100000

int noSongTwice(int* songs, int songsSize) {
    // Songs are numbered up to MAX_SONG, so an array holds each last position
    int* lastSeen = malloc(sizeof(int) * (MAX_SONG + 1));
    for (int i = 0; i <= MAX_SONG; i++) lastSeen[i] = -1;
    int longest = 0;
    int left = 0;
    for (int right = 0; right < songsSize; right++) {
        int last = lastSeen[songs[right]];
        // A last play from before the window isn't a repeat, so left never moves back
        if (last + 1 > left) left = last + 1;
        lastSeen[songs[right]] = right;
        if (right - left + 1 > longest) longest = right - left + 1;
    }
    free(lastSeen);
    return longest;
}
