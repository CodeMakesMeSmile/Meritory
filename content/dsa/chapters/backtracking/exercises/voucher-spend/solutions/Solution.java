import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class Solution {
    private final List<int[]> baskets = new ArrayList<>();

    public int[][] voucherBaskets(int[] prices, int voucher) {
        // Sorting puts equal prices side by side and keeps each basket in order
        int[] sorted = prices.clone();
        Arrays.sort(sorted);
        baskets.clear();
        build(sorted, 0, voucher, new int[sorted.length], 0);
        return baskets.toArray(new int[0][]);
    }

    // path[0] to path[size - 1] holds the items chosen so far
    private void build(int[] sorted, int start, int left, int[] path, int size) {
        if (left == 0) {
            baskets.add(Arrays.copyOf(path, size));
            return;
        }
        for (int i = start; i < sorted.length; i++) {
            // Every later price is at least as high, so none of them fit either
            if (sorted[i] > left) break;
            // A second branch at this level with the same price would repeat the first
            if (i > start && sorted[i] == sorted[i - 1]) continue;
            path[size] = sorted[i];
            // Starting after i uses each item at most once
            build(sorted, i + 1, left - sorted[i], path, size + 1);
        }
    }
}
