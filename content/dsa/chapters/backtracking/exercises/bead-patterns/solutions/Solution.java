import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class Solution {
    private final List<int[]> patterns = new ArrayList<>();

    public int[][] beadPatterns(int[] beads) {
        // Sorting puts beads of the same colour side by side
        int[] sorted = beads.clone();
        Arrays.sort(sorted);
        patterns.clear();
        build(sorted, new int[sorted.length], 0, new boolean[sorted.length]);
        return patterns.toArray(new int[0][]);
    }

    // path[0] to path[size - 1] holds the pattern so far
    private void build(int[] sorted, int[] path, int size, boolean[] used) {
        if (size == sorted.length) {
            patterns.add(path.clone());
            return;
        }
        for (int i = 0; i < sorted.length; i++) {
            if (used[i]) continue;
            // Beads of one colour go on from left to right, so swapping them never repeats a pattern
            if (i > 0 && sorted[i] == sorted[i - 1] && !used[i - 1]) continue;
            used[i] = true;
            path[size] = sorted[i];
            build(sorted, path, size + 1, used);
            used[i] = false;
        }
    }
}
