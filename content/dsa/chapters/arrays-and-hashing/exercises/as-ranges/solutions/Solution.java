import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

class Solution {
    public int[][] asRanges(int[] ids) {
        Set<Integer> present = new HashSet<>();
        for (int id : ids) {
            present.add(id);
        }
        List<int[]> ranges = new ArrayList<>();
        for (int start : present) {
            if (present.contains(start - 1)) {
                continue;
            }
            int end = start;
            while (present.contains(end + 1)) {
                end++;
            }
            ranges.add(new int[] {start, end});
        }
        return ranges.toArray(new int[0][]);
    }
}
