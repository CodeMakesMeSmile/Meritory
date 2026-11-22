import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class Solution {
    private final List<int[]> bundles = new ArrayList<>();

    public int[][] giftBundles(int[] prices) {
        // Sorting puts equal prices side by side and keeps each bundle in order
        int[] sorted = prices.clone();
        Arrays.sort(sorted);
        bundles.clear();
        build(sorted, 0, new int[sorted.length], 0);
        return bundles.toArray(new int[0][]);
    }

    // path[0] to path[size - 1] holds the bundle being built
    private void build(int[] sorted, int start, int[] path, int size) {
        bundles.add(Arrays.copyOf(path, size));
        for (int i = start; i < sorted.length; i++) {
            // A second branch at this level with the same price would repeat the first
            if (i > start && sorted[i] == sorted[i - 1]) continue;
            path[size] = sorted[i];
            build(sorted, i + 1, path, size + 1);
        }
    }
}
