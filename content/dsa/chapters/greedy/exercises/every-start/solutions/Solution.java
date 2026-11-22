import java.util.ArrayList;
import java.util.List;

class Solution {
    public int[] everyStart(int[][] depots) {
        int n = depots.length;
        // salt[i] is the running total of load minus spread over the depots before i
        long[] salt = new long[n + 1];
        for (int i = 0; i < n; i++) {
            salt[i + 1] = salt[i] + depots[i][0] - depots[i][1];
        }
        long total = salt[n];
        // lowAfter[s] is the lowest running total from s + 1 up to n
        long[] lowAfter = new long[n + 1];
        lowAfter[n] = Long.MAX_VALUE;
        for (int s = n - 1; s >= 0; s--) {
            lowAfter[s] = Math.min(lowAfter[s + 1], salt[s + 1]);
        }
        List<Integer> starts = new ArrayList<>();
        // The lowest running total from 1 up to s, for the roads after the loop wraps
        long lowBefore = 0;
        for (int s = 0; s < n; s++) {
            // From depot s the plough holds salt[j] - salt[s], plus the total once it wraps
            boolean aheadOk = lowAfter[s] >= salt[s];
            boolean wrapOk = s == 0 || total + lowBefore >= salt[s];
            if (aheadOk && wrapOk) starts.add(s);
            lowBefore = s == 0 ? salt[1] : Math.min(lowBefore, salt[s + 1]);
        }
        int[] answer = new int[starts.size()];
        for (int i = 0; i < answer.length; i++) answer[i] = starts.get(i);
        return answer;
    }
}
