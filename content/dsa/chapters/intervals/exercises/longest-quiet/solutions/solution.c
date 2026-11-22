#include <stdlib.h>

typedef struct {
    int start;
    int end;
} Session;

static int compareStarts(const void* a, const void* b) {
    int x = ((const Session*)a)->start;
    int y = ((const Session*)b)->start;
    return (x > y) - (x < y);
}

int longestQuiet(int** rooms, int roomsSize, int* roomsColSize, int opensAt, int closesAt) {
    // Every session from every room, as a start and an end
    int total = 0;
    for (int i = 0; i < roomsSize; i++) total += roomsColSize[i] / 2;
    Session* sessions = malloc(sizeof(Session) * (total > 0 ? total : 1));
    int n = 0;
    for (int i = 0; i < roomsSize; i++) {
        for (int k = 0; k + 1 < roomsColSize[i]; k += 2) {
            sessions[n++] = (Session){rooms[i][k], rooms[i][k + 1]};
        }
    }
    qsort(sessions, n, sizeof(Session), compareStarts);
    int longest = 0;
    // No room is in use from here until the next session starts
    int quiet = opensAt;
    for (int i = 0; i < n; i++) {
        if (sessions[i].start > quiet) {
            int end = sessions[i].start < closesAt ? sessions[i].start : closesAt;
            if (end - quiet > longest) longest = end - quiet;
        }
        if (sessions[i].end > quiet) quiet = sessions[i].end;
        if (quiet >= closesAt) break;
    }
    if (closesAt - quiet > longest) longest = closesAt - quiet;
    free(sessions);
    return longest;
}
