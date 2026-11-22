import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class Solution {
    public int mostScenic(int n, int[][] runs, int start, int goal) {
        // Each entry is {hut, views}
        List<List<int[]>> out = new ArrayList<>();
        for (int i = 0; i < n; i++) out.add(new ArrayList<>());
        int[] waiting = new int[n];
        for (int[] run : runs) {
            out.get(run[0]).add(new int[] {run[1], run[2]});
            waiting[run[1]]++;
        }
        // best[hut] is the most views on any way down from start so far, and -1 means not reached
        int[] best = new int[n];
        Arrays.fill(best, -1);
        best[start] = 0;
        // Kahn's algorithm gives an order where every run points later in the order
        int[] order = new int[n];
        int tail = 0;
        for (int hut = 0; hut < n; hut++) {
            if (waiting[hut] == 0) order[tail++] = hut;
        }
        for (int head = 0; head < tail; head++) {
            int hut = order[head];
            // Every run into this hut came from earlier in the order, so its best is final
            for (int[] run : out.get(hut)) {
                int next = run[0];
                // Only huts reached from the start can pass on a score
                if (best[hut] != -1) best[next] = Math.max(best[next], best[hut] + run[1]);
                waiting[next]--;
                if (waiting[next] == 0) order[tail++] = next;
            }
        }
        return best[goal];
    }
}
