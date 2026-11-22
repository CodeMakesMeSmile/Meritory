class Solution {
    public int sharedAirtime(int[][] first, int[][] second) {
        int total = 0;
        int i = 0;
        int j = 0;
        while (i < first.length && j < second.length) {
            // The two current broadcasts share from the later start to the earlier end
            int start = Math.max(first[i][0], second[j][0]);
            int end = Math.min(first[i][1], second[j][1]);
            if (start < end) total += end - start;
            // Whichever ends first can't share time with anything later in the other log
            if (first[i][1] < second[j][1]) {
                i++;
            } else {
                j++;
            }
        }
        return total;
    }
}
