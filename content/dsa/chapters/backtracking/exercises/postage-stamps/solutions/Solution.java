import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class Solution {
    private final List<int[]> sets = new ArrayList<>();

    public int[][] stampSets(int[] values, int postage) {
        int[] sorted = values.clone();
        Arrays.sort(sorted);
        sets.clear();
        // A set has at most postage stamps, since each is worth at least 1
        build(sorted, 0, postage, new int[postage], 0);
        return sets.toArray(new int[0][]);
    }

    // path[0] to path[size - 1] holds the stamps chosen so far
    private void build(int[] sorted, int start, int left, int[] path, int size) {
        if (left == 0) {
            sets.add(Arrays.copyOf(path, size));
            return;
        }
        for (int i = start; i < sorted.length; i++) {
            // Every later stamp is worth at least as much, so none of them fit either
            if (sorted[i] > left) break;
            path[size] = sorted[i];
            // Starting at i again lets the same value be used more than once
            build(sorted, i, left - sorted[i], path, size + 1);
        }
    }
}
