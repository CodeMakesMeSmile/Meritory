import java.util.Arrays;

class Solution {
    public int[] recordDays(int[] highs) {
        int[] records = new int[highs.length];
        int count = 0;
        for (int i = 0; i < highs.length; i++) {
            // A record has to beat the best so far, so a tie doesn't count
            if (count == 0 || highs[i] > highs[records[count - 1]]) {
                records[count++] = i;
            }
        }
        return Arrays.copyOf(records, count);
    }
}
