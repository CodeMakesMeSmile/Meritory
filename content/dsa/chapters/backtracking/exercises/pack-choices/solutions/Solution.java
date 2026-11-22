import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class Solution {
    private final List<int[]> sets = new ArrayList<>();

    public int[][] packChoices(int[] items) {
        sets.clear();
        build(items, 0, new int[items.length], 0);
        return sets.toArray(new int[0][]);
    }

    // path[0] to path[size - 1] holds the set being built
    private void build(int[] items, int start, int[] path, int size) {
        // Every path is a set, so save a copy of each one
        sets.add(Arrays.copyOf(path, size));
        for (int i = start; i < items.length; i++) {
            // The next choice at this level overwrites this one, which is the undo
            path[size] = items[i];
            // Only later items can follow, so each set is built once, in input order
            build(items, i + 1, path, size + 1);
        }
    }
}
