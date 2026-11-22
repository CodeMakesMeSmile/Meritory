class Solution {
    public int fewestVolunteers(int[] skills, int needed) {
        int n = skills.length;
        int fewest = -1;
        // Each mask is one group, with bit i meaning volunteer i is in it
        for (int mask = 0; mask < 1 << n; mask++) {
            int covered = 0;
            int size = 0;
            for (int i = 0; i < n; i++) {
                if (((mask >> i) & 1) == 1) {
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
}
