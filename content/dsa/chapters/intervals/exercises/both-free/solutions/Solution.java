import java.util.ArrayList;
import java.util.List;

class Solution {
    public int[][] bothFree(int[][] first, int[][] second) {
        List<int[]> both = new ArrayList<>();
        int i = 0;
        int j = 0;
        while (i < first.length && j < second.length) {
            // The two current free times share from the later start to the earlier end
            int start = Math.max(first[i][0], second[j][0]);
            int end = Math.min(first[i][1], second[j][1]);
            if (start < end) both.add(new int[] {start, end});
            // Whichever ends first can't share time with anything later in the other list
            if (first[i][1] < second[j][1]) {
                i++;
            } else {
                j++;
            }
        }
        return both.toArray(new int[0][]);
    }
}
