import java.util.ArrayList;
import java.util.List;

class Solution {
    private final List<int[]> orders = new ArrayList<>();

    public int[][] runningOrders(int[] acts) {
        orders.clear();
        build(acts, new int[acts.length], 0, new boolean[acts.length]);
        return orders.toArray(new int[0][]);
    }

    // path[0] to path[size - 1] holds the order so far
    private void build(int[] acts, int[] path, int size, boolean[] used) {
        if (size == acts.length) {
            orders.add(path.clone());
            return;
        }
        for (int i = 0; i < acts.length; i++) {
            // Any act not yet on stage can go next
            if (used[i]) continue;
            used[i] = true;
            path[size] = acts[i];
            build(acts, path, size + 1, used);
            // The next choice overwrites path[size], so only the mark needs undoing
            used[i] = false;
        }
    }
}
