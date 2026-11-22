int fewestVolunteers(int* skills, int skillsSize, int needed) {
    int fewest = -1;
    // Each mask is one group, with bit i meaning volunteer i is in it
    for (int mask = 0; mask < 1 << skillsSize; mask++) {
        int covered = 0;
        int size = 0;
        for (int i = 0; i < skillsSize; i++) {
            if ((mask >> i) & 1) {
                covered |= skills[i];
                size++;
            }
        }
        // The group works when every needed bit is also covered
        if ((covered & needed) == needed && (fewest == -1 || size < fewest)) {
            fewest = size;
        }
    }
    return fewest;
}
