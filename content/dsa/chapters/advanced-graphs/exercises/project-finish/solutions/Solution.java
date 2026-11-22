import java.util.ArrayList;
import java.util.List;

class Solution {
    public int earliestFinish(int[] hours, int[][] needs) {
        int n = hours.length;
        List<List<Integer>> unlocks = new ArrayList<>();
        for (int i = 0; i < n; i++) unlocks.add(new ArrayList<>());
        int[] waiting = new int[n];
        for (int[] pair : needs) {
            unlocks.get(pair[0]).add(pair[1]);
            waiting[pair[1]]++;
        }
        // begin[i] is the latest finish of everything task i waits on so far
        int[] begin = new int[n];
        // Kahn's algorithm: a task joins the order once everything it waits on is in it
        int[] order = new int[n];
        int tail = 0;
        for (int task = 0; task < n; task++) {
            if (waiting[task] == 0) order[tail++] = task;
        }
        int last = 0;
        for (int head = 0; head < tail; head++) {
            int task = order[head];
            // Everything this task waits on came earlier in the order, so its start is final
            int finish = begin[task] + hours[task];
            last = Math.max(last, finish);
            for (int next : unlocks.get(task)) {
                begin[next] = Math.max(begin[next], finish);
                waiting[next]--;
                if (waiting[next] == 0) order[tail++] = next;
            }
        }
        return last;
    }
}
